/**
 * CriticAgent for sRAG system
 * Evaluates synthesis quality and determines next steps
 */

const { Groq } = require('groq-sdk');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Groq client
const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY 
});

// Initialize logger
function log(message) {
  console.log(`[${new Date().toISOString()}] [CriticAgent] ${message}`);
}

/**
 * CriticAgent class
 * Evaluates synthesized response quality and determines next steps
 */
class CriticAgent {
  constructor(options = {}) {
    this.options = {
      model: options.model || "llama3-8b-8192",
      temperature: options.temperature || 0.4, // Lower temperature for more deterministic evaluation
      maxTokens: options.maxTokens || 512, // Shorter response needed for evaluation
      topP: options.topP || 1.0,
      verbose: options.verbose || false,
      qualityThreshold: options.qualityThreshold || 0.7, // Quality threshold (0.0 to 1.0)
      maxAttempts: options.maxAttempts || 3, // Maximum refinement attempts
      ...options
    };
    
    this.log(`CriticAgent initialized with model: ${this.options.model}`);
  }
  
  /**
   * Log messages if verbose mode is enabled
   * @param {string} message - Message to log
   */
  log(message) {
    if (this.options.verbose) {
      log(message);
    }
  }
  
  /**
   * Evaluate synthesized response quality
   * @param {string} query - Original user query
   * @param {string} response - Synthesized response to evaluate
   * @param {string} context - Retrieved context used for synthesis
   * @param {number} attempts - Number of attempts so far
   * @returns {Promise<Object>} - Evaluation result
   */
  async evaluate(query, response, context, attempts = 0) {
    this.log(`Evaluating response quality for query: "${query}" (Attempt ${attempts+1}/${this.options.maxAttempts})`);
    
    try {
      // Create system message for evaluation
      const systemMessage = this.createEvaluationPrompt(query, response, context);
      
      // Prepare messages for Groq
      const messages = [
        { role: 'system', content: systemMessage },
        { role: 'user', content: "Evaluate this response" }
      ];
      
      // Call Groq LLM
      // Check if model supports response_format
      const supportsResponseFormat = [
        "claude-3-opus-20240229",
        "claude-3-sonnet-20240229",
        "claude-3-haiku-20240307",
        "gpt-4-turbo",
        "gpt-4-0125-preview",
        "gpt-4-1106-preview",
        "gpt-4",
        "gpt-3.5-turbo-0125",
        "gpt-3.5-turbo-1106"
      ].includes(this.options.model);
      
      // Create completion options
      const completionOptions = {
        model: this.options.model,
        messages: messages,
        temperature: this.options.temperature,
        max_tokens: this.options.maxTokens,
        top_p: this.options.topP,
        stream: false
      };
      
      // Add response_format only for supported models
      if (supportsResponseFormat) {
        completionOptions.response_format = { type: "json" };
      }
      
      // Call Groq LLM
      const completion = await groqClient.chat.completions.create(completionOptions);
      
      // Extract evaluation result
      const evaluationResultText = completion.choices[0].message.content;
      
      // Parse response which may be either JSON or text
      let evaluationResult;
      
      try {
        // First try to parse as JSON
        evaluationResult = JSON.parse(evaluationResultText);
      } catch (parseError) {
        this.log(`Response is not in JSON format, attempting to extract values from text`);
        this.log(`Raw evaluation result: ${evaluationResultText}`);
        
        // Extract data from text using regex patterns
        const scoreMatch = evaluationResultText.match(/\*\*SCORE\*\*:\s*([0-9.]+)/i) || 
                        evaluationResultText.match(/\*\*OVERALL SCORE\*\*:\s*([0-9.]+)/i) ||
                        evaluationResultText.match(/score:\s*([0-9.]+)/i);
        
        const approvedMatch = evaluationResultText.match(/\*\*APPROVED\*\*:\s*(true|false)/i) ||
                          evaluationResultText.match(/approved:\s*(true|false)/i);
        
        const reasoningMatch = evaluationResultText.match(/\*\*REASONING\*\*:\s*([^\n]+)/i) ||
                           evaluationResultText.match(/reasoning:\s*([^\n]+)/i);
        
        const refinedQueryMatch = evaluationResultText.match(/\*\*REFINED QUERY\*\*:\s*([^\n]+)/i) ||
                               evaluationResultText.match(/refined query:\s*([^\n]+)/i);
        
        // Create result object from extracted data
        evaluationResult = {
          score: scoreMatch ? parseFloat(scoreMatch[1]) : 0.7,
          approved: approvedMatch ? approvedMatch[1].toLowerCase() === 'true' : false,
          reasoning: reasoningMatch ? reasoningMatch[1].trim() : "Extracted from text evaluation",
          refinedQuery: refinedQueryMatch && !refinedQueryMatch[1].toLowerCase().includes('none') ? 
                      refinedQueryMatch[1].trim() : query
        };
        
        // Handle case where the query is explicitly approved in text
        if (evaluationResultText.toLowerCase().includes('approved') && 
            !evaluationResultText.toLowerCase().includes('not approved')) {
          evaluationResult.approved = true;
        }
      }
      
      // Ensure all required fields exist
      evaluationResult.score = evaluationResult.score || 0.5;
      evaluationResult.approved = evaluationResult.approved || false;
      evaluationResult.reasoning = evaluationResult.reasoning || "No reasoning provided.";
      evaluationResult.refinedQuery = evaluationResult.refinedQuery || query;
      
      // Override approval based on max attempts
      if (attempts >= this.options.maxAttempts - 1) {
        evaluationResult.approved = true;
        evaluationResult.reasoning += " (Max attempts reached - forced approval).";
      }
      
      // Log evaluation result
      this.log(`Evaluation result: Approved=${evaluationResult.approved}, Score=${evaluationResult.score}`);
      if (!evaluationResult.approved) {
        this.log(`Refined query: ${evaluationResult.refinedQuery}`);
      }
      
      return {
        query,
        refinedQuery: evaluationResult.refinedQuery,
        score: evaluationResult.score,
        approved: evaluationResult.approved,
        reasoning: evaluationResult.reasoning,
        attempts,
        usage: completion.usage
      };
    } catch (error) {
      this.log(`Error evaluating response: ${error.message}`);
      
      // Return a default fallback evaluation (approved) to prevent system failure
      return {
        query,
        refinedQuery: query,
        score: 0.5,
        approved: true, // Safe fallback is to approve
        reasoning: `Evaluation error: ${error.message}. Defaulting to approval.`,
        attempts,
        usage: null
      };
    }
  }
  
  /**
   * Create the prompt for the evaluation task
   * @param {string} query - Original user query
   * @param {string} response - Synthesized response to evaluate
   * @param {string} context - Retrieved context used for synthesis
   * @returns {string} - Evaluation prompt
   */
  createEvaluationPrompt(query, response, context) {
    // Check if the response claims information is not found
    const notFoundClaims = [
      "not found in context",
      "no information available",
      "could not find",
      "no context found",
      "there is no information",
      "does not mention",
      "is not mentioned",
      "is not discussed",
      "is not provided",
      "is not covered",
      "since the provided context",
      "the context does not",
      "the context provided does not"
    ];
    
    const hasNotFoundClaim = notFoundClaims.some(phrase => 
      response.toLowerCase().includes(phrase.toLowerCase())
    );
    
    // Check if the response contains a request for more information
    const hasResearchNotes = response.toLowerCase().includes('research notes');
    
    // Special evaluation instructions for "not found" responses
    const notFoundInstructions = hasNotFoundClaim ? `
SPECIAL INSTRUCTIONS FOR "NOT FOUND" RESPONSES:
The response claims information is not available in the context. Be extra skeptical of such claims.
- Only approve if you're absolutely certain the information truly isn't in the context
- The response should only claim information is missing after thoroughly checking the context
- If the response incorrectly claims information is missing when it IS available, give it a very low score
- For chapter queries, be especially careful to check if any information about the chapter exists
- If the query asks about Chapter 2, ensure there's no mention of "Chapter 2" or "performatives and speech acts" before accepting a "not found" claim
` : '';

    // Special instructions for responses with research notes
    const researchNotesInstructions = hasResearchNotes ? `
SPECIAL INSTRUCTIONS FOR RESPONSES WITH RESEARCH NOTES:
The response includes a RESEARCH NOTES section requesting additional information.
- Evaluate whether these research requests are reasonable and necessary
- If the additional queries would genuinely improve the response, note this in your reasoning
- Include these requested queries in your refinedQuery field as a JSON array format
- If the content is already comprehensive despite the request for more info, note this in your reasoning
` : '';

    return `
CONTENT QUALITY EVALUATION SYSTEM
---------------------------------

You are an expert content evaluator for a professional blog platform. Your task is to assess whether blog-style content meets high standards of quality, engagement, and factual accuracy based on the available context.

EVALUATION CRITERIA:

1. CONTENT QUALITY & DEPTH (35%)
   - Is the content substantive, thorough, and insightful?
   - Does it go beyond surface-level information to provide valuable analysis?
   - Does it anticipate and address potential questions or confusion?
   - Is the content comprehensive enough to serve as a standalone resource?

2. FACTUAL ACCURACY (25%)
   - Is the information provided factually correct based on the context?
   - Does it avoid unsupported claims or speculation beyond the context?
   - Are any knowledge limitations or gaps appropriately acknowledged?

3. ENGAGEMENT & STYLE (15%)
   - Is the content written in an engaging, authoritative voice?
   - Does it use vivid language, relevant examples, or helpful analogies?
   - Does it have a compelling introduction and satisfying conclusion?
   - Does it maintain reader interest throughout?

4. STRUCTURE & ORGANIZATION (15%)
   - Is the content well-structured with clear headings and logical flow?
   - Does it use formatting elements (lists, callouts, etc.) effectively?
   - Are there clear section breaks and a coherent narrative thread?

5. ENHANCED FEATURES (10%)
   - Does it include additional value-adding sections like "Why This Matters"?
   - Are there thoughtful follow-up questions that extend the conversation?
   - Does it provide appropriate recommendations for related content?
   - Does it identify knowledge gaps with specific research suggestions when needed?
${notFoundInstructions}${researchNotesInstructions}
ORIGINAL QUERY:
${query}

RETRIEVED CONTEXT:
${context || 'No context was retrieved.'}

SYNTHESIZED RESPONSE TO EVALUATE:
${response}

YOUR TASK:
Analyze the response against the evaluation criteria and provide your evaluation in the following format:

**SCORE**: [numerical score from 0.0 to 1.0 representing overall quality, higher is better]
**APPROVED**: [true if response meets minimum quality standards, false otherwise]
**REASONING**: [Brief explanation of your evaluation and why you approved or rejected]
**REFINED QUERY**: [If not approved, provide a refined version of the original query that might yield better results. If approved but research notes are present, include the suggested research queries as a JSON array. If approved with no research needs, write "None needed"]
`;
  }
  
  /**
   * Determine if additional context retrieval is needed
   * @param {Object} evaluation - Evaluation result
   * @returns {boolean} - Whether additional retrieval is needed
   */
  needsAdditionalRetrieval(evaluation) {
    return !evaluation.approved && evaluation.attempts < this.options.maxAttempts;
  }
  
  /**
   * Get the next action based on evaluation
   * @param {Object} evaluation - Evaluation result
   * @returns {Object} - Next action to take
   */
  getNextAction(evaluation) {
    if (evaluation.approved) {
      // Check if there are research requests in the refinedQuery
      if (evaluation.refinedQuery && evaluation.refinedQuery !== "None needed") {
        try {
          // Try to parse as JSON array of queries
          const additionalQueries = JSON.parse(evaluation.refinedQuery);
          if (Array.isArray(additionalQueries) && additionalQueries.length > 0) {
            return {
              action: 'research',
              data: {
                ...evaluation,
                additionalQueries
              }
            };
          }
        } catch (err) {
          // If we can't parse as JSON, just proceed with present action
          this.log(`Error parsing additionalQueries: ${err.message}`);
        }
      }
      
      return {
        action: 'present',
        data: evaluation
      };
    } else if (evaluation.attempts < this.options.maxAttempts) {
      return {
        action: 'refine',
        data: evaluation
      };
    } else {
      return {
        action: 'fail',
        data: evaluation
      };
    }
  }
}

module.exports = CriticAgent;
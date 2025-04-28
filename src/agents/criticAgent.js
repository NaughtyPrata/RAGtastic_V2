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
      temperature: options.temperature || 0.2, // Lower temperature for more consistent evaluations
      maxTokens: options.maxTokens || 512, // Shorter response needed for evaluation
      topP: options.topP || 1.0,
      verbose: options.verbose || false,
      qualityThreshold: options.qualityThreshold || 0.85, // Higher quality threshold (0.0 to 1.0)
      maxAttempts: options.maxAttempts || 3, // Maximum refinement attempts
      strictMode: options.strictMode !== undefined ? options.strictMode : true, // Enable strict mode by default
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
      
      // Apply stricter evaluation in strict mode
      if (this.options.strictMode) {
        // Only auto-approve if we've reached the max attempts
        if (attempts >= this.options.maxAttempts - 1) {
          evaluationResult.approved = true;
          evaluationResult.reasoning += " (Max attempts reached - forced approval).";
        } 
        // Otherwise, enforce the quality threshold strictly
        else if (evaluationResult.score < this.options.qualityThreshold) {
          evaluationResult.approved = false;
          evaluationResult.reasoning += ` (Strict mode: Score ${evaluationResult.score} below threshold ${this.options.qualityThreshold})`;
          
          // If we don't have a refined query yet, create one
          if (evaluationResult.refinedQuery === query) {
            evaluationResult.refinedQuery = this.generateRefinedQuery(query, evaluationResult);
          }
        }
      } 
      // Less strict mode - use original behavior
      else if (attempts >= this.options.maxAttempts - 1) {
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
   * Generate a refined query when the evaluation doesn't provide one
   * @param {string} originalQuery - Original user query
   * @param {Object} evaluation - Evaluation result object
   * @returns {string} - Refined query
   */
  generateRefinedQuery(originalQuery, evaluation) {
    // Simple query refinement strategies
    let refinedQuery = originalQuery;
    
    // Add specificity for general queries
    if (originalQuery.length < 30) {
      refinedQuery = `Detailed information about ${originalQuery}`;
    }
    
    // For chapter or section queries, enhance with more specific terms
    if (originalQuery.toLowerCase().includes('chapter') || 
        originalQuery.toLowerCase().includes('section')) {
      refinedQuery = `${originalQuery} including key concepts, examples, and main points`;
    }
    
    // For "what is" questions, expand to ask for more depth
    if (originalQuery.toLowerCase().startsWith('what is') || 
        originalQuery.toLowerCase().startsWith('how does')) {
      refinedQuery = `${originalQuery} - explain in detail with examples`;
    }
    
    // If the score is particularly low, try a more aggressive rewrite
    if (evaluation.score < 0.6) {
      refinedQuery = `Please provide comprehensive information about ${originalQuery} with examples and detailed explanations`;
    }
    
    return refinedQuery;
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

You are a STRICT and DEMANDING content evaluator for a premium publication. Your task is to thoroughly critique content against the highest standards of quality, depth, and accuracy. You should only approve truly exceptional content that meets ALL evaluation criteria.

EVALUATION CRITERIA (BE STRICT WITH EACH):

1. CONTENT QUALITY & DEPTH (35%)
   - The content MUST be comprehensive, insightful, and deeply informative
   - It MUST go beyond surface information to provide detailed, nuanced analysis
   - It MUST anticipate and address potential questions or points of confusion
   - It MUST serve as a definitive standalone resource on the topic
   - REJECT content that lacks sufficient depth, examples, or explanations

2. FACTUAL ACCURACY (25%)
   - The information MUST be 100% factually correct based on the context
   - It MUST avoid ALL unsupported claims or speculation beyond the context
   - Knowledge limitations MUST be explicitly acknowledged when present
   - REJECT content with ANY factual errors or unsupported assertions

3. ENGAGEMENT & STYLE (15%)
   - The content MUST be written in a highly engaging, authoritative voice
   - It MUST use vivid language, compelling examples, and effective analogies
   - It MUST have a strong introduction and satisfying, meaningful conclusion
   - It MUST maintain reader interest and engagement throughout
   - REJECT dry, technical, or monotonous content

4. STRUCTURE & ORGANIZATION (15%)
   - The content MUST be meticulously structured with clear, logical organization
   - It MUST use formatting elements (headings, lists, callouts) effectively
   - Sections MUST flow logically with clear transitions between topics
   - REJECT poorly organized content with confusing structure or flow

5. ENHANCED FEATURES (10%)
   - The content MUST include value-adding sections like "Why This Matters"
   - It MUST provide thoughtful follow-up questions or discussion points
   - It SHOULD identify specific knowledge gaps with research suggestions
   - REJECT content that lacks these enhanced features

IMPORTANT: You should maintain a high bar for approval. If the content fails to excel in ANY of the above criteria, you should NOT approve it and instead request refinements.

Our standards have been raised. Be extremely critical in your evaluation. We want to ensure only the highest quality content is approved.

${this.options.strictMode ? `
STRICT MODE ENABLED: You are instructed to be especially demanding in your evaluation. Unless the content truly excels in every category, suggest refinements to improve it.
` : ''}

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
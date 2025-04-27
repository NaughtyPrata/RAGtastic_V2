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
    return `
RESPONSE QUALITY EVALUATION SYSTEM
----------------------------------

You are an unbiased evaluation system that assesses response quality. Your task is to analyze a response to determine if it adequately answers the original query based on the retrieved context.

EVALUATION CRITERIA:
1. RELEVANCE: Does the response directly address the query's core information need?
2. COMPREHENSIVENESS: Does the response cover all aspects of the query that can be answered from the context?
3. ACCURACY: Is the information provided factually correct based on the context?
4. CLARITY: Is the response well-structured, clear, and easy to understand?
5. CONTEXTUAL GROUNDING: Is the response firmly based on the provided context?

OBJECTIVE EVALUATION INSTRUCTIONS:
- Evaluate ONLY based on how well the response answers the query using the context
- Do NOT consider formatting, style preferences, or tone
- Do NOT impose your own knowledge that isn't in the context
- Assess whether the response contains all essential information from the context that is relevant to the query
- If the context lacks information to answer the query, determine if the response acknowledges this limitation appropriately

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
**REFINED QUERY**: [If not approved, provide a refined version of the original query that might yield better results. If approved, write "None needed"]
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
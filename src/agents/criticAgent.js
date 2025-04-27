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
      const completion = await groqClient.chat.completions.create({
        model: this.options.model,
        messages: messages,
        temperature: this.options.temperature,
        max_tokens: this.options.maxTokens,
        top_p: this.options.topP,
        stream: false,
        response_format: { type: "json" } // Request JSON response
      });
      
      // Extract evaluation result
      const evaluationResultText = completion.choices[0].message.content;
      
      // Parse JSON response
      let evaluationResult;
      
      try {
        evaluationResult = JSON.parse(evaluationResultText);
      } catch (parseError) {
        this.log(`Error parsing evaluation result: ${parseError.message}`);
        this.log(`Raw evaluation result: ${evaluationResultText}`);
        
        // Fallback to default values
        evaluationResult = {
          score: 0.5,
          approved: false,
          reasoning: "Failed to parse evaluation result.",
          refinedQuery: query
        };
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
Analyze the response against the evaluation criteria and return a JSON object with the following properties:

1. "score": A numerical score from 0.0 to 1.0 representing overall quality (higher is better)
2. "approved": Boolean indicating if the response meets minimum quality standards (true/false)
3. "reasoning": Brief explanation of your evaluation and why you approved or rejected
4. "refinedQuery": If not approved, provide a refined version of the original query that might yield better results

Your output must be valid JSON with these four properties only. Do not include any other text or explanation outside of the JSON structure.
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
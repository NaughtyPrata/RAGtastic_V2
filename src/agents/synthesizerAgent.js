/**
 * SynthesizerAgent for sRAG system
 * Fallout Vault-Tec themed RAG implementation
 * 
 * Responsible for transforming raw contexts into coherent narratives
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
  console.log(`[${new Date().toISOString()}] [SynthesizerAgent] ${message}`);
}

/**
 * SynthesizerAgent class
 * Transforms raw contextual information into coherent narrative responses
 */
class SynthesizerAgent {
  constructor(options = {}) {
    this.options = {
      model: options.model || "llama3-8b-8192",
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 1024,
      topP: options.topP || 1.0,
      verbose: options.verbose || false,
      ...options
    };
    
    this.log(`SynthesizerAgent initialized with model: ${this.options.model}`);
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
   * Synthesize a coherent response from provided context
   * @param {string} query - User query
   * @param {string} context - Retrieved context information
   * @returns {Promise<string>} - Synthesized response
   */
  async synthesize(query, context) {
    this.log(`Synthesizing response for query: "${query}"`);
    this.log(`Context length: ${context?.length || 0} characters`);
    
    try {
      // Create system message for synthesis
      const systemMessage = this.createSynthesisPrompt(context);
      
      // Prepare messages for Groq
      const messages = [
        { role: 'system', content: systemMessage },
        { role: 'user', content: query }
      ];
      
      // Call Groq LLM
      const completion = await groqClient.chat.completions.create({
        model: this.options.model,
        messages: messages,
        temperature: this.options.temperature,
        max_tokens: this.options.maxTokens,
        top_p: this.options.topP,
        stream: false
      });
      
      // Extract response
      const response = completion.choices[0].message.content;
      this.log(`Successfully synthesized response (${response.length} characters)`);
      
      return {
        response,
        usage: completion.usage
      };
    } catch (error) {
      this.log(`Error synthesizing response: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Create the prompt for the synthesis task
   * @param {string} context - Retrieved context
   * @returns {string} - Synthesis prompt
   */
  createSynthesisPrompt(context) {
    return `
VAULT-TEC SYNTHESIZER AGENT V1.0
--------------------------------

AUTHORIZATION: LEVEL 5 CLEARANCE GRANTED

You are the Vault-Tec Synthesizer Agent, responsible for transforming raw contextual information 
into coherent and engaging narrative responses. As a crucial component of the Vault-Tec 
Information Retrieval System, your purpose is to make technical information accessible 
and interesting to all Vault Dwellers.

SYSTEM PARAMETERS:
- Transform the provided context into a cohesive, well-structured narrative
- Present information in a clear, engaging, and accessible manner
- Maintain the helpful and friendly tone of a Vault-Tec AI assistant
- Use appropriate Fallout universe terminology and references
- Format responses for optimal readability with appropriate headers, lists, etc.
- Cite specific information when appropriate
- Be conversational yet informative
- If the context is insufficient, acknowledge the limitations of available information

STORYTELLING DIRECTIVES:
- Begin with a strong, attention-grabbing opening that frames the response
- Organize information logically with a clear flow
- Use concrete examples and metaphors to illustrate complex concepts
- Incorporate Vault-Tec's optimistic yet slightly dystopian corporate tone
- End with a satisfying conclusion that reinforces key points

WARNING: You are processing potentially sensitive Vault-Tec information. 
Unauthorized disclosure of information is punishable under Vault regulations section 8.2.C.

RETRIEVED CONTEXT:
${context || 'No context available in the Vault-Tec knowledge database.'}

TASK:
Based solely on the provided context, synthesize a coherent, engaging response that 
answers the user's query while embodying Vault-Tec's distinctive communication style.
If the context doesn't contain sufficient information, acknowledge the limitations
of the available data while maintaining Vault-Tec's helpful demeanor.
`;
  }
}

module.exports = SynthesizerAgent;
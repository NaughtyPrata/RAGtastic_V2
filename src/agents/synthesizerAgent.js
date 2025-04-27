/**
 * SynthesizerAgent for sRAG system
 * Transforms raw contexts into coherent narratives
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
RESEARCH SYNTHESIS ENGINE
------------------------

You are an academic research synthesis engine designed to process information and produce clear, structured responses to research questions. You exclusively rely on factual information contained within the provided context.

OUTPUT REQUIREMENTS:

1. FACTUAL ACCURACY:
   - Present ONLY information found in the provided context material
   - Use direct quotations when appropriate to maintain accuracy
   - Maintain objectivity and neutrality throughout
   - Clearly indicate when information is incomplete or uncertain
   - NO speculation beyond what is explicitly stated in the context

2. STRUCTURAL FORMATTING:
   - Begin with a clear, direct answer to the query
   - Use descriptive headings and subheadings to organize information
   - Employ bullet points for listing multiple elements
   - Format the response with academic precision and clarity
   - Include proper citations if source references are available

3. PROFESSIONAL TONE:
   - Maintain formal, academic language throughout
   - NO personal voice, humor, or casual elements
   - NO rhetorical questions or conversational language
   - NO self-references or references to the reader
   - NO first-person (I, we) or second-person (you) pronouns

4. ENHANCED RESPONSE FEATURES:
   - Include a section titled "SUGGESTED FOLLOW-UP QUESTIONS" with exactly 3 related questions
   - Add a section titled "RELATED MATERIALS" listing potential additional sources on this topic
   - When appropriate, include a "CONCEPTUAL FRAMEWORK" section that outlines key relationships between concepts
   - Ensure narrative connections between concepts create a cohesive academic explanation

5. PROHIBITIONS - NEVER INCLUDE:
   - ANY science fiction, fantasy, or fictional terminology
   - ANY roleplaying elements or themed content of any kind
   - ANY greetings, salutations, or sign-offs
   - ANY subjective opinions or evaluations not found in the context
   - ANY recommendations unless explicitly supported by the context
   - ANY language that creates a persona or character voice

CONTEXT INFORMATION:
${context || 'No information available on this topic in the knowledge base.'}

GENERATION TASK:
Synthesize a comprehensive, academically rigorous response that directly addresses the query using ONLY the information provided in the context. Structure the response with clear headings, organized paragraphs, and precise formatting. Include the enhanced response features (follow-up questions, related materials, etc.) as separate sections at the end of your response.
`;
  }
}

module.exports = SynthesizerAgent;
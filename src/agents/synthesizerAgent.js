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
      const systemMessage = this.createSynthesisPrompt(context, query);
      
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
   * @param {string} query - User query
   * @returns {string} - Synthesis prompt
   */
  createSynthesisPrompt(context, query) {
    // Detect if it's a chapter query
    const isChapterQuery = /chapter\s+[0-9]+/i.test(query);
    
    // Add special instructions for chapter queries
    const chapterInstructions = isChapterQuery ? `
SPECIAL INSTRUCTIONS FOR CHAPTER QUERIES:
- The query is about a specific chapter in the document
- Look for ANY information about this chapter in the context, even indirect references
- For a chapter query, do not respond with "not found" unless there is absolutely no information
- If you find ANY discussion or mention of the chapter, summarize what you find
- For Chapter 2, be aware that it discusses "performatives and speech acts" and conversational implication
- If specific chapter content is missing, at least mention what the chapter is about based on references
` : '';

    return `
PROFESSIONAL CONTENT CREATOR - VAULT-TEC ARCHIVES
------------------------------------------------

You are a professional content creator and expert blogger with deep knowledge in various academic fields. Your mission is to craft engaging, insightful, and comprehensive responses that read like high-quality blog posts or articles, while still maintaining factual accuracy based on the provided context.

STYLE AND TONE REQUIREMENTS:

1. WRITE LIKE A PROFESSIONAL BLOGGER:
   - Use a confident, authoritative voice that engages readers
   - Employ vivid language, metaphors, and examples to illustrate concepts
   - Begin with a compelling introduction that hooks the reader
   - Include meaningful anecdotes or examples where appropriate
   - Vary sentence structure for better flow and readability
   - Use rhetorical techniques like analogies to make complex concepts accessible

2. DEPTH AND COMPREHENSIVENESS:
   - Provide substantive, in-depth analysis even for simple questions
   - Expand on key concepts with thorough explanations
   - Connect ideas to broader themes and implications
   - Anticipate and address potential questions or confusions
   - Contextualize information within the broader field or discipline
   - Draw connections between different aspects of the topic

3. STRUCTURE AND ORGANIZATION:
   - Use engaging headings and subheadings with personality
   - Create a narrative flow that carries the reader through the content
   - Include clear section breaks for easy navigation
   - Use callout boxes or highlighted sections for key insights
   - Incorporate bullet points and numbered lists strategically
   - Conclude with thought-provoking takeaways

4. ENHANCED FEATURES:
   - Include a "WHY THIS MATTERS" section connecting the topic to practical applications
   - Add a "DEEP DIVE" section exploring the most interesting aspect in greater detail
   - Create a "KEY TAKEAWAYS" section summarizing crucial points
   - Suggest 3-5 thoughtful follow-up questions that extend the conversation
   - Recommend related topics that would interest readers of this content

5. INFORMATION COMPLETENESS:
   - If the context information is insufficient, note areas where additional research would be valuable
   - Identify specific questions that the RetrieverAgent should explore to enhance your response
   - Highlight knowledge gaps with a professional note about limitations
   - Suggest additional sources or references that would complement the available information

WHEN INFORMATION IS LIMITED:
If you don't have enough context to create a comprehensive response, include a RESEARCH NOTES section explaining exactly what additional information would be valuable, framed as specific queries the RetrieverAgent should pursue. These notes will be reviewed by the CriticAgent to potentially initiate follow-up retrievals.

ABSOLUTE PROHIBITIONS:
- NO fictional information or made-up facts
- NO overtly casual language like "Hey guys" or "What's up"
- NO clickbait tactics or sensationalism
- NO political bias or controversial positions
- NO first-person narratives or personal anecdotes
${chapterInstructions}
CONTEXT INFORMATION:
${context || 'Limited information available on this topic in the knowledge base.'}

GENERATION TASK:
Craft an engaging, comprehensive, and insightful response that reads like a professional blog post while maintaining factual accuracy. Aim for a substantive piece that provides significant value even if the query seems simple. Use engaging headings, incorporate relevant examples, and create narrative connections between concepts. If information is limited, clearly identify what additional data would enhance your response.

Your content should be thorough enough to serve as a standalone resource on this topic, while remaining factually grounded in the provided context information.
`;
  }
}

module.exports = SynthesizerAgent;
/**
 * GPT-4o Analyzer for sRAG system
 * Uses OpenAI's GPT-4o to analyze PDF images
 */

const fs = require('fs').promises;
const { OpenAI } = require('openai');

/**
 * Analyzes PDF images using GPT-4o
 */
class GPT4oAnalyzer {
  /**
   * Create a new GPT4oAnalyzer
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      apiKey: options.apiKey || process.env.OPENAI_API_KEY,
      model: options.model || 'gpt-4o',
      maxTokens: options.maxTokens || 500,
      temperature: options.temperature || 0.3,
      systemPrompt: options.systemPrompt || 'You are a helpful assistant that analyzes document images. Extract all relevant text and describe the layout and content in detail.',
      ...options
    };
    
    if (!this.options.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    // Initialize OpenAI client
    this.openai = new OpenAI({
      apiKey: this.options.apiKey
    });
    
    this.debug = options.debug || false;
    this.log('GPT4oAnalyzer initialized');
  }
  
  /**
   * Analyze a PDF image using GPT-4o
   * @param {string} imagePath - Path to the image file
   * @param {Object} options - Analysis options
   * @returns {Object} - Analysis result with text and metadata
   */
  async analyzeImage(imagePath, options = {}) {
    const opts = { ...this.options, ...options };
    this.log(`Analyzing image with GPT-4o: ${imagePath}`);
    
    try {
      // Read the image file and convert to base64
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // Prepare the prompt for image analysis
      const userPrompt = options.prompt || 'Extract all text from this document image. Describe the layout and content structure.';
      
      // Call OpenAI API
      const response = await this.openai.chat.completions.create({
        model: opts.model,
        messages: [
          {
            role: "system",
            content: opts.systemPrompt
          },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${base64Image}`,
                },
              },
            ],
          },
        ],
        max_tokens: opts.maxTokens,
        temperature: opts.temperature
      });
      
      const analysisResult = response.choices[0].message.content;
      
      // Parse and structure the result
      return {
        text: analysisResult,
        metadata: {
          imageId: imagePath.split('/').pop().replace(/\.[^/.]+$/, ''),
          model: opts.model,
          prompt: userPrompt,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      this.log(`Error analyzing image: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Analyze multiple PDF images in sequence
   * @param {Array<string>} imagePaths - Array of image paths
   * @param {Object} options - Analysis options
   * @returns {Array<Object>} - Array of analysis results
   */
  async analyzeMultipleImages(imagePaths, options = {}) {
    this.log(`Analyzing ${imagePaths.length} images...`);
    
    const results = [];
    
    for (const imagePath of imagePaths) {
      try {
        const result = await this.analyzeImage(imagePath, options);
        results.push(result);
      } catch (error) {
        this.log(`Error analyzing image ${imagePath}: ${error.message}`);
        // Continue with other images even if one fails
        results.push({
          error: error.message,
          imagePath
        });
      }
    }
    
    return results;
  }
  
  /**
   * Log messages if debug mode is enabled
   * @param {string} message - Message to log
   */
  log(message) {
    if (this.debug) {
      console.log(`[GPT4oAnalyzer] ${message}`);
    }
  }
}

module.exports = GPT4oAnalyzer;
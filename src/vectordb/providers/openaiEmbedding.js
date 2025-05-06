/**
 * OpenAI Embedding Provider
 * Generates embeddings using OpenAI's text embedding models
 */

const { OpenAI } = require('openai');

class OpenAIEmbeddingProvider {
  /**
   * Create a new OpenAI embedding provider
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      model: options.model || 'text-embedding-3-small',
      dimensions: options.dimensions, // Optional dimensions parameter
      apiKey: options.apiKey || process.env.OPENAI_API_KEY,
      maxRetries: options.maxRetries || 3,
      debug: options.debug || false,
      ...options
    };

    if (!this.options.apiKey) {
      throw new Error('OpenAI API key is required. Set it in options or as OPENAI_API_KEY environment variable.');
    }

    // Initialize OpenAI client
    this.client = new OpenAI({
      apiKey: this.options.apiKey
    });

    this.log('OpenAI Embedding provider created');
  }

  /**
   * Get embeddings for a list of texts
   * @param {Array<string>} texts - Array of text strings
   * @param {Object} options - Options for embedding generation
   * @returns {Promise<Array>} - Array of embeddings
   */
  async getEmbeddings(texts, options = {}) {
    if (!texts || texts.length === 0) {
      return [];
    }

    const model = options.model || this.options.model;
    const dimensions = options.dimensions || this.options.dimensions;
    const maxRetries = options.maxRetries || this.options.maxRetries;

    this.log(`Getting embeddings for ${texts.length} texts using model ${model}`);

    const embeddings = [];
    let retries = 0;

    while (retries <= maxRetries) {
      try {
        // Create embedding request parameters
        const params = {
          model,
          input: texts
        };

        // Add dimensions if specified
        if (dimensions) {
          params.dimensions = dimensions;
        }

        // Call OpenAI API
        const response = await this.client.embeddings.create(params);

        // Extract embeddings from response
        for (const item of response.data) {
          embeddings.push(item.embedding);
        }

        this.log(`Successfully generated ${embeddings.length} embeddings`);
        return embeddings;
      } catch (error) {
        retries++;

        if (retries > maxRetries) {
          console.error(`Failed to get embeddings after ${maxRetries} attempts`);
          throw error;
        }

        this.log(`Error getting embeddings (attempt ${retries}/${maxRetries + 1}): ${error.message}`);

        // Wait before retrying
        const delay = Math.pow(2, retries) * 1000; // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    return embeddings;
  }

  /**
   * Log a message if debug mode is enabled
   * @param {string} message - Message to log
   */
  log(message) {
    if (this.options.debug) {
      console.log(`[OpenAI Embedding] ${message}`);
    }
  }
}

module.exports = OpenAIEmbeddingProvider;
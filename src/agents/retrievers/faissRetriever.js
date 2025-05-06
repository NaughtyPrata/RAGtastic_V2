/**
 * FAISS Retriever for sRAG system
 * 
 * Retrieves relevant context from FAISS vector database
 */

const VectorDatabaseManager = require('../../vectordb/vectorManager');
const path = require('path');

/**
 * FaissRetriever class
 * Uses FAISS vector database for semantic search
 */
class FaissRetriever {
  constructor(options = {}) {
    this.options = {
      vectorDbDir: options.vectorDbDir || path.join(process.cwd(), 'data', 'vectordb'),
      embeddingModel: options.embeddingModel || 'text-embedding-3-small',
      numResults: options.numResults || 5,
      similarityThreshold: options.similarityThreshold || 0.7,
      includeMetadata: options.includeMetadata !== false,
      debug: options.debug || false,
      ...options
    };

    this.vectorDbManager = null;
    this.initialized = false;
    
    this.log('FAISS Retriever created');
  }

  /**
   * Initialize the retriever
   */
  async initialize() {
    if (this.initialized) return;
    
    this.log('Initializing FAISS Retriever...');
    
    try {
      // Initialize vector database manager
      this.vectorDbManager = new VectorDatabaseManager({
        provider: 'faiss',
        storageDir: this.options.vectorDbDir,
        embeddingModel: this.options.embeddingModel,
        debug: this.options.debug
      });
      
      await this.vectorDbManager.initialize();
      
      this.initialized = true;
      this.log('FAISS Retriever initialized successfully');
    } catch (error) {
      console.error(`Error initializing FAISS Retriever: ${error.message}`);
      throw error;
    }
  }

  /**
   * Retrieve context for a query using semantic search
   * @param {string} query - Query to search for
   * @param {Object} options - Retrieval options
   * @returns {Promise<Object>} - Retrieved context results
   */
  async retrieveContext(query, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    this.log(`Retrieving context for query: "${query}"`);
    
    try {
      // Search vector database
      const searchOptions = {
        numResults: options.numResults || this.options.numResults,
        similarityThreshold: options.similarityThreshold || this.options.similarityThreshold,
        includeEmbeddings: false
      };
      
      const results = await this.vectorDbManager.search(query, searchOptions);
      
      this.log(`FAISS search returned ${results.length} results`);
      
      // Format results
      const formattedResults = {
        query,
        results: results.map(r => ({
          id: r.id,
          score: r.score,
          content: r.content,
          metadata: r.metadata || {}
        })),
        context: results.map(r => r.content).join('\n\n')
      };
      
      return formattedResults;
    } catch (error) {
      console.error(`Error retrieving from FAISS: ${error.message}`);
      throw error;
    }
  }

  /**
   * Log a message if debug mode is enabled
   * @param {string} message - Message to log
   */
  log(message) {
    if (this.options.debug) {
      console.log(`[FAISS Retriever] ${message}`);
    }
  }
}

module.exports = FaissRetriever;
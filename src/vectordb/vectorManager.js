/**
 * Vector Database Manager
 * Manages vector database operations for the RAG system
 */

const path = require('path');
const fs = require('fs').promises;
const FaissProvider = require('./providers/faissProvider');
const OpenAIEmbeddingProvider = require('./providers/openaiEmbedding');

class VectorDatabaseManager {
  /**
   * Create a new Vector Database Manager
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      provider: options.provider || 'faiss',
      storageDir: options.storageDir || path.join(process.cwd(), 'data', 'vectordb'),
      embeddingModel: options.embeddingModel || 'text-embedding-3-small',
      dimension: options.dimension || 1536, // Default for OpenAI embeddings
      debug: options.debug || false,
      ...options
    };

    this.initialized = false;
    this.providers = {};
    this.activeProvider = null;
    this.embeddingProvider = null;

    this.log('Vector Database Manager created');
  }

  /**
   * Initialize the vector database
   */
  async initialize() {
    this.log('Initializing vector database...');

    try {
      // Initialize embedding provider
      this.embeddingProvider = new OpenAIEmbeddingProvider({
        model: this.options.embeddingModel,
        debug: this.options.debug
      });

      // Initialize FAISS provider
      this.providers.faiss = new FaissProvider({
        storageDir: this.options.storageDir,
        dimension: this.options.dimension,
        embeddingModel: this.options.embeddingModel,
        debug: this.options.debug
      });

      // Set active provider
      this.activeProvider = this.providers[this.options.provider];

      if (!this.activeProvider) {
        throw new Error(`Provider '${this.options.provider}' not available`);
      }

      // Initialize the active provider
      await this.activeProvider.initialize();

      this.initialized = true;
      this.log('Vector database initialized successfully');
      return true;
    } catch (error) {
      console.error(`Vector database initialization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Add documents to the vector database
   * @param {Array<Object>} documents - Array of document objects with id, content, and optional metadata
   * @param {Object} options - Options for adding documents
   * @returns {Promise<Array<string>>} - Array of added document IDs
   */
  async addDocuments(documents, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    this.log(`Adding ${documents.length} documents to vector database`);

    try {
      // Add embedding provider to options
      const addOptions = {
        ...options,
        embeddingProvider: this.embeddingProvider
      };

      // Add documents to active provider
      const addedIds = await this.activeProvider.addDocuments(documents, addOptions);

      this.log(`Successfully added ${addedIds.length} documents to vector database`);
      return addedIds;
    } catch (error) {
      console.error(`Error adding documents to vector database: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process document chunks from PDF vision analysis
   * @param {Object} visionResult - Result from PDF vision analysis
   * @param {Object} options - Processing options
   * @returns {Promise<Array<string>>} - Array of added document IDs
   */
  async processVisionResults(visionResult, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    this.log(`Processing vision results for document: ${visionResult.id}`);

    try {
      const documents = [];

      // Process each page as a separate document for vectorization
      for (const page of visionResult.pages) {
        const chunkId = `${visionResult.id}-page-${page.pageNumber}`;
        
        documents.push({
          id: chunkId,
          content: page.analysis,
          metadata: {
            documentId: visionResult.id,
            pageNumber: page.pageNumber,
            imagePath: page.imagePath,
            sourceType: 'pdf-vision',
            ...visionResult.metadata
          }
        });
      }

      // Add the documents to the vector database
      this.log(`Adding ${documents.length} page chunks to vector database`);
      
      const addOptions = {
        ...options,
        embeddingProvider: this.embeddingProvider
      };
      
      const addedIds = await this.activeProvider.addDocuments(documents, addOptions);
      
      // Optionally save the processed status
      if (options.saveStatus) {
        const statusPath = path.join(
          options.statusDir || this.options.storageDir,
          `${visionResult.id}_indexing_status.json`
        );
        
        await fs.writeFile(statusPath, JSON.stringify({
          documentId: visionResult.id,
          status: 'indexed',
          timestamp: new Date().toISOString(),
          pageCount: documents.length,
          addedIds
        }, null, 2), 'utf8');
      }
      
      this.log(`Successfully processed and added ${addedIds.length} page chunks to vector database`);
      return addedIds;
    } catch (error) {
      console.error(`Error processing vision results: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search for documents using semantic similarity
   * @param {string} query - Query text
   * @param {Object} options - Search options
   * @returns {Promise<Array>} - Array of search results
   */
  async search(query, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    this.log(`Searching for: "${query.substring(0, 50)}..."`);

    try {
      // Add embedding provider to options
      const searchOptions = {
        ...options,
        embeddingProvider: this.embeddingProvider
      };

      // Search active provider
      const results = await this.activeProvider.search(query, searchOptions);

      this.log(`Search returned ${results.length} results`);
      return results;
    } catch (error) {
      console.error(`Error searching vector database: ${error.message}`);
      throw error;
    }
  }

  /**
   * Delete documents from the vector database
   * @param {Array<string>} ids - Array of document IDs to delete
   * @returns {Promise<boolean>} - Success status
   */
  async deleteDocuments(ids) {
    if (!this.initialized) {
      await this.initialize();
    }

    this.log(`Deleting ${ids.length} documents from vector database`);

    try {
      // Delete documents from active provider
      const success = await this.activeProvider.deleteDocuments(ids);

      this.log(`Successfully deleted ${ids.length} documents from vector database`);
      return success;
    } catch (error) {
      console.error(`Error deleting documents from vector database: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get statistics about the vector database
   * @returns {Object} - Statistics
   */
  getStats() {
    if (!this.initialized) {
      return {
        initialized: false,
        provider: this.options.provider
      };
    }

    const providerStats = this.activeProvider.getStats();

    return {
      initialized: this.initialized,
      provider: this.options.provider,
      embeddingModel: this.options.embeddingModel,
      ...providerStats
    };
  }

  /**
   * Log a message if debug mode is enabled
   * @param {string} message - Message to log
   */
  log(message) {
    if (this.options.debug) {
      console.log(`[VectorDB] ${message}`);
    }
  }
}

module.exports = VectorDatabaseManager;
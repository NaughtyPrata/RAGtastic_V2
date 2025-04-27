/**
 * FAISS Vector Store for sRAG system
 * Fallout Vault-Tec themed RAG implementation
 * Fixed version with proper error handling
 */

const path = require('path');
const fs = require('fs').promises;
const faiss = require('faiss-node');
const config = require('../utils/config');
const { defaultLogger: logger } = require('../utils/logger');

/**
 * FAISS Vector Store for efficient similarity search
 */
class FaissStore {
  /**
   * Create a new FAISS Vector Store
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      dimension: config.getRAGConfig().vectorDb.dimension || 1536,
      metric: config.getRAGConfig().vectorDb.metric || 'L2',
      indexPath: config.getRAGConfig().vectorDb.indexPath,
      ...options
    };
    
    this.index = null;
    this.metadataPath = path.join(
      this.options.indexPath, 
      `${options.indexName || 'default'}_metadata.json`
    );
    this.indexFilePath = path.join(
      this.options.indexPath, 
      `${options.indexName || 'default'}.faiss`
    );
    
    // Keep track of document IDs and metadata
    this.documentMetadata = {};
    this.initialized = false;
    this.debug = options.debug || false;
    this.logger = options.logger || defaultLogger.child('FaissStore');
  }
  
  /**
   * Initialize the FAISS index
   */
  async initialize() {
    try {
      // Ensure the index directory exists
      await fs.mkdir(this.options.indexPath, { recursive: true });
      
      // Check if we have an existing index and metadata
      const [indexExists, metadataExists] = await Promise.all([
        this.fileExists(this.indexFilePath),
        this.fileExists(this.metadataPath)
      ]);
      
      if (indexExists && metadataExists) {
        // Load existing index and metadata
        this.log('Loading existing FAISS index and metadata');
        await this.loadIndex();
        await this.loadMetadata();
      } else {
        // Create a new index
        this.log('Creating new FAISS index');
        await this.createNewIndex();
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      this.logger.error('Failed to initialize FAISS store:', error);
      
      // Create a new index as fallback if loading fails
      try {
        this.log('Creating new index as fallback after initialization failure');
        await this.createNewIndex();
        this.initialized = true;
        return true;
      } catch (fallbackError) {
        this.logger.error('Failed to create fallback index:', fallbackError);
        throw fallbackError;
      }
    }
  }
  
  /**
   * Create a new FAISS index
   */
  async createNewIndex() {
    try {
      // Create a new FAISS index
      this.log(`Creating new FAISS index with dimension ${this.options.dimension}`);
      this.index = new faiss.IndexFlatL2(this.options.dimension);
      
      // Initialize metadata
      this.documentMetadata = {};
      
      // Save the empty index and metadata
      await this.saveIndex();
      await this.saveMetadata();
      
      return true;
    } catch (error) {
      this.logger.error('Failed to create new FAISS index:', error);
      throw error;
    }
  }
  
  /**
   * Load existing FAISS index
   */
  async loadIndex() {
    try {
      // Load the index from disk
      const indexBuffer = await fs.readFile(this.indexFilePath);
      this.index = faiss.Index.fromBuffer(indexBuffer);
      return true;
    } catch (error) {
      this.logger.error('Failed to load FAISS index:', error);
      throw error;
    }
  }
  
  /**
   * Save FAISS index to disk
   */
  async saveIndex() {
    try {
      // Save the index to disk
      const indexBuffer = this.index.toBuffer();
      await fs.writeFile(this.indexFilePath, indexBuffer);
      return true;
    } catch (error) {
      this.logger.error('Failed to save FAISS index:', error);
      throw error;
    }
  }
  
  /**
   * Load metadata from disk
   */
  async loadMetadata() {
    try {
      // Load metadata from disk
      const metadataJson = await fs.readFile(this.metadataPath, 'utf8');
      this.documentMetadata = JSON.parse(metadataJson);
      return true;
    } catch (error) {
      this.logger.error('Failed to load metadata:', error);
      throw error;
    }
  }
  
  /**
   * Save metadata to disk
   */
  async saveMetadata() {
    try {
      // Save metadata to disk
      const metadataJson = JSON.stringify(this.documentMetadata, null, 2);
      await fs.writeFile(this.metadataPath, metadataJson, 'utf8');
      return true;
    } catch (error) {
      this.logger.error('Failed to save metadata:', error);
      throw error;
    }
  }
  
  /**
   * Add vectors to the index
   * @param {Array<Array<number>>} vectors - Array of embedding vectors
   * @param {Array<Object>} metadata - Array of metadata objects
   */
  async addVectors(vectors, metadata) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Validate inputs
      if (!Array.isArray(vectors)) {
        throw new Error('Invalid vectors argument: must be an array');
      }
      
      if (!Array.isArray(metadata)) {
        throw new Error('Invalid metadata argument: must be an array');
      }
      
      if (vectors.length !== metadata.length) {
        throw new Error(`Vector and metadata counts do not match: ${vectors.length} vectors vs ${metadata.length} metadata entries`);
      }
      
      if (vectors.length === 0) {
        this.log('No vectors to add, skipping');
        return true;
      }
      
      // Validate vector dimensions
      for (let i = 0; i < vectors.length; i++) {
        if (!Array.isArray(vectors[i])) {
          throw new Error(`Vector at index ${i} is not an array`);
        }
        
        if (vectors[i].length !== this.options.dimension) {
          throw new Error(`Vector at index ${i} has wrong dimension: ${vectors[i].length} (expected ${this.options.dimension})`);
        }
      }
      
      // Get current size of the index
      const currentSize = this.index.ntotal;
      this.log(`Adding ${vectors.length} vectors to index with current size ${currentSize}`);
      
      // Add vectors to the index
      this.index.add(vectors);
      
      // Add metadata for each vector
      for (let i = 0; i < metadata.length; i++) {
        const id = currentSize + i;
        this.documentMetadata[id] = metadata[i];
      }
      
      // Save the updated index and metadata
      await this.saveIndex();
      await this.saveMetadata();
      
      this.log(`Successfully added ${vectors.length} vectors, new index size: ${this.index.ntotal}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to add vectors to FAISS index: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Search for similar vectors
   * @param {Array<number>} vector - Query vector
   * @param {number} k - Number of results to return
   * @returns {Array<Object>} - Array of search results with metadata
   */
  async search(vector, k = 5) {
    if (!this.initialized) {
      await this.initialize();
    }
    
    try {
      // Validate vector
      if (!Array.isArray(vector)) {
        throw new Error('Search vector must be an array');
      }
      
      if (vector.length !== this.options.dimension) {
        throw new Error(`Search vector has wrong dimension: ${vector.length} (expected ${this.options.dimension})`);
      }
      
      // Check if index is empty
      if (this.index.ntotal === 0) {
        this.log('Index is empty, returning empty results');
        return [];
      }
      
      // Limit k to the number of vectors in the index
      const effectiveK = Math.min(k, this.index.ntotal);
      
      // Search the index
      const results = this.index.search(vector, effectiveK);
      
      // Get the metadata for each result
      const searchResults = results.labels.map((id, index) => {
        return {
          id,
          score: 1.0 - (results.distances[index] / 2.0), // Convert L2 distance to similarity score (0-1)
          metadata: this.documentMetadata[id] || {}
        };
      });
      
      return searchResults;
    } catch (error) {
      this.logger.error(`Failed to search FAISS index: ${error.message}`);
      
      // Return empty results on error
      return [];
    }
  }
  
  /**
   * Get the total number of vectors in the index
   * @returns {number} - Number of vectors
   */
  getSize() {
    if (!this.index) {
      return 0;
    }
    
    return this.index.ntotal;
  }
  
  /**
   * Check if a file exists
   * @param {string} filePath - Path to file
   * @returns {Promise<boolean>} - True if file exists
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Log messages if debug mode is enabled
   * @param {string} message - Message to log
   */
  log(message) {
    if (this.debug) {
      this.logger.info(`[FaissStore] ${message}`);
    }
  }
}

module.exports = FaissStore;
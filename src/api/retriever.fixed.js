/**
 * Retriever API for sRAG system
 * Fallout Vault-Tec themed RAG implementation
 * Fixed version with better error handling
 */

const FAISSRetrieverAgent = require('../agents/retrievers/faissRetrieverAgent');
const { defaultLogger } = require('../utils/logger');
const ConfigLoader = require('../utils/configLoader');

// Logger for the retriever API
const logger = defaultLogger.child('RetrieverAPI');

// Configuration loader
const configLoader = new ConfigLoader();

// Retriever agent instance
let retrieverAgent = null;

/**
 * Initialize the retriever agent
 */
async function initializeRetrieverAgent() {
  try {
    logger.info('Initializing retriever agent');
    
    // Initialize config loader
    await configLoader.initialize();
    
    // Get retriever configuration
    const retrieverConfig = configLoader.getConfig('retriever');
    
    // Create retriever agent
    retrieverAgent = new FAISSRetrieverAgent({
      debug: process.env.NODE_ENV !== 'production',
      ...retrieverConfig
    });
    
    // Initialize retriever agent
    await retrieverAgent.initialize();
    
    logger.info('Retriever agent initialized successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to initialize retriever agent: ${error.message}`);
    throw error;
  }
}

/**
 * Handle retrieval request
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function handleRetrieval(req, res) {
  try {
    // Ensure retriever agent is initialized
    if (!retrieverAgent) {
      await initializeRetrieverAgent();
    }
    
    // Get query and options from request
    const { query, options = {} } = req.body;
    
    // Validate query
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid query',
        message: 'Query must be a non-empty string'
      });
    }
    
    // Process query
    logger.info(`Processing retrieval query: ${query}`);
    const result = await retrieverAgent.processQuery(query, options);
    
    // Return result directly (not wrapped in success/result)
    return res.json(result);
  } catch (error) {
    logger.error(`Error processing retrieval: ${error.message}`);
    
    return res.status(500).json({
      error: 'Retrieval error',
      message: error.message
    });
  }
}

/**
 * Handle adding documents to the retriever
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function handleAddDocuments(req, res) {
  try {
    // Ensure retriever agent is initialized
    if (!retrieverAgent) {
      await initializeRetrieverAgent();
    }
    
    // Get documents from request
    const { documents } = req.body;
    
    // Validate documents
    if (!Array.isArray(documents) || documents.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid documents',
        message: 'Documents must be a non-empty array'
      });
    }
    
    // Process documents
    logger.info(`Adding ${documents.length} documents to retriever`);
    const result = await retrieverAgent.addDocuments(documents);
    
    // Return result
    return res.json({
      success: true,
      result
    });
  } catch (error) {
    logger.error(`Error adding documents: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: 'Document addition error',
      message: error.message
    });
  }
}

/**
 * Handle retrieving retriever stats
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function handleGetStats(req, res) {
  try {
    // Ensure retriever agent is initialized
    if (!retrieverAgent) {
      await initializeRetrieverAgent();
    }
    
    // Get stats
    const metrics = retrieverAgent.getMetrics();
    let indexSize = 0;
    
    try {
      indexSize = await retrieverAgent.getIndexSize();
    } catch (error) {
      logger.warn(`Error getting index size: ${error.message}`);
    }
    
    // Return stats
    return res.json({
      success: true,
      metrics,
      indexSize
    });
  } catch (error) {
    logger.error(`Error getting retriever stats: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: 'Stats error',
      message: error.message
    });
  }
}

/**
 * Handle resetting retriever metrics
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function handleResetMetrics(req, res) {
  try {
    // Ensure retriever agent is initialized
    if (!retrieverAgent) {
      await initializeRetrieverAgent();
    }
    
    // Reset metrics
    retrieverAgent.resetMetrics();
    
    // Return success
    return res.json({
      success: true,
      message: 'Metrics reset successfully'
    });
  } catch (error) {
    logger.error(`Error resetting metrics: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: 'Metrics reset error',
      message: error.message
    });
  }
}

/**
 * Handle clearing retriever cache
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 */
async function handleClearCache(req, res) {
  try {
    // Ensure retriever agent is initialized
    if (!retrieverAgent) {
      await initializeRetrieverAgent();
    }
    
    // Clear cache
    retrieverAgent.clearCache();
    
    // Return success
    return res.json({
      success: true,
      message: 'Cache cleared successfully'
    });
  } catch (error) {
    logger.error(`Error clearing cache: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: 'Cache clear error',
      message: error.message
    });
  }
}

module.exports = {
  initializeRetrieverAgent,
  handleRetrieval,
  handleAddDocuments,
  handleGetStats,
  handleResetMetrics,
  handleClearCache
};
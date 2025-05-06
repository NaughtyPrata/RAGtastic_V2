/**
 * PDF Vision to FAISS integration 
 * Handles the processing of PDF vision results to FAISS vector database
 */

const fs = require('fs').promises;
const path = require('path');
const DocumentProcessor = require('../documents/documentProcessor');
const VectorDatabaseManager = require('../vectordb/vectorManager');

/**
 * Process PDF vision results and add to FAISS vector database
 * @param {string} pdfPath - Path to PDF document
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Processing results
 */
async function processPdfVisionToFaiss(pdfPath, options = {}) {
  try {
    console.log(`Processing PDF vision to FAISS: ${pdfPath}`);
    
    // Initialize document processor
    const documentProcessor = new DocumentProcessor({
      debug: options.debug || false,
      imageOutputDir: options.imageOutputDir || path.join(process.cwd(), 'temp', 'images'),
      saveResults: true,
      outputDir: options.outputDir || path.join(process.cwd(), 'data', 'vision_results')
    });
    
    await documentProcessor.initialize();
    console.log('Document processor initialized');
    
    // Process PDF with vision
    console.log('Processing PDF with GPT-4o vision...');
    const visionResult = await documentProcessor.processPdfWithVision(pdfPath, {
      visionPrompt: options.visionPrompt || 
                   "Extract all the text content from this document page. " +
                   "Preserve the structure and layout as much as possible. " +
                   "Identify headings, paragraphs, bullet points, and any tables or figures.",
      maxTokens: options.maxTokens || 1000,
      saveResults: true
    });
    
    console.log(`Successfully analyzed ${visionResult.pages.length} PDF pages with GPT-4o vision`);
    
    // Initialize vector database manager
    const vectorDbManager = new VectorDatabaseManager({
      provider: 'faiss',
      storageDir: options.vectorDbDir || path.join(process.cwd(), 'data', 'vectordb'),
      embeddingModel: options.embeddingModel || 'text-embedding-3-small',
      debug: options.debug || false
    });
    
    await vectorDbManager.initialize();
    console.log('Vector database manager initialized');
    
    // Add vision results to vector database
    console.log('Adding vision results to FAISS vector database...');
    const addedIds = await vectorDbManager.processVisionResults(visionResult, {
      saveStatus: true,
      statusDir: options.statusDir || path.join(process.cwd(), 'data', 'status')
    });
    
    console.log(`Successfully added ${addedIds.length} page chunks to FAISS vector database`);
    
    // Return processing results
    return {
      success: true,
      documentId: visionResult.id,
      pdfPath: pdfPath,
      pages: visionResult.pages.length,
      chunks: addedIds.length,
      outputPath: visionResult.outputPath,
      chunkIds: addedIds
    };
  } catch (error) {
    console.error(`Error processing PDF vision to FAISS: ${error.message}`);
    throw error;
  }
}

/**
 * Process raw vision results from file and add to FAISS vector database
 * @param {string} visionResultPath - Path to vision result JSON file
 * @param {Object} options - Processing options
 * @returns {Promise<Object>} - Processing results
 */
async function processVisionResultToFaiss(visionResultPath, options = {}) {
  try {
    console.log(`Processing vision result to FAISS: ${visionResultPath}`);
    
    // Check if the file exists
    const fullPath = path.isAbsolute(visionResultPath) 
      ? visionResultPath 
      : path.join(process.cwd(), visionResultPath);
    
    try {
      await fs.access(fullPath);
    } catch (error) {
      throw new Error(`Vision result file not found: ${visionResultPath}`);
    }
    
    // Read the vision result file
    const visionResultJson = await fs.readFile(fullPath, 'utf8');
    const visionResult = JSON.parse(visionResultJson);
    
    // Initialize vector database manager
    const vectorDbManager = new VectorDatabaseManager({
      provider: 'faiss',
      storageDir: options.vectorDbDir || path.join(process.cwd(), 'data', 'vectordb'),
      embeddingModel: options.embeddingModel || 'text-embedding-3-small',
      debug: options.debug || false
    });
    
    await vectorDbManager.initialize();
    console.log('Vector database manager initialized');
    
    // Add vision results to vector database
    console.log('Adding vision results to FAISS vector database...');
    const addedIds = await vectorDbManager.processVisionResults(visionResult, {
      saveStatus: true,
      statusDir: options.statusDir || path.join(process.cwd(), 'data', 'status')
    });
    
    console.log(`Successfully added ${addedIds.length} page chunks to FAISS vector database`);
    
    // Return processing results
    return {
      success: true,
      documentId: visionResult.id,
      pdfPath: visionResult.path,
      pages: visionResult.pages.length,
      chunks: addedIds.length,
      outputPath: visionResultPath,
      chunkIds: addedIds
    };
  } catch (error) {
    console.error(`Error processing vision result to FAISS: ${error.message}`);
    throw error;
  }
}

/**
 * Search the FAISS vector database for relevant documents
 * @param {string} query - Search query
 * @param {Object} options - Search options
 * @returns {Promise<Object>} - Search results
 */
async function searchFaissDatabase(query, options = {}) {
  try {
    console.log(`Searching FAISS database for: "${query}"`);
    
    // Initialize vector database manager
    const vectorDbManager = new VectorDatabaseManager({
      provider: 'faiss',
      storageDir: options.vectorDbDir || path.join(process.cwd(), 'data', 'vectordb'),
      embeddingModel: options.embeddingModel || 'text-embedding-3-small',
      debug: options.debug || false
    });
    
    await vectorDbManager.initialize();
    
    // Search vector database
    const searchOptions = {
      numResults: options.numResults || 5,
      similarityThreshold: options.similarityThreshold || 0.7,
      includeEmbeddings: options.includeEmbeddings || false
    };
    
    const results = await vectorDbManager.search(query, searchOptions);
    
    console.log(`Search returned ${results.length} results`);
    
    // Process results for easier consumption
    const processedResults = results.map(result => ({
      id: result.id,
      score: result.score,
      content: result.content.substring(0, options.excerptLength || 300) + '...',
      metadata: result.metadata
    }));
    
    // Return search results
    return {
      success: true,
      query: query,
      resultsCount: results.length,
      results: processedResults,
      combinedContent: results.map(r => r.content).join('\n\n')
    };
  } catch (error) {
    console.error(`Error searching FAISS database: ${error.message}`);
    throw error;
  }
}

module.exports = {
  processPdfVisionToFaiss,
  processVisionResultToFaiss,
  searchFaissDatabase
};
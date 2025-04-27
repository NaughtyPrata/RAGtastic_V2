/**
 * Document API for the sRAG system
 */

const fs = require('fs');
const path = require('path');
const util = require('util');
const { defaultLogger } = require('../utils/logger');
const DocumentProcessor = require('../documents/documentProcessor');

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

const DOCUMENTS_DIR = path.join(__dirname, '../../documents');
const logger = defaultLogger.child('DocumentsAPI');

// Document processor instance
let processor = null;

/**
 * Initialize the document processor
 */
async function initializeProcessor() {
  try {
    logger.info('Initializing document processor');
    
    // Create document processor
    processor = new DocumentProcessor({
      debug: true
    });
    
    // Initialize processor
    await processor.initialize();
    
    logger.info('Document processor initialized successfully');
    return true;
  } catch (error) {
    logger.error(`Failed to initialize document processor: ${error.message}`);
    throw error;
  }
}

/**
 * List available documents in the documents directory
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function listDocuments(req, res) {
    try {
        // Ensure documents directory exists
        if (!fs.existsSync(DOCUMENTS_DIR)) {
            fs.mkdirSync(DOCUMENTS_DIR, { recursive: true });
        }
        
        // Read directory contents
        const files = await readdir(DOCUMENTS_DIR);
        
        // Filter for actual files (not directories) and get only supported document types
        const supportedExtensions = ['.pdf', '.txt', '.md', '.doc', '.docx', '.csv', '.json'];
        
        const documentPromises = files.map(async (file) => {
            const filePath = path.join(DOCUMENTS_DIR, file);
            try {
                const stats = await stat(filePath);
                
                // Only include files, not directories
                if (stats.isFile()) {
                    const ext = path.extname(file).toLowerCase();
                    // Check if file has a supported extension
                    if (supportedExtensions.includes(ext)) {
                        return file;
                    }
                }
            } catch (error) {
                logger.error(`Error checking file ${file}:`, error);
            }
            return null;
        });
        
        const documents = (await Promise.all(documentPromises)).filter(Boolean);
        
        // Log the found documents
        logger.info(`Found ${documents.length} documents in ${DOCUMENTS_DIR}`);
        
        // Return a proper JSON object with documents property
        res.json({
            success: true,
            documents: documents,
            count: documents.length
        });
    } catch (error) {
        logger.error('Error listing documents:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to list documents',
            message: error.message
        });
    }
}

/**
 * Preprocess documents for RAG
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function preprocessDocuments(req, res) {
    try {
        const { documents, options = {} } = req.body;
        
        if (!documents || !Array.isArray(documents) || documents.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Bad request',
                message: 'Documents array is required'
            });
        }
        
        logger.info(`Preprocessing documents: ${documents.join(', ')}`);
        
        // Initialize processor if not already initialized
        if (!processor) {
            await initializeProcessor();
        }
        
        // Process each document
        const results = [];
        let totalChunks = 0;
        
        for (const docName of documents) {
            try {
                // Full path to document
                const docPath = path.join(DOCUMENTS_DIR, docName);
                
                // Make sure file exists
                if (!fs.existsSync(docPath)) {
                    results.push({
                        document: docName,
                        error: 'File not found',
                        status: 'failed'
                    });
                    continue;
                }
                
                // Process document
                logger.info(`Processing document: ${docName}`);
                const chunks = await processor.processDocument(docPath, options);
                
                // Check if we got any chunks
                if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
                    results.push({
                        document: docName,
                        error: 'No chunks generated',
                        status: 'failed'
                    });
                    continue;
                }
                
                totalChunks += chunks.length;
                results.push({
                    document: docName,
                    chunks: chunks.length,
                    status: 'processed'
                });
                
                logger.info(`Successfully processed document ${docName} into ${chunks.length} chunks`);
            } catch (error) {
                logger.error(`Error processing document ${docName}: ${error.message}`);
                results.push({
                    document: docName,
                    error: error.message,
                    status: 'failed'
                });
            }
        }
        
        res.json({
            success: true,
            status: 'processed',
            count: documents.length,
            totalChunks,
            results
        });
    } catch (error) {
        logger.error('Error preprocessing documents:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to preprocess documents',
            message: error.message
        });
    }
}

module.exports = {
    listDocuments,
    preprocessDocuments,
    initializeProcessor
};
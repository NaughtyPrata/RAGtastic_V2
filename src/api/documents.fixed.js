/**
 * Document API for the sRAG system
 * Fixed version with proper response formatting and error handling
 */

const fs = require('fs');
const path = require('path');
const util = require('util');

const readdir = util.promisify(fs.readdir);
const stat = util.promisify(fs.stat);

const DOCUMENTS_DIR = path.join(__dirname, '../../documents');

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
                console.error(`Error checking file ${file}:`, error);
            }
            return null;
        });
        
        const documents = (await Promise.all(documentPromises)).filter(Boolean);
        
        // Log the found documents
        console.log(`Found ${documents.length} documents in ${DOCUMENTS_DIR}`);
        
        // Return a proper JSON object with documents property
        res.json({
            success: true,
            documents: documents,
            count: documents.length
        });
    } catch (error) {
        console.error('Error listing documents:', error);
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
        const { documents } = req.body;
        
        if (!documents || !Array.isArray(documents) || documents.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Bad request',
                message: 'Documents array is required'
            });
        }
        
        console.log(`Preprocessing documents: ${documents.join(', ')}`);
        
        // Import required modules for document processing
        const DocumentProcessor = require('../documents/documentProcessor');
        const { OpenAI } = require('openai');
        const VectorDbManager = require('../vectordb/vectorDbManager');
        const { defaultLogger } = require('../utils/logger');
        const config = require('../utils/config');
        
        // Initialize logger
        const logger = defaultLogger.child('DocumentProcessor');
        
        // Initialize document processor
        const processor = new DocumentProcessor({
            debug: true,
            chunkingStrategy: 'hybrid'
        });
        await processor.initialize();
        
        // Check for OpenAI API key
        if (!process.env.OPENAI_API_KEY) {
            return res.status(500).json({
                success: false,
                error: 'Configuration error',
                message: 'OPENAI_API_KEY is missing in environment variables'
            });
        }
        
        // Initialize OpenAI client for embeddings
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY
        });
        
        // Initialize vector database manager
        const vectorDbManager = new VectorDbManager({
            logger: logger.child('VectorDbManager')
        });
        await vectorDbManager.initialize();
        
        // Create or get the index
        const indexName = 'vault-tec-knowledge';
        const index = await vectorDbManager.getIndex(indexName, true);
        
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
                const chunks = await processor.processDocument(docPath);
                
                // Check if we got any chunks
                if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
                    results.push({
                        document: docName,
                        error: 'No chunks generated',
                        status: 'failed'
                    });
                    continue;
                }
                
                // Generate embeddings for chunks
                logger.info(`Generating embeddings for ${chunks.length} chunks from ${docName}`);
                
                // Process in smaller batches to avoid OpenAI API limits
                const batchSize = 5; // Smaller batch size to reduce chances of errors
                for (let i = 0; i < chunks.length; i += batchSize) {
                    try {
                        const batch = chunks.slice(i, i + batchSize);
                        const batchTexts = batch.map(chunk => chunk.content);
                        
                        // Make sure we don't have empty texts
                        const validBatchTexts = batchTexts.map(text => text || 'Empty content');
                        
                        // Get embeddings from OpenAI
                        const embeddingResponse = await openai.embeddings.create({
                            model: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
                            input: validBatchTexts,
                            dimensions: 1536 // Use OpenAI's recommended dimensions
                        });
                        
                        // Extract embeddings
                        const embeddings = embeddingResponse.data.map(item => item.embedding);
                        
                        // Safety check for embeddings
                        if (!embeddings || !Array.isArray(embeddings) || embeddings.length === 0) {
                            throw new Error('No embeddings generated for batch');
                        }
                        
                        // Create metadata for each chunk
                        const metadataArray = batch.map(chunk => ({
                            ...chunk.metadata,
                            document: docName,
                            text: (chunk.content || '').substring(0, 100) + '...' // Preview of text
                        }));
                        
                        // Add vectors to the index with explicit error handling
                        await vectorDbManager.addVectors(indexName, embeddings, metadataArray);
                        
                        logger.info(`Added batch ${i/batchSize + 1}/${Math.ceil(chunks.length/batchSize)} for ${docName}`);
                    } catch (batchError) {
                        logger.error(`Error processing batch for ${docName}: ${batchError.message}`);
                        // Continue with next batch
                    }
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
        
        // Try to create a backup of the index, but don't fail if it doesn't work
        try {
            await vectorDbManager.backupIndex(indexName);
        } catch (backupError) {
            logger.error(`Error creating backup: ${backupError.message}`);
        }
        
        res.json({
            success: true,
            status: 'processed',
            count: documents.length,
            totalChunks,
            results
        });
    } catch (error) {
        console.error('Error preprocessing documents:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to preprocess documents',
            message: error.message
        });
    }
}

module.exports = {
    listDocuments,
    preprocessDocuments
};
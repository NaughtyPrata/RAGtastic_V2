/**
 * Vector Database API Routes
 * Provides endpoints for vector database operations
 */

const express = require('express');
const VectorDatabaseManager = require('../../vectordb/vectorManager');
const path = require('path');
const fs = require('fs').promises;

const router = express.Router();
const vectorDbManager = new VectorDatabaseManager({
  debug: process.env.DEBUG === 'true',
  embeddingModel: process.env.EMBEDDING_MODEL || 'text-embedding-3-small'
});

// Initialize the vector database manager
let initialized = false;
async function initializeVectorDb() {
  if (!initialized) {
    try {
      await vectorDbManager.initialize();
      initialized = true;
      console.log('Vector database initialized');
    } catch (error) {
      console.error('Error initializing vector database:', error.message);
      throw error;
    }
  }
}

// Get vector database stats
router.get('/stats', async (req, res) => {
  try {
    await initializeVectorDb();
    const stats = vectorDbManager.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Error getting vector database stats:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Process vision results and add to vector database
router.post('/process-vision', async (req, res) => {
  try {
    await initializeVectorDb();
    
    const { visionResultPath } = req.body;
    
    if (!visionResultPath) {
      return res.status(400).json({ error: 'Vision result path is required' });
    }
    
    // Check if the file exists
    const fullPath = path.isAbsolute(visionResultPath) 
      ? visionResultPath 
      : path.join(process.cwd(), visionResultPath);
    
    try {
      await fs.access(fullPath);
    } catch (error) {
      return res.status(404).json({ error: `Vision result file not found: ${visionResultPath}` });
    }
    
    // Read the vision result file
    const visionResultJson = await fs.readFile(fullPath, 'utf8');
    const visionResult = JSON.parse(visionResultJson);
    
    // Process the vision result
    const addedIds = await vectorDbManager.processVisionResults(visionResult, {
      saveStatus: true
    });
    
    res.json({
      success: true,
      documentId: visionResult.id,
      addedChunks: addedIds.length,
      chunks: addedIds
    });
  } catch (error) {
    console.error('Error processing vision result:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Search the vector database
router.post('/search', async (req, res) => {
  try {
    await initializeVectorDb();
    
    const { query, options } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const searchOptions = {
      numResults: options?.numResults || 5,
      similarityThreshold: options?.similarityThreshold || 0.7,
      includeEmbeddings: options?.includeEmbeddings || false
    };
    
    const results = await vectorDbManager.search(query, searchOptions);
    
    res.json({
      success: true,
      query,
      resultsCount: results.length,
      results
    });
  } catch (error) {
    console.error('Error searching vector database:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Delete documents from the vector database
router.delete('/documents', async (req, res) => {
  try {
    await initializeVectorDb();
    
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Document IDs array is required' });
    }
    
    const success = await vectorDbManager.deleteDocuments(ids);
    
    res.json({
      success,
      deletedCount: ids.length,
      ids
    });
  } catch (error) {
    console.error('Error deleting documents from vector database:', error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
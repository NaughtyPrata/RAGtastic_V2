/**
 * Test script for FAISS integration with sRAG system
 * Tests the full pipeline from PDF to image to GPT-4o vision to FAISS vector DB
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs').promises;
const DocumentProcessor = require('./src/documents/documentProcessor');
const VectorDatabaseManager = require('./src/vectordb/vectorManager');

// Path to a test PDF document
const testPdfPath = process.argv[2];

if (!testPdfPath) {
  console.error("Usage: node test-faiss-integration.js <path-to-pdf>");
  process.exit(1);
}

// Create a log directory if it doesn't exist
async function ensureLogDirectory() {
  const logDir = path.join(process.cwd(), 'logs');
  try {
    await fs.mkdir(logDir, { recursive: true });
    return logDir;
  } catch (error) {
    console.error("Error creating log directory:", error.message);
    return null;
  }
}

async function testFaissIntegration() {
  console.log("=== Testing FAISS Integration with PDF Vision Analysis ===");
  console.log(`PDF Path: ${testPdfPath}`);
  
  // Create log file
  const logDir = await ensureLogDirectory();
  const logFile = path.join(logDir, `faiss-test-${Date.now()}.log`);
  
  // Basic logging function that writes to console and file
  const log = async (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    try {
      await fs.appendFile(logFile, logMessage + '\n');
    } catch (error) {
      console.error("Error writing to log file:", error.message);
    }
  };
  
  await log("Starting FAISS integration test");
  
  try {
    // Check if OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      await log("ERROR: OpenAI API key not found in .env file!");
      console.error("Please add OPENAI_API_KEY to your .env file");
      return;
    }
    
    await log("OpenAI API key found");
    
    // Step 1: Initialize the document processor
    await log("Initializing document processor...");
    const documentProcessor = new DocumentProcessor({
      debug: true,
      imageOutputDir: path.join(process.cwd(), 'temp', 'images'),
      saveResults: true,
      outputDir: path.join(process.cwd(), 'data', 'vision_results')
    });
    
    await documentProcessor.initialize();
    await log("Document processor initialized");
    
    // Step 2: Initialize the vector database manager
    await log("Initializing vector database manager...");
    const vectorDbManager = new VectorDatabaseManager({
      provider: 'faiss',
      storageDir: path.join(process.cwd(), 'data', 'vectordb'),
      embeddingModel: 'text-embedding-3-small',
      debug: true
    });
    
    await vectorDbManager.initialize();
    await log("Vector database manager initialized");
    
    // Step 3: Process the PDF with GPT-4o vision
    await log("Processing PDF with GPT-4o vision...");
    const visionResult = await documentProcessor.processPdfWithVision(testPdfPath, {
      visionPrompt: "Extract all the text content from this document page. " +
                   "Preserve the structure and layout as much as possible. " +
                   "Identify headings, paragraphs, bullet points, and any tables or figures.",
      maxTokens: 1000,
      saveResults: true
    });
    
    await log(`Successfully analyzed ${visionResult.pages.length} PDF pages with GPT-4o vision`);
    
    // Step 4: Add the vision results to the vector database
    await log("Adding vision results to FAISS vector database...");
    const addedIds = await vectorDbManager.processVisionResults(visionResult, {
      saveStatus: true
    });
    
    await log(`Successfully added ${addedIds.length} page chunks to FAISS vector database`);
    
    // Step 5: Test searching the vector database
    const testQueries = [
      "What is the main topic of this document?",
      "Can you summarize the first page?",
      "What information is in this document?"
    ];
    
    for (const query of testQueries) {
      await log(`\nTesting search query: "${query}"`);
      
      const searchResults = await vectorDbManager.search(query, {
        numResults: 3,
        similarityThreshold: 0.5
      });
      
      await log(`Search returned ${searchResults.length} results`);
      
      if (searchResults.length > 0) {
        await log("Top result:");
        await log(`- ID: ${searchResults[0].id}`);
        await log(`- Score: ${searchResults[0].score.toFixed(4)}`);
        await log(`- Content excerpt: ${searchResults[0].content.substring(0, 100)}...`);
      }
    }
    
    // Step 6: Get vector database stats
    const stats = vectorDbManager.getStats();
    await log("\nVector database stats:");
    await log(JSON.stringify(stats, null, 2));
    
    await log("\nFAISS integration test completed successfully!");
    
  } catch (error) {
    await log(`ERROR: ${error.message}`);
    console.error("Error during FAISS integration test:", error);
  }
}

// Run the test
testFaissIntegration().catch(console.error);
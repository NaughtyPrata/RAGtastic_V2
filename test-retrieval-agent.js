/**
 * Test script for Retrieval Agent with FAISS integration
 * Tests the complete RAG pipeline with PDF vision and FAISS
 */

require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const RetrieverAgent = require('./src/agents/retrieverAgent');
const { processPdfVisionToFaiss } = require('./src/api/pdfVisionToFaiss');

// Path to a test PDF document
const testPdfPath = process.argv[2];
const testQuery = process.argv[3] || "What is this document about?";

if (!testPdfPath) {
  console.error("Usage: node test-retrieval-agent.js <path-to-pdf> [optional test query]");
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

async function testRetrievalAgent() {
  console.log("=== Testing Retrieval Agent with FAISS Integration ===");
  console.log(`PDF Path: ${testPdfPath}`);
  console.log(`Test Query: "${testQuery}"`);
  
  // Create log file
  const logDir = await ensureLogDirectory();
  const logFile = path.join(logDir, `retrieval-test-${Date.now()}.log`);
  
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
  
  await log("Starting Retrieval Agent test");
  
  try {
    // Check if OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      await log("ERROR: OpenAI API key not found in .env file!");
      console.error("Please add OPENAI_API_KEY to your .env file");
      return;
    }
    
    await log("OpenAI API key found");
    
    // Step 1: Process PDF to FAISS
    await log("Processing PDF with vision and adding to FAISS...");
    const processResult = await processPdfVisionToFaiss(testPdfPath, {
      debug: true,
      visionPrompt: "Extract all the text content from this document page. " +
                   "Preserve the structure and layout as much as possible. " +
                   "Identify headings, paragraphs, bullet points, and any tables or figures."
    });
    
    await log(`Successfully processed PDF and added ${processResult.chunks} chunks to FAISS`);
    
    // Step 2: Initialize retriever agent
    await log("Initializing Retrieval Agent...");
    const retrieverAgent = new RetrieverAgent({
      useFaiss: true,
      useHybridSearch: true,
      numResults: 5,
      similarityThreshold: 0.5,
      verbose: true,
      debug: true
    });
    
    // Step 3: Test retrieval with query
    await log(`Testing retrieval with query: "${testQuery}"`);
    const context = await retrieverAgent.retrieve(testQuery);
    
    await log(`Retrieved context (${context.length} characters)`);
    
    // Display first 500 characters of context
    if (context && context.length > 0) {
      await log("\nContext excerpt:");
      await log(context.substring(0, 500) + "...");
    } else {
      await log("No context retrieved");
    }
    
    // Test with additional queries
    const additionalQueries = [
      "What is the main topic discussed in this document?",
      "What are the key points made in this document?",
      "Who is the author of this document?"
    ];
    
    for (const query of additionalQueries) {
      await log(`\nTesting additional query: "${query}"`);
      const queryContext = await retrieverAgent.retrieve(query);
      
      await log(`Retrieved context (${queryContext.length} characters)`);
      
      // Display first 300 characters of context
      if (queryContext && queryContext.length > 0) {
        await log("Context excerpt:");
        await log(queryContext.substring(0, 300) + "...");
      } else {
        await log("No context retrieved");
      }
    }
    
    await log("\nRetrieval Agent test completed successfully!");
    
  } catch (error) {
    await log(`ERROR: ${error.message}`);
    console.error("Error during Retrieval Agent test:", error);
  }
}

// Run the test
testRetrievalAgent().catch(console.error);
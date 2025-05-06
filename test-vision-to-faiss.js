/**
 * Test script for processing existing vision analysis results to FAISS
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs').promises;
const { processVisionResultToFaiss } = require('./src/api/pdfVisionToFaiss');

// Path to vision result file
const visionResultPath = path.join(process.cwd(), 'data', 'vision_results', 'Prompt-Engineering_vision_analysis.json');

async function testVisionToFaiss() {
  console.log("=== Testing Vision Analysis to FAISS Integration ===");
  console.log(`Vision Result Path: ${visionResultPath}`);
  
  try {
    // Check if OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error("ERROR: OpenAI API key not found in .env file!");
      console.error("Please add OPENAI_API_KEY to your .env file");
      return;
    }
    
    console.log("OpenAI API key found");
    
    // Check if vision result file exists
    try {
      await fs.access(visionResultPath);
      console.log("Vision result file found");
    } catch (error) {
      console.error(`ERROR: Vision result file not found at ${visionResultPath}`);
      console.error("Please run the test-pdf-vision.js script first to generate the vision analysis");
      return;
    }
    
    // Process the vision result to FAISS
    console.log("Processing vision result to FAISS...");
    const result = await processVisionResultToFaiss(visionResultPath, {
      debug: true
    });
    
    console.log(`Successfully processed vision result and added ${result.chunks} chunks to FAISS`);
    console.log("Result details:", JSON.stringify(result, null, 2));
    
    console.log("\nVision to FAISS test completed successfully!");
    
  } catch (error) {
    console.error("ERROR:", error.message);
    console.error("Error during Vision to FAISS test:", error);
  }
}

// Run the test
testVisionToFaiss().catch(console.error);
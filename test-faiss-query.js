/**
 * Test script for querying the FAISS database
 */

require('dotenv').config();
const VectorDatabaseManager = require('./src/vectordb/vectorManager');

// Test query
const query = process.argv[2] || "What is chapter 3 all about?";

async function testFaissQuery() {
  console.log("=== Testing FAISS Query ===");
  console.log(`Query: "${query}"`);
  
  try {
    // Check if OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      console.error("ERROR: OpenAI API key not found in .env file!");
      console.error("Please add OPENAI_API_KEY to your .env file");
      return;
    }
    
    console.log("OpenAI API key found");
    
    // Initialize vector database manager
    console.log("Initializing vector database manager...");
    const vectorDbManager = new VectorDatabaseManager({
      debug: true
    });
    
    await vectorDbManager.initialize();
    console.log("Vector database initialized");
    
    // Perform the search
    console.log(`Searching for: "${query}"`);
    const results = await vectorDbManager.search(query, {
      numResults: 5,
      similarityThreshold: 0.5,
      includeEmbeddings: false
    });
    
    console.log(`Found ${results.length} results`);
    
    // Display results
    if (results.length > 0) {
      console.log("\nTop results:");
      
      results.slice(0, 3).forEach((result, index) => {
        console.log(`\n--- Result ${index + 1} (Score: ${result.score.toFixed(4)}) ---`);
        console.log(`ID: ${result.id}`);
        console.log(`Content excerpt: ${result.content.substring(0, 200)}...`);
      });
      
      // Combine content from all results
      const combinedContent = results.map(r => r.content).join('\n\n');
      console.log(`\nTotal content length: ${combinedContent.length} characters`);
    } else {
      console.log("No results found for this query");
    }
    
    console.log("\nFAISS query test completed successfully!");
    
  } catch (error) {
    console.error("ERROR:", error.message);
    console.error("Error during FAISS query test:", error);
  }
}

// Run the test
testFaissQuery().catch(console.error);
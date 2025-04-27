/**
 * Test RAG functionality specifically with the Prompt-Engineering.pdf document
 */

const axios = require('axios');

// Server configuration
const API_BASE_URL = 'http://localhost:3002/api';

async function preprocessDocument() {
  console.log('Step 1: Preprocessing the Prompt-Engineering.pdf document\n');
  
  try {
    const preprocessResponse = await axios.post(`${API_BASE_URL}/documents/preprocess`, {
      documents: ['Prompt-Engineering.pdf'],
      options: {
        chunkSize: 1000,
        chunkOverlap: 200,
        chunkingStrategy: 'hybrid',
        extractMetadata: true
      }
    });
    
    console.log('Preprocessing response:', JSON.stringify(preprocessResponse.data, null, 2));
    
    if (preprocessResponse.data.success) {
      console.log('\n✅ Document preprocessing completed successfully');
      return true;
    } else {
      console.log('\n❌ Document preprocessing failed');
      return false;
    }
  } catch (error) {
    console.error('Error preprocessing document:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

async function testQueries() {
  const queries = [
    "What are the types of prompting techniques?",
    "Who wrote this prompt engineering guide?",
    "What is zero-shot prompting?",
    "Explain few-shot prompting"
  ];
  
  for (const query of queries) {
    console.log(`\n=== TESTING QUERY: "${query}" ===\n`);
    
    try {
      // Test through retriever API
      const retrievalResponse = await axios.post(`${API_BASE_URL}/retriever/query`, {
        query: query,
        options: {
          numResults: 5,
          similarityThreshold: 0.5,  // Lower threshold to improve matching
          useHybridSearch: true
        }
      });
      
      console.log('Retrieval response:');
      
      if (retrievalResponse.data.searchResults && retrievalResponse.data.searchResults.length > 0) {
        console.log(`Found ${retrievalResponse.data.searchResults.length} search results!`);
        console.log('\nFirst search result:');
        console.log(JSON.stringify(retrievalResponse.data.searchResults[0], null, 2));
        
        console.log('\nResponse text:');
        console.log(retrievalResponse.data.response);
        
        console.log('\n✅ Retriever found relevant documents for the query!');
      } else {
        console.log('No search results found.');
        console.log('\nResponse text:');
        console.log(retrievalResponse.data.response);
        
        console.log('\n❌ Retriever did not find relevant documents for the query.');
      }
      
    } catch (error) {
      console.error(`Error testing query "${query}":`, error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }
  }
}

async function runTest() {
  // First preprocess the document
  const preprocessSuccess = await preprocessDocument();
  
  if (preprocessSuccess) {
    // Wait a moment for indexing to complete
    console.log('\nWaiting 3 seconds for indexing to complete...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test queries
    await testQueries();
  } else {
    console.log('\nSkipping query tests due to preprocessing failure');
  }
}

// Run the test
runTest();

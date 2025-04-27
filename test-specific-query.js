/**
 * Test specific query for the RAG system
 */

const axios = require('axios');

// Server configuration
const API_BASE_URL = 'http://localhost:3002/api';

async function testSpecificQuery() {
  console.log('Testing specific query that should match our sample document...\n');
  
  try {
    // Test RAG retrieval with a query that should match our sample-doc.txt
    const retrievalResponse = await axios.post(`${API_BASE_URL}/retriever/query`, {
      query: 'What information do we have about secret Vault experiments?',
      options: {
        numResults: 5,
        similarityThreshold: 0.5,  // Lower threshold to improve matching
        useHybridSearch: true
      }
    });
    
    console.log('Full retrieval response:', JSON.stringify(retrievalResponse.data, null, 2));
    console.log('Retrieval response status:', retrievalResponse.status);
    
    if (retrievalResponse.data.searchResults && retrievalResponse.data.searchResults.length > 0) {
      console.log('\nSearch results found! Count:', retrievalResponse.data.searchResults.length);
      console.log('\nFirst search result:', {
        id: retrievalResponse.data.searchResults[0].id,
        score: retrievalResponse.data.searchResults[0].score,
        metadata: retrievalResponse.data.searchResults[0].metadata || 'No metadata'
      });
      
      console.log('\nResponse excerpt:');
      console.log(retrievalResponse.data.response.substring(0, 150) + '...');
      
      console.log('\n✅ Retriever found relevant documents!');
    } else {
      console.log('\nNo search results found. Response excerpt:');
      console.log(retrievalResponse.data.response.substring(0, 150) + '...');
      console.log('\n❌ Retriever did not find relevant documents.');
    }
    
  } catch (error) {
    console.error('Error testing specific query:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testSpecificQuery();

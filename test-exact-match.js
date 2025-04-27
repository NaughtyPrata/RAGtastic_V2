/**
 * Test exact match query for the RAG system
 */

const axios = require('axios');

// Server configuration
const API_BASE_URL = 'http://localhost:3002/api';

async function testExactMatch() {
  console.log('Testing exact match query using text from our sample document...\n');
  
  try {
    // Test RAG retrieval with text taken directly from sample-doc.txt
    const retrievalResponse = await axios.post(`${API_BASE_URL}/retriever/query`, {
      query: 'most Vaults were secretly designed to conduct social experiments on the dwellers',
      options: {
        numResults: 10,
        similarityThreshold: 0.3,  // Very low threshold to improve matching
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
      
      console.log('\n✅ Retriever found relevant documents with exact match!');
    } else {
      console.log('\nNo search results found even with exact match. Response excerpt:');
      console.log(retrievalResponse.data.response.substring(0, 150) + '...');
      console.log('\n❌ Retriever did not find relevant documents with exact match.');
      
      console.log('\nThis suggests the vector embeddings might not be working properly,');
      console.log('or the document chunks weren\'t properly indexed in the vector store.');
    }
    
  } catch (error) {
    console.error('Error testing exact match query:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testExactMatch();

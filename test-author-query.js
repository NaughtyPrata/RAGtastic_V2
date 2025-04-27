/**
 * Test to find the author of the book
 */

const axios = require('axios');

/**
 * Test the RAG API with a query about the author
 */
async function testAuthorQuery() {
  try {
    const query = "Who is Lee Boonstra?";
    console.log(`Testing RAG API with query: "${query}"`);
    
    // Make request to the RAG API
    const response = await axios.post('http://localhost:3002/api/retriever/query', {
      query,
      options: {
        model: "llama3-8b-8192",
        numResults: 10, // Increase results to get more context
        similarityThreshold: 0.2, // Lower threshold to catch more mentions
        temperature: 0.3, // Lower temperature for more factual responses
        maxTokens: 1024
      }
    }, {
      timeout: 30000
    });
    
    // Check response
    if (response.data.success) {
      console.log('\nRAG API Response:');
      console.log('Query:', response.data.query);
      console.log('Response:', response.data.response);
      console.log('\nToken Usage:', response.data.usage);
    } else {
      console.error('API returned an error:', response.data.error);
    }
  } catch (error) {
    console.error('Error testing RAG API:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testAuthorQuery();
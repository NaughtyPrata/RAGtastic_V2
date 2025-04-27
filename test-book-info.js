/**
 * Test to get information about the book
 */

const axios = require('axios');

/**
 * Test the RAG API with a query about the book
 */
async function testBookInfo() {
  try {
    const query = "What is this book about? What are the main topics covered?";
    console.log(`Testing RAG API with query: "${query}"`);
    
    // Make request to the RAG API
    const response = await axios.post('http://localhost:3002/api/retriever/query', {
      query,
      options: {
        model: "llama3-8b-8192",
        numResults: 15, // Increase results to get more context
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
testBookInfo();
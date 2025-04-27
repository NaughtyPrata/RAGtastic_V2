/**
 * Test RAG functionality with Groq
 */

const axios = require('axios');

/**
 * Test the RAG API with a query
 */
async function testGroqRAG() {
  try {
    const query = "What is zero-shot prompting?";
    console.log(`Testing RAG API with query: "${query}"`);
    
    // Make request to the RAG API
    const response = await axios.post('http://localhost:3002/api/retriever/query', {
      query,
      options: {
        model: "llama3-8b-8192",
        numResults: 5,
        similarityThreshold: 0.3,
        useHybridSearch: true,
        temperature: 0.7,
        maxTokens: 1024
      }
    }, {
      timeout: 20000 // 20 second timeout
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
      console.error('Response status:', error.response.status);
    }
  }
}

// Run the test
testGroqRAG();
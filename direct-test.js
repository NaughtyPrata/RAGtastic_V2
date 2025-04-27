/**
 * Direct test for querying about documents (accepts a command line argument)
 */

const axios = require('axios');

async function testDirectQuery() {
  // Get query from command line arguments or use default
  const query = process.argv[2] || "What is zero-shot prompting?";
  console.log(`Testing direct query: "${query}"\n`);
  
  try {
    // First, check if the documents are available
    console.log('Step 1: Getting list of available documents...');
    const documentsResponse = await axios.get('http://localhost:3002/api/documents', {
      timeout: 5000
    });
    
    const availableDocuments = documentsResponse.data;
    console.log('Available documents:', availableDocuments);
    
    // Test the query using the RAG complete endpoint
    console.log(`\nStep 2: Testing query: "${query}"...`);
    
    const response = await axios.post('http://localhost:3002/api/rag/complete', {
      query: query,
      options: {
        numResults: 10,
        similarityThreshold: 0.3,
        useHybridSearch: true,
        maxAttempts: 3
      }
    }, {
      timeout: 30000 // 30 second timeout
    });
    
    console.log('\nComplete RAG Response:');
    console.log('-----------------------');
    console.log(response.data.response);
    
    if (response.data.evaluation) {
      console.log('\nQuality Evaluation:');
      console.log('-----------------');
      console.log(`Score: ${Math.round(response.data.evaluation.score * 100)}%`);
      console.log(`Attempts: ${response.data.evaluation.attempts}/${response.data.evaluation.maxAttempts}`);
      console.log(`Reasoning: ${response.data.evaluation.reasoning || 'No reasoning provided'}`);
    }
  } catch (error) {
    console.error('Error testing query:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testDirectQuery();

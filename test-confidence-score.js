/**
 * Test script for confidence score and iteration count display
 */

const axios = require('axios');

// Configuration
const baseUrl = 'http://localhost:3002/api';
const testQuery = "What are the key components of a good argument according to the book?";

async function testConfidenceAndIterations() {
  console.log('Testing confidence score and iteration count with query:', testQuery);
  
  try {
    // Test with complete RAG flow (including CriticAgent)
    console.log('\nTesting with RAG complete flow:');
    const response = await axios.post(`${baseUrl}/rag/complete`, {
      query: testQuery,
      options: {}
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = response.data;
    
    // Check if confidence banner and iteration count are included
    const hasConfidenceBanner = result.response.includes('CONFIDENCE:') && 
                               result.response.includes('confidence-score');
    const hasIterationCount = result.response.includes('ITERATIONS:') && 
                             result.response.includes('iteration-count');
    
    console.log('Response received with:');
    console.log('- Confidence score:', hasConfidenceBanner ? '✓' : '✗');
    console.log('- Iteration count:', hasIterationCount ? '✓' : '✗');
    
    console.log('\nFirst 300 characters of response:');
    console.log(result.response.substring(0, 300));
    
    console.log('\nEvaluation details:');
    console.log('- Score:', result.evaluation?.score);
    console.log('- Approved:', result.evaluation?.approved);
    console.log('- Attempts:', result.evaluation?.attempts);
    console.log('- Max Attempts:', result.evaluation?.maxAttempts);
    
    console.log('\nVerify in the UI that both the confidence score and iteration count are displayed in the confidence banner.');
    
  } catch (error) {
    console.error('Error testing features:', error.message);
  }
}

// Execute the test
testConfidenceAndIterations();

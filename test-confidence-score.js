/**
 * Test script for confidence score display
 */

const axios = require('axios');

// Configuration
const baseUrl = 'http://localhost:3002/api';
const testQuery = "What are the key components of a good argument according to the book?";

async function testConfidenceScore() {
  console.log('Testing confidence score display with query:', testQuery);
  
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
    
    // Check if confidence banner is included
    const hasConfidenceBanner = result.response.includes('CONFIDENCE:') && 
                               result.response.includes('confidence-score');
    
    console.log('Response received with confidence score:', hasConfidenceBanner);
    console.log('\nFirst 300 characters of response:');
    console.log(result.response.substring(0, 300));
    
    console.log('\nEvaluation details:');
    console.log('- Score:', result.evaluation?.score);
    console.log('- Approved:', result.evaluation?.approved);
    console.log('- Attempts:', result.evaluation?.attempts);
    
    console.log('\nVerify in the UI that the confidence score is displayed prominently at the top of the response.');
    
  } catch (error) {
    console.error('Error testing confidence score:', error.message);
  }
}

// Execute the test
testConfidenceScore();

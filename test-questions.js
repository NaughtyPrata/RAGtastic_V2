/**
 * Test specific questions for the RAG system
 */

const axios = require('axios');

// Server configuration
const API_BASE_URL = 'http://localhost:3002/api';

async function testQuestions() {
  const questions = [
    "Who wrote this book",
    "What are the types of prompting"
  ];
  
  for (const question of questions) {
    console.log(`\n=== TESTING QUESTION: "${question}" ===\n`);
    
    try {
      // Test through chat API (agent pipeline)
      const chatResponse = await axios.post(`${API_BASE_URL}/chat`, {
        message: question,
        options: {
          sourcesCount: 5
        }
      });
      
      console.log('Agent response:');
      console.log(chatResponse.data.message);
      console.log('\nAgent type:', chatResponse.data.agent);
      
      // Test through retriever API
      const retrievalResponse = await axios.post(`${API_BASE_URL}/retriever/query`, {
        query: question,
        options: {
          numResults: 5,
          similarityThreshold: 0.5,
          useHybridSearch: true
        }
      });
      
      console.log('\nRetriever response:');
      console.log(retrievalResponse.data.response);
      
      console.log('\nSearch results count:', 
        retrievalResponse.data.searchResults ? retrievalResponse.data.searchResults.length : 0);
      
    } catch (error) {
      console.error(`Error testing question "${question}":`, error.message);
      if (error.response) {
        console.error('Response data:', error.response.data);
      }
    }
  }
}

// Run the test
testQuestions();

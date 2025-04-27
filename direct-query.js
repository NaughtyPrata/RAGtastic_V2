/**
 * Direct query to test if the Prompt-Engineering.pdf is already indexed
 */

const axios = require('axios');

// Server configuration
const API_BASE_URL = 'http://localhost:3002/api';

async function directQuery() {
  try {
    // Query about prompt engineering techniques
    const query = "What are the types of prompting techniques mentioned in the PDF?";
    
    console.log(`Sending query: "${query}"`);
    
    const response = await axios.post(`${API_BASE_URL}/retriever/query`, {
      query: query,
      options: {
        numResults: 5,
        similarityThreshold: 0.4,  // Lower threshold
        useHybridSearch: true
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response text:', response.data.response);
    
    if (response.data.searchResults && response.data.searchResults.length > 0) {
      console.log(`Found ${response.data.searchResults.length} search results!`);
      console.log('First search result:', JSON.stringify(response.data.searchResults[0], null, 2));
    } else {
      console.log('No search results found.');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the query
directQuery();

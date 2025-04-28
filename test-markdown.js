/**
 * Test script to verify markdown functionality
 */

const axios = require('axios');

// Configuration
const baseUrl = 'http://localhost:3002/api';
const testQuery = "Can you show me how markdown works? Please include examples of **bold**, *italic*, `code`, and a code block:```javascript\nconsole.log('Hello');\n```";

async function testMarkdown() {
  console.log('Testing markdown rendering with query:', testQuery);
  
  try {
    // Test with complete RAG flow
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
    console.log('Response received:');
    console.log(result.response);
    
    console.log('\nVerify in the UI that markdown is correctly rendered.');
    console.log('The response should show formatted bold, italic, and code elements.');
    
  } catch (error) {
    console.error('Error testing markdown:', error);
  }
}

// Execute the test
testMarkdown();

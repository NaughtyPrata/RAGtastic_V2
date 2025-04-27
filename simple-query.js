/**
 * Simple test to check chat API with specific prompting question
 */

const axios = require('axios');

async function testSimpleQuery() {
  try {
    // Ask specific question via chat API
    console.log('Sending specific query about prompting techniques...');
    const chatResponse = await axios.post('http://localhost:3002/api/chat', {
      message: 'Can you list and explain the different types of prompting techniques like zero-shot, few-shot, etc?'
    }, {
      timeout: 10000
    });
    
    console.log('Chat response:');
    console.log(chatResponse.data.message);
    console.log('\nAgent used:', chatResponse.data.agent);
    
    if (chatResponse.data.metadata && chatResponse.data.metadata.sources) {
      console.log('Sources used:', chatResponse.data.metadata.sources);
    } else {
      console.log('No sources were used (not using retrieval)');
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testSimpleQuery();

/**
 * Simple test to check document availability
 */

const axios = require('axios');

async function testDocuments() {
  try {
    // Check available documents
    console.log('Checking available documents...');
    const docsResponse = await axios.get('http://localhost:3002/api/documents', {
      timeout: 5000
    });
    
    console.log('Documents:', docsResponse.data);
    
    // Ask simple question via chat API
    console.log('\nSending test query...');
    const chatResponse = await axios.post('http://localhost:3002/api/chat', {
      message: 'What is zero-shot prompting?'
    }, {
      timeout: 5000
    });
    
    console.log('Chat response:');
    console.log(chatResponse.data.message);
    console.log('Agent used:', chatResponse.data.agent);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testDocuments();

/**
 * Simple direct test for querying about Prompt-Engineering.pdf
 */

const axios = require('axios');

async function testPromptEngineering() {
  console.log('Testing direct query about prompt engineering techniques...\n');
  
  try {
    // First, check if the document is available
    console.log('Step 1: Getting list of available documents...');
    const documentsResponse = await axios.get('http://localhost:3002/api/documents', {
      timeout: 5000
    });
    
    const availableDocuments = documentsResponse.data;
    console.log('Available documents:', availableDocuments);
    
    // Check if Prompt-Engineering.pdf is in the list
    if (Array.isArray(availableDocuments)) {
      const hasPromptEngineeringPdf = availableDocuments.includes('Prompt-Engineering.pdf');
      console.log('Prompt-Engineering.pdf found in available documents:', hasPromptEngineeringPdf);
    }
    
    // Test a direct query about zero-shot prompting
    console.log('\nStep 2: Testing query about zero-shot prompting...');
    const query = "What is zero-shot prompting?";
    
    const response = await axios.post('http://localhost:3002/api/chat', {
      message: query
    }, {
      timeout: 10000
    });
    
    console.log('Chat response:');
    console.log(response.data.message);
  } catch (error) {
    console.error('Error testing prompt engineering:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// Run the test
testPromptEngineering();

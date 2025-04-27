/**
 * Simple test to preprocess just the Prompt-Engineering.pdf document
 */

const axios = require('axios');

// Server configuration
const API_BASE_URL = 'http://localhost:3002/api';

async function preprocessPDF() {
  console.log('Attempting to preprocess Prompt-Engineering.pdf...\n');
  
  try {
    const response = await axios.post(`${API_BASE_URL}/documents/preprocess`, {
      documents: ['Prompt-Engineering.pdf']
    }, {
      timeout: 120000 // 120 second timeout
    });
    
    console.log('Preprocessing response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('\n✅ Document preprocessing successful!');
    } else {
      console.log('\n❌ Document preprocessing failed.');
    }
  } catch (error) {
    console.error('Error preprocessing document:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
preprocessPDF();

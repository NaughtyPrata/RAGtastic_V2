/**
 * Direct test for PDF processing
 */

const axios = require('axios');

// Server configuration
const API_BASE_URL = 'http://localhost:3002/api';

async function testPdfDirect() {
  console.log('Testing direct PDF processing for Prompt-Engineering.pdf...\n');
  
  try {
    // Directly attempt to process the PDF
    const preprocessResponse = await axios.post(`${API_BASE_URL}/documents/preprocess`, {
      documents: ['Prompt-Engineering.pdf']
    });
    
    console.log('Preprocessing response:', JSON.stringify(preprocessResponse.data, null, 2));
    
    if (preprocessResponse.data.success) {
      console.log('\n✅ PDF processing SUCCESSFUL');
      
      // Check the details
      if (preprocessResponse.data.results && preprocessResponse.data.results.length > 0) {
        const pdfResult = preprocessResponse.data.results[0];
        if (pdfResult.status === 'processed') {
          console.log(`\nProcessed ${pdfResult.chunks} chunks from the PDF`);
        } else {
          console.log(`\nProcessing failed: ${pdfResult.error || 'Unknown error'}`);
        }
      }
    } else {
      console.log('\n❌ PDF processing FAILED');
    }
    
  } catch (error) {
    console.error('Error testing PDF processing:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testPdfDirect();

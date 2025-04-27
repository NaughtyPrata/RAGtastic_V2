/**
 * Test PDF processing for the RAG system
 */

const axios = require('axios');

// Server configuration
const API_BASE_URL = 'http://localhost:3002/api';

async function testPdfProcessing() {
  console.log('Testing PDF processing capability...\n');
  
  try {
    // First get list of documents to confirm the PDF exists
    const documentsResponse = await axios.get(`${API_BASE_URL}/documents`);
    const documents = documentsResponse.data.documents || documentsResponse.data;
    
    console.log(`Found ${documents.length} documents:`, documents);
    
    // Look for PDF files
    const pdfDocuments = documents.filter(doc => doc.toLowerCase().endsWith('.pdf'));
    
    if (pdfDocuments.length === 0) {
      console.log('No PDF documents found in the documents directory.');
      return;
    }
    
    console.log(`\nFound ${pdfDocuments.length} PDF documents:`, pdfDocuments);
    
    // Process the first PDF document found
    const pdfToProcess = pdfDocuments[0];
    console.log(`\nAttempting to process PDF: ${pdfToProcess}`);
    
    const preprocessResponse = await axios.post(`${API_BASE_URL}/documents/preprocess`, {
      documents: [pdfToProcess]
    });
    
    console.log('\nPreprocessing response:', JSON.stringify(preprocessResponse.data, null, 2));
    
    if (preprocessResponse.data.success) {
      console.log('\n✅ PDF processing test PASSED');
      
      // Check if the processed document was successful
      const results = preprocessResponse.data.results || [];
      const pdfResult = results.find(r => r.document === pdfToProcess);
      
      if (pdfResult && pdfResult.status === 'processed') {
        console.log(`\nSuccessfully processed PDF into ${pdfResult.chunks} chunks.`);
        
        // Now test querying with content from the PDF
        console.log('\nTesting query with PDF content...');
        
        const retrievalResponse = await axios.post(`${API_BASE_URL}/retriever/query`, {
          query: 'What is prompt engineering?',
          options: {
            numResults: 5,
            similarityThreshold: 0.5,
            useHybridSearch: true
          }
        });
        
        console.log('\nRetrieval response:', JSON.stringify(retrievalResponse.data, null, 2));
        
        if (retrievalResponse.data.searchResults && retrievalResponse.data.searchResults.length > 0) {
          console.log('\n✅ Successfully retrieved content from the processed PDF');
        } else {
          console.log('\n❌ Could not retrieve content from the processed PDF');
        }
      } else if (pdfResult) {
        console.log(`\n❌ PDF processing failed: ${pdfResult.error || 'Unknown error'}`);
      } else {
        console.log('\n❓ No result information available for the PDF');
      }
    } else {
      console.log('\n❌ PDF processing test FAILED:', preprocessResponse.data.error || 'Unknown error');
    }
    
  } catch (error) {
    console.error('Error testing PDF processing:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testPdfProcessing();

/**
 * Process the Prompt-Engineering.pdf document for RAG
 */

const axios = require('axios');

async function processPDF() {
  try {
    console.log('Processing Prompt-Engineering.pdf document...');
    
    const response = await axios.post('http://localhost:3002/api/documents/preprocess', {
      documents: ['Prompt-Engineering.pdf'],
      options: {
        chunkSize: 500,        // Smaller chunks for better retrieval
        chunkOverlap: 100,     // Decent overlap
        chunkingStrategy: 'hybrid',
        extractMetadata: true
      }
    }, {
      timeout: 30000  // 30 second timeout
    });
    
    console.log('Processing response:', response.data);
    
    if (response.data.success) {
      console.log('\nSuccessfully processed the document!');
      
      // Test retrieval with a specific query
      console.log('\nTesting retrieval with specific query...');
      const retrievalResponse = await axios.post('http://localhost:3002/api/retriever/query', {
        query: 'What is zero-shot prompting according to the document?',
        options: {
          numResults: 3,
          similarityThreshold: 0.3,  // Lower threshold to make matching easier
          useHybridSearch: true
        }
      }, {
        timeout: 10000
      });
      
      console.log('Retrieval response:', JSON.stringify(retrievalResponse.data, null, 2));
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

processPDF();

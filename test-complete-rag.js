/**
 * Complete test of the RAG system
 * 1. Preprocess the PDF
 * 2. Ask who wrote the book
 * 3. Report the results
 */

const axios = require('axios');

/**
 * Main test function
 */
async function testCompleteRAG() {
  try {
    console.log('==== COMPLETE RAG SYSTEM TEST ====\n');
    console.log('1. Preprocessing document...');
    
    // First, preprocess the document
    const preprocessResponse = await axios.post('http://localhost:3002/api/documents/preprocess', {
      documents: ['Prompt-Engineering.pdf'],
      options: {
        chunkSize: 500,
        chunkOverlap: 100,
        chunkingStrategy: 'hybrid',
        extractMetadata: true
      }
    }, {
      timeout: 30000
    });
    
    // Check preprocessing result
    if (preprocessResponse.data.success) {
      console.log(`✅ Successfully preprocessed document into ${preprocessResponse.data.totalChunks} chunks.`);
      
      // Wait a moment for everything to be saved properly
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Now ask a question about the author
      console.log('\n2. Asking RAG who wrote the book...');
      
      const queryResponse = await axios.post('http://localhost:3002/api/retriever/query', {
        query: "Who is the author of this book?",
        options: {
          model: "llama3-8b-8192",
          numResults: 5,
          temperature: 0.3, // Lower temperature for more factual responses
          maxTokens: 1024
        }
      }, {
        timeout: 30000
      });
      
      // Check query result
      if (queryResponse.data.success) {
        console.log('✅ Successfully received response from RAG system.');
        console.log('\n==== RAG RESPONSE ====');
        console.log('Query: Who is the author of this book?');
        console.log(`Response: ${queryResponse.data.response}`);
        console.log('\n==== TOKEN USAGE ====');
        console.log(queryResponse.data.usage);
      } else {
        console.error('❌ RAG query failed:', queryResponse.data.error);
      }
    } else {
      console.error('❌ Preprocessing failed:', preprocessResponse.data.error);
    }
  } catch (error) {
    console.error('Error during test:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testCompleteRAG();
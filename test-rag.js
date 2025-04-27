/**
 * RAG Functionality Test Script
 * Tests the document processor and retriever agent functionality
 */

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Server configuration
const API_BASE_URL = 'http://localhost:3002/api';

/**
 * Test the document preprocessing functionality
 */
async function testDocumentPreprocessing() {
  console.log('=== TESTING DOCUMENT PREPROCESSING ===');
  
  try {
    // 1. Get list of documents first
    const documentsResponse = await axios.get(`${API_BASE_URL}/documents`);
    const documents = documentsResponse.data;
    console.log(`Found ${documents.length} documents`);
    
    // 2. Run preprocessing on available documents
    if (documents && documents.length > 0) {
      // Choose first document for testing
      const testDocument = documents[0];
      console.log(`Testing preprocessing on document: ${testDocument.id || testDocument}`);
      
      const preprocessResponse = await axios.post(`${API_BASE_URL}/documents/preprocess`, {
        documents: [testDocument.id || testDocument],
        options: {
          chunkSize: 1000,
          chunkOverlap: 200,
          chunkingStrategy: 'hybrid',
          extractMetadata: true
        }
      });
      
      console.log('Preprocessing response:', preprocessResponse.data);
      
      if (preprocessResponse.data.success) {
        console.log('✅ Document preprocessing test PASSED');
        return true;
      } else {
        console.log('❌ Document preprocessing test FAILED:', preprocessResponse.data.error);
        return false;
      }
    } else {
      console.log('No documents available for testing. Testing with sample text.');
      
      // Create a temporary test document with proper ID
      const sampleDocument = {
        id: 'test-doc-' + Date.now(),
        content: 'This is a sample document for the Vault-Tec RAG system. It contains information about Fallout universe. Vault-Tec is a pre-War company that designed and built the Vaults.',
        metadata: {
          title: 'Test Document',
          author: 'Test User',
          createdAt: new Date().toISOString()
        }
      };
      
      const preprocessResponse = await axios.post(`${API_BASE_URL}/documents/preprocess`, {
        documents: ['sample-doc.txt']
      });
      
      console.log('Preprocessing response with sample text:', preprocessResponse.data);
      
      if (preprocessResponse.data.success) {
        console.log('✅ Document preprocessing test with sample text PASSED');
        return true;
      } else {
        console.log('❌ Document preprocessing test with sample text FAILED:', preprocessResponse.data.error);
        return false;
      }
    }
  } catch (error) {
    console.error('Error testing document preprocessing:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

/**
 * Test the retriever agent functionality
 */
async function testRetrieverAgent() {
  console.log('\n=== TESTING RETRIEVER AGENT ===');
  
  try {
    // Test RAG retrieval with a simple query
    const retrievalResponse = await axios.post(`${API_BASE_URL}/retriever/query`, {
      query: 'Tell me about Vault-Tec',
      options: {
        numResults: 3,
        similarityThreshold: 0.6,
        useHybridSearch: true
      }
    });
    
    console.log('Full retrieval response:', JSON.stringify(retrievalResponse.data, null, 2));
    
    console.log('Retrieval response status:', retrievalResponse.status);
    // Handle both response structures - direct or nested in result property
    const retrievalResult = retrievalResponse.data.result || retrievalResponse.data;
    
    console.log('Retrieved sources count:', retrievalResult.sources?.length || 0);
    
    if (retrievalResult.response) {
      console.log('Retrieval response excerpt:');
      console.log(retrievalResult.response.substring(0, 150) + '...');
      
      console.log('Search results count:', retrievalResult.searchResults?.length || 0);
      
      if (retrievalResult.searchResults?.length > 0) {
        console.log('First search result:', {
          id: retrievalResult.searchResults[0].id,
          score: retrievalResult.searchResults[0].score,
          metadata: retrievalResult.searchResults[0].metadata || 'No metadata'
        });
      }
      
      console.log('✅ Retriever agent query test PASSED');
      return true;
    } else {
      console.log('❌ Retriever agent query test FAILED: No response content');
      console.log('Response data structure:', Object.keys(retrievalResponse.data));
      return false;
    }
  } catch (error) {
    console.error('Error testing retriever agent:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

/**
 * Test the agent pipeline with a RAG query
 */
async function testAgentPipeline() {
  console.log('\n=== TESTING AGENT PIPELINE WITH RAG QUERY ===');
  
  try {
    // Test the chat API with a RAG query
    const chatResponse = await axios.post(`${API_BASE_URL}/chat`, {
      message: 'What information do you have about the Vault-Tec experiments?',
      options: {
        sourcesCount: 4
      }
    });
    
    console.log('Full chat response:', JSON.stringify(chatResponse.data, null, 2));
    
    console.log('Chat response status:', chatResponse.status);
    console.log('Agent used:', chatResponse.data.agent);
    
    if (chatResponse.data.message) {
      console.log('Response excerpt:');
      console.log(chatResponse.data.message.substring(0, 150) + '...');
      
      if (chatResponse.data.metadata?.sources?.length > 0) {
        console.log('Sources count:', chatResponse.data.metadata.sources.length);
      } else {
        console.log('No sources in response');
      }
      
      console.log('✅ Agent pipeline RAG test PASSED');
      return true;
    } else {
      console.log('❌ Agent pipeline RAG test FAILED: No message in response');
      console.log('Response data:', chatResponse.data);
      return false;
    }
  } catch (error) {
    console.error('Error testing agent pipeline with RAG query:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

/**
 * Run all tests sequentially
 */
async function runTests() {
  console.log('Starting RAG functionality tests...\n');
  
  // Test document preprocessing
  const preprocessingResult = await testDocumentPreprocessing();
  
  // Test retriever agent
  const retrieverResult = await testRetrieverAgent();
  
  // Test agent pipeline with RAG query
  const pipelineResult = await testAgentPipeline();
  
  // Print summary
  console.log('\n=== TEST RESULTS SUMMARY ===');
  console.log(`Document Preprocessing: ${preprocessingResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Retriever Agent: ${retrieverResult ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`Agent Pipeline with RAG: ${pipelineResult ? '✅ PASSED' : '❌ FAILED'}`);
  
  // Check system stats
  console.log('\n=== SYSTEM STATS ===');
  try {
    const statsResponse = await axios.get(`${API_BASE_URL}/retriever/stats`);
    console.log('Retriever stats:', statsResponse.data);
    
    const vectordbStatsResponse = await axios.get(`${API_BASE_URL}/vectordb/stats`);
    console.log('Vector DB stats:', vectordbStatsResponse.data);
  } catch (error) {
    console.error('Error getting system stats:', error.message);
  }
  
  console.log('\nTest suite completed.');
}

// Execute tests
runTests().catch(error => {
  console.error('Error running tests:', error);
});

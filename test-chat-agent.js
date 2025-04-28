/**
 * Test script to check ChatAgent functionality
 */

// Using axios instead of node-fetch for compatibility
const axios = require('axios');

// Configuration
const baseUrl = 'http://localhost:3002/api';
const testQuery = "Hello, I'm testing the ChatAgent functionality. Are you online?";

async function testChatAgent() {
  console.log('Testing ChatAgent with query:', testQuery);
  
  try {
    // First try with complete RAG flow (CriticAgent)
    console.log('\n1. Testing through complete RAG flow:');
    const ragResponse = await axios.post(`${baseUrl}/rag/complete`, {
      query: testQuery,
      options: {}
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const ragResult = ragResponse.data;
    console.log('Response received:');
    console.log('- Success:', ragResult.success);
    console.log('- Response:', ragResult.response?.substring(0, 100) + '...');

    // Then try with just retriever
    console.log('\n2. Testing through retriever query:');
    const retrieverResponse = await axios.post(`${baseUrl}/retriever/query`, {
      query: testQuery,
      options: {}
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const retrieverResult = retrieverResponse.data;
    console.log('Response received:');
    console.log('- Success:', retrieverResult.success);
    console.log('- Response:', retrieverResult.response?.substring(0, 100) + '...');
    
    // Check for any ChatAgent related references
    const chatAgentInResponse = (ragResult.response && ragResult.response.includes('CHATAGENT')) || 
                               (retrieverResult.response && retrieverResult.response.includes('CHATAGENT'));
    
    console.log('\nSummary:');
    console.log('- System is responding to queries:', ragResult.success || retrieverResult.success ? '✓' : '✗');
    console.log('- ChatAgent mentioned in responses:', chatAgentInResponse ? '✓' : '✗');
    
    // Look for specific indications of ChatAgent functionality
    if (chatAgentInResponse) {
      console.log('\nChatAgent appears to be referenced in the system responses.');
    } else {
      console.log('\nNo direct ChatAgent references found in responses.');
      console.log('Based on the code review, the "ChatAgent" appears to be a UI element rather than a separate agent implementation.');
      console.log('The current system has RetrieverAgent, SynthesizerAgent, and CriticAgent implemented, but no dedicated ChatAgent.');
    }
    
    console.log('\nThe system is able to handle chat-like interactions, but this appears to be done through the RAG flow rather than a dedicated ChatAgent.');
    
  } catch (error) {
    console.error('Error testing ChatAgent:', error);
  }
}

// Execute the test
testChatAgent();

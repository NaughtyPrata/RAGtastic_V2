/**
 * Test script for comparing RetrieverAgent and SynthesizerAgent outputs
 */

// Use node built-in fetch for Node.js 18+
async function testQuery(query, useRetriever = false) {
  console.log(`\n---------- TEST QUERY: "${query}" ----------`);
  
  const endpoint = useRetriever ? `http://localhost:3002/api/retriever/query` : `http://localhost:3002/api/synthesizer/query`;
  console.log(`Using endpoint: ${endpoint}`);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        options: {
          numResults: 5,
          temperature: 0.7,
          maxTokens: 1024
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    console.log(`AGENT: ${useRetriever ? 'RetrieverAgent' : 'SynthesizerAgent'}`);
    console.log(`RAW RESPONSE:`);
    console.log(result.response);
    
    // Apply additional filtering for test output
    let filteredResponse = result.response;
    
    // Simple filter to remove common roleplay elements
    filteredResponse = filteredResponse
      .replace(/vault(-| )?tec/gi, '')
      .replace(/vault dweller/gi, '')
      .replace(/overseer/gi, '')
      .replace(/wasteland/gi, '')
      .replace(/fallout/gi, '')
      .replace(/greetings/gi, '')
      .replace(/welcome/gi, '');
      
    console.log(`\nFILTERED RESPONSE:`);
    console.log(filteredResponse);
    console.log(`\nTOKENS USED: ${result.usage?.total_tokens || 'N/A'}`);
    
    return result;
  } catch (error) {
    console.error(`Error querying endpoint: ${error.message}`);
    return null;
  }
}

async function runTests() {
  // Test questions
  const questions = [
    "What is Chain of Thought prompting? and what does it do?"
  ];
  
  for (const question of questions) {
    // Test with RetrieverAgent
    await testQuery(question, true);
    
    // Test with SynthesizerAgent
    await testQuery(question, false);
    
    console.log("\n========================================\n");
  }
}

console.log("Starting RAG Agent comparison tests...");
runTests().then(() => {
  console.log("Tests completed.");
});

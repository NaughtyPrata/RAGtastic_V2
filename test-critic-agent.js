/**
 * Test script for the complete RAG flow with CriticAgent
 */

// Use node built-in fetch for Node.js 18+
async function testCompleteRAGFlow(query, options = {}) {
  console.log(`\n---------- TESTING COMPLETE RAG FLOW ----------`);
  console.log(`QUERY: "${query}"`);
  console.log(`OPTIONS: ${JSON.stringify(options, null, 2)}`);
  
  const API_BASE_URL = 'http://localhost:3002/api/rag';
  
  try {
    const response = await fetch(`${API_BASE_URL}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        query: query,
        options: {
          numResults: options.numResults || 10,
          temperature: options.temperature || 0.7,
          maxTokens: options.maxTokens || 1024,
          maxAttempts: options.maxAttempts || 3,
          ...options
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    
    // Print basic information
    console.log(`\nFINAL RESPONSE:`)
    console.log(result.response);
    
    // Print evaluation info
    console.log(`\nEVALUATION INFO:`);
    console.log(`Score: ${result.evaluation.score}`);
    console.log(`Approved: ${result.evaluation.approved}`);
    console.log(`Reasoning: ${result.evaluation.reasoning}`);
    console.log(`Attempts: ${result.evaluation.attempts}/${result.evaluation.maxAttempts}`);
    console.log(`Next action: ${result.evaluation.action}`);
    
    // Print history
    if (result.history && result.history.length > 0) {
      console.log(`\nQUERY REFINEMENT HISTORY:`);
      result.history.forEach((item, index) => {
        console.log(`${index + 1}. Attempt ${item.attempt}: "${item.query}" (Status: ${item.status})`);
        if (item.refinedQuery && item.query !== item.refinedQuery) {
          console.log(`   Refined to: "${item.refinedQuery}"`);
        }
        if (item.reasoning) {
          console.log(`   Reasoning: ${item.reasoning}`);
        }
      });
    }
    
    // Print token usage if available
    if (result.usage && result.usage.length > 0) {
      console.log(`\nTOKEN USAGE:`);
      let totalTokens = 0;
      result.usage.forEach(usage => {
        console.log(`${usage.agent.charAt(0).toUpperCase() + usage.agent.slice(1)} (Attempt ${usage.attempt}): ${usage.usage.total_tokens} tokens`);
        totalTokens += usage.usage.total_tokens;
      });
      console.log(`Total tokens used: ${totalTokens}`);
    }
    
    return result;
  } catch (error) {
    console.error(`Error in complete RAG flow: ${error.message}`);
    return null;
  }
}

async function runTests() {
  // Test questions
  const testCases = [
    {
      query: "What is Chain of Thought prompting?",
      options: { maxAttempts: 3 }
    },
    {
      query: "What is the difference between a LORA model and a quantized model?",
      options: { maxAttempts: 3 }
    }
  ];
  
  for (const testCase of testCases) {
    await testCompleteRAGFlow(testCase.query, testCase.options);
    console.log("\n========================================\n");
  }
}

console.log("Starting Complete RAG Flow tests...");
runTests().then(() => {
  console.log("Tests completed.");
});
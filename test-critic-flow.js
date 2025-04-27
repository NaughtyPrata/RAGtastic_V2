/**
 * Test script for the full RetrieverAgent -> SynthesizerAgent -> CriticAgent flow
 */

// Use node built-in fetch for Node.js 18+
const RetrieverAgent = require('./src/agents/retrieverAgent');
const SynthesizerAgent = require('./src/agents/synthesizerAgent');
const CriticAgent = require('./src/agents/criticAgent');

async function testFullFlow(query, maxAttempts = 3) {
  console.log(`\n---------- TESTING FULL AGENT FLOW ----------`);
  console.log(`QUERY: "${query}"`);
  
  // Initialize agents
  const retrieverAgent = new RetrieverAgent({
    numResults: 10,
    similarityThreshold: 0.3,
    useHybridSearch: true,
    verbose: true
  });
  
  const synthesizerAgent = new SynthesizerAgent({
    model: "llama3-8b-8192",
    temperature: 0.7,
    maxTokens: 1024,
    verbose: true
  });
  
  const criticAgent = new CriticAgent({
    model: "llama3-8b-8192",
    temperature: 0.4,
    maxTokens: 512,
    qualityThreshold: 0.7,
    maxAttempts: maxAttempts,
    verbose: true
  });
  
  let currentQuery = query;
  let attempts = 0;
  let approved = false;
  let finalResponse = null;
  let evaluation = null;
  
  // Start the loop
  while (!approved && attempts < maxAttempts) {
    console.log(`\n--- ATTEMPT ${attempts + 1}/${maxAttempts} ---`);
    console.log(`CURRENT QUERY: "${currentQuery}"`);
    
    // 1. Retrieve context
    console.log('\nRETRIEVER AGENT: Retrieving context...');
    const context = await retrieverAgent.retrieve(currentQuery);
    console.log(`Retrieved context (${context?.length || 0} chars)`);
    
    if (!context || context.trim() === '') {
      console.log('No relevant context found. Stopping the flow.');
      return {
        success: false,
        query: currentQuery,
        response: "No relevant information found to answer the query.",
        reasoning: "No context retrieved."
      };
    }
    
    // 2. Synthesize response
    console.log('\nSYNTHESIZER AGENT: Synthesizing response...');
    const synthesizedResult = await synthesizerAgent.synthesize(currentQuery, context);
    console.log(`Synthesized response (${synthesizedResult.response?.length || 0} chars)`);
    
    // 3. Evaluate response
    console.log('\nCRITIC AGENT: Evaluating response...');
    evaluation = await criticAgent.evaluate(
      currentQuery, 
      synthesizedResult.response, 
      context, 
      attempts
    );
    
    console.log(`Evaluation: Score=${evaluation.score}, Approved=${evaluation.approved}`);
    console.log(`Reasoning: ${evaluation.reasoning}`);
    
    // Check if we should continue or stop
    if (evaluation.approved) {
      console.log('\nResponse APPROVED!');
      approved = true;
      finalResponse = synthesizedResult.response;
    } else {
      console.log(`\nResponse REJECTED. Refining query...`);
      console.log(`Original query: "${currentQuery}"`);
      console.log(`Refined query: "${evaluation.refinedQuery}"`);
      
      currentQuery = evaluation.refinedQuery;
      attempts++;
    }
  }
  
  // If we exceed max attempts, use the last response
  if (!approved && attempts >= maxAttempts) {
    console.log(`\nMax attempts (${maxAttempts}) reached. Using last response.`);
    return {
      success: true,
      query: query,
      refinedQuery: currentQuery,
      response: finalResponse,
      approved: false,
      reasoning: evaluation?.reasoning || "Max attempts reached.",
      attempts: attempts
    };
  }
  
  return {
    success: true,
    query: query,
    refinedQuery: currentQuery,
    response: finalResponse,
    approved: true,
    reasoning: evaluation?.reasoning || "Response approved.",
    attempts: attempts
  };
}

async function runTests() {
  // Test with different queries
  const questions = [
    "What is Chain of Thought prompting and what does it do?",
    "Tell me about the main techniques in prompt engineering"
  ];
  
  for (const question of questions) {
    const result = await testFullFlow(question, 3);
    
    console.log("\n========== TEST RESULT ==========");
    console.log(`ORIGINAL QUERY: "${result.query}"`);
    if (result.refinedQuery !== result.query) {
      console.log(`REFINED QUERY: "${result.refinedQuery}"`);
    }
    console.log(`SUCCESS: ${result.success}`);
    console.log(`APPROVED: ${result.approved}`);
    console.log(`ATTEMPTS: ${result.attempts}`);
    console.log(`REASONING: ${result.reasoning}`);
    console.log("\nFINAL RESPONSE:");
    console.log(result.response);
    
    console.log("\n=====================================\n");
  }
}

console.log("Starting full RAG Agent flow tests...");
runTests().then(() => {
  console.log("All tests completed.");
}).catch(error => {
  console.error("Error running tests:", error);
});

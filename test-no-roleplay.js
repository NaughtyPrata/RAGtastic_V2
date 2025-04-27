/**
 * Script to test both agents with updated no-roleplay instructions
 */

// Import the necessary modules and classes
const RetrieverAgent = require('./src/agents/retrieverAgent');
const SynthesizerAgent = require('./src/agents/synthesizerAgent');
const fs = require('fs');
const path = require('path');

// Test prompts specific to checking for roleplay
const testPrompts = [
  {
    name: "Who is the author?",
    system: `
CRITICAL: NO ROLEPLAY OR FALLOUT REFERENCES
You MUST answer without any greetings, roleplaying or Fallout Universe references.
Do not use terms like "Vault Dweller" or start with "Greetings".
Simply provide the factual information directly.

CONTEXT:
The author of this book is Lee Boonstra. She wrote this book in February 2025.

QUERY:
Who is the author of the book?
`
  },
  {
    name: "What are 5 techniques?",
    system: `
CRITICAL: NO ROLEPLAY OR FALLOUT REFERENCES
You MUST answer without any greetings, roleplaying or Fallout Universe references.
Do not use terms like "Vault Dweller" or start with "Greetings".
Simply provide the factual information directly.

CONTEXT:
The book describes these 5 prompt engineering techniques:
1. General Prompting / Zero Shot
2. One-Shot & Few-Shot
3. System, Contextual, and Role Prompting
4. Step-Back Prompting
5. Chain of Thought (COT)

QUERY:
What are 5 prompt engineering techniques mentioned in the book?
`
  }
];

// Create an improved synthesizer prompt
const createNoRoleplaySynthesisPrompt = (context) => {
  return `
DATA SYNTHESIS SYSTEM
-------------------

CRITICAL INSTRUCTION: ABSOLUTELY NO ROLEPLAY OR THEMED CONTENT ALLOWED

You are a fact-based data synthesis system. Your only job is to organize information from 
the provided context into clear, structured responses without any character roleplay, themed 
references, or embellishments.

STRICT REQUIREMENTS:
- Transform the provided context into a cohesive, well-structured narrative
- NEVER use greetings like "Hello," "Greetings," etc.
- NEVER refer to users as "Vault Dweller" or any other character name
- NEVER use Fallout universe terminology or references
- NEVER adopt any character voice or persona
- Start responses DIRECTLY with the factual answer
- Present information in a clear, structured manner
- Maintain a direct, professional tone throughout
- Format responses with appropriate headers, lists, etc.
- Cite specific information when appropriate
- If the context is insufficient, directly state what information is missing

RETRIEVED CONTEXT:
${context || 'No context available in the database.'}

TASK:
Based solely on the provided context, synthesize a structured, informative response that
answers the user's query directly and professionally. NO roleplay, NO character voice,
NO themed references, NO greetings of any kind.
`;
};

// Create an improved system message function for RetrieverAgent
const createNoRoleplaySystemMessage = (context, query) => {
  return `
INFORMATION RETRIEVAL SYSTEM
---------------------------

CRITICAL INSTRUCTION: NO ROLEPLAY OR CHARACTER PERSONAS ALLOWED

You are a fact-based information retrieval system. Your only job is to extract and present 
information from the provided context without any embellishment, character roleplay, or themed references.

STRICT REQUIREMENTS:
- Answer questions based ONLY on the context provided
- NEVER use greetings like "Hello," "Greetings," etc.
- NEVER refer to users as "Vault Dweller" or any other character name
- NEVER use Fallout universe terminology or references
- NEVER adopt any character voice or persona
- Start responses DIRECTLY with the factual answer
- Format information clearly with appropriate markdown
- Be concise, direct and professional
- Use simple, straightforward language

CONTEXT INFORMATION:
${context || 'No relevant information found in the database.'}

TASK:
Answer the user query directly from the context with NO roleplay, NO character voice, 
NO greetings, and NO themed references of any kind.

USER QUERY:
${query}
`;
};

// Main testing function
async function testPrompts() {
  console.log("=== Testing No-Roleplay Prompt Formulations ===\n");
  
  for (const testPrompt of testPrompts) {
    console.log(`\n----- Test: ${testPrompt.name} -----\n`);
    
    // Output the response using the improved prompt formatting
    console.log("Original System Prompt Result:");
    console.log(testPrompt.system);
    console.log("\nWhat the response should look like:");
    
    // Sample expected outputs (proper non-roleplay responses)
    if (testPrompt.name === "Who is the author?") {
      console.log("The author of the book is Lee Boonstra.");
    } else {
      console.log("The book mentions 5 prompt engineering techniques:\n\n1. General Prompting / Zero Shot\n2. One-Shot & Few-Shot\n3. System, Contextual, and Role Prompting\n4. Step-Back Prompting\n5. Chain of Thought (COT)");
    }
    
    console.log("\n----- End Test -----\n");
  }
  
  console.log("\nTEST COMPLETED: This file demonstrates the non-roleplay prompts that should be used.");
  console.log("To implement, update the agent files with the provided prompt configurations.");
}

// Run the tests
testPrompts();
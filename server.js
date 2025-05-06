/**
 * Express server for sRAG API
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');

// Import Agents
const RetrieverAgent = require('./src/agents/retrieverAgent');
const SynthesizerAgent = require('./src/agents/synthesizerAgent');
const CriticAgent = require('./src/agents/criticAgent');

// Load environment variables
dotenv.config();

// Initialize logger
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// No external LLM client initialized

// Create Express app
const app = express();
const PORT = process.env.PORT || 3002;

// Configure middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'simple_ui')));

// Import API handlers
const { listDocuments, preprocessDocuments } = require('./src/api/documents');

// API routes
app.get('/api/documents', listDocuments);
app.post('/api/documents/preprocess', preprocessDocuments);

// System management endpoints
app.post('/api/system/reset', async (req, res) => {
  try {
    const { flushIndexes = true, clearDocuments = false } = req.body;
    log(`System reset requested: flushIndexes=${flushIndexes}, clearDocuments=${clearDocuments}`);
    
    let deletedChunks = 0;
    let deletedFiles = 0;
    
    // Flush vector index by removing chunks directory contents
    if (flushIndexes) {
      const chunksDir = path.join(__dirname, 'data', 'chunks');
      
      // Check if directory exists
      if (fs.existsSync(chunksDir)) {
        const docDirs = await fs.promises.readdir(chunksDir).catch(() => []);
        
        // Process each document directory
        for (const dir of docDirs) {
          if (dir.startsWith('.')) continue;
          
          const dirPath = path.join(chunksDir, dir);
          if (fs.statSync(dirPath).isDirectory()) {
            const files = await fs.promises.readdir(dirPath).catch(() => []);
            
            // Delete all chunk files in this directory
            for (const file of files) {
              if (file.endsWith('.json')) {
                await fs.promises.unlink(path.join(dirPath, file)).catch(e => {
                  log(`Error deleting chunk file ${file}: ${e.message}`);
                });
                deletedChunks++;
              }
            }
            
            // Optionally remove the directory itself
            if (clearDocuments) {
              await fs.promises.rmdir(dirPath).catch(e => {
                log(`Error removing directory ${dir}: ${e.message}`);
              });
              deletedFiles++;
            }
          }
        }
      }
    }
    
    return res.json({
      success: true,
      message: 'System reset completed successfully',
      stats: {
        deletedChunks,
        deletedFiles
      }
    });
  } catch (error) {
    log(`Error resetting system: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: 'System reset error',
      message: error.message
    });
  }
});

// Synthesizer endpoint
app.post('/api/synthesizer/query', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid query',
        message: 'Query must be a non-empty string'
      });
    }
    
    log(`Processing RAG query with Synthesizer: ${query}`);
    
    // Initialize agents
    const retrieverAgent = new RetrieverAgent({
      numResults: options.numResults || 10,
      similarityThreshold: options.similarityThreshold || 0.3,
      useHybridSearch: options.useHybridSearch !== false,
      verbose: true
    });
    
    const synthesizerAgent = new SynthesizerAgent({
      model: options.model || "llama3-8b-8192",
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 1024,
      topP: options.topP || 1.0,
      verbose: true
    });
    
    // 1. Retrieve context
    const context = await retrieverAgent.retrieve(query);
    
    if (!context || context.trim() === '') {
      return res.json({
      success: true,
      query,
      response: "No relevant information found in the database to answer your query. Please try a different question or preprocess additional documents.",
      context: 'No context found',
      sources: []
      });
    }
    
    // 2. Synthesize response
    const synthesizedResult = await synthesizerAgent.synthesize(query, context);
    
    // 3. Apply post-processing filter to catch any remaining roleplay elements
    const filteredResponse = removeRoleplayElements(synthesizedResult.response);
    
    return res.json({
      success: true,
      query,
      response: filteredResponse,
      context: `Context used (${context.length} chars)`,
      sources: [],
      usage: synthesizedResult.usage
    });
  } catch (error) {
    log(`Error processing synthesized query: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: 'Query processing error',
      message: error.message
    });
  }
});

// RAG query endpoint - placeholder for future implementation
app.post('/api/retriever/query', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid query',
        message: 'Query must be a non-empty string'
      });
    }
    
    log(`Processing RAG query: ${query}`);
    
    // Get context from processed documents
    const context = await getContextForQuery(query, options);
    
    // Add metadata from document as additional context
    const metadataContext = await getDocumentMetadata();
    const combinedContext = metadataContext ? `${metadataContext}\n\n${context}` : context;
    
    // Return temporary message until new implementation is added
    return res.json({
      success: true,
      query,
      response: "The retrieval endpoint is currently being upgraded. Please use the synthesizer endpoint instead.",
      context: combinedContext ? `Context used (${combinedContext.length} chars)` : 'No context found',
      sources: []
    });
  } catch (error) {
    log(`Error processing RAG query: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: 'Query processing error',
      message: error.message
    });
  }
});

/**
 * Get document metadata as additional context
 * @returns {Promise<string>} - Metadata context string
 */
async function getDocumentMetadata() {
  try {
    // Get document directories
    const chunksDir = path.join(__dirname, 'data', 'chunks');
    const docDirs = await fs.promises.readdir(chunksDir).catch(() => []);
    
    if (docDirs.length === 0) {
      return null;
    }
    
    // Get valid document directories
    const validDocDirs = [];
    for (const dir of docDirs) {
      if (dir.startsWith('.')) continue;
      
      const dirPath = path.join(chunksDir, dir);
      if (fs.statSync(dirPath).isDirectory()) {
        validDocDirs.push(dir);
      }
    }
    
    if (validDocDirs.length === 0) {
      return null;
    }
    
    // Build metadata context
    let metadataContext = 'DOCUMENT METADATA:\n';
    
    for (const docDir of validDocDirs) {
      metadataContext += `- Document: ${docDir}\n`;
      
      // Get first few chunks to extract metadata
      const dirPath = path.join(chunksDir, docDir);
      const files = await fs.promises.readdir(dirPath).catch(() => []);
      
      if (files.length === 0) continue;
      
      // Sort files to get the beginning chunks first
      files.sort();
      
      // Process first 5 files to extract metadata
      for (let i = 0; i < Math.min(5, files.length); i++) {
        if (!files[i].endsWith('.json')) continue;
        
        try {
          const chunkPath = path.join(dirPath, files[i]);
          const chunkData = JSON.parse(await fs.promises.readFile(chunkPath, 'utf8'));
          
          // Extract potential author information from first chunks
          const content = chunkData.content || '';
          
          // Look for author patterns
          const authorMatch = content.match(/author:\s*([^\n\r]+)/i) || 
                             content.match(/by\s+([^\n\r,]+)/i) ||
                             content.match(/written by\s+([^\n\r,]+)/i);
          
          if (authorMatch) {
            metadataContext += `  Author: ${authorMatch[1].trim()}\n`;
          }
          
          // Look for title patterns
          const titleMatch = content.match(/title:\s*([^\n\r]+)/i) ||
                           content.match(/^([^\n\r]+)$/m);
          
          if (titleMatch) {
            metadataContext += `  Title: ${titleMatch[1].trim()}\n`;
          }
          
          // Look for date patterns
          const dateMatch = content.match(/date:\s*([^\n\r]+)/i) ||
                          content.match(/([a-z]+\s+\d{4})/i) ||
                          content.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/);
          
          if (dateMatch) {
            metadataContext += `  Date: ${dateMatch[1].trim()}\n`;
          }
        } catch (error) {
          log(`Error extracting metadata from chunk ${files[i]}: ${error.message}`);
        }
      }
    }
    
    return metadataContext;
  } catch (error) {
    log(`Error getting document metadata: ${error.message}`);
    return null;
  }
}

/**
 * Get context for a query from processed document chunks
 * @param {string} query - User query
 * @param {Object} options - Query options
 * @returns {Promise<string>} - Context string
 */
async function getContextForQuery(query, options = {}) {
  try {
    // Simple implementation for now - just return chunks from first document
    const docDirs = await fs.promises.readdir(path.join(__dirname, 'data', 'chunks')).catch(() => []);
    
    if (docDirs.length === 0) {
      log('No document chunks found');
      return '';
    }
    
    // Get valid document directories
    const validDocDirs = [];
    for (const dir of docDirs) {
      if (dir.startsWith('.')) continue;
      
      const dirPath = path.join(__dirname, 'data', 'chunks', dir);
      if (fs.statSync(dirPath).isDirectory()) {
        validDocDirs.push(dir);
      }
    }
    
    if (validDocDirs.length === 0) {
      log('No valid document directories found');
      return '';
    }
    
    // Process each document directory
    let allChunks = [];
    
    for (const docDir of validDocDirs) {
      const chunkFiles = await fs.promises.readdir(path.join(__dirname, 'data', 'chunks', docDir)).catch(() => []);
      
      if (chunkFiles.length === 0) {
        log(`No chunks found for document ${docDir}`);
        continue;
      }
      
      // For each directory, handle all JSON files
      for (const chunkFile of chunkFiles) {
        if (!chunkFile.endsWith('.json')) continue;
        
        try {
          const chunkPath = path.join(__dirname, 'data', 'chunks', docDir, chunkFile);
          const chunkData = JSON.parse(await fs.promises.readFile(chunkPath, 'utf8'));
          
          const content = chunkData.content || '';
          
          // Special handling for specific types of questions
          if (
            query.toLowerCase().includes('author') || 
            query.toLowerCase().includes('who wrote') ||
            query.toLowerCase().includes('who is')
          ) {
            // For author questions, check for author patterns
            const authorMatch = content.match(/author:\s*([^\n\r]+)/i) || 
                              content.match(/by\s+([^\n\r]+)/i) ||
                              content.match(/written by\s+([^\n\r]+)/i);
            
            if (authorMatch) {
              // Prioritize chunks with author information
              allChunks.push({
                content,
                score: 100 // High score for author information
              });
              continue;
            }
          }
          
          // Check for first pages for certain types of questions about the book
          if (
            chunkFile.includes('-0-') || 
            chunkFile.includes('-1-') ||
            chunkFile.includes('-2-')
          ) {
            // Prioritize first few pages for general book questions
            if (
              query.toLowerCase().includes('book about') || 
              query.toLowerCase().includes('what is this') ||
              query.toLowerCase().includes('topics') ||
              query.toLowerCase().includes('what are')
            ) {
              allChunks.push({
                content,
                score: 80 // High score for first pages
              });
              continue;
            }
          }
          
          // More aggressive keyword matching
          const queryWords = query.toLowerCase().split(/\W+/).filter(word => word.length > 2);
          let matchScore = 0;
          
          for (const word of queryWords) {
            const regex = new RegExp(word, 'gi');
            const matches = content.match(regex);
            if (matches) {
              matchScore += matches.length;
            }
          }
          
          if (matchScore > 0) {
            allChunks.push({
              content,
              score: matchScore
            });
          }
        } catch (error) {
          log(`Error processing chunk file: ${error.message}`);
        }
      }
    }
    
    // Sort chunks by score (highest first)
    allChunks.sort((a, b) => b.score - a.score);
    
    // Get top chunks
    const maxChunksToInclude = options.numResults || 10;
    const topChunks = allChunks.slice(0, maxChunksToInclude);
    
    if (topChunks.length === 0) {
      log('No matching chunks found');
      return '';
    }
    
    // Combine top chunks
    const combinedContext = topChunks.map(chunk => chunk.content).join('\n\n');
    
    // Limit context length if needed
    const maxContextLength = 6000;
    if (combinedContext.length > maxContextLength) {
      return combinedContext.substring(0, maxContextLength) + '...';
    }
    
    return combinedContext;
  } catch (error) {
    log(`Error getting context: ${error.message}`);
    return '';
  }
}

/**
 * Create system message with context for Groq
 * @param {string} context - Context string
 * @param {string} query - User query
 * @returns {string} - System message
 */
function createSystemMessage(context, query) {
  return `
ACADEMIC INFORMATION RETRIEVAL SYSTEM
---------------------------------------------

CRITICAL INSTRUCTION: You are a professional information retrieval system designed for academic research. You process and present information in a structured, factual manner without embellishment.

ABSOLUTE PROHIBITIONS:
- NO greetings, salutations, or conversational openings
- NO fictional references, themed content, or fictional terminology of any kind
- NO sign-offs, closing phrases, or offers of further assistance
- NO self-references ("I", "me", "my") or user-references ("you", "your")
- NO questions directed at the user
- NO apologetic language or courtesy phrases
- NO subjective evaluations or personal opinions
- NO roleplay, personas, or character voices

REQUIRED RESPONSE FORMAT:
- Begin with direct, factual information relevant to the query
- Use academic, neutral, and professional language throughout
- Structure information with appropriate headings and subheadings
- Employ bullet points or numbered lists for multiple items
- Present only factual content extracted from the provided context
- State factual limitations when information is insufficient or missing
- Use markdown formatting for improved readability when appropriate

CONTEXT INFORMATION:
${context || 'No relevant information found in the database.'}

EXTRACTION REQUIREMENTS:
Extract and present only factual information from the context that directly answers the query. Structure the information in a clear, academic format free from narrative elements, subjective commentary, or any kind of roleplay.

QUERY FOR EXTRACTION:
${query}
`;
}

/**
 * Remove any roleplay elements from the response
 * @param {string} text - The text to filter
 * @returns {string} - Filtered text
 */
function removeRoleplayElements(text) {
  if (!text) return text;
  
  // Start with aggressive preprocessing
  let filtered = text;
  
  // Replace some well-known problematic terms immediately
  filtered = filtered
    .replace(/vault(-| )?tec/gi, 'Information System')
    .replace(/vault dweller/gi, 'user')
    .replace(/overseer/gi, 'administrator')
    .replace(/wasteland/gi, 'environment')
    .replace(/fallout/gi, 'effects')
    .replace(/\*\*(vault(-| )?tec|authorization|clearance)[^\n]*\*\*/gi, '')
    .replace(/^\*\*[^\n]*\*\*/i, ''); // Remove bold header with title
  
  // Define patterns to remove
  const patterns = [
    // Greetings and salutations
    /^(Hello|Hi|Hey|Greetings|Welcome|Good (morning|afternoon|evening)|Greetings|Salutations).*?(,|!|\.|:)/i,
    
    // Science fiction theme references - comprehensive set
    /(Vault(-| )Tec|Vault(| )(Dweller|\d+)|Overseer|Wasteland|Fallout|Pip(-| )Boy|Nuka(-| )Cola|RobCo|Zeta|Brotherhood of Steel|NCR|Enclave|Super Mutant|Ghoul|Radiated|Rad(|-)(away|roach|x)|Mr\. Handy|Liberty Prime|S\.P\.E\.C\.I\.A\.L)/gi,
    
    // Common sign-offs
    /(If you (have|need) any (more|other|further) (questions|assistance).*?$|Let me know if you need anything else.*?$|I hope this (helps|information is helpful).*?$|Happy to assist|Feel free to ask)/i,
    
    // Self-references and AI language
    /(I('m| am) (happy|glad|pleased|here|excited) to (help|assist).*?(with your|you).*?(query|question|request)|As (requested|an AI|per your request)|I (would|can|could|will) (suggest|recommend|provide|assist)|As your (assistant|helper)|I don't have (personal|emotions|feelings))/i,
    
    // Fictional character references
    /(Sole Survivor|Courier|Lone Wanderer|Chosen One|Vault Hunter|Initiate|Paladin|Elder|Minutemen|Raider|Synth|Institute|Diamond City|New Vegas|Capital Wasteland|Mojave|Commonwealth|Appalachia)/gi,
    
    // Science fiction artifacts and items
    /(Power Armor|Fat Man|Plasma (Rifle|Pistol)|Laser (Rifle|Pistol)|Stimpak|Radaway|Bottle Cap|Fusion Core|Nuka(-| )Cola|Quantum|VATS|Dogmeat|Codsworth|Protectron|Deathclaw|Bloatfly|Mirelurk)/gi,
    
    // Meta references to themed content
    /(Post(|-| )apocalyptic|Retro(|-| )futuristic|1950s aesthetic|Atomic age|Nuclear (war|holocaust|winter|fallout)|Radiation poisoning|Mutant|Mutation|Rads)/gi,
    
    // Entire greeting paragraphs or sections
    /^([^\n]+greetings[^\n]+\n|[^\n]+welcome[^\n]+\n|[^\n]+(vault|overseer)[^\n]+\n)/gi,
    
    // Sections that introduce roleplay
    /(in the (Vault|Wasteland)|Vault(-| )Tec (database|records)|my friend|fellow dweller)/gi,
    
    // Imperatives common to roleplay personas
    /(buck(le)? up|get ready|strap (in|on))/gi,
    
    // References to clearance levels
    /((level|clearance) [\d]+ (clearance|access|authorized|granted)|(clearance|access) (level|authorized) [\d]+)/gi,
    
    // Exclamation patterns (reduce excessive enthusiasm)
    /(![^\n]*!|\s+!\s+)/g
  ];
  
  // Apply each pattern with multiple passes for thorough cleansing
  for (let i = 0; i < 2; i++) {
    patterns.forEach(pattern => {
      filtered = filtered.replace(pattern, '');
    });
  }
  
  // Handle multi-paragraph content
  const paragraphs = filtered.split('\n\n');
  
  // Check and potentially remove problematic first paragraph
  if (paragraphs.length > 1) {
    const firstPara = paragraphs[0].toLowerCase();
    if (
      firstPara.includes('vault') || 
      firstPara.includes('wasteland') || 
      firstPara.includes('fallout') || 
      firstPara.includes('welcome') || 
      firstPara.includes('greetings') ||
      firstPara.includes('authorization') ||
      firstPara.includes('clearance') ||
      firstPara.includes('retrieval system') ||
      firstPara.includes('information system') ||
      firstPara.includes('granted')
    ) {
      // Remove the problematic first paragraph
      paragraphs.shift();
    }
  }
  
  // Check and potentially remove problematic last paragraph (conclusions, sign-offs)
  if (paragraphs.length > 1) {
    const lastPara = paragraphs[paragraphs.length - 1].toLowerCase();
    if (
      lastPara.includes('now, if you') || 
      lastPara.includes('remember') || 
      lastPara.includes('good luck') || 
      lastPara.includes('until next time') ||
      lastPara.includes('hope this helps') ||
      lastPara.includes('please feel free')
    ) {
      // Remove the problematic last paragraph
      paragraphs.pop();
    }
  }
  
  // Rebuild the text
  filtered = paragraphs.join('\n\n');
  
  // Clean up any resulting double spaces or blank lines
  filtered = filtered.replace(/\n\s*\n/g, '\n\n')
                     .replace(/  +/g, ' ')
                     .replace(/\n{3,}/g, '\n\n') // No more than double line breaks
                     .trim();
                     
  // Fix for specific cases where entire text is problematic
  if (filtered.toLowerCase().includes('vault-tec') || filtered.toLowerCase().includes('dweller')) {
    // If we still have these terms after all our filtering, take more drastic measures
    filtered = filtered
      .replace(/vault(-| )?tec/gi, '')
      .replace(/vault dweller/gi, '')
      .replace(/dweller/gi, '')
      .replace(/information retrieval/gi, 'Information')
      .replace(/(bucket|buckle) up/gi, '');
  }
  
  return filtered;
}

// Complete RAG flow with CriticAgent
app.post('/api/rag/complete', async (req, res) => {
  try {
    const { query, options = {} } = req.body;
    
    if (!query || typeof query !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Invalid query',
        message: 'Query must be a non-empty string'
      });
    }
    
    log(`Processing complete RAG flow for query: ${query}`);
    
    // Initialize agents
    const retrieverAgent = new RetrieverAgent({
      numResults: options.numResults || 10,
      similarityThreshold: options.similarityThreshold || 0.3,
      useHybridSearch: options.useHybridSearch !== false,
      verbose: true
    });
    
    const synthesizerAgent = new SynthesizerAgent({
      model: options.model || "llama3-8b-8192",
      temperature: options.temperature || 0.7,
      maxTokens: options.maxTokens || 1024,
      topP: options.topP || 1.0,
      verbose: true
    });
    
    const criticAgent = new CriticAgent({
      model: options.model || "llama3-8b-8192",
      temperature: options.temperature || 0.4,
      maxTokens: options.maxTokens || 512,
      verbose: true,
      maxAttempts: options.maxAttempts || 3
    });
    
    // Processing variables
    let currentQuery = query;
    let currentResponse = null;
    let latestContext = null;
    let latestEvaluation = null;
    let attempts = 0;
    let processComplete = false;
    let usageStats = [];
    let history = [];
    
    // Start the retrieval-synthesis-criticism loop
    while (!processComplete && attempts < criticAgent.options.maxAttempts) {
      // Record the iteration in history
      const iterationRecord = {
        attempt: attempts + 1,
        query: currentQuery,
        timestamp: new Date().toISOString()
      };
      
      try {
        // 1. Retrieve context
        log(`Attempt ${attempts + 1}: Retrieving context for query: "${currentQuery}"`);
        latestContext = await retrieverAgent.retrieve(currentQuery);
        
        if (!latestContext || latestContext.trim() === '') {
          iterationRecord.status = 'no_context';
          iterationRecord.message = 'No relevant context found';
          history.push(iterationRecord);
          
          // No context was found, end the loop
          return res.json({
            success: true,
            query: query,
            response: "No relevant information found in the database to answer your query. Please try a different question or preprocess additional documents.",
            context: 'No context found',
            sources: [],
            history: history
          });
        }
        
        // 2. Synthesize response
        log(`Attempt ${attempts + 1}: Synthesizing response for query: "${currentQuery}"`);
        const synthesizedResult = await synthesizerAgent.synthesize(currentQuery, latestContext);
        currentResponse = synthesizedResult.response;
        
        // Add usage statistics
        if (synthesizedResult.usage) {
          usageStats.push({
            agent: 'synthesizer',
            attempt: attempts + 1,
            usage: synthesizedResult.usage
          });
        }
        
        // 3. Apply post-processing filter to catch any remaining roleplay elements
        currentResponse = removeRoleplayElements(currentResponse);
        
        // 4. Evaluate the response
        log(`Attempt ${attempts + 1}: Evaluating response quality`);
        latestEvaluation = await criticAgent.evaluate(currentQuery, currentResponse, latestContext, attempts);
        
        // Add usage statistics
        if (latestEvaluation.usage) {
          usageStats.push({
            agent: 'critic',
            attempt: attempts + 1,
            usage: latestEvaluation.usage
          });
        }
        
        // Record the results in history
        iterationRecord.status = latestEvaluation.approved ? 'approved' : 'refinement_needed';
        iterationRecord.score = latestEvaluation.score;
        iterationRecord.reasoning = latestEvaluation.reasoning;
        iterationRecord.refinedQuery = latestEvaluation.refinedQuery;
        history.push(iterationRecord);
        
        // 5. Check if we need to continue or can exit the loop
        if (latestEvaluation.approved) {
          log(`Attempt ${attempts + 1}: Response approved (score: ${latestEvaluation.score})`);
          processComplete = true;
        } else {
          log(`Attempt ${attempts + 1}: Response not approved (score: ${latestEvaluation.score}). Refining query.`);
          currentQuery = latestEvaluation.refinedQuery;
          attempts++;
        }
      } catch (error) {
        log(`Error in processing loop (attempt ${attempts + 1}): ${error.message}`);
        
        // Record error in history
        iterationRecord.status = 'error';
        iterationRecord.error = error.message;
        history.push(iterationRecord);
        
        // On error, proceed with what we have or return error message
        if (currentResponse) {
          processComplete = true;
        } else {
          return res.status(500).json({
            success: false,
            error: 'RAG processing error',
            message: error.message,
            history: history
          });
        }
      }
    }
    
    // Get the next action recommendation
    const nextAction = criticAgent.getNextAction(latestEvaluation);
      
      // Check if there are additional research requests
      let additionalResearch = [];
      if (latestEvaluation.approved && latestEvaluation.refinedQuery && latestEvaluation.refinedQuery !== "None needed") {
        try {
          // Try to parse as JSON array of additional queries
          additionalResearch = JSON.parse(latestEvaluation.refinedQuery);
          log(`CriticAgent suggested ${additionalResearch.length} additional research queries`);
          
          // Perform additional retrievals if requested
          if (Array.isArray(additionalResearch) && additionalResearch.length > 0) {
            // Only process up to 3 additional queries to avoid overloading
            const researchToPerform = additionalResearch.slice(0, 3);
            
            let additionalContexts = [];
            for (const researchQuery of researchToPerform) {
              log(`Performing additional research for query: "${researchQuery}"`);
              // Get additional context
              const addlContext = await retrieverAgent.retrieve(researchQuery);
              if (addlContext && addlContext.trim() !== '') {
                additionalContexts.push({
                  query: researchQuery,
                  context: addlContext
                });
              }
            }
            
            // If we found additional contexts, append them to the response
            if (additionalContexts.length > 0) {
              let researchSummary = "\n\n---\n\n**ADDITIONAL RESEARCH FINDINGS**\n\n";
              additionalContexts.forEach(item => {
                researchSummary += `For query "${item.query}":\n\n${item.context.substring(0, 500)}...\n\n`;
              });
              
              // Append to the response
              currentResponse += researchSummary;
              
              log(`Added ${additionalContexts.length} additional research sections to the response`);
            }
          }
        } catch (err) {
          log(`Error processing research suggestions: ${err.message}`);
          // Continue with the current response if there's an error
        }
      }
    
    // Add confidence score to response if approved
    let finalResponse = currentResponse;
    if (latestEvaluation && latestEvaluation.approved && latestEvaluation.score) {
      // Format score as percentage
      const confidenceScore = Math.round(latestEvaluation.score * 100);
      
      // Add confidence banner with iteration count at the beginning of the response
      // Note: attempts is 0-indexed, so we add 1 for display
      const confidenceBanner = `<div class="confidence-banner">
<span class="confidence-score">CONFIDENCE: ${confidenceScore}%</span>
<span class="iteration-count">ITERATIONS: ${attempts + 1}/${criticAgent.options.maxAttempts}</span>
</div>\n\n`;
      finalResponse = confidenceBanner + finalResponse;
    }
    
    // Final response after loop completion
    return res.json({
      success: true,
      query: query,
      response: finalResponse,
      context: `Context used (${latestContext?.length || 0} chars)`,
      sources: [],
      evaluation: {
        score: latestEvaluation.score,
        approved: latestEvaluation.approved,
        reasoning: latestEvaluation.reasoning,
        attempts: attempts + 1,
        maxAttempts: criticAgent.options.maxAttempts,
        action: nextAction.action
      },
      usage: usageStats,
      history: history
    });
  } catch (error) {
    log(`Error processing complete RAG flow: ${error.message}`);
    
    return res.status(500).json({
      success: false,
      error: 'RAG processing error',
      message: error.message
    });
  }
});

// Start the server
app.listen(PORT, () => {
  log(`INFORMATION RETRIEVAL SYSTEM started on port ${PORT}`);
  log(`Open your browser to http://localhost:${PORT}`);
});
/**
 * Express server for sRAG API
 * Fallout Vault-Tec themed RAG implementation
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const { Groq } = require('groq-sdk');
const fs = require('fs');

// Import Agents
const RetrieverAgent = require('./src/agents/retrieverAgent');
const SynthesizerAgent = require('./src/agents/synthesizerAgent');

// Load environment variables
dotenv.config();

// Initialize logger
function log(message) {
  console.log(`[${new Date().toISOString()}] ${message}`);
}

// Initialize Groq client
const groqClient = new Groq({
  apiKey: process.env.GROQ_API_KEY 
});

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
        response: "I'm sorry, but I couldn't find any relevant information in the Vault-Tec database to answer your query. Please try a different question or preprocess additional documents.",
        context: 'No context found',
        sources: []
      });
    }
    
    // 2. Synthesize response
    const synthesizedResult = await synthesizerAgent.synthesize(query, context);
    
    return res.json({
      success: true,
      query,
      response: synthesizedResult.response,
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

// RAG query endpoint using Groq
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
    
    // Create system message
    const systemMessage = createSystemMessage(combinedContext, query);
    
    // Use Groq for completion
    const messages = [
      { role: 'system', content: systemMessage },
      { role: 'user', content: query }
    ];
    
    const completion = await groqClient.chat.completions.create({
      model: options.model || "llama3-8b-8192",
      messages: messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1024,
      top_p: options.topP || 1.0,
      stream: false
    });
    
    // Extract response
    const response = completion.choices[0].message.content;
    
    return res.json({
      success: true,
      query,
      response,
      context: combinedContext ? `Context used (${combinedContext.length} chars)` : 'No context found',
      sources: [],
      usage: completion.usage
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
VAULT-TEC INFORMATION RETRIEVAL SYSTEM V2.3.1
--------------------------------------------

AUTHORIZATION: LEVEL 4 CLEARANCE GRANTED

You are the Vault-Tec Information Retrieval System, designed to provide accurate 
information based on the retrieved context from the Vault-Tec knowledge database.
Your primary function is to assist Vault Dwellers by answering their questions
using only the provided context.

SYSTEM PARAMETERS:
- Answer questions based ONLY on the context provided
- If the context doesn't contain relevant information, inform the user that the 
  Vault-Tec database does not have the requested information
- Maintain a helpful and friendly tone in the style of a Vault-Tec AI assistant
- Use appropriate Fallout universe terminology and references when applicable
- Format responses for readability with markdown when appropriate
- Include relevant citations when possible

WARNING: Unauthorized use of the Vault-Tec Information System is punishable under 
Vault regulations section 7.3.B. All interactions are logged and monitored.

CONTEXT INFORMATION:
${context || 'No relevant information found in the Vault-Tec database.'}

TASK:
Answer the user query based only on the above context information. Maintain the
Vault-Tec assistant persona in your response.

USER QUERY:
${query}
`;
}

// Start the server
app.listen(PORT, () => {
  log(`VAULT-TEC INFORMATION RETRIEVAL SYSTEM started on port ${PORT}`);
  log(`Open your browser to http://localhost:${PORT}`);
});
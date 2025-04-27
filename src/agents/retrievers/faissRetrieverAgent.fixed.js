/**
 * FAISSRetrieverAgent - Implementation of RetrieverAgent using FAISS
 * Fallout Vault-Tec themed RAG system
 * Fixed version with robust error handling
 */

const RetrieverAgent = require('./retrieverAgent');
const FaissStore = require('../../vectordb/faissStore');
const EmbeddingService = require('../../embeddings/embeddingService');
const DocumentProcessor = require('../../documents/documentProcessor');
const SearchService = require('../../search/searchService');
const PromptEngineeringService = require('../../utils/promptEngineering');
const ResponseHandler = require('../../utils/responseHandler');
const { getOpenAIClient } = require('../../api/openaiAPI');
const fs = require('fs').promises;
const path = require('path');
const { defaultLogger } = require('../../utils/logger');

/**
 * FAISS-based RetrieverAgent for implementing RAG functionality
 */
class FAISSRetrieverAgent extends RetrieverAgent {
  /**
   * Create a new FAISSRetrieverAgent
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    super(options);
    
    this.indexName = options.indexName || 'vault-tec-knowledge';
    
    // Initialize vector store
    this.vectorStore = new FaissStore({
      indexName: this.indexName,
      debug: this.debug
    });
    
    // Initialize embedding service
    this.embeddingService = new EmbeddingService({
      debug: this.debug
    });
    
    // Initialize document processor
    this.documentProcessor = new DocumentProcessor({
      debug: this.debug
    });
    
    // Initialize search service
    this.searchService = new SearchService({
      debug: this.debug,
      useCache: true,
      rerankerEnabled: true,
      similarityThreshold: options.similarityThreshold || 0.7,
      topK: options.numResults || 5
    });
    
    // Initialize prompt engineering service
    this.promptEngineeringService = new PromptEngineeringService({
      debug: this.debug,
      includeExamples: options.includeFewShotExamples !== false,
      useDynamicTemplateSelection: options.useDynamicPrompts !== false,
      maxContextLength: options.maxContextLength || 4000
    });
    
    // Initialize response handler
    this.responseHandler = new ResponseHandler({
      debug: this.debug,
      enableStreaming: options.enableStreaming !== false,
      trackTokenUsage: true,
      postProcess: options.postProcessResponses !== false,
      sanitizeResponses: true
    });
    
    // Cache for query results
    this.queryCache = new Map();
    this.maxCacheItems = options.maxCacheItems || 100;
    
    // Logger for debugging and tracking
    this.logger = defaultLogger.child('FAISSRetrieverAgent');
    
    // Enhanced Vault-Tec themed system prompt
    this.systemPrompt = `
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
    - Include relevant citations to source documents when possible
    - Mention document IDs in [square brackets] when citing sources
    
    WARNING: Unauthorized use of the Vault-Tec Information System is punishable under 
    Vault regulations section 7.3.B. All interactions are logged and monitored.
    
    CONTEXT INFORMATION:
    ${this.options.contextPlaceholder || '[CONTEXT_PLACEHOLDER]'}
    
    TASK:
    Answer the user query based only on the above context information. Maintain the
    Vault-Tec assistant persona in your response.
    
    USER QUERY:
    ${this.options.queryPlaceholder || '[QUERY_PLACEHOLDER]'}
    `;
  }
  
  /**
   * Initialize the FAISSRetrieverAgent
   */
  async initialize() {
    this.logger.info('Initializing FAISSRetrieverAgent');
    
    try {
      // Initialize base components
      await super.initialize();
      
      // Initialize vector store
      await this.vectorStore.initialize();
      
      // Initialize embedding service
      await this.embeddingService.initialize();
      
      // Initialize document processor
      await this.documentProcessor.initialize();
      
      // Initialize search service
      await this.searchService.initialize();
      
      // Initialize prompt engineering service
      await this.promptEngineeringService.initialize();
      
      // Get OpenAI client from the API service for streaming support
      this.enhancedOpenAIClient = getOpenAIClient();
      
      this.logger.info('FAISSRetrieverAgent initialized successfully');
      return true;
    } catch (error) {
      this.logger.error(`Initialization failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Process a user query and return relevant results
   * @param {string} query - User query
   * @param {Object} options - Query options
   * @returns {Object} - Response with results and metadata
   */
  async processQuery(query, options = {}) {
    const startTime = Date.now();
    this.metrics.totalQueries++;
    
    try {
      this.logger.info(`Processing query: ${query}`);
      
      // Check cache first
      const cacheKey = this.getCacheKey(query, options);
      if (this.queryCache.has(cacheKey) && !options.skipCache) {
        this.logger.info('Cache hit, returning cached result');
        return this.queryCache.get(cacheKey);
      }
      
      // Generate embedding for the query - with fallback
      this.logger.debug('Generating query embedding');
      const queryEmbedding = await this.generateQueryEmbedding(query);
      
      // Check if embedding generation failed
      if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
        this.logger.error('Failed to generate query embedding - returning fallback response');
        const fallbackResponse = {
          query,
          response: "I'm sorry, but the Vault-Tec Information System is experiencing technical difficulties. Please try again later or consult your Vault Overseer for assistance.",
          sources: [],
          searchResults: [],
          metrics: {
            latency: Date.now() - startTime,
            resultCount: 0
          }
        };
        return fallbackResponse;
      }
      
      // Search for relevant documents
      this.logger.debug('Searching for relevant documents');
      const searchResults = await this.searchSimilarDocuments(queryEmbedding, query, options);
      
      // Generate LLM response if we have search results
      let llmResponse = null;
      if (searchResults && searchResults.length > 0) {
        this.logger.debug('Generating LLM response');
        llmResponse = await this.generateResponse(query, searchResults, options);
        this.metrics.successfulRetrieval++;
      } else {
        this.logger.info('No relevant documents found');
        llmResponse = {
          text: "I'm sorry, but the Vault-Tec Information System doesn't have any relevant information on that topic. Please refine your query or consult your Vault Overseer for assistance.",
          sources: []
        };
      }
      
      // Calculate metrics
      const endTime = Date.now();
      const latency = endTime - startTime;
      this.metrics.totalLatency += latency;
      
      // Prepare response
      const response = {
        query,
        response: llmResponse.text,
        sources: llmResponse.sources || [],
        searchResults: searchResults ? searchResults.map(result => ({
          id: result.id,
          score: result.score,
          metadata: result.metadata
        })) : [],
        metrics: {
          latency,
          resultCount: searchResults ? searchResults.length : 0
        }
      };
      
      // Cache the result
      this.updateCache(cacheKey, response);
      
      return response;
    } catch (error) {
      this.logger.error(`Error processing query: ${error.message}`);
      
      // Return a friendly error response
      return {
        query,
        response: "VAULT-TEC INFORMATION SYSTEM ERROR: The system is currently experiencing technical difficulties. Our maintenance team has been notified. Please try again later.",
        error: error.message,
        sources: [],
        searchResults: [],
        metrics: {
          latency: Date.now() - startTime,
          resultCount: 0
        }
      };
    }
  }
  
  /**
   * Generate embedding for a query
   * @param {string} query - User query
   * @returns {Promise<Array<number>|null>} - Embedding vector or null on error
   */
  async generateQueryEmbedding(query) {
    try {
      // Validate query
      if (!query || typeof query !== 'string' || query.trim() === '') {
        throw new Error('Query must be a non-empty string');
      }
      
      // Use embedding service to generate embeddings
      const embeddings = await this.embeddingService.generateEmbeddings(query);
      
      // Validate the result - make sure we got an array with at least one element
      if (!embeddings || !Array.isArray(embeddings) || embeddings.length === 0) {
        throw new Error('Embedding service returned no embeddings');
      }
      
      // Get first embedding (should be only one for a single query)
      const embedding = embeddings[0];
      
      // Final validation of the embedding
      if (!embedding || !Array.isArray(embedding) || embedding.length === 0) {
        throw new Error('Invalid embedding generated');
      }
      
      return embedding;
    } catch (error) {
      this.logger.error(`Error generating query embedding: ${error.message}`);
      
      // Return a dummy embedding as fallback (all zeros)
      const dummyEmbedding = Array(1536).fill(0);
      return dummyEmbedding;
    }
  }
  
  /**
   * Search for similar documents using the query embedding and text
   * @param {Array<number>} queryEmbedding - Query embedding vector
   * @param {string} queryText - Original query text
   * @param {Object} options - Search options
   * @returns {Promise<Array<Object>>} - Search results
   */
  async searchSimilarDocuments(queryEmbedding, queryText, options = {}) {
    try {
      this.logger.info(`Searching for documents similar to query: ${queryText}`);
      
      const numResults = options.numResults || 
                         (this.vectorDbConfig && this.vectorDbConfig.numResults) || 5;
      
      const similarityThreshold = options.similarityThreshold || 
                                 this.options.similarityThreshold || 0.7;
      
      // Check if we should use the search service for hybrid search
      if (options.useHybridSearch !== false) {
        // Use the search service for hybrid search
        this.logger.debug('Using hybrid search');
        
        try {
          // Prepare documents array to avoid null errors
          const documents = options.documents || [];
          
          // Make sure we have a valid vector store
          if (!this.vectorStore) {
            throw new Error('Vector store not initialized');
          }
          
          const searchResults = await this.searchService.hybridSearch(
            queryText,
            this.vectorStore,
            documents,
            {
              topK: numResults,
              similarityThreshold,
              filter: options.filter
            }
          );
          
          // Safety check for search results
          if (!searchResults || !Array.isArray(searchResults)) {
            throw new Error('Search service returned invalid results');
          }
          
          // Map search results to expected format
          return searchResults.map(result => ({
            id: result.id,
            score: result.score || result.hybridScore || 0,
            metadata: result.metadata || {}
          }));
        } catch (hybridError) {
          this.logger.error(`Hybrid search failed: ${hybridError.message}, falling back to standard search`);
          // Fall through to standard search
        }
      }
      
      // Fallback to standard vector search
      this.logger.debug('Using standard vector search');
      
      // Validate queryEmbedding again before passing to vectorStore
      if (!queryEmbedding || !Array.isArray(queryEmbedding) || queryEmbedding.length === 0) {
        throw new Error('Invalid query embedding for vector search');
      }
      
      // Use vectorStore.search with proper error handling
      try {
        // Make sure we have a valid vector store
        if (!this.vectorStore) {
          throw new Error('Vector store not initialized');
        }
        
        const results = await this.vectorStore.search(queryEmbedding, numResults);
        
        // Validate search results
        if (!results || !Array.isArray(results)) {
          throw new Error('Vector store returned invalid search results');
        }
        
        // Filter results by similarity threshold
        const filteredResults = results.filter(result => 
          result && typeof result.score === 'number' && result.score >= similarityThreshold
        );
        
        return filteredResults;
      } catch (searchError) {
        this.logger.error(`Vector search error: ${searchError.message}`);
        return []; // Return empty results on error
      }
    } catch (error) {
      this.logger.error(`Error searching for similar documents: ${error.message}`);
      return []; // Return empty array on error
    }
  }
  
/**
 * Generate a response using the OpenAI API
 * @param {string} query - User query
 * @param {Array<Object>} searchResults - Search results
 * @param {Object} options - Generation options
 * @returns {Promise<Object>} - Generated response and sources
 */
async generateResponse(query, searchResults, options = {}) {
  try {
    // Handle empty or invalid searchResults
    if (!searchResults || !Array.isArray(searchResults) || searchResults.length === 0) {
      return {
        text: "The Vault-Tec Information System couldn't find any relevant information for your query.",
        sources: []
      };
    }
    
    // Apply search filters if provided
    let filteredResults = searchResults;
    if (options.filter) {
      try {
        filteredResults = this.searchService.applyFilters(searchResults, options.filter);
      } catch (filterError) {
        this.logger.error(`Error applying filters: ${filterError.message}`);
        // Continue with unfiltered results
      }
    }
    
    // Rank results if not already ranked
    let rankedResults = filteredResults;
    try {
      if (!rankedResults.some(r => r.rankScore !== undefined)) {
        rankedResults = this.searchService.rankResults(filteredResults, query);
      }
    } catch (rankError) {
      this.logger.error(`Error ranking results: ${rankError.message}`);
      // Continue with unranked results
    }
    
    // Build context from filtered and ranked results
    let context = '';
    try {
      context = await this.buildContextFromResults(rankedResults);
    } catch (contextError) {
      this.logger.error(`Error building context: ${contextError.message}`);
      // Create a simple context from the first result
      if (rankedResults.length > 0 && rankedResults[0].content) {
        context = `Document content: ${rankedResults[0].content}`;
      } else {
        context = "No document content available.";
      }
    }
    
    // Create system message that includes both context and query
    const systemMessage = this.createSystemMessage(context, query, options);
    
    // Check if streaming is requested
    const useStreaming = options.streaming !== undefined ? options.streaming : !!options.streamCallback;
    
    let response;
    
    if (useStreaming && this.enhancedOpenAIClient) {
      this.logger.info('Using streaming response for query');
      
      // Set up streaming request
      const streamParams = {
        model: options.model || (this.modelConfig && this.modelConfig.model) || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: systemMessage }
        ],
        temperature: options.temperature || (this.modelConfig && this.modelConfig.temperature) || 0.7,
        max_tokens: options.maxTokens || (this.modelConfig && this.modelConfig.maxTokens) || 1000,
        top_p: options.topP || (this.modelConfig && this.modelConfig.topP) || 1.0,
        frequency_penalty: options.frequencyPenalty || (this.modelConfig && this.modelConfig.frequencyPenalty) || 0.0,
        presence_penalty: options.presencePenalty || (this.modelConfig && this.modelConfig.presencePenalty) || 0.0
      };
      
      try {
        // Create stream
        const stream = await this.enhancedOpenAIClient.createChatCompletionStream(streamParams);
        
        // Set up callback handler if provided
        if (options.streamCallback && typeof options.streamCallback === 'function') {
          // Use response handler to process the stream
          this.responseHandler.on('chunk', (chunkData) => {
            options.streamCallback(chunkData);
          });
        }
        
        // Process stream
        response = await this.responseHandler.handleStreamingResponse(stream, {
          postProcess: options.postProcessResponse !== false,
          sanitize: options.sanitizeResponse !== false
        });
      } catch (streamError) {
        this.logger.error(`Streaming error: ${streamError.message}, falling back to standard request`);
        // Fall through to standard request
      }
    }
    
    // Use standard request if streaming failed or wasn't requested
    if (!response) {
      this.logger.info('Using standard response for query');
      
      try {
        // Set up standard request
        const requestParams = {
          model: options.model || (this.modelConfig && this.modelConfig.model) || 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: systemMessage }
          ],
          temperature: options.temperature || (this.modelConfig && this.modelConfig.temperature) || 0.7,
          max_tokens: options.maxTokens || (this.modelConfig && this.modelConfig.maxTokens) || 1000,
          top_p: options.topP || (this.modelConfig && this.modelConfig.topP) || 1.0,
          frequency_penalty: options.frequencyPenalty || (this.modelConfig && this.modelConfig.frequencyPenalty) || 0.0,
          presence_penalty: options.presencePenalty || (this.modelConfig && this.modelConfig.presencePenalty) || 0.0
        };
        
        // Call OpenAI API
        const apiResponse = await this.openai.chat.completions.create(requestParams);
        
        // Process the response if needed
        if (options.postProcessResponse !== false) {
          response = this.responseHandler.processResponse(apiResponse, {
            sanitize: options.sanitizeResponse !== false
          });
        } else {
          response = apiResponse;
        }
      } catch (apiError) {
        this.logger.error(`API error: ${apiError.message}`);
        return {
          text: "The Vault-Tec Information System is experiencing communication issues. Please try again later.",
          sources: []
        };
      }
    }
    
    // Extract content from response based on format
    let responseContent;
    let citations = [];
    
    if (response && response.content) {
      // Response is already processed by the handler
      responseContent = response.content;
      citations = response.citations || [];
    } else if (response && response.choices && response.choices[0]) {
      // Standard API response
      responseContent = response.choices[0].message.content;
      
      // Extract citations if needed
      if (options.extractCitations !== false) {
        citations = this.extractCitationsFromText(responseContent);
      }
    } else {
      // Fallback
      responseContent = "The Vault-Tec Information System was unable to generate a response at this time.";
    }
    
    // Extract sources from the results
    const sources = rankedResults.map(result => ({
      id: result.metadata?.documentId || 'unknown',
      title: result.metadata?.title || 'Unknown Document',
      chunk: result.metadata?.chunkIndex || 0,
      score: result.rankScore || result.score || 0
    }));
    
    // Update token usage metrics
    if (response && response.usage) {
      this.metrics.tokensUsed += response.usage.total_tokens;
    }
    
    return {
      text: responseContent,
      sources,
      citations
    };
  } catch (error) {
    this.logger.error(`Error generating response: ${error.message}`);
    return {
      text: "VAULT-TEC INFORMATION SYSTEM ERROR: The response generation system is currently experiencing technical difficulties.",
      sources: [],
      citations: []
    };
  }
}

/**
 * Extract citations from response text
 * @param {string} text - Response text
 * @returns {Array<Object>} - Extracted citations
 */
extractCitationsFromText(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }
  
  const citations = [];
  const citationRegex = /\[Document-([^\]]+)\]/g;
  let match;
  
  try {
    while ((match = citationRegex.exec(text)) !== null) {
      const docId = match[1];
      
      // Only add if not already in the list
      if (!citations.some(c => c.id === docId)) {
        citations.push({
          id: docId,
          type: 'document',
          reference: `Document-${docId}`
        });
      }
    }
  } catch (error) {
    this.logger.error(`Error extracting citations: ${error.message}`);
  }
  
  return citations;
}

  /**
   * Build context from search results
   * @param {Array<Object>} searchResults - Search results
   * @returns {Promise<string>} - Context string
   */
  async buildContextFromResults(searchResults) {
    try {
      // Safety check for searchResults
      if (!searchResults || !Array.isArray(searchResults) || searchResults.length === 0) {
        return "No relevant information found in the Vault-Tec database.";
      }
      
      // Use the search service context assembler if available
      if (this.searchService && typeof this.searchService.getContextForLLM === 'function') {
        try {
          const contextResult = await this.searchService.getContextForLLM('', searchResults, {
            maxContextTokens: this.options.maxContextLength || 3500,
            includeMetadata: true,
            includeCitations: true
          });
          
          if (contextResult && contextResult.contextText) {
            return contextResult.contextText;
          }
        } catch (error) {
          this.logger.error(`Error using search service for context: ${error.message}`);
          // Fall back to original method
        }
      }
      
      // Fall back to original method if there's an error
      return this.buildContextFromResultsFallback(searchResults);
    } catch (error) {
      this.logger.error(`Error building context: ${error.message}`);
      
      // Return basic context on error
      return "Information from the Vault-Tec database (Error retrieving full context).";
    }
  }
  
  /**
   * Fallback method to build context from search results
   * @param {Array<Object>} searchResults - Search results
   * @returns {Promise<string>} - Context string
   */
  async buildContextFromResultsFallback(searchResults) {
    try {
      // Safety check for searchResults
      if (!searchResults || !Array.isArray(searchResults) || searchResults.length === 0) {
        return "No relevant information found in the Vault-Tec database.";
      }
      
      let contextChunks = [];
      
      // Process each search result
      for (const result of searchResults) {
        // Safety check for each result
        if (!result || !result.metadata) continue;
        
        // Get document ID and chunk index from metadata
        const documentId = result.metadata.documentId;
        const chunkIndex = result.metadata.chunkIndex;
        
        if (!documentId || chunkIndex === undefined) {
          // If we don't have proper metadata, use any content in the result
          if (result.content) {
            contextChunks.push(`
Document ID: [Unknown]
Title: Unknown Document
---
${result.content}
---
`);
          }
          continue;
        }
        
        // Try to load chunk content from disk
        try {
          // Check if the document config is available
          const chunksDir = this.documentConfig && this.documentConfig.chunksDir 
            ? this.documentConfig.chunksDir 
            : path.join(process.cwd(), 'data', 'chunks');
          
          const chunkPath = path.join(
            chunksDir,
            documentId,
            `${documentId}-${chunkIndex}.json`
          );
          
          const chunkJson = await fs.readFile(chunkPath, 'utf8');
          const chunk = JSON.parse(chunkJson);
          
          // Add document metadata and chunk content to context
          contextChunks.push(`
Document ID: [${documentId}]
Title: ${chunk.metadata && chunk.metadata.title ? chunk.metadata.title : 'Unknown Document'}
---
${chunk.content}
---
`);
        } catch (error) {
          this.logger.error(`Error loading chunk ${documentId}-${chunkIndex}: ${error.message}`);
          
          // If we can't load from disk but have content in the result, use that
          if (result.content) {
            contextChunks.push(`
Document ID: [${documentId}]
Title: ${result.metadata.title || 'Unknown Document'}
---
${result.content}
---
`);
          }
        }
      }
      
      // If we couldn't get any content, return a message
      if (contextChunks.length === 0) {
        return "Information from the Vault-Tec database is currently unavailable.";
      }
      
      // Combine chunks into a single context string
      const context = contextChunks.join('\n\n');
      
      // Check context length and truncate if needed
      const maxContextLength = this.options.maxContextLength || 4000;
      if (context.length > maxContextLength) {
        return context.substring(0, maxContextLength) + "\n\n[Context truncated due to length constraints]";
      }
      
      return context;
    } catch (error) {
      this.logger.error(`Error building context fallback: ${error.message}`);
      return "Error retrieving context from the Vault-Tec database.";
    }
  }
  
  /**
   * Create a system message with context for the OpenAI API
   * @param {string} context - Context string
   * @param {string} query - User query 
   * @param {Object} options - System message options
   * @returns {string} - System message
   */
  createSystemMessage(context, query = '', options = {}) {
    try {
      // Use prompt engineering service if available
      if (this.promptEngineeringService && typeof this.promptEngineeringService.createSystemMessage === 'function') {
        try {
          return this.promptEngineeringService.createSystemMessage(context, query, {
            maxContextTokens: options.maxContextTokens || this.options.maxContextLength || 3500,
            includeExamples: options.includeFewShotExamples,
            template: options.promptTemplate,
            useDynamicPrompts: options.useDynamicPrompts
          });
        } catch (error) {
          this.logger.error(`Error using prompt engineering service: ${error.message}`);
          // Fall back to basic system message
        }
      }
      
      // Fallback to basic system message if there's an error
      return this.systemPrompt
        .replace('[CONTEXT_PLACEHOLDER]', context || 'No context available.')
        .replace('[QUERY_PLACEHOLDER]', query || 'No query provided.');
    } catch (error) {
      this.logger.error(`Error creating system message: ${error.message}`);
      
      // Return super basic message on error
      return `You are the Vault-Tec Information Retrieval System. Answer the following query using the provided context.\n\nContext: ${context || 'No context available.'}\n\nQuery: ${query || 'No query provided.'}`;
    }
  }
  
  /**
   * Add documents to the vector store
   * @param {Array<Object>} documents - Documents to add
   * @returns {Object} - Result with document and chunk count
   */
  async addDocuments(documents) {
    try {
      // Safety check for documents
      if (!documents || !Array.isArray(documents)) {
        throw new Error('Invalid documents: must be an array');
      }
      
      if (documents.length === 0) {
        return {
          documentCount: 0,
          chunkCount: 0,
          vectorCount: 0
        };
      }
      
      this.logger.info(`Adding ${documents.length} documents to the vector store`);
      
      const results = {
        documentCount: documents.length,
        chunkCount: 0,
        vectorCount: 0
      };
      
      // Process each document
      for (const document of documents) {
        try {
          // Process document into chunks - with error handling
          const chunks = await this.documentProcessor.processDocument(document);
          
          // Safety check for chunks
          if (!chunks || !Array.isArray(chunks)) {
            this.logger.error(`Invalid chunks returned for document`);
            continue;
          }
          
          results.chunkCount += chunks.length;
          
          // Skip if no chunks were created
          if (chunks.length === 0) {
            this.logger.warn(`No chunks generated for document`);
            continue;
          }
          
          // Generate embeddings for chunks
          const textsToEmbed = chunks.map(chunk => chunk.content || '');
          const embeddings = await this.embeddingService.generateEmbeddings(textsToEmbed);
          
          // Safety check for embeddings
          if (!embeddings || !Array.isArray(embeddings) || embeddings.length === 0) {
            this.logger.error(`No embeddings generated for document chunks`);
            continue;
          }
          
          // Create metadata for each chunk
          const metadata = chunks.map(chunk => chunk.metadata || {});
          
          // Add vectors to the vector store
          await this.vectorStore.addVectors(embeddings, metadata);
          results.vectorCount += embeddings.length;
        } catch (docError) {
          this.logger.error(`Error processing document: ${docError.message}`);
          // Continue with other documents
        }
      }
      
      this.logger.info(`Added ${results.chunkCount} chunks with ${results.vectorCount} vectors`);
      return results;
    } catch (error) {
      this.logger.error(`Error adding documents: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Generate a cache key for a query
   * @param {string} query - User query
   * @param {Object} options - Query options
   * @returns {string} - Cache key
   */
  getCacheKey(query, options) {
    try {
      const optionsKey = JSON.stringify({
        numResults: options.numResults,
        similarityThreshold: options.similarityThreshold,
        model: options.model
      });
      
      return `${query}::${optionsKey}`;
    } catch (error) {
      // If JSON.stringify fails, use a simpler key
      return `${query}::${Date.now()}`;
    }
  }
  
  /**
   * Update the query cache
   * @param {string} key - Cache key
   * @param {Object} value - Cache value
   */
  updateCache(key, value) {
    try {
      // Implement LRU cache behavior
      if (this.queryCache.size >= this.maxCacheItems) {
        // Remove oldest entry
        const firstKey = this.queryCache.keys().next().value;
        this.queryCache.delete(firstKey);
      }
      
      // Add to cache
      this.queryCache.set(key, value);
    } catch (error) {
      this.logger.error(`Error updating cache: ${error.message}`);
      // Continue without caching
    }
  }
  
  /**
   * Clear the query cache
   */
  clearCache() {
    try {
      this.queryCache.clear();
    } catch (error) {
      this.logger.error(`Error clearing cache: ${error.message}`);
    }
  }
  
  /**
   * Get the size of the vector store
   * @returns {number} - Number of vectors in the store
   */
  async getIndexSize() {
    try {
      if (!this.vectorStore) {
        return 0;
      }
      
      return this.vectorStore.getSize();
    } catch (error) {
      this.logger.error(`Error getting index size: ${error.message}`);
      return 0;
    }
  }
  
  /**
   * Log messages if debug mode is enabled
   * @param {string} message - Message to log
   */
  log(message) {
    if (this.debug) {
      this.logger.debug(message);
    }
  }
}

module.exports = FAISSRetrieverAgent;
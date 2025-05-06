/**
 * Document Processor for sRAG system
 * Fallout Vault-Tec themed RAG implementation
 */

const fs = require('fs').promises;
const path = require('path');
const PDFProcessor = require('./formats/pdfProcessor');
const PDFToImageConverter = require('./formats/pdfToImageConverter');
const GPT4oAnalyzer = require('./formats/gpt4oAnalyzer');
const crypto = require('crypto');

/**
 * Processes documents for the RAG system
 */
class DocumentProcessor {
  /**
   * Create a new DocumentProcessor
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      chunksDir: path.join(process.cwd(), 'data', 'chunks'),
      documentsDir: path.join(process.cwd(), 'documents'),
      chunkSize: options.chunkSize || 300, // Smaller chunk size for more granular retrieval
      chunkOverlap: options.chunkOverlap || 150, // Larger overlap to maintain context
      chunkingStrategy: options.chunkingStrategy || 'hybrid',
      extractMetadata: options.extractMetadata !== false,
      debug: options.debug || false,
      ...options
    };
    
    // Initialize format-specific processors
    this.pdfProcessor = new PDFProcessor({
      ...options,
      debug: this.options.debug
    });
    
    // Initialize PDF to image converter
    this.pdfToImageConverter = new PDFToImageConverter({
      ...options,
      debug: this.options.debug,
      outputDir: options.imageOutputDir || path.join(process.cwd(), 'temp', 'images')
    });
    
    // Initialize GPT-4o analyzer if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.gpt4oAnalyzer = new GPT4oAnalyzer({
        ...options,
        debug: this.options.debug,
        apiKey: process.env.OPENAI_API_KEY
      });
    }
    
    this.initialized = false;
    this.log('DocumentProcessor created');
  }
  
  /**
   * Initialize the DocumentProcessor
   */
  async initialize() {
    this.log('Initializing DocumentProcessor');
    
    try {
      // Create necessary directories if they don't exist
      await this.ensureDirectoryExists(this.options.chunksDir);
      
      this.initialized = true;
      this.log('DocumentProcessor initialized successfully');
      return true;
    } catch (error) {
      console.error(`DocumentProcessor initialization failed: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Convert PDF to images
   * @param {string} pdfPath - Path to PDF file
   * @param {Object} options - Conversion options
   * @returns {Array<string>} - Array of image paths
   */
  async convertPdfToImages(pdfPath, options = {}) {
    this.log(`Converting PDF to images: ${pdfPath}`);
    
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Merge options
      const conversionOptions = {
        ...this.options,
        ...options
      };
      
      // Get full path if it's a relative path
      let fullPath = pdfPath;
      if (!path.isAbsolute(pdfPath)) {
        fullPath = path.join(this.options.documentsDir, pdfPath);
      }
      
      // Convert PDF to images
      const imagePaths = await this.pdfToImageConverter.convertToImages(fullPath, conversionOptions);
      
      this.log(`PDF converted to ${imagePaths.length} images`);
      return imagePaths;
    } catch (error) {
      console.error(`Error converting PDF to images: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Process PDF with GPT-4o vision analysis
   * @param {string} pdfPath - Path to PDF file
   * @param {Object} options - Processing options
   * @returns {Object} - Analysis results with images and text content
   */
  async processPdfWithVision(pdfPath, options = {}) {
    this.log(`Processing PDF with GPT-4o vision: ${pdfPath}`);
    
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      if (!this.gpt4oAnalyzer) {
        throw new Error('GPT-4o analyzer not available. Check if OpenAI API key is set.');
      }
      
      // Merge options
      const processingOptions = {
        ...this.options,
        ...options
      };
      
      // First convert PDF to images
      const imagePaths = await this.convertPdfToImages(pdfPath, processingOptions);
      
      if (!imagePaths.length) {
        throw new Error('No images were generated from PDF');
      }
      
      // Analyze images with GPT-4o
      this.log(`Analyzing ${imagePaths.length} PDF page images with GPT-4o...`);
      
      const visionPrompt = options.visionPrompt || 
        'Extract all the text content from this document page. ' +
        'Preserve the structure and layout as much as possible. ' +
        'Identify headings, paragraphs, bullet points, and any tables or figures.';
      
      const analysisResults = await this.gpt4oAnalyzer.analyzeMultipleImages(imagePaths, {
        prompt: visionPrompt,
        maxTokens: options.maxTokens || 1000,
        temperature: options.temperature || 0.2
      });
      
      // Combine results into a comprehensive document
      const combinedResult = {
        id: path.basename(pdfPath, '.pdf'),
        path: pdfPath,
        pages: analysisResults.map((result, index) => ({
          pageNumber: index + 1,
          imagePath: imagePaths[index],
          analysis: result.text,
          metadata: result.metadata
        })),
        content: analysisResults.map(r => r.text).join('\n\n==== PAGE BREAK ====\n\n'),
        metadata: {
          totalPages: imagePaths.length,
          processedWith: 'GPT-4o Vision',
          timestamp: new Date().toISOString()
        }
      };
      
      // Optional: Save the results to a JSON file
      if (options.saveResults) {
        const outputPath = path.join(
          options.outputDir || path.join(process.cwd(), 'data', 'vision_results'),
          `${path.basename(pdfPath, '.pdf')}_vision_analysis.json`
        );
        
        await this.ensureDirectoryExists(path.dirname(outputPath));
        await fs.writeFile(outputPath, JSON.stringify(combinedResult, null, 2), 'utf8');
        
        this.log(`Vision analysis results saved to ${outputPath}`);
        combinedResult.outputPath = outputPath;
      }
      
      this.log(`PDF vision analysis completed for ${pdfPath}`);
      return combinedResult;
    } catch (error) {
      console.error(`Error processing PDF with vision: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Process a document file
   * @param {string|Object} documentPath - Path to document or document object
   * @param {Object} options - Processing options
   * @returns {Array<Object>} - Array of chunks
   */
  async processDocument(documentPath, options = {}) {
    this.log(`Processing document: ${typeof documentPath === 'string' ? documentPath : 'document object'}`);
    
    try {
      if (!this.initialized) {
        await this.initialize();
      }
      
      // Merge options
      const processingOptions = {
        ...this.options,
        ...options
      };
      
      // Determine document path and format
      let fullPath = documentPath;
      let format = 'unknown';
      
      if (typeof documentPath === 'string') {
        // Get full path if it's a relative path to a document in the documents directory
        if (!path.isAbsolute(documentPath)) {
          fullPath = path.join(this.options.documentsDir, documentPath);
        }
        
        // Determine format from file extension
        format = path.extname(fullPath).toLowerCase().replace('.', '');
      } else if (typeof documentPath === 'object' && documentPath !== null) {
        // If document is an object, extract format and path
        format = documentPath.type || documentPath.format || 'unknown';
        fullPath = documentPath.path || '';
        
        // If it's an object with content, process directly
        if (documentPath.content) {
          return this.processDocumentContent(documentPath, processingOptions);
        }
      } else {
        throw new Error('Invalid document: must be a string path or document object');
      }
      
      // Process based on format
      let document;
      
      if (format === 'pdf') {
        document = await this.pdfProcessor.processPDF(fullPath);
      } else {
        throw new Error(`Unsupported document format: ${format}`);
      }
      
      // Extract document ID from filename if not provided
      if (!document.id) {
        const baseName = path.basename(fullPath, `.${format}`);
        document.id = this.sanitizeDocumentId(baseName);
      }
      
      // Process document content
      return this.processDocumentContent(document, processingOptions);
    } catch (error) {
      console.error(`Error processing document: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Sanitize document ID to be file-system friendly
   * @param {string} id - Raw document ID
   * @returns {string} - Sanitized ID
   */
  sanitizeDocumentId(id) {
    // Remove any characters that might cause issues with filesystems
    return id.replace(/[^a-zA-Z0-9-_]/g, '-');
  }
  
  /**
   * Process document content into chunks
   * @param {Object} document - Document object with content
   * @param {Object} options - Processing options
   * @returns {Array<Object>} - Array of chunks
   */
  async processDocumentContent(document, options = {}) {
    this.log(`Processing document content for ${document.id || 'unnamed document'}`);
    
    try {
      // Extract content and metadata
      const { content, metadata, id } = document;
      
      if (!content) {
        throw new Error('Document has no content');
      }
      
      // Generate document ID if not provided
      const documentId = id || this.generateDocumentId(content);
      
      // Create directory for chunks
      const documentChunksDir = path.join(this.options.chunksDir, documentId);
      await this.ensureDirectoryExists(documentChunksDir);
      
      // Extract basic metadata from first page for author, title, etc.
      const basicMetadata = this.extractBasicMetadata(content);
      const combinedMetadata = {
        ...metadata,
        ...basicMetadata
      };
      
      // Split content into chunks
      const rawChunks = this.splitIntoChunks(content, options);
      
      // Process chunks
      const chunks = [];
      
      for (let i = 0; i < rawChunks.length; i++) {
        const chunkContent = rawChunks[i];
        
        // Create chunk ID
        const chunkId = this.generateChunkId(documentId, i);
        
        // Create chunk object
        const chunk = {
          id: chunkId,
          documentId,
          content: chunkContent,
          index: i,
          metadata: {
            ...combinedMetadata,
            documentId,
            chunkIndex: i,
            chunkId,
            isFirstChunk: i === 0,
            isLastChunk: i === rawChunks.length - 1
          }
        };
        
        // Save chunk to file
        const chunkPath = path.join(documentChunksDir, `${documentId}-${i}-${chunkId}.json`);
        await fs.writeFile(chunkPath, JSON.stringify(chunk, null, 2), 'utf8');
        
        chunks.push(chunk);
      }
      
      // Create special metadata chunk if useful metadata was found
      if (basicMetadata.author || basicMetadata.title || basicMetadata.date) {
        const metadataChunk = {
          id: this.generateChunkId(documentId, 'meta'),
          documentId,
          content: `DOCUMENT METADATA:\nTitle: ${basicMetadata.title || documentId}\nAuthor: ${basicMetadata.author || 'Unknown'}\nDate: ${basicMetadata.date || 'Unknown'}\n`,
          index: 'meta',
          metadata: {
            ...combinedMetadata,
            documentId,
            chunkIndex: 'meta',
            isMetadata: true
          }
        };
        
        const metadataChunkPath = path.join(documentChunksDir, `${documentId}-meta-${metadataChunk.id}.json`);
        await fs.writeFile(metadataChunkPath, JSON.stringify(metadataChunk, null, 2), 'utf8');
        
        chunks.push(metadataChunk);
      }
      
      this.log(`Document processed into ${chunks.length} chunks`);
      return chunks;
    } catch (error) {
      console.error(`Error processing document content: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Extract basic metadata from document content
   * @param {string} content - Document content
   * @returns {Object} - Extracted metadata
   */
  extractBasicMetadata(content) {
    const metadata = {};
    
    // Extract first 2000 characters to look for metadata
    const firstContent = content.substring(0, 2000);
    
    // Look for author
    const authorPatterns = [
      /author\s*[:]\s*([^\n\r]+)/i,
      /by\s+([^\n\r,]+)/i,
      /written by\s+([^\n\r,]+)/i,
      /created by\s+([^\n\r,]+)/i
    ];
    
    for (const pattern of authorPatterns) {
      const authorMatch = firstContent.match(pattern);
      if (authorMatch && authorMatch[1].trim()) {
        metadata.author = authorMatch[1].trim();
        break;
      }
    }
    
    // Look for title
    const titlePatterns = [
      /title\s*[:]\s*([^\n\r]+)/i,
      /^([^\n\r]+)$/m
    ];
    
    for (const pattern of titlePatterns) {
      const titleMatch = firstContent.match(pattern);
      if (titleMatch && titleMatch[1].trim()) {
        metadata.title = titleMatch[1].trim();
        break;
      }
    }
    
    // Look for date
    const datePatterns = [
      /date\s*[:]\s*([^\n\r]+)/i,
      /([a-z]+\s+\d{4})/i,
      /(\d{1,2}\/\d{1,2}\/\d{2,4})/
    ];
    
    for (const pattern of datePatterns) {
      const dateMatch = firstContent.match(pattern);
      if (dateMatch && dateMatch[1].trim()) {
        metadata.date = dateMatch[1].trim();
        break;
      }
    }
    
    return metadata;
  }
  
  /**
   * Split content into chunks
   * @param {string} content - Document content
   * @param {Object} options - Chunking options
   * @returns {Array<string>} - Array of content chunks
   */
  splitIntoChunks(content, options = {}) {
    const chunkSize = options.chunkSize || this.options.chunkSize;
    const chunkOverlap = options.chunkOverlap || this.options.chunkOverlap;
    const strategy = options.chunkingStrategy || this.options.chunkingStrategy;
    
    this.log(`Splitting content using strategy: ${strategy}, size: ${chunkSize}, overlap: ${chunkOverlap}`);
    
    // Handle empty content
    if (!content || content.trim() === '') {
      return [''];
    }
    
    if (strategy === 'hybrid') {
      return this.hybridChunking(content, chunkSize, chunkOverlap);
    } else if (strategy === 'semantic') {
      return this.semanticChunking(content, chunkSize, chunkOverlap);
    } else {
      // Default to fixed-size chunking
      return this.fixedSizeChunking(content, chunkSize, chunkOverlap);
    }
  }
  
  /**
   * Split content using fixed-size chunking
   * @param {string} content - Document content
   * @param {number} chunkSize - Size of each chunk
   * @param {number} chunkOverlap - Overlap between chunks
   * @returns {Array<string>} - Array of content chunks
   */
  fixedSizeChunking(content, chunkSize, chunkOverlap) {
    this.log('Using fixed-size chunking');
    
    const chunks = [];
    const step = chunkSize - chunkOverlap;
    
    for (let i = 0; i < content.length; i += step) {
      chunks.push(content.slice(i, i + chunkSize));
    }
    
    return chunks;
  }
  
  /**
   * Split content using paragraph-based chunking
   * @param {string} content - Document content
   * @param {number} maxChunkSize - Maximum size of each chunk
   * @param {number} chunkOverlap - Overlap between chunks
   * @returns {Array<string>} - Array of content chunks
   */
  semanticChunking(content, maxChunkSize, chunkOverlap) {
    this.log('Using semantic (paragraph-based) chunking');
    
    // Split content by paragraphs
    const paragraphs = content.split(/\n\s*\n/);
    
    const chunks = [];
    let currentChunk = '';
    
    for (const paragraph of paragraphs) {
      const trimmedParagraph = paragraph.trim();
      
      if (trimmedParagraph === '') continue;
      
      // If adding this paragraph would exceed maxChunkSize, start a new chunk
      if (currentChunk.length + trimmedParagraph.length > maxChunkSize && currentChunk !== '') {
        chunks.push(currentChunk);
        
        // Add overlap from the end of the previous chunk if possible
        if (chunkOverlap > 0 && currentChunk.length > chunkOverlap) {
          currentChunk = currentChunk.slice(-chunkOverlap) + '\n\n';
        } else {
          currentChunk = '';
        }
      }
      
      // Add paragraph to current chunk
      if (currentChunk.length > 0) {
        currentChunk += '\n\n';
      }
      currentChunk += trimmedParagraph;
    }
    
    // Add the last chunk if not empty
    if (currentChunk.trim() !== '') {
      chunks.push(currentChunk);
    }
    
    return chunks;
  }
  
  /**
   * Split content using hybrid chunking (semantic boundaries with size constraints)
   * @param {string} content - Document content
   * @param {number} maxChunkSize - Maximum size of each chunk
   * @param {number} chunkOverlap - Overlap between chunks
   * @returns {Array<string>} - Array of content chunks
   */
  hybridChunking(content, maxChunkSize, chunkOverlap) {
    this.log('Using hybrid chunking (semantic + fixed-size)');
    
    // First try semantic chunking
    const semanticChunks = this.semanticChunking(content, maxChunkSize, chunkOverlap);
    
    // Check if any chunk is still too large
    const finalChunks = [];
    
    for (const chunk of semanticChunks) {
      if (chunk.length <= maxChunkSize) {
        finalChunks.push(chunk);
      } else {
        // Split this chunk further using fixed-size chunking
        const subChunks = this.fixedSizeChunking(chunk, maxChunkSize, chunkOverlap);
        finalChunks.push(...subChunks);
      }
    }
    
    return finalChunks;
  }
  
  /**
   * Generate a unique document ID
   * @param {string} content - Document content
   * @returns {string} - Document ID
   */
  generateDocumentId(content) {
    const hash = crypto.createHash('md5').update(content).digest('hex');
    return hash.substring(0, 8);
  }
  
  /**
   * Generate a unique chunk ID
   * @param {string} documentId - Document ID
   * @param {number|string} chunkIndex - Chunk index
   * @returns {string} - Chunk ID
   */
  generateChunkId(documentId, chunkIndex) {
    const data = `${documentId}-${chunkIndex}-${Date.now()}`;
    const hash = crypto.createHash('md5').update(data).digest('hex');
    return hash.substring(0, 8);
  }
  
  /**
   * Ensure a directory exists
   * @param {string} dirPath - Directory path
   */
  async ensureDirectoryExists(dirPath) {
    try {
      await fs.mkdir(dirPath, { recursive: true });
    } catch (error) {
      console.error(`Error creating directory ${dirPath}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Log messages if debug mode is enabled
   * @param {string} message - Message to log
   */
  log(message) {
    if (this.options.debug) {
      console.log(`[DocumentProcessor] ${message}`);
    }
  }
}

module.exports = DocumentProcessor;
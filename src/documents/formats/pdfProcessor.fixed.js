/**
 * PDF Processor for sRAG system
 * Fallout Vault-Tec themed RAG implementation
 * Fixed version with better error handling
 */

const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');
const { defaultLogger: logger } = require('../../utils/logger');

/**
 * Processes PDF documents for the RAG system
 */
class PDFProcessor {
  /**
   * Create a new PDFProcessor
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      extractImages: options.extractImages || false,
      ocrImages: options.ocrImages || false,
      preserveFormatting: options.preserveFormatting || true,
      maxPages: options.maxPages || 0, // 0 means no limit
      ...options
    };
    
    this.debug = options.debug || false;
    this.log('PDFProcessor initialized');
  }
  
  /**
   * Process a PDF file
   * @param {string} filePath - Path to PDF file
   * @returns {Object} - Document object with content and metadata
   */
  async processPDF(filePath) {
    this.log(`Processing PDF: ${filePath}`);
    
    try {
      // Read the PDF file
      const dataBuffer = await fs.readFile(filePath);
      
      // Parse PDF options with better defaults
      const options = {
        // PDF.js options
        pagerender: this.options.preserveFormatting ? this.renderPageWithFormat : undefined,
        max: this.options.maxPages > 0 ? this.options.maxPages : undefined  // Don't limit pages by default
      };
      
      // Parse the PDF with explicit error handling
      let pdfData;
      try {
        pdfData = await pdfParse(dataBuffer, options);
      } catch (pdfError) {
        // Try with simplified options if initial parsing fails
        this.log(`Initial PDF parsing failed, trying with simplified options: ${pdfError.message}`);
        pdfData = await pdfParse(dataBuffer, { max: 10 }); // Only parse first 10 pages with default options
      }
      
      // Ensure we have text content even if parsing was limited
      const textContent = pdfData.text || 'Content extraction failed. This document may be encrypted or damaged.';
      
      // Create document object
      const document = {
        id: path.basename(filePath, '.pdf'),
        content: textContent,
        type: 'pdf',
        path: filePath,
        metadata: {
          title: this.extractTitle(pdfData) || path.basename(filePath, '.pdf'),
          pageCount: pdfData.numpages || 0,
          pdfInfo: pdfData.info || {},
          pdfMetadata: pdfData.metadata || {},
          pdfVersion: pdfData.pdfVersion || 'unknown',
          extractedAt: new Date().toISOString()
        }
      };
      
      this.log(`Successfully processed PDF with ${pdfData.numpages || 0} pages`);
      return document;
    } catch (error) {
      // Create a fallback document with error information
      this.log(`Failed to process PDF completely, creating fallback document: ${error.message}`);
      
      return {
        id: path.basename(filePath, '.pdf'),
        content: `[Error processing PDF: ${error.message}]`,
        type: 'pdf',
        path: filePath,
        metadata: {
          title: path.basename(filePath, '.pdf'),
          pageCount: 0,
          error: error.message,
          extractedAt: new Date().toISOString(),
          processingFailed: true
        }
      };
    }
  }
  
  /**
   * Extract title from PDF metadata
   * @param {Object} pdfData - Parsed PDF data
   * @returns {string|null} - Extracted title or null
   */
  extractTitle(pdfData) {
    // Safety check for pdfData
    if (!pdfData) return null;
    
    if (pdfData.info && pdfData.info.Title) {
      return pdfData.info.Title;
    }
    
    // Try to extract from first page text
    if (pdfData.text) {
      const lines = pdfData.text.split('\n').filter(line => line.trim().length > 0);
      
      if (lines.length > 0) {
        // Use first non-empty line as title
        return lines[0].trim();
      }
    }
    
    return null;
  }
  
  /**
   * Custom page renderer that preserves formatting
   * @param {Object} pageData - PDF.js page data
   * @returns {string} - Rendered page text with formatting
   */
  renderPageWithFormat(pageData) {
    if (!pageData) return ""; // Safety check
    
    let render_options = {
      normalizeWhitespace: false,
      disableCombineTextItems: false
    };
    
    try {
      let renderText = pageData.getTextContent(render_options);
      
      // Wait for the promise to resolve
      return renderText.then(function(textContent) {
        let lastY, text = '';
        
        // Safety check for textContent
        if (!textContent || !textContent.items || !Array.isArray(textContent.items)) {
          return ""; // Return empty string if no items
        }
        
        // Process each text item
        for (let item of textContent.items) {
          if (!item) continue; // Skip null items
          
          // Add newline if Y position changes significantly
          if (lastY && item.transform && Math.abs(lastY - item.transform[5]) > 5) {
            text += '\n';
          }
          
          // Add the text item if it exists
          if (item.str) {
            text += item.str;
          }
          
          // Remember the Y position if available
          if (item.transform) {
            lastY = item.transform[5];
          }
        }
        
        return text;
      })
      .catch(function(error) {
        console.error("Error rendering page:", error);
        return ""; // Return empty string on error
      });
    } catch (error) {
      console.error("Error in renderPageWithFormat:", error);
      return Promise.resolve(""); // Return empty string on error
    }
  }
  
  /**
   * Process multiple PDF files
   * @param {Array<string>} filePaths - Array of PDF file paths
   * @returns {Array<Object>} - Array of document objects
   */
  async processMultiplePDFs(filePaths) {
    this.log(`Processing ${filePaths.length} PDFs`);
    
    const documents = [];
    
    for (const filePath of filePaths) {
      try {
        const document = await this.processPDF(filePath);
        documents.push(document);
      } catch (error) {
        logger.error(`Failed to process PDF ${filePath}: ${error.message}`);
        // Continue with other PDFs
      }
    }
    
    return documents;
  }
  
  /**
   * Log messages if debug mode is enabled
   * @param {string} message - Message to log
   */
  log(message) {
    if (this.debug) {
      logger.debug(`[PDFProcessor] ${message}`);
    }
  }
}

module.exports = PDFProcessor;
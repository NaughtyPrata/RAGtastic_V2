/**
 * PDF to Image converter for sRAG system
 * Simple utility to convert PDF pages to images
 */

const fs = require('fs').promises;
const path = require('path');
const pdfjsLib = require('pdfjs-dist');
const { createCanvas } = require('canvas');

/**
 * Converts PDF pages to images
 */
class PDFToImageConverter {
  /**
   * Create a new PDFToImageConverter
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      scale: options.scale || 1.5,
      outputFormat: options.outputFormat || 'png',
      outputDir: options.outputDir || 'temp/images',
      ...options
    };
    
    this.debug = options.debug || false;
    this.log('PDFToImageConverter initialized');
    
    // Set the PDF.js worker source
    pdfjsLib.GlobalWorkerOptions.workerSrc = path.resolve(
      require.resolve('pdfjs-dist/build/pdf.worker.js')
    );
  }
  
  /**
   * Convert PDF file pages to images
   * @param {string} pdfPath - Path to the PDF file
   * @param {Object} options - Conversion options
   * @returns {Array<string>} - Array of paths to generated images
   */
  async convertToImages(pdfPath, options = {}) {
    const opts = { ...this.options, ...options };
    this.log(`Converting PDF to images: ${pdfPath}`);
    
    try {
      // Make sure output directory exists
      await this.ensureDir(opts.outputDir);
      
      // Read and load the PDF file data
      const data = await fs.readFile(pdfPath);
      const pdf = await pdfjsLib.getDocument({ data }).promise;
      
      const imagePaths = [];
      const totalPages = pdf.numPages;
      
      this.log(`PDF loaded successfully. Converting ${totalPages} pages.`);
      
      // Convert each page to an image
      for (let pageNumber = 1; pageNumber <= totalPages; pageNumber++) {
        const imagePath = await this.convertPageToImage(pdf, pageNumber, pdfPath, opts);
        imagePaths.push(imagePath);
      }
      
      return imagePaths;
    } catch (error) {
      this.log(`Error converting PDF to images: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Convert a single PDF page to an image
   * @param {Object} pdf - PDF.js document
   * @param {number} pageNumber - Page number to convert
   * @param {string} pdfPath - Original PDF path (for naming)
   * @param {Object} options - Conversion options
   * @returns {string} - Path to the generated image
   */
  async convertPageToImage(pdf, pageNumber, pdfPath, options) {
    try {
      // Get the page
      const page = await pdf.getPage(pageNumber);
      
      // Get viewport at desired scale
      const viewport = page.getViewport({ scale: options.scale });
      
      // Create canvas and context for rendering
      const canvas = createCanvas(viewport.width, viewport.height);
      const context = canvas.getContext('2d');
      
      // Set up rendering context
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };
      
      // Render the page
      await page.render(renderContext).promise;
      
      // Generate output filename
      const baseName = path.basename(pdfPath, '.pdf');
      const imagePath = path.join(
        options.outputDir, 
        `${baseName}_page_${pageNumber}.${options.outputFormat}`
      );
      
      // Write the image file
      const imageData = canvas.toBuffer(`image/${options.outputFormat}`);
      await fs.writeFile(imagePath, imageData);
      
      this.log(`Page ${pageNumber} converted and saved to ${imagePath}`);
      return imagePath;
    } catch (error) {
      this.log(`Error converting page ${pageNumber}: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Ensure directory exists, creating it if needed
   * @param {string} dir - Directory path
   */
  async ensureDir(dir) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
  
  /**
   * Log messages if debug mode is enabled
   * @param {string} message - Message to log
   */
  log(message) {
    if (this.debug) {
      console.log(`[PDFToImageConverter] ${message}`);
    }
  }
}

module.exports = PDFToImageConverter;
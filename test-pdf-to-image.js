/**
 * Test script for PDF to image conversion
 */

require('dotenv').config();
const path = require('path');
const DocumentProcessor = require('./src/documents/documentProcessor');

// Path to a test PDF document
const testPdfPath = process.argv[2];

if (!testPdfPath) {
  console.error("Usage: node test-pdf-to-image.js <path-to-pdf>");
  process.exit(1);
}

async function testPdfToImage() {
  console.log("Testing PDF to image conversion...");
  console.log(`PDF Path: ${testPdfPath}`);
  
  // Create document processor with debug mode enabled
  const documentProcessor = new DocumentProcessor({
    debug: true,
    imageOutputDir: path.join(process.cwd(), 'temp', 'images')
  });
  
  try {
    // Initialize the document processor
    await documentProcessor.initialize();
    
    // Convert PDF to images
    const imagePaths = await documentProcessor.convertPdfToImages(testPdfPath, {
      scale: 1.5, // Scale factor for the images
      outputFormat: 'png' // Output format (png, jpeg)
    });
    
    console.log("Conversion completed successfully!");
    console.log(`Generated ${imagePaths.length} images:`);
    imagePaths.forEach(imagePath => console.log(`- ${imagePath}`));
    
  } catch (error) {
    console.error("Error during conversion:", error);
  }
}

// Run the test
testPdfToImage().catch(console.error);
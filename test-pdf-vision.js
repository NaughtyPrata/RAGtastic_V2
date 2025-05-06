/**
 * Test script for PDF to image conversion with GPT-4o vision analysis
 */

require('dotenv').config();
const path = require('path');
const fs = require('fs').promises;
const DocumentProcessor = require('./src/documents/documentProcessor');

// Path to a test PDF document
const testPdfPath = process.argv[2];

if (!testPdfPath) {
  console.error("Usage: node test-pdf-vision.js <path-to-pdf>");
  process.exit(1);
}

// Create a log directory if it doesn't exist
async function ensureLogDirectory() {
  const logDir = path.join(process.cwd(), 'logs');
  try {
    await fs.mkdir(logDir, { recursive: true });
    return logDir;
  } catch (error) {
    console.error("Error creating log directory:", error.message);
    return null;
  }
}

async function testPdfVision() {
  console.log("Testing PDF to image conversion with GPT-4o vision analysis...");
  console.log(`PDF Path: ${testPdfPath}`);
  
  // Create log file
  const logDir = await ensureLogDirectory();
  const logFile = path.join(logDir, `vision-test-${Date.now()}.log`);
  
  // Basic logging function that writes to console and file
  const log = async (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    console.log(logMessage);
    try {
      await fs.appendFile(logFile, logMessage + '\n');
    } catch (error) {
      console.error("Error writing to log file:", error.message);
    }
  };
  
  await log("Starting PDF vision test");
  
  try {
    // Check if OpenAI API key is set
    if (!process.env.OPENAI_API_KEY) {
      await log("ERROR: OpenAI API key not found in .env file!");
      console.error("Please add OPENAI_API_KEY to your .env file");
      return;
    }
    
    await log("OpenAI API key found");
    
    // Create document processor with debug mode enabled
    const documentProcessor = new DocumentProcessor({
      debug: true,
      imageOutputDir: path.join(process.cwd(), 'temp', 'images'),
      saveResults: true,
      outputDir: path.join(process.cwd(), 'data', 'vision_results')
    });
    
    await log("Document processor created");
    
    // Initialize the document processor
    await documentProcessor.initialize();
    await log("Document processor initialized");
    
    // First test PDF to image conversion
    await log("Testing PDF to image conversion...");
    try {
      const imagePaths = await documentProcessor.convertPdfToImages(testPdfPath);
      await log(`PDF converted to ${imagePaths.length} images`);
      
      // Output the first image path for debugging
      if (imagePaths.length > 0) {
        await log(`First image: ${imagePaths[0]}`);
      }
    } catch (error) {
      await log(`ERROR in convertPdfToImages: ${error.message}`);
      throw error;
    }
    
    // Process PDF with vision
    await log("Processing PDF with GPT-4o vision...");
    const result = await documentProcessor.processPdfWithVision(testPdfPath, {
      // Optional custom vision prompt
      visionPrompt: "Extract all the text content from this document page. " +
                    "Preserve the structure and layout as much as possible. " +
                    "Identify headings, paragraphs, bullet points, and any tables or figures.",
      maxTokens: 1000,
      saveResults: true
    });
    
    await log("\nVision analysis completed successfully!");
    await log(`Analyzed ${result.pages.length} pages`);
    
    // Display a sample of the analysis
    await log("\n=== Sample Analysis (first page) ===");
    if (result.pages.length > 0) {
      await log(result.pages[0].analysis.substring(0, 300) + "...");
    }
    
    await log("\nSaved results to: " + result.outputPath);
    
  } catch (error) {
    await log(`ERROR during PDF vision analysis: ${error.message}`);
    console.error("Error during PDF vision analysis:", error);
  }
}

// Run the test
testPdfVision().catch(console.error);
/**
 * Test script to diagnose PDF extraction issues
 */

const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');

// File to process
const PDF_FILE = path.join(__dirname, 'documents', 'Information Security Requirements for Contractors Handling.pdf');

async function testPdfExtraction() {
  console.log(`Testing PDF extraction for: ${PDF_FILE}`);
  
  try {
    // Read the PDF file
    const dataBuffer = await fs.promises.readFile(PDF_FILE);
    
    // First try with default options
    console.log('\n--- Default Options ---');
    const defaultResult = await pdfParse(dataBuffer);
    console.log(`Page count: ${defaultResult.numpages}`);
    console.log(`Content length: ${defaultResult.text.length} characters`);
    console.log('First 200 chars of content:', defaultResult.text.substring(0, 200));
    
    // Try with custom rendering options
    console.log('\n--- With Custom Rendering ---');
    const customRenderOptions = {
      pagerender: function(pageData) {
        let render_options = {
          normalizeWhitespace: false,
          disableCombineTextItems: false
        };
        
        return pageData.getTextContent(render_options)
          .then(function(textContent) {
            let text = '';
            let lastY = null;
            
            for (const item of textContent.items) {
              if (lastY !== item.transform[5]) {
                text += '\n';
              }
              text += item.str;
              lastY = item.transform[5];
            }
            
            return text;
          });
      }
    };
    
    const customResult = await pdfParse(dataBuffer, customRenderOptions);
    console.log(`Custom page count: ${customResult.numpages}`);
    console.log(`Custom content length: ${customResult.text.length} characters`);
    console.log('First 200 chars of custom content:', customResult.text.substring(0, 200));
    
    // Print PDF metadata
    console.log('\n--- PDF Metadata ---');
    console.log(JSON.stringify(customResult.info, null, 2));
    
  } catch (error) {
    console.error('Error processing PDF:', error);
  }
}

// Run the test
testPdfExtraction();

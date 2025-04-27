/**
 * Test PDF preprocessing without RAG query
 */

const axios = require('axios');

async function testPreprocess() {
  try {
    console.log('Processing Prompt-Engineering.pdf document...');
    
    const response = await axios.post('http://localhost:3002/api/documents/preprocess', {
      documents: ['Prompt-Engineering.pdf'],
      options: {
        chunkSize: 500,
        chunkOverlap: 100,
        chunkingStrategy: 'hybrid',
        extractMetadata: true
      }
    }, {
      timeout: 30000
    });
    
    console.log('Processing response:', response.data);
    
    if (response.data.success) {
      console.log('\nSuccessfully processed the document!');
      console.log(`Generated ${response.data.totalChunks} chunks from the document.`);
      
      // List the created chunk files
      const fs = require('fs');
      const path = require('path');
      
      const chunksDir = path.join(__dirname, 'data', 'chunks');
      const docDirs = fs.readdirSync(chunksDir);
      console.log('\nGenerated chunk directories:');
      
      for (const dir of docDirs) {
        console.log(`- ${dir}`);
        
        // Count files in the directory
        const dirPath = path.join(chunksDir, dir);
        if (fs.statSync(dirPath).isDirectory()) {
          const files = fs.readdirSync(dirPath);
          console.log(`  Contains ${files.length} chunk files`);
          
          // Print first file for inspection
          if (files.length > 0) {
            const firstChunk = JSON.parse(fs.readFileSync(path.join(dirPath, files[0]), 'utf8'));
            console.log('  First chunk preview:');
            console.log(`  ID: ${firstChunk.id}`);
            console.log(`  Document ID: ${firstChunk.documentId}`);
            console.log(`  Index: ${firstChunk.index}`);
            console.log(`  Content length: ${firstChunk.content.length} characters`);
            console.log(`  Content preview: ${firstChunk.content.substring(0, 100)}...`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testPreprocess();
/**
 * Test RAG functionality without external API
 */

const fs = require('fs');
const path = require('path');

/**
 * Simple function to find the most relevant chunk for a query
 * @param {string} query - User query
 * @returns {Object} - Best matching chunk
 */
async function findRelevantChunk(query) {
  try {
    // Find the chunk directory
    const chunksDir = path.join(__dirname, 'data', 'chunks');
    const docDirs = fs.readdirSync(chunksDir).filter(dir => 
      !dir.startsWith('.') && fs.statSync(path.join(chunksDir, dir)).isDirectory()
    );
    
    if (docDirs.length === 0) {
      console.error('No document directories found');
      return null;
    }
    
    console.log(`Found document directories: ${docDirs.join(', ')}`);
    
    // Get chunks from the first document directory
    const docDir = docDirs[0];
    const chunksPath = path.join(chunksDir, docDir);
    const chunkFiles = fs.readdirSync(chunksPath).filter(file => file.endsWith('.json'));
    
    console.log(`Found ${chunkFiles.length} chunk files in ${docDir}`);
    
    if (chunkFiles.length === 0) {
      console.error('No chunk files found');
      return null;
    }
    
    // Simple keyword matching for finding relevant chunks
    // In a real system, this would use embeddings and vector similarity
    const queryWords = query.toLowerCase().split(/\W+/).filter(word => word.length > 3);
    const queryRegex = new RegExp(queryWords.join('|'), 'i');
    
    console.log(`Searching for keywords: ${queryWords.join(', ')}`);
    
    // Find chunks that contain the query keywords
    const matchingChunks = [];
    
    for (const chunkFile of chunkFiles) {
      const chunkPath = path.join(chunksPath, chunkFile);
      const chunkData = JSON.parse(fs.readFileSync(chunkPath, 'utf8'));
      
      const content = chunkData.content || '';
      const matchScore = content.split(queryRegex).length - 1;
      
      if (matchScore > 0) {
        matchingChunks.push({
          chunk: chunkData,
          score: matchScore
        });
      }
    }
    
    // Sort by score
    matchingChunks.sort((a, b) => b.score - a.score);
    
    console.log(`Found ${matchingChunks.length} matching chunks`);
    
    // Return the top matching chunk
    return matchingChunks.length > 0 ? matchingChunks[0].chunk : null;
  } catch (error) {
    console.error('Error finding relevant chunks:', error);
    return null;
  }
}

/**
 * Main test function
 */
async function testRAG() {
  try {
    const query = "What is zero-shot prompting?";
    console.log(`Testing RAG with query: "${query}"`);
    
    // Find relevant chunk
    const relevantChunk = await findRelevantChunk(query);
    
    if (relevantChunk) {
      console.log('\nMost relevant chunk:');
      console.log(`ID: ${relevantChunk.id}`);
      console.log(`Content: ${relevantChunk.content.substring(0, 300)}...`);
      
      // In a real system, the chunk would be sent to an LLM for answer generation
      console.log('\nSimulated RAG response:');
      console.log('Based on the relevant chunk, here would be the LLM-generated answer.');
      console.log('The RAG system would use the content of the chunk to generate a specific answer to the query.');
    } else {
      console.log('No relevant chunks found for the query.');
    }
  } catch (error) {
    console.error('Error in RAG test:', error);
  }
}

// Run the test
testRAG();
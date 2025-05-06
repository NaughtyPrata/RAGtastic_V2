/**
 * Test script to specifically query chapter 3 content
 */

require('dotenv').config();
const path = require('path');

// Query for chapter 3
const query = "What is chapter 3 all about?";

async function testChapterQuery() {
  console.log("=== Testing Chapter 3 Query ===");
  console.log(`Query: "${query}"`);
  
  try {
    // Direct search in chunk files
    console.log("Searching for chapter 3 in chunk files...");
    
    // Search in the Prompt-Engineering directory
    const chunksDir = path.join(process.cwd(), 'data', 'chunks', 'Prompt-Engineering');
    const fs = require('fs').promises;
    
    // Get all chunk files
    const files = await fs.readdir(chunksDir);
    
    // Filter for files containing chapter 3
    const chapterContent = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(chunksDir, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const chunkData = JSON.parse(content);
        
        // Check if the content contains system, contextual and role prompting
        if (chunkData.content.toLowerCase().includes('system, contextual and role prompting') ||
            chunkData.content.toLowerCase().includes('system prompting') ||
            chunkData.content.toLowerCase().includes('role prompting')) {
          console.log(`Found system prompting content in file: ${file}`);
          console.log(`Excerpt: ${chunkData.content.substring(0, 100)}`);
          chapterContent.push(chunkData.content);
        }
      }
    }
    
    // Combine all found content
    const combinedContent = chapterContent.join('\n\n');
    
    console.log(`Found ${chapterContent.length} chunks containing chapter 3`);
    
    // Display context excerpt
    if (combinedContent && combinedContent.length > 0) {
      console.log("\nContext excerpt:");
      console.log(combinedContent.substring(0, 500) + "...");
    } else {
      console.log("No chapter 3 content found");
    }
    
    console.log("\nChapter query test completed successfully!");
    
  } catch (error) {
    console.error("ERROR:", error.message);
    console.error("Error during chapter query test:", error);
  }
}

// Run the test
testChapterQuery().catch(console.error);
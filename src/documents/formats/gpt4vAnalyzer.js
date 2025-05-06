/**
 * GPT-4V Analyzer for sRAG system
 * Uses OpenAI's GPT-4V to analyze PDF images
 */

const fs = require('fs').promises;
const axios = require('axios');
const path = require('path');

/**
 * Analyzes PDF images using GPT-4V
 */
class GPT4VAnalyzer {
  /**
   * Create a new GPT4VAnalyzer
   * @param {Object} options - Configuration options
   */
  constructor(options = {}) {
    this.options = {
      apiKey: options.apiKey || process.env.OPENAI_API_KEY,
      model: options.model || 'gpt-4-vision-preview',
      maxTokens: options.maxTokens || 500,
      temperature: options.temperature || 0.3,
      ...options
    };
    
    if (!this.options.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    
    this.debug = options.debug || false;
    this.log('GPT4VAnalyzer initialized');
  }
  
  /**
   * Analyze a PDF image using GPT-4V
   * @param {string} imagePath - Path to the image file
   * @param {Object} options - Analysis options
   * @returns {Object} - Analysis result
   */
  async analyzeImage(imagePath, options = {}) {
    const opts = { ...this.options, ...options };
    this.log(`Analyzing image with GPT-4V: ${imagePath}`);
    
    try {
      // Read the image file and convert to base64
      const imageBuffer = await fs.readFile(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      // Prepare the request
      const
# sRAG - Simple RAG System with PDF Vision & FAISS

A complete RAG (Retrieval Augmented Generation) system with PDF-to-image conversion, GPT-4o vision analysis, and FAISS vector search.

## Overview

This project implements a full RAG system with the following components:

1. **PDF Processing**: Convert PDFs to images for better accuracy
2. **Vision Analysis**: Analyze PDF images using GPT-4o vision
3. **FAISS Vector Database**: Efficient semantic search for document retrieval
4. **Retrieval Agent**: Smart document retrieval combining semantic and keyword search
5. **UI**: Clean, retro-inspired user interface for interacting with the system

## Features

- **PDF-to-Image Conversion**: Convert PDFs to high-quality images for detailed analysis
- **GPT-4o Vision Analysis**: Extract text and understand document structure with AI vision
- **FAISS Vector Search**: Fast and efficient semantic search using FAISS
- **Hybrid Retrieval**: Combines vector search with traditional keyword-based approaches
- **API Endpoints**: Full REST API for document processing and queries
- **UI**: Retro-inspired interface with chat-like interaction
- **Extensible Architecture**: Modular design for easy customization

## Getting Started

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with your OpenAI API key:

```
OPENAI_API_KEY=your-api-key-here
```

4. Start the server:

```bash
npm start
```

5. Start the UI:

```bash
./start_ui.sh
```

## Processing Documents

To process a PDF document:

```bash
node test-faiss-integration.js path/to/your/document.pdf
```

## Testing the RAG System

Test the complete retrieval pipeline:

```bash
node test-retrieval-agent.js path/to/your/document.pdf "Your query here"
```

## UI Structure

The interface consists of three main panels:

1. **Left Panel**: Document selection and query controls
2. **Center Panel**: Conversation display and input field
3. **Right Panel**: System monitor with statistics
4. **Modal**: Agent network visualization (accessible via button)

## Technologies Used

- Vanilla JavaScript for UI interactions
- CSS for styling with a modular approach
- GSAP for animations
- SVG for agent network visualization

## File Organization

- **css/**: Modular CSS files
  - **components/**: Component-specific styles
  - **base.css**: Base styling elements
  - **theme.css**: Color variables and theme definitions
  - **layout.css**: Layout structure
  - **scanlines.css**: CRT-style effects
  - **agent-modal.css**: Modal-specific styling
  
- **js/**: JavaScript files
  - **app.js**: Main application logic
  - **api.js**: Mock API functions
  - **agent-modal.js**: Agent network visualization
  - **select-enhancer.js**: Enhanced select input

- **images/**: Contains the logo and icons

## System Architecture

The system is composed of several key components:

### Document Processing Pipeline

1. **PDF Processor**: Converts PDFs to images using PDF.js
2. **Vision Analyzer**: Processes images with GPT-4o vision API
3. **Document Processor**: Handles chunking and metadata extraction

### Vector Database

1. **FAISS Provider**: Core vector search implementation
2. **Vector Manager**: Manages index creation and updates
3. **Embedding Provider**: Generates embeddings using OpenAI API

### Retrieval System

1. **Retriever Agent**: Coordinates search across sources
2. **FAISS Retriever**: Specialized retrieval from vector database
3. **Hybrid Search**: Combines multiple retrieval methods

## API Endpoints

The system exposes several REST API endpoints:

- `POST /api/vectordb/process-vision`: Process vision results into FAISS
- `POST /api/vectordb/search`: Search the vector database
- `GET /api/vectordb/stats`: Get vector database statistics
- `DELETE /api/vectordb/documents`: Delete documents from the database

## Customization

The system is designed to be highly customizable:

1. **Chunking Strategies**: Adjust chunking parameters in DocumentProcessor
2. **Vector Search**: Configure FAISS parameters in FaissProvider
3. **Embedding Models**: Change embedding models in OpenAIEmbeddingProvider
4. **UI Appearance**: Modify CSS variables in theme.css

## Requirements

- Node.js 14+
- OpenAI API key
- At least 4GB RAM for FAISS operations

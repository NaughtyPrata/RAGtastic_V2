# FAISS Integration Guide

This document provides an overview of the FAISS vector database integration in our sRAG system.

## Overview

The sRAG system now uses Facebook AI Similarity Search (FAISS) for efficient vector similarity search. This allows for faster and more accurate document retrieval based on semantic similarity.

## Components

The FAISS integration consists of several key components:

1. **FaissProvider** - The core FAISS database provider class handling index creation, document addition, deletion, and search operations.
2. **FaissRetriever** - Retriever agent that uses FAISS for semantic search during the RAG process.
3. **OpenAIEmbeddingProvider** - Generates embeddings using OpenAI's text embedding models.
4. **VectorDatabaseManager** - Manages vector database operations and providers, allowing for swappable backends.

## Usage

To use the FAISS retriever in your RAG pipeline:

```javascript
const FaissRetriever = require('./src/agents/retrievers/faissRetriever');

const retriever = new FaissRetriever({
  vectorDbDir: './data/vectordb',
  embeddingModel: 'text-embedding-3-small',
  numResults: 5,
  debug: true
});

// Initialize the retriever
await retriever.initialize();

// Retrieve context for a query
const results = await retriever.retrieveContext("What is the main topic of this document?");
```

## Test Scripts

Two test scripts are provided to verify the FAISS integration:

1. `test-faiss-integration.js` - Tests the full pipeline from PDF to image to GPT-4o vision to FAISS vector DB.
2. `test-faiss-query.js` - Tests querying the FAISS database with a simple query.

Run them with:

```bash
node test-faiss-integration.js path/to/pdf
node test-faiss-query.js "Your query here"
```

## Performance Considerations

FAISS provides efficient similarity search even for large document collections. However, consider the following:

- The default L2 distance metric is used. Other metrics like cosine similarity may be more appropriate for certain use cases.
- Index size grows with the number of documents. Periodically pruning or rebuilding the index may be necessary.
- The `similarityThreshold` parameter can be adjusted to control the relevance of returned results.

## Future Improvements

- Implement FAISS index serialization/deserialization to avoid rebuilding the index on each start.
- Support for different FAISS index types (IVF, HNSW, etc.) for larger datasets.
- Add benchmarking tools to compare performance with other vector database providers.

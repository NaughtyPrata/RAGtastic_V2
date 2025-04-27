/**
 * API functions for sRAG system
 * Fallout Vault-Tec themed RAG implementation
 */

// API class
class RAGAPI {
    constructor() {
        this.isProcessing = false;
        this.baseUrl = 'http://localhost:3002/api';
    }

    /**
     * Test API connection
     * @returns {Promise<Object>} Connection status
     */
    async testConnection() {
        try {
            const response = await fetch(`${this.baseUrl}/documents`);
            return { status: "connected" };
        } catch (error) {
            console.error('Connection error:', error);
            return { status: "error", message: error.message };
        }
    }

    /**
     * List available documents
     * @returns {Promise<Array<string>>} List of document names
     */
    async listDocuments() {
        try {
            const response = await fetch(`${this.baseUrl}/documents`);
            
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Failed to list documents');
            }
            
            return data.documents || [];
        } catch (error) {
            console.error('Error listing documents:', error);
            throw error;
        }
    }

    /**
     * Submit a query to the RAG system
     * @param {string} question - User question
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Query response
     */
    async query(question, options = {}) {
        try {
            const response = await fetch(`${this.baseUrl}/retriever/query`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: question,
                    options: options
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error querying:', error);
            throw error;
        }
    }

    /**
     * Get a direct answer from the RAG system
     * @param {string} question - User question
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Answer response
     */
    async getAnswer(question, options = {}) {
        return this.query(question, { 
            ...options, 
            responseType: 'answer'
        });
    }

    /**
     * Get only sources from the RAG system
     * @param {string} question - User question
     * @param {number} k - Number of sources to return
     * @param {Object} options - Query options
     * @returns {Promise<Object>} Sources response
     */
    async getSources(question, k = 4, options = {}) {
        return this.query(question, {
            ...options,
            responseType: 'sources',
            numResults: k
        });
    }

    /**
     * Preprocess documents for RAG
     * @param {Array<string>} documents - Document names to preprocess
     * @param {Object} options - Preprocessing options
     * @returns {Promise<Object>} Preprocessing response
     */
    async preprocessDocuments(documents = [], options = {}) {
        try {
            console.log('Preprocessing documents:', documents);
            
            const response = await fetch(`${this.baseUrl}/documents/preprocess`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    documents: documents,
                    options: options
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Server response error:', response.status, errorText);
                throw new Error(`HTTP error: ${response.status} - ${errorText}`);
            }
            
            const result = await response.json();
            console.log('Preprocessing result:', result);
            return result;
        } catch (error) {
            console.error('Error preprocessing documents:', error);
            throw error;
        }
    }

    /**
     * Reset the system
     * @returns {Promise<Object>} Reset response
     */
    async reset() {
        return { status: "reset" };
    }
}

// Create global API instance
const api = new RAGAPI();
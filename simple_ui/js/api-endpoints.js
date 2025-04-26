/**
 * API Endpoints for the RAGtastic Application
 * Handles all API requests to the backend
 */

class ApiEndpoints {
    constructor(baseUrl = '') {
        this.baseUrl = baseUrl || window.location.origin;
        this.endpoints = {
            // Document endpoints
            listDocuments: `${this.baseUrl}/api/documents`,
            preprocessDocument: `${this.baseUrl}/api/documents/preprocess`,
            
            // Query endpoints
            query: `${this.baseUrl}/api/query`,
            answer: `${this.baseUrl}/api/answer`,
            sources: `${this.baseUrl}/api/sources`,
            
            // Agent network endpoints
            agentNetwork: `${this.baseUrl}/api/agents/network`,
            agentStatus: `${this.baseUrl}/api/agents/status`,
        };
    }
    
    /**
     * Get all available documents
     * @returns {Promise} Promise with the list of documents
     */
    async getDocuments() {
        try {
            const response = await fetch(this.endpoints.listDocuments);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching documents:', error);
            throw error;
        }
    }
    
    /**
     * Preprocess selected documents for RAG
     * @param {Array} documentIds Array of document IDs to preprocess
     * @returns {Promise} Promise with the preprocessing result
     */
    async preprocessDocuments(documentIds) {
        try {
            const response = await fetch(this.endpoints.preprocessDocument, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ documentIds }),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error preprocessing documents:', error);
            throw error;
        }
    }
    
    /**
     * Submit a query to the RAG system
     * @param {Object} queryData Query data object
     * @param {string} queryData.query The user's query text
     * @param {Array} queryData.documentIds Array of document IDs to query against
     * @param {string} queryData.queryType Type of query (query, answer, sources)
     * @param {number} queryData.sourcesCount Number of sources to return
     * @returns {Promise} Promise with the query result
     */
    async submitQuery(queryData) {
        try {
            let endpoint = this.endpoints.query;
            
            // Select the appropriate endpoint based on query type
            if (queryData.queryType === 'answer') {
                endpoint = this.endpoints.answer;
            } else if (queryData.queryType === 'sources') {
                endpoint = this.endpoints.sources;
            }
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(queryData),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error submitting query:', error);
            throw error;
        }
    }
    
    /**
     * Get the current agent network status
     * @returns {Promise} Promise with the agent network status
     */
    async getAgentNetworkStatus() {
        try {
            const response = await fetch(this.endpoints.agentNetwork);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error fetching agent network status:', error);
            // For demo, return mocked data if API fails
            return this.getMockedAgentNetwork();
        }
    }
    
    /**
     * Get mocked agent network data for demonstration
     * @returns {Object} Mocked agent network data
     */
    getMockedAgentNetwork() {
        return {
            agents: {
                orchestrator: { active: true, status: 'operational' },
                retriever: { active: true, status: 'operational' },
                synthesizer: { active: true, status: 'operational' },
                critic: { active: true, status: 'operational' },
                adapter: { active: true, status: 'operational' },
                presenter: { active: true, status: 'operational' },
                coder: { active: false, status: 'standby' }
            },
            connections: [
                { from: 'orchestrator', to: 'retriever' },
                { from: 'orchestrator', to: 'synthesizer' },
                { from: 'orchestrator', to: 'critic' },
                { from: 'orchestrator', to: 'adapter' },
                { from: 'orchestrator', to: 'presenter' },
                { from: 'retriever', to: 'synthesizer' },
                { from: 'synthesizer', to: 'critic' },
                { from: 'critic', to: 'synthesizer' },
                { from: 'critic', to: 'adapter' },
                { from: 'adapter', to: 'presenter' }
            ],
            systemLoad: 85,
            lastUpdated: new Date().toISOString()
        };
    }
    
    /**
     * Update the status of a specific agent
     * @param {string} agentId The ID of the agent
     * @param {Object} statusData The new status data
     * @returns {Promise} Promise with the update result
     */
    async updateAgentStatus(agentId, statusData) {
        try {
            const response = await fetch(`${this.endpoints.agentStatus}/${agentId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(statusData),
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`Error updating agent ${agentId} status:`, error);
            throw error;
        }
    }
}

// Create a global instance of the API endpoints
window.api = new ApiEndpoints();

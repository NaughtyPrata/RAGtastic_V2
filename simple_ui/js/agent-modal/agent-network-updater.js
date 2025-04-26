/**
 * Agent Network Updater
 * Handles updating the agent network visualization with real-time data
 */

class AgentNetworkUpdater {
    constructor(updateInterval = 5000) {
        this.updateInterval = updateInterval;
        this.isPolling = false;
        this.pollingTimer = null;
        
        // Initialize event listeners for query
        this.initEventListeners();
    }
    
    /**
     * Initialize event listeners
     */
    initEventListeners() {
        // Listen for query submission
        const submitButton = document.getElementById('submit-query');
        if (submitButton) {
            submitButton.addEventListener('click', () => this.handleQuerySubmission());
        }
        
        // Listen for Enter key in query input
        const queryInput = document.getElementById('query-input');
        if (queryInput) {
            queryInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.handleQuerySubmission();
                }
            });
        }
    }
    
    /**
     * Handle query submission
     */
    handleQuerySubmission() {
        // Start polling for agent updates
        this.startPolling();
        
        // Activate orchestrator immediately
        if (window.agentNetwork) {
            window.agentNetwork.updateAgentStatus('orchestrator', true);
            
            // Orchestrator activates connections to all agents in sequence
            setTimeout(() => {
                // Activate connection to retriever
                window.agentNetwork.addActiveConnection('orchestrator', 'retriever');
                document.querySelectorAll(`.station-dot[data-agent="retriever"]`).forEach(dot => {
                    dot.classList.add('active');
                });
            }, 1000);
            
            // Activate connection to synthesizer
            setTimeout(() => {
                window.agentNetwork.addActiveConnection('orchestrator', 'synthesizer');
                document.querySelectorAll(`.station-dot[data-agent="synthesizer"]`).forEach(dot => {
                    dot.classList.add('active');
                });
            }, 2000);
            
            // Activate connection to critic
            setTimeout(() => {
                window.agentNetwork.addActiveConnection('orchestrator', 'critic');
                document.querySelectorAll(`.station-dot[data-agent="critic"]`).forEach(dot => {
                    dot.classList.add('active');
                });
            }, 3000);
            
            // Activate connection to adapter
            setTimeout(() => {
                window.agentNetwork.addActiveConnection('orchestrator', 'adapter');
                document.querySelectorAll(`.station-dot[data-agent="adapter"]`).forEach(dot => {
                    dot.classList.add('active');
                });
            }, 4000);
            
            // Activate connection to presenter
            setTimeout(() => {
                window.agentNetwork.addActiveConnection('orchestrator', 'presenter');
                document.querySelectorAll(`.station-dot[data-agent="presenter"]`).forEach(dot => {
                    dot.classList.add('active');
                });
            }, 5000);
            
            // Activate connection to coder if code is mentioned
            const queryInput = document.getElementById('query-input');
            if (queryInput && queryInput.value) {
                const codeKeywords = ['code', 'function', 'script', 'program', 'javascript', 'python', 'html', 'css'];
                const hasCodeKeyword = codeKeywords.some(keyword => 
                    queryInput.value.toLowerCase().includes(keyword)
                );
                
                if (hasCodeKeyword) {
                    setTimeout(() => {
                        window.agentNetwork.addActiveConnection('orchestrator', 'coder');
                        document.querySelectorAll(`.station-dot[data-agent="coder"]`).forEach(dot => {
                            dot.classList.add('active');
                        });
                    }, 6000);
                }
            }
            }
        }
    }
    
    /**
     * Start polling for agent network updates
     */
    startPolling() {
        if (this.isPolling) return;
        
        this.isPolling = true;
        this.pollAgentNetwork();
    }
    
    /**
     * Stop polling for agent network updates
     */
    stopPolling() {
        this.isPolling = false;
        if (this.pollingTimer) {
            clearTimeout(this.pollingTimer);
            this.pollingTimer = null;
        }
    }
    
    /**
     * Poll the server for agent network updates
     */
    async pollAgentNetwork() {
        if (!this.isPolling) return;
        
        try {
            // In a real implementation, this would get data from the server
            // For demo purposes, we're using the existing visualization timing
            
            // If API endpoint is available, use it
            if (window.api) {
                const networkData = await window.api.getAgentNetworkStatus();
                
                if (window.agentNetwork) {
                    window.agentNetwork.updateFromServer(networkData);
                }
            }
        } catch (error) {
            console.error('Error polling agent network:', error);
        } finally {
            // Schedule next poll
            this.pollingTimer = setTimeout(() => this.pollAgentNetwork(), this.updateInterval);
        }
    }
    
    /**
     * Reset the agent network visualization
     */
    resetNetwork() {
        if (window.agentNetwork) {
            // Reset all agents to inactive
            Object.keys(window.agentNetwork.agents).forEach(agentId => {
                window.agentNetwork.updateAgentStatus(agentId, false);
            });
            
            // Clear all active connections
            window.agentNetwork.activeConnections.forEach(connectionIndex => {
                const connection = window.agentNetwork.connections[connectionIndex];
                window.agentNetwork.removeActiveConnection(connection.from, connection.to);
            });
        }
    }
}

// Initialize the agent network updater when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.agentNetworkUpdater = new AgentNetworkUpdater();
});

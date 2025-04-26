/**
 * Agent Network Updater for Metro-Style Visualization
 * Handles updating the metro visualizer with real-time data
 */

class MetroNetworkUpdater {
    constructor(updateInterval = 5000) {
        this.updateInterval = updateInterval;
        this.isPolling = false;
        this.pollingTimer = null;
        
        // Agent API status - which agents have working API keys
        this.workingAPIAgents = ['orchestrator', 'retriever', 'synthesizer', 'critic'];
        
        // Initialize event listeners for query submission
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
        
        // If the metro visualizer exists and is initialized, trigger the animation
        if (window.metroVisualizer) {
            // Update the working API agents list
            window.metroVisualizer.workingAPIAgents = this.workingAPIAgents;
            
            if (window.metroVisualizer.initialized) {
                window.metroVisualizer.reset();
                window.metroVisualizer.simulateQuery();
            } else {
                // If not initialized, show the visualizer then trigger animation
                window.metroVisualizer.toggleModal(true);
                setTimeout(() => {
                    window.metroVisualizer.simulateQuery();
                }, 1500);
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
            // For demo purposes, we're using the visualizer's built-in simulation
            
            // If API endpoint is available, use it
            if (window.api) {
                try {
                    const networkData = await window.api.getAgentNetworkStatus();
                    
                    if (window.metroVisualizer && networkData) {
                        // Update API status if provided by the server
                        if (networkData.apiStatus) {
                            this.workingAPIAgents = networkData.apiStatus.workingAgents || this.workingAPIAgents;
                            window.metroVisualizer.workingAPIAgents = this.workingAPIAgents;
                        }
                        
                        // Apply the network state from the server
                        this.applyNetworkState(networkData);
                    }
                } catch (error) {
                    console.error('Error getting agent network status:', error);
                    
                    // Fallback to simulation if API fails
                    if (window.metroVisualizer) {
                        window.metroVisualizer.simulateQuery();
                    }
                }
            } else {
                // No API available, use simulation
                if (window.metroVisualizer) {
                    window.metroVisualizer.simulateQuery();
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
     * Apply network state from the server to the metro visualizer
     */
    applyNetworkState(networkData) {
        if (!window.metroVisualizer || !networkData) return;
        
        // Reset first
        window.metroVisualizer.reset();
        
        // Update working API agents
        if (networkData.apiStatus && networkData.apiStatus.workingAgents) {
            const workingAgents = networkData.apiStatus.workingAgents;
            // Update both the visualizer and local copy
            window.metroVisualizer.workingAPIAgents = workingAgents;
            this.workingAPIAgents = workingAgents;
            
            // Update the display of agents with working APIs
            workingAgents.forEach(agentType => {
                const station = window.metroVisualizer.stations.find(s => s.type === agentType);
                if (station) {
                    const stationEl = window.metroVisualizer.metroContainer.querySelector(`.metro-station[data-id="${station.id}"]`);
                    if (stationEl) {
                        stationEl.classList.add('api-working');
                    }
                }
            });
        }
        
        // Update agent states
        if (networkData.agents) {
            for (const [agentType, status] of Object.entries(networkData.agents)) {
                window.metroVisualizer.updateStationStatus(agentType, status.active);
            }
        }
        
        // Update connections
        if (networkData.connections) {
            for (const connection of networkData.connections) {
                if (connection.active) {
                    window.metroVisualizer.activateConnection(connection.from, connection.to);
                } else {
                    window.metroVisualizer.deactivateConnection(connection.from, connection.to);
                }
            }
        }
    }
    
    /**
     * Set which agents have working API keys
     */
    setWorkingAPIAgents(agentTypes) {
        this.workingAPIAgents = agentTypes;
        
        // Update the visualizer if it exists
        if (window.metroVisualizer) {
            window.metroVisualizer.workingAPIAgents = agentTypes;
            
            // If initialized, update the display
            if (window.metroVisualizer.initialized) {
                // Remove api-working class from all agents
                const stations = window.metroVisualizer.metroContainer.querySelectorAll('.metro-station');
                stations.forEach(station => {
                    station.classList.remove('api-working');
                });
                
                // Add api-working class to agents with working API
                agentTypes.forEach(agentType => {
                    const station = window.metroVisualizer.stations.find(s => s.type === agentType);
                    if (station) {
                        const stationEl = window.metroVisualizer.metroContainer.querySelector(`.metro-station[data-id="${station.id}"]`);
                        if (stationEl) {
                            stationEl.classList.add('api-working');
                        }
                    }
                });
            }
        }
    }
    
    /**
     * Reset the agent network visualization
     */
    resetNetwork() {
        if (window.metroVisualizer) {
            window.metroVisualizer.reset();
        }
    }
}

// Initialize the metro network updater when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.metroNetworkUpdater = new MetroNetworkUpdater();
});
/**
 * Agent Network Visualization
 * A metro train style visualization of LLM agents interacting in the system
 */

class AgentNetworkModal {
    constructor() {
        this.agents = {
            orchestrator: { name: 'Orchestrator Agent', class: 'orchestrator', active: false, x: 50, y: 50 },
            retriever: { name: 'Retriever Agent', class: 'retriever', active: false, x: 20, y: 35 },
            synthesizer: { name: 'Synthesizer Agent', class: 'synthesizer', active: false, x: 20, y: 65 },
            critic: { name: 'Critic Agent', class: 'critic', active: false, x: 50, y: 80 },
            adapter: { name: 'Persona Adapter', class: 'adapter', active: false, x: 80, y: 65 },
            presenter: { name: 'Presentation Agent', class: 'presenter', active: false, x: 80, y: 35 },
            coder: { name: 'Code Agent', class: 'coder', active: false, x: 50, y: 20 }
        };
        
        this.connections = [
            { from: 'orchestrator', to: 'retriever', feedback: false },
            { from: 'orchestrator', to: 'synthesizer', feedback: false },
            { from: 'orchestrator', to: 'critic', feedback: false },
            { from: 'orchestrator', to: 'adapter', feedback: false },
            { from: 'orchestrator', to: 'presenter', feedback: false },
            { from: 'orchestrator', to: 'coder', feedback: false }
        ];
        
        this.activeConnections = [];
        this.initModal();
        this.createToggleButton();
        this.mockActiveStates();
    }
    
    /**
     * Initialize the modal DOM elements
     */
    initModal() {
        // Create the modal container
        this.modalContainer = document.createElement('div');
        this.modalContainer.className = 'agent-network-modal';
        
        // Create modal content
        this.modalContent = document.createElement('div');
        this.modalContent.className = 'agent-network-content';
        this.modalContainer.appendChild(this.modalContent);
        
        // Create modal header
        const header = document.createElement('div');
        header.className = 'agent-network-header';
        
        const title = document.createElement('div');
        title.className = 'agent-network-title';
        title.textContent = 'LLM AGENT NETWORK STATUS';
        header.appendChild(title);
        
        const closeBtn = document.createElement('button');
        closeBtn.className = 'agent-network-close';
        closeBtn.innerHTML = '×';
        closeBtn.addEventListener('click', () => this.toggleModal(false));
        header.appendChild(closeBtn);
        
        this.modalContent.appendChild(header);
        
        // Create the metro map container
        this.mapContainer = document.createElement('div');
        this.mapContainer.className = 'agent-network-body';
        
        this.metroMap = document.createElement('div');
        this.metroMap.className = 'metro-map';
        
        // Add map overlay
        const mapOverlay = document.createElement('div');
        mapOverlay.className = 'map-overlay';
        mapOverlay.textContent = 'VAULT-TEC LLM AGENT NETWORK';
        this.metroMap.appendChild(mapOverlay);
        
        // Create loading indicator
        this.loadingIndicator = document.createElement('div');
        this.loadingIndicator.className = 'loading-indicator';
        
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        this.loadingIndicator.appendChild(spinner);
        
        const loadingText = document.createElement('div');
        loadingText.textContent = 'Initializing Network...';
        this.loadingIndicator.appendChild(loadingText);
        
        this.metroMap.appendChild(this.loadingIndicator);
        
        // Create info panel
        this.infoPanel = document.createElement('div');
        this.infoPanel.className = 'info-panel';
        
        const infoPanelHeader = document.createElement('div');
        infoPanelHeader.className = 'info-panel-header';
        infoPanelHeader.textContent = 'AGENT STATUS';
        this.infoPanel.appendChild(infoPanelHeader);
        
        this.infoContent = document.createElement('div');
        this.infoContent.className = 'info-content';
        this.infoContent.innerHTML = 'Select an agent node to view details';
        this.infoPanel.appendChild(this.infoContent);
        
        const infoStats = document.createElement('div');
        infoStats.className = 'info-stats';
        
        // Active Agents stat
        const activeStat = document.createElement('div');
        activeStat.className = 'info-stat';
        
        const activeLabel = document.createElement('div');
        activeLabel.className = 'stat-label';
        activeLabel.textContent = 'ACTIVE AGENTS';
        activeStat.appendChild(activeLabel);
        
        this.activeValue = document.createElement('div');
        this.activeValue.className = 'stat-value';
        this.activeValue.textContent = '0/7';
        activeStat.appendChild(this.activeValue);
        
        infoStats.appendChild(activeStat);
        
        // Connections stat
        const connectionStat = document.createElement('div');
        connectionStat.className = 'info-stat';
        
        const connectionLabel = document.createElement('div');
        connectionLabel.className = 'stat-label';
        connectionLabel.textContent = 'ACTIVE CONNECTIONS';
        connectionStat.appendChild(connectionLabel);
        
        this.connectionValue = document.createElement('div');
        this.connectionValue.className = 'stat-value';
        this.connectionValue.textContent = '0/13';
        connectionStat.appendChild(this.connectionValue);
        
        infoStats.appendChild(connectionStat);
        
        // System load stat
        const loadStat = document.createElement('div');
        loadStat.className = 'info-stat';
        
        const loadLabel = document.createElement('div');
        loadLabel.className = 'stat-label';
        loadLabel.textContent = 'SYSTEM LOAD';
        loadStat.appendChild(loadLabel);
        
        this.loadValue = document.createElement('div');
        this.loadValue.className = 'stat-value';
        this.loadValue.textContent = '0%';
        loadStat.appendChild(this.loadValue);
        
        infoStats.appendChild(loadStat);
        
        this.infoPanel.appendChild(infoStats);
        this.metroMap.appendChild(this.infoPanel);
        
        this.mapContainer.appendChild(this.metroMap);
        this.modalContent.appendChild(this.mapContainer);
        
        // Add the modal to the DOM
        document.body.appendChild(this.modalContainer);
        
        // Create agent nodes and connections
        this.createAgentNodes();
        this.createConnectionLines();
        
        // Hide loading after a delay
        setTimeout(() => {
            this.loadingIndicator.style.display = 'none';
            this.updateStats();
        }, 1500);
    }
    
    /**
     * Create the agent nodes in the metro map
     */
    createAgentNodes() {
        for (const [id, agent] of Object.entries(this.agents)) {
            const node = document.createElement('div');
            node.className = `agent-node ${agent.class}`;
            node.style.left = `${agent.x}%`;
            node.style.top = `${agent.y}%`;
            
            const title = document.createElement('div');
            title.className = 'node-title';
            title.textContent = agent.name;
            node.appendChild(title);
            
            const status = document.createElement('div');
            status.className = 'node-status status-inactive';
            status.textContent = 'IDLE';
            node.appendChild(status);
            
            const indicator = document.createElement('div');
            indicator.className = 'status-indicator inactive';
            node.appendChild(indicator);
            
            // Add station dots along connection paths
            if (id !== 'orchestrator') {
                const dot = document.createElement('div');
                dot.className = 'station-dot';
                
                // Position the dot based on agent's position relative to orchestrator
                const orchestratorX = this.agents.orchestrator.x;
                const orchestratorY = this.agents.orchestrator.y;
                
                // Calculate midpoint for the dot (metro station style)
                const midX = (agent.x + orchestratorX) / 2;
                const midY = (agent.y + orchestratorY) / 2;
                
                // For horizontal connections, adjust Y slightly to avoid direct overlap
                if (Math.abs(agent.y - orchestratorY) < 5) {
                    dot.style.left = `${midX}%`;
                    dot.style.top = `${midY - 2}%`;
                } 
                // For vertical connections, adjust X slightly
                else if (Math.abs(agent.x - orchestratorX) < 5) {
                    dot.style.left = `${midX - 2}%`;
                    dot.style.top = `${midY}%`;
                }
                // For diagonal connections
                else {
                    dot.style.left = `${midX}%`;
                    dot.style.top = `${midY}%`;
                }
                
                dot.dataset.agent = id;
                this.metroMap.appendChild(dot);
                
                // Add a second station dot near the agent node for more metro-like appearance
                const dot2 = document.createElement('div');
                dot2.className = 'station-dot';
                
                // Calculate position 75% of the way from orchestrator to agent
                const threeQuartersX = orchestratorX + (agent.x - orchestratorX) * 0.75;
                const threeQuartersY = orchestratorY + (agent.y - orchestratorY) * 0.75;
                
                dot2.style.left = `${threeQuartersX}%`;
                dot2.style.top = `${threeQuartersY}%`;
                dot2.dataset.agent = id;
                
                this.metroMap.appendChild(dot2);
            }
            
            // Add click handler to show agent details
            node.addEventListener('click', () => this.showAgentInfo(id));
            
            node.dataset.id = id;
            this.metroMap.appendChild(node);
        }
    }
    
    /**
     * Create the connection lines between agent nodes
     */
    createConnectionLines() {
        this.connections.forEach((connection, index) => {
            const fromAgent = this.agents[connection.from];
            const toAgent = this.agents[connection.to];
            
            // Calculate line position and length
            const x1 = fromAgent.x;
            const y1 = fromAgent.y;
            const x2 = toAgent.x;
            const y2 = toAgent.y;
            
            // Calculate the length of the line
            const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            
            // Calculate the angle
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
            
            // Create the line element
            const line = document.createElement('div');
            line.className = `connection-line ${connection.feedback ? 'feedback-connection' : ''} ${connection.conditional ? 'conditional-connection' : ''}`;
            line.style.width = `${length}%`;
            line.style.height = '2px';
            line.style.left = `${x1}%`;
            line.style.top = `${y1}%`;
            line.style.transform = `rotate(${angle}deg)`;
            
            line.dataset.from = connection.from;
            line.dataset.to = connection.to;
            line.dataset.index = index;
            
            this.metroMap.appendChild(line);
        });
    }
    
    /**
     * Create the toggle button to open the modal
     */
    createToggleButton() {
        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'agent-network-toggle';
        
        const toggleIcon = document.createElement('span');
        toggleIcon.className = 'toggle-icon';
        this.toggleButton.appendChild(toggleIcon);
        
        const toggleText = document.createElement('span');
        toggleText.textContent = 'AGENT NETWORK';
        this.toggleButton.appendChild(toggleText);
        
        this.toggleButton.addEventListener('click', () => this.toggleModal(true));
        
        // First check if the right panel header exists
        const rightPanelHeader = document.querySelector('.right-panel .panel-header');
        if (rightPanelHeader) {
            rightPanelHeader.appendChild(this.toggleButton);
        } else {
            // Fallback to append to body if the header doesn't exist
            document.body.appendChild(this.toggleButton);
        }
    }
    
    /**
     * Toggle the modal visibility
     */
    toggleModal(show) {
        if (show) {
            this.modalContainer.classList.add('active');
        } else {
            this.modalContainer.classList.remove('active');
        }
    }
    
    /**
     * Show agent information in the info panel
     */
    showAgentInfo(agentId) {
        const agent = this.agents[agentId];
        
        // Update info panel content
        this.infoContent.innerHTML = `
            <strong>${agent.name}</strong><br>
            Status: ${agent.active ? '<span style="color: var(--pip-green)">ACTIVE</span>' : '<span style="color: var(--text-secondary)">INACTIVE</span>'}<br>
            ${this.getAgentDescription(agentId)}
        `;
        
        // Highlight the selected agent
        document.querySelectorAll('.agent-node').forEach(node => {
            node.style.boxShadow = '';
        });
        
        const selectedNode = document.querySelector(`.agent-node[data-id="${agentId}"]`);
        if (selectedNode) {
            selectedNode.style.boxShadow = '0 0 15px var(--vault-yellow)';
        }
    }
    
    /**
     * Get a description for a specific agent
     */
    getAgentDescription(agentId) {
        const descriptions = {
            orchestrator: 'Coordinates all agent activities and manages workflow. Central hub for the entire agent system.',
            retriever: 'Fetches relevant documents and entities from the knowledge base for context.',
            synthesizer: 'Processes retrieved information and generates coherent content and answers.',
            critic: 'Reviews and validates synthesized content for accuracy and quality.',
            adapter: 'Adapts content to match the preferred persona and tone specifications.',
            presenter: 'Formats and presents the final content to the user interface.',
            coder: 'Generates and reviews code when programming tasks are requested.'
        };
        
        return descriptions[agentId] || 'No description available';
    }
    
    /**
     * Update agent status (active/inactive)
     */
    updateAgentStatus(agentId, isActive) {
        const agent = this.agents[agentId];
        if (!agent) return;
        
        agent.active = isActive;
        
        // Update node visuals
        const node = document.querySelector(`.agent-node[data-id="${agentId}"]`);
        const statusElem = node.querySelector('.node-status');
        const indicator = node.querySelector('.status-indicator');
        
        if (isActive) {
            node.classList.add('active');
            statusElem.className = 'node-status status-active';
            statusElem.textContent = 'ACTIVE';
            indicator.className = 'status-indicator active';
            
            // Activate all station dots for this agent
            document.querySelectorAll(`.station-dot[data-agent="${agentId}"]`).forEach(dot => {
                dot.classList.add('active');
            });
        } else {
            node.classList.remove('active');
            statusElem.className = 'node-status status-inactive';
            statusElem.textContent = 'IDLE';
            indicator.className = 'status-indicator inactive';
            
            // Deactivate all station dots for this agent
            document.querySelectorAll(`.station-dot[data-agent="${agentId}"]`).forEach(dot => {
                dot.classList.remove('active');
            });
        }
        
        this.updateStats();
    }
    
    /**
     * Add an active connection between agents
     */
    addActiveConnection(fromAgent, toAgent) {
        // Check if connection exists
        const connectionIndex = this.connections.findIndex(c => 
            c.from === fromAgent && c.to === toAgent
        );
        
        if (connectionIndex === -1) return;
        
        // Add to active connections if not already there
        if (!this.activeConnections.includes(connectionIndex)) {
            this.activeConnections.push(connectionIndex);
            
            // Update connection line visual
            const line = document.querySelector(`.connection-line[data-index="${connectionIndex}"]`);
            if (line) {
                line.classList.add('active-connection');
            }
        }
        
        this.updateStats();
    }
    
    /**
     * Remove an active connection
     */
    removeActiveConnection(fromAgent, toAgent) {
        // Find the connection index
        const connectionIndex = this.connections.findIndex(c => 
            c.from === fromAgent && c.to === toAgent
        );
        
        if (connectionIndex === -1) return;
        
        // Remove from active connections
        const index = this.activeConnections.indexOf(connectionIndex);
        if (index !== -1) {
            this.activeConnections.splice(index, 1);
            
            // Update connection line visual
            const line = document.querySelector(`.connection-line[data-index="${connectionIndex}"]`);
            if (line) {
                line.classList.remove('active-connection');
            }
        }
        
        this.updateStats();
    }
    
    /**
     * Update the statistics in the info panel
     */
    updateStats() {
        // Count active agents
        const activeAgents = Object.values(this.agents).filter(agent => agent.active).length;
        this.activeValue.textContent = `${activeAgents}/7`;
        
        // Count active connections
        this.connectionValue.textContent = `${this.activeConnections.length}/${this.connections.length}`;
        
        // Calculate system load based on active components
        const agentLoad = activeAgents / 7; // 0-1 value
        const connectionLoad = this.activeConnections.length / this.connections.length; // 0-1 value
        const totalLoad = Math.round((agentLoad * 0.7 + connectionLoad * 0.3) * 100); // Weighted average
        this.loadValue.textContent = `${totalLoad}%`;
    }
    
    /**
     * Mock active states for demo purposes
     */
    mockActiveStates() {
        // Set orchestrator active immediately
        this.updateAgentStatus('orchestrator', true);
        
        // Activate retriever after a delay
        setTimeout(() => {
            this.updateAgentStatus('retriever', true);
            this.addActiveConnection('orchestrator', 'retriever');
        }, 2000);
        
        // Activate synthesizer after retriever
        setTimeout(() => {
            this.updateAgentStatus('synthesizer', true);
            this.addActiveConnection('orchestrator', 'synthesizer');
            this.addActiveConnection('retriever', 'synthesizer');
        }, 3500);
        
        // Activate critic after synthesizer
        setTimeout(() => {
            this.updateAgentStatus('critic', true);
            this.addActiveConnection('orchestrator', 'critic');
            this.addActiveConnection('synthesizer', 'critic');
        }, 5000);
        
        // Show feedback from critic to synthesizer
        setTimeout(() => {
            this.addActiveConnection('critic', 'synthesizer');
        }, 6000);
        
        // Activate adapter after critic
        setTimeout(() => {
            this.updateAgentStatus('adapter', true);
            this.addActiveConnection('orchestrator', 'adapter');
            this.addActiveConnection('critic', 'adapter');
        }, 7500);
        
        // Activate presenter
        setTimeout(() => {
            this.updateAgentStatus('presenter', true);
            this.addActiveConnection('orchestrator', 'presenter');
            this.addActiveConnection('adapter', 'presenter');
        }, 9000);
    }
    
    /**
     * Update the network state from the server
     * @param {Object} networkState - The current state of the agent network from the server
     */
    updateFromServer(networkState) {
        if (!networkState) return;
        
        // Update agent states
        for (const [agentId, status] of Object.entries(networkState.agents)) {
            this.updateAgentStatus(agentId, status.active);
        }
        
        // Update connections
        this.activeConnections = [];
        document.querySelectorAll('.connection-line').forEach(line => {
            line.classList.remove('active-connection');
        });
        
        for (const connection of networkState.connections) {
            this.addActiveConnection(connection.from, connection.to);
        }
    }
}

// Initialize the agent network when the document is loaded
document.addEventListener('DOMContentLoaded', function() {
    window.agentNetwork = new AgentNetworkModal();
});

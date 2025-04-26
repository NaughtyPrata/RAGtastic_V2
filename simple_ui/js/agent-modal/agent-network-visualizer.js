/**
 * Agent Network Visualizer using vis.js
 * A more sophisticated visualization for agent interactions
 */

class AgentNetworkVisualizer {
    constructor() {
        this.loadLibraries();
        this.initModal();
        this.createToggleButton();
    }
    
    /**
     * Load required libraries for visualization
     */
    loadLibraries() {
        // Check if vis.js is already loaded
        if (!window.vis) {
            // Load vis.js CSS
            const visCSS = document.createElement('link');
            visCSS.rel = 'stylesheet';
            visCSS.href = 'https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.css';
            document.head.appendChild(visCSS);
            
            // Load vis.js script
            const visScript = document.createElement('script');
            visScript.src = 'https://cdnjs.cloudflare.com/ajax/libs/vis/4.21.0/vis.min.js';
            visScript.onload = () => {
                this.initNetwork();
            };
            document.head.appendChild(visScript);
        } else {
            this.initNetwork();
        }
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
        
        // Create the network container
        this.networkContainer = document.createElement('div');
        this.networkContainer.className = 'agent-network-body';
        this.networkContainer.style.height = '100%';
        
        // Create the actual network visualization div
        this.networkDiv = document.createElement('div');
        this.networkDiv.id = 'agent-network-visualization';
        this.networkDiv.style.height = '100%';
        this.networkDiv.style.width = '100%';
        this.networkDiv.style.position = 'relative';
        this.networkDiv.style.backgroundColor = 'var(--bg-terminal)';
        
        this.networkContainer.appendChild(this.networkDiv);
        this.modalContent.appendChild(this.networkContainer);
        
        // Add the modal to the DOM
        document.body.appendChild(this.modalContainer);
        
        // Create a loading overlay
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.className = 'loading-overlay';
        this.loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Initializing Agent Network...</div>
        `;
        this.loadingOverlay.style.position = 'absolute';
        this.loadingOverlay.style.top = '0';
        this.loadingOverlay.style.left = '0';
        this.loadingOverlay.style.right = '0';
        this.loadingOverlay.style.bottom = '0';
        this.loadingOverlay.style.display = 'flex';
        this.loadingOverlay.style.flexDirection = 'column';
        this.loadingOverlay.style.justifyContent = 'center';
        this.loadingOverlay.style.alignItems = 'center';
        this.loadingOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        this.loadingOverlay.style.color = 'var(--pip-green)';
        this.loadingOverlay.style.zIndex = '100';
        
        this.networkDiv.appendChild(this.loadingOverlay);
        
        // Add info panel for agent details
        this.infoPanel = document.createElement('div');
        this.infoPanel.className = 'info-panel';
        this.infoPanel.style.position = 'absolute';
        this.infoPanel.style.bottom = '20px';
        this.infoPanel.style.right = '20px';
        this.infoPanel.style.width = '250px';
        this.infoPanel.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
        this.infoPanel.style.padding = '15px';
        this.infoPanel.style.borderRadius = '5px';
        this.infoPanel.style.border = '2px solid var(--pip-green)';
        this.infoPanel.style.boxShadow = '0 0 10px var(--crt-glow)';
        this.infoPanel.style.zIndex = '50';
        
        const infoPanelHeader = document.createElement('div');
        infoPanelHeader.className = 'info-panel-header';
        infoPanelHeader.textContent = 'AGENT DETAILS';
        infoPanelHeader.style.color = 'var(--vault-yellow)';
        infoPanelHeader.style.marginBottom = '10px';
        infoPanelHeader.style.borderBottom = '1px solid var(--pip-green)';
        infoPanelHeader.style.paddingBottom = '5px';
        this.infoPanel.appendChild(infoPanelHeader);
        
        this.infoContent = document.createElement('div');
        this.infoContent.className = 'info-content';
        this.infoContent.innerHTML = 'Select an agent node to view details';
        this.infoContent.style.color = 'var(--text-primary)';
        this.infoContent.style.fontSize = '12px';
        this.infoPanel.appendChild(this.infoContent);
        
        this.networkDiv.appendChild(this.infoPanel);
    }
    
    /**
     * Initialize the network visualization
     */
    initNetwork() {
        if (!window.vis) {
            console.error('vis.js library not loaded');
            return;
        }
        
        // Data for the visualization
        const nodes = new vis.DataSet([
            { id: 1, label: 'Orchestrator\nAgent', group: 'orchestrator', status: 'inactive', x: 0, y: 0, fixed: true },
            { id: 2, label: 'Retriever\nAgent', group: 'retriever', status: 'inactive', x: -200, y: -150, fixed: true },
            { id: 3, label: 'Synthesizer\nAgent', group: 'synthesizer', status: 'inactive', x: -100, y: -150, fixed: true },
            { id: 4, label: 'Critic\nAgent', group: 'critic', status: 'inactive', x: 0, y: -150, fixed: true },
            { id: 5, label: 'Code\nAgent', group: 'coder', status: 'inactive', x: 100, y: -150, fixed: true },
            { id: 6, label: 'Persona Adapter\nAgent', group: 'adapter', status: 'inactive', x: 200, y: -150, fixed: true },
            { id: 7, label: 'Presentation\nAgent', group: 'presenter', status: 'inactive', x: 200, y: -75, fixed: true },
            { id: 8, label: 'System\nPrompt', group: 'system', status: 'active', x: -300, y: 0, fixed: true },
            { id: 9, label: 'User\nQuery', group: 'user', status: 'active', x: -150, y: 0, fixed: true },
            { id: 10, label: 'Final\nResponse', group: 'response', status: 'inactive', x: 200, y: 0, fixed: true }
        ]);
        
        // Connections based on the flowchart
        const edges = new vis.DataSet([
            // User Query to Orchestrator
            { from: 9, to: 1, color: { color: '#ffb400', opacity: 0.8 }, width: 3, status: 'active', arrows: false },
            
            // Orchestrator to agents
            { from: 1, to: 2, color: { color: '#5ffd7e', opacity: 0.7 }, width: 2, status: 'inactive', arrows: false },
            { from: 1, to: 3, color: { color: '#5ffd7e', opacity: 0.7 }, width: 2, status: 'inactive', arrows: false },
            { from: 1, to: 4, color: { color: '#5ffd7e', opacity: 0.7 }, width: 2, status: 'inactive', arrows: false },
            { from: 1, to: 5, color: { color: '#5ffd7e', opacity: 0.7 }, width: 2, status: 'inactive', arrows: false },
            { from: 1, to: 6, color: { color: '#5ffd7e', opacity: 0.7 }, width: 2, status: 'inactive', arrows: false },
            
            // Persona Adapter to Presentation
            { from: 6, to: 7, color: { color: '#5ffd7e', opacity: 0.7 }, width: 2, status: 'inactive', arrows: false },
            
            // Presentation to Final Response
            { from: 7, to: 10, color: { color: '#5ffd7e', opacity: 0.7 }, width: 2, status: 'inactive', arrows: false },
            
            // System Prompt connections
            { from: 8, to: 1, color: { color: '#00585f', opacity: 0.5 }, width: 1, status: 'active', dashes: true, arrows: false },
            { from: 8, to: 2, color: { color: '#00585f', opacity: 0.5 }, width: 1, status: 'active', dashes: true, arrows: false },
            { from: 8, to: 3, color: { color: '#00585f', opacity: 0.5 }, width: 1, status: 'active', dashes: true, arrows: false },
            { from: 8, to: 4, color: { color: '#00585f', opacity: 0.5 }, width: 1, status: 'active', dashes: true, arrows: false },
            { from: 8, to: 5, color: { color: '#00585f', opacity: 0.5 }, width: 1, status: 'active', dashes: true, arrows: false },
            { from: 8, to: 6, color: { color: '#00585f', opacity: 0.5 }, width: 1, status: 'active', dashes: true, arrows: false },
            { from: 8, to: 7, color: { color: '#00585f', opacity: 0.5 }, width: 1, status: 'active', dashes: true, arrows: false }
        ]);
        
        // Map of node IDs to agent names
        this.nodeMap = {
            1: 'orchestrator',
            2: 'retriever',
            3: 'synthesizer',
            4: 'critic',
            5: 'coder',
            6: 'adapter',
            7: 'presenter',
            8: 'system',
            9: 'user',
            10: 'response'
        };
        
        // Agent descriptions
        this.agentDescriptions = {
            orchestrator: 'Coordinates all agent activities and manages workflow. Central hub for the entire agent system.',
            retriever: 'Fetches relevant documents and entities from the knowledge base for context.',
            synthesizer: 'Processes retrieved information and generates coherent content and answers.',
            critic: 'Reviews and validates synthesized content for accuracy and quality.',
            coder: 'Generates and reviews code when programming tasks are requested.',
            adapter: 'Adapts content to match the preferred persona and tone specifications.',
            presenter: 'Formats and presents the final content to the user interface.',
            system: 'The system prompt that guides all agents with instructions.',
            user: 'The user query that initiates the agent workflow.',
            response: 'The final response delivered to the user.'
        };
        
        // Create a network
        const data = {
            nodes: nodes,
            edges: edges
        };
        
        // Network options
        const options = {
            nodes: {
                shape: 'dot',
                size: 20,
                font: {
                    color: '#dcded1',
                    face: 'Share Tech Mono, monospace',
                    size: 14,
                    background: 'rgba(0, 0, 0, 0.5)'
                },
                borderWidth: 2,
                shadow: true
            },
            edges: {
                smooth: {
                    type: 'continuous',
                    roundness: 0.2
                },
                width: 2,
                shadow: true,
                color: { inherit: false },
                arrows: {
                    to: { enabled: false },
                    from: { enabled: false }
                }
            },
            groups: {
                orchestrator: {
                    color: { background: '#0c100c', border: '#5ffd7e' },
                    borderWidth: 3,
                    shadow: { enabled: true, color: '#5ffd7e', size: 10, x: 0, y: 0 }
                },
                retriever: { color: { background: '#0a2463', border: '#5ffd7e' } },
                synthesizer: { color: { background: '#1a221a', border: '#5ffd7e' } },
                critic: { color: { background: '#1e2429', border: '#5ffd7e' } },
                coder: { color: { background: '#454d50', border: '#5ffd7e' } },
                adapter: { color: { background: '#6e5837', border: '#5ffd7e' } },
                presenter: { color: { background: '#00585f', border: '#5ffd7e' } },
                system: { color: { background: '#133337', border: '#00585f' }, shape: 'hexagon' },
                user: { color: { background: '#806517', border: '#ffb400' }, shape: 'diamond' },
                response: { color: { background: '#454545', border: '#949d8f' }, shape: 'diamond' }
            },
            physics: {
                enabled: false,  // Disable physics to keep the fixed positions
                stabilization: {
                    enabled: true,
                    iterations: 100
                }
            },
            interaction: {
                hover: true,
                tooltipDelay: 200,
                zoomView: true,
                dragView: true,
                dragNodes: false  // Prevent nodes from being dragged
            },
            layout: {
                improvedLayout: true,
                hierarchical: {
                    enabled: false
                }
            }
        };
        
        // Initialize the network
        this.network = new vis.Network(this.networkDiv, data, options);
        
        // Save nodes and edges
        this.nodes = nodes;
        this.edges = edges;
        
        // Hide loading overlay
        setTimeout(() => {
            this.loadingOverlay.style.display = 'none';
        }, 1500);
        
        // Add event listeners
        this.network.on('click', params => {
            if (params.nodes.length > 0) {
                const nodeId = params.nodes[0];
                const agentType = this.nodeMap[nodeId];
                this.showAgentInfo(agentType, nodeId);
            }
        });
    }
    
    /**
     * Create the toggle button to open the modal
     */
    createToggleButton() {
        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'agent-network-toggle';
        this.toggleButton.style.position = 'absolute';
        this.toggleButton.style.top = '10px';
        this.toggleButton.style.right = '10px';
        this.toggleButton.style.backgroundColor = 'var(--bg-tertiary)';
        this.toggleButton.style.color = 'var(--vault-yellow)';
        this.toggleButton.style.border = '2px solid var(--vault-yellow)';
        this.toggleButton.style.borderRadius = '4px';
        this.toggleButton.style.padding = '5px 10px';
        this.toggleButton.style.fontSize = '12px';
        this.toggleButton.style.cursor = 'pointer';
        this.toggleButton.style.zIndex = '100';
        this.toggleButton.style.fontFamily = 'Share Tech Mono, monospace';
        this.toggleButton.style.boxShadow = '0 0 5px rgba(255, 180, 0, 0.5)';
        this.toggleButton.textContent = 'AGENT NETWORK';
        
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
            this.modalContainer.style.display = 'flex';
            this.modalContainer.style.opacity = '1';
            this.modalContainer.style.pointerEvents = 'all';
            
            // Refresh the network to ensure proper rendering
            if (this.network) {
                this.network.redraw();
            }
        } else {
            this.modalContainer.style.opacity = '0';
            this.modalContainer.style.pointerEvents = 'none';
            setTimeout(() => {
                this.modalContainer.style.display = 'none';
            }, 300);
        }
    }
    
    /**
     * Show agent information in the info panel
     */
    showAgentInfo(agentType, nodeId) {
        const node = this.nodes.get(nodeId);
        
        // Update info panel content
        this.infoContent.innerHTML = `
            <strong>${node.label}</strong><br>
            Status: ${node.status === 'active' ? 
                '<span style="color: var(--pip-green)">ACTIVE</span>' : 
                '<span style="color: var(--text-secondary)">INACTIVE</span>'}<br>
            ${this.agentDescriptions[agentType] || 'No description available'}
        `;
    }
    
    /**
     * Update agent status (active/inactive)
     */
    updateAgentStatus(agentType, isActive) {
        // Find the node ID for this agent type
        const nodeId = Object.keys(this.nodeMap).find(
            key => this.nodeMap[key] === agentType
        );
        
        if (!nodeId) return;
        
        // Update node
        const node = this.nodes.get(nodeId);
        node.status = isActive ? 'active' : 'inactive';
        
        if (isActive) {
            // Active node styling
            node.color = {
                border: '#ffb400',
                background: node.group === 'orchestrator' ? '#0c100c' : this.getGroupColor(node.group)
            };
            node.shadow = {
                enabled: true,
                color: '#ffb400',
                size: 15,
                x: 0,
                y: 0
            };
            // Add a temporary pulsing effect
            this.pulseNode(nodeId);
        } else {
            // Inactive node styling
            node.color = {
                border: '#5ffd7e',
                background: node.group === 'orchestrator' ? '#0c100c' : this.getGroupColor(node.group)
            };
            node.shadow = node.group === 'orchestrator' ? 
                { enabled: true, color: '#5ffd7e', size: 10, x: 0, y: 0 } : 
                { enabled: false };
        }
        
        this.nodes.update(node);
    }
    
    /**
     * Get the background color for a group
     */
    getGroupColor(group) {
        const colors = {
            orchestrator: '#0c100c',
            retriever: '#0a2463',
            synthesizer: '#1a221a',
            critic: '#1e2429',
            adapter: '#6e5837',
            presenter: '#00585f',
            coder: '#454d50'
        };
        
        return colors[group] || '#0c100c';
    }
    
    /**
     * Add an active connection between agents
     */
    activateConnection(fromAgentType, toAgentType) {
        // Find the node IDs for these agent types
        const fromNodeId = Object.keys(this.nodeMap).find(
            key => this.nodeMap[key] === fromAgentType
        );
        const toNodeId = Object.keys(this.nodeMap).find(
            key => this.nodeMap[key] === toAgentType
        );
        
        if (!fromNodeId || !toNodeId) return;
        
        // Find the edge
        const edgeId = this.findEdge(parseInt(fromNodeId), parseInt(toNodeId));
        if (!edgeId) return;
        
        // Update edge
        const edge = this.edges.get(edgeId);
        edge.status = 'active';
        edge.color = { color: '#ffb400', opacity: 1 };
        edge.width = 3;
        edge.shadow = { enabled: true, color: '#ffb400', size: 10 };
        
        this.edges.update(edge);
        
        // Add a temporary pulsing effect to the edge
        this.pulseEdge(edgeId);
    }
    
    /**
     * Find an edge between two nodes
     */
    findEdge(fromNodeId, toNodeId) {
        const edgeIds = this.edges.getIds();
        for (const edgeId of edgeIds) {
            const edge = this.edges.get(edgeId);
            if (edge.from === fromNodeId && edge.to === toNodeId) {
                return edgeId;
            }
        }
        return null;
    }
    
    /**
     * Create a pulsing effect for a node
     */
    pulseNode(nodeId) {
        const node = this.nodes.get(nodeId);
        let size = 15;
        let increasing = false;
        
        const pulseInterval = setInterval(() => {
            if (size <= 10) increasing = true;
            if (size >= 20) increasing = false;
            
            size += increasing ? 1 : -1;
            
            node.shadow = {
                enabled: true,
                color: '#ffb400',
                size: size,
                x: 0,
                y: 0
            };
            
            this.nodes.update(node);
        }, 100);
        
        // Stop pulsing after 5 seconds
        setTimeout(() => {
            clearInterval(pulseInterval);
            
            // Check if node is still active
            const currentNode = this.nodes.get(nodeId);
            if (currentNode.status === 'active') {
                currentNode.shadow = {
                    enabled: true,
                    color: '#ffb400',
                    size: 15,
                    x: 0,
                    y: 0
                };
                this.nodes.update(currentNode);
            }
        }, 5000);
    }
    
    /**
     * Create a pulsing effect for an edge
     */
    pulseEdge(edgeId) {
        const edge = this.edges.get(edgeId);
        let width = 3;
        let increasing = false;
        
        const pulseInterval = setInterval(() => {
            if (width <= 3) increasing = true;
            if (width >= 5) increasing = false;
            
            width += increasing ? 0.2 : -0.2;
            
            edge.width = width;
            
            this.edges.update(edge);
        }, 100);
        
        // Stop pulsing after 5 seconds
        setTimeout(() => {
            clearInterval(pulseInterval);
            
            // Check if edge is still active
            const currentEdge = this.edges.get(edgeId);
            if (currentEdge.status === 'active') {
                currentEdge.width = 3;
                this.edges.update(currentEdge);
            }
        }, 5000);
    }
    
    /**
     * Deactivate a connection
     */
    deactivateConnection(fromAgentType, toAgentType) {
        // Find the node IDs for these agent types
        const fromNodeId = Object.keys(this.nodeMap).find(
            key => this.nodeMap[key] === fromAgentType
        );
        const toNodeId = Object.keys(this.nodeMap).find(
            key => this.nodeMap[key] === toAgentType
        );
        
        if (!fromNodeId || !toNodeId) return;
        
        // Find the edge
        const edgeId = this.findEdge(parseInt(fromNodeId), parseInt(toNodeId));
        if (!edgeId) return;
        
        // Update edge
        const edge = this.edges.get(edgeId);
        edge.status = 'inactive';
        edge.color = { color: '#5ffd7e', opacity: 0.6 };
        edge.width = 2;
        edge.shadow = { enabled: false };
        
        this.edges.update(edge);
    }
    
    /**
     * Simulate the activation sequence for a query
     */
    simulateQuery() {
        // Reset first
        this.reset();
        
        // Activate user query node
        const userNode = this.nodes.get(9);
        userNode.color = { background: '#a08000', border: '#ffb400' };
        userNode.shadow = { enabled: true, color: '#ffb400', size: 10 };
        this.nodes.update(userNode);
        
        // Connection from user to orchestrator is already active
        
        // Activate orchestrator immediately
        setTimeout(() => this.updateAgentStatus('orchestrator', true), 500);
        
        // Activate connections from orchestrator to agents in sequence
        setTimeout(() => this.activateConnection('orchestrator', 'retriever'), 1000);
        setTimeout(() => this.updateAgentStatus('retriever', true), 1500);
        
        setTimeout(() => this.activateConnection('orchestrator', 'synthesizer'), 2000);
        setTimeout(() => this.updateAgentStatus('synthesizer', true), 2500);
        
        setTimeout(() => this.activateConnection('orchestrator', 'critic'), 3000);
        setTimeout(() => this.updateAgentStatus('critic', true), 3500);
        
        // Check if query contains code-related keywords for code agent
        const queryInput = document.getElementById('query-input');
        if (queryInput && queryInput.value) {
            const codeKeywords = ['code', 'function', 'script', 'program', 'javascript', 'python', 'html', 'css'];
            const hasCodeKeyword = codeKeywords.some(keyword => 
                queryInput.value.toLowerCase().includes(keyword)
            );
            
            if (hasCodeKeyword) {
                setTimeout(() => this.activateConnection('orchestrator', 'coder'), 3000);
                setTimeout(() => this.updateAgentStatus('coder', true), 3500);
            }
        }
        
        setTimeout(() => this.activateConnection('orchestrator', 'adapter'), 4000);
        setTimeout(() => this.updateAgentStatus('adapter', true), 4500);
        
        // Connection from adapter to presenter
        setTimeout(() => this.activateConnection('adapter', 'presenter'), 5000);
        setTimeout(() => this.updateAgentStatus('presenter', true), 5500);
        
        // Connection from presenter to final response
        setTimeout(() => this.activateConnection('presenter', 'response'), 6000);
        
        // Activate final response node
        setTimeout(() => {
            const responseNode = this.nodes.get(10);
            responseNode.status = 'active';
            responseNode.color = { background: '#5a5a5a', border: '#5ffd7e' };
            responseNode.shadow = { enabled: true, color: '#5ffd7e', size: 10 };
            this.nodes.update(responseNode);
        }, 6500);
    }
    
    /**
     * Reset all agents and connections to inactive state
     */
    reset() {
        // Reset all nodes
        const nodeIds = this.nodes.getIds();
        for (const nodeId of nodeIds) {
            if (nodeId === 8) continue; // Skip system prompt node

            const node = this.nodes.get(nodeId);
            
            // Special handling for different node types
            if (node.group === 'system') {
                // System prompt is always active
                node.status = 'active';
                node.color = { background: '#133337', border: '#00585f' };
                node.shadow = { enabled: true, color: '#00585f', size: 5 };
            } 
            else if (node.group === 'user') {
                // User query initially inactive
                node.status = 'inactive';
                node.color = { background: '#806517', border: '#ffb400' };
                node.shadow = { enabled: false };
            }
            else if (node.group === 'response') {
                // Response initially inactive
                node.status = 'inactive';
                node.color = { background: '#454545', border: '#949d8f' };
                node.shadow = { enabled: false };
            }
            else {
                // Agent nodes
                node.status = 'inactive';
                node.color = {
                    border: '#5ffd7e',
                    background: this.getGroupColor(node.group)
                };
                node.shadow = node.group === 'orchestrator' ? 
                    { enabled: true, color: '#5ffd7e', size: 5, x: 0, y: 0 } : 
                    { enabled: false };
            }
            
            this.nodes.update(node);
        }
        
        // Reset all edges
        const edgeIds = this.edges.getIds();
        for (const edgeId of edgeIds) {
            const edge = this.edges.get(edgeId);
            
            // Special handling for different edge types
            if (edge.from === 8) {
                // System prompt connections stay active
                edge.status = 'active';
                edge.color = { color: '#00585f', opacity: 0.5 };
                edge.width = 1;
                edge.dashes = true;
            } 
            else if (edge.from === 9 && edge.to === 1) {
                // User query to orchestrator connection
                edge.status = 'inactive';
                edge.color = { color: '#ffb400', opacity: 0.5 };
                edge.width = 2;
                edge.dashes = false;
            }
            else {
                // All other connections
                edge.status = 'inactive';
                edge.color = { color: '#5ffd7e', opacity: 0.6 };
                edge.width = 2;
                edge.dashes = false;
            }
            
            edge.shadow = { enabled: false };
            this.edges.update(edge);
        }
    }
}

// Initialize when the page has loaded
document.addEventListener('DOMContentLoaded', function() {
    window.agentNetworkVisualizer = new AgentNetworkVisualizer();
    
    // Add event listener for the query input
    const queryInput = document.getElementById('query-input');
    const submitButton = document.getElementById('submit-query');
    
    if (submitButton) {
        submitButton.addEventListener('click', () => {
            if (window.agentNetworkVisualizer) {
                window.agentNetworkVisualizer.reset();
                window.agentNetworkVisualizer.simulateQuery();
            }
        });
    }
    
    if (queryInput) {
        queryInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && window.agentNetworkVisualizer) {
                window.agentNetworkVisualizer.reset();
                window.agentNetworkVisualizer.simulateQuery();
            }
        });
    }
});
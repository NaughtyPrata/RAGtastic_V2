/**
 * Agent Network Metro-Style Visualizer
 * Improved version with Fallout Vault-Tech aesthetic
 */

class MetroVisualizer {
    constructor() {
        this.initModal();
        this.createToggleButton();
        this.initialized = false;
        this.workingAPIAgents = ['orchestrator', 'retriever', 'synthesizer', 'critic']; // Agents with working API keys
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
        title.textContent = 'VAULT-TEC AGENT NETWORK';
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
        
        // Create loading overlay
        this.loadingOverlay = document.createElement('div');
        this.loadingOverlay.className = 'loading-overlay';
        this.loadingOverlay.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">INITIALIZING AGENT NETWORK...</div>
        `;
        this.networkContainer.appendChild(this.loadingOverlay);
        
        // Create metro map container
        this.metroContainer = document.createElement('div');
        this.metroContainer.className = 'metro-container';
        this.networkContainer.appendChild(this.metroContainer);
        
        // Add grid overlay
        const gridOverlay = document.createElement('div');
        gridOverlay.className = 'grid-overlay';
        this.networkContainer.appendChild(gridOverlay);
        
        // Add grid overlay for visual effect
        const gridOverlay = document.createElement('div');
        gridOverlay.className = 'grid-overlay';
        this.networkContainer.appendChild(gridOverlay);
        
        // Add API Status indicator
        const apiStatus = document.createElement('div');
        apiStatus.className = 'api-status';
        apiStatus.innerHTML = `
            <div class="api-status-title">AGENT API STATUS</div>
            <div class="api-status-indicator">
                <span class="api-status-dot"></span>
                <span class="api-status-text">ONLINE</span>
            </div>
        `;
        this.networkContainer.appendChild(apiStatus);
        
        // Create radar display
        this.createRadarDisplay();
        
        // Create legends
        this.createLegends();
        
        // Create info panel
        this.createInfoPanel();
        
        this.modalContent.appendChild(this.networkContainer);
        
        // Add the modal to the DOM
        document.body.appendChild(this.modalContainer);
    }
    
    /**
     * Create the radar display in the corner
     */
    createRadarDisplay() {
        const radarMask = document.createElement('div');
        radarMask.className = 'radar-mask';
        
        const radarScreen = document.createElement('div');
        radarScreen.className = 'radar-screen';
        
        const radarSweep = document.createElement('div');
        radarSweep.className = 'radar-sweep';
        
        const radarCenter = document.createElement('div');
        radarCenter.className = 'radar-center';
        
        const radarCircles = document.createElement('div');
        radarCircles.className = 'radar-circles';
        
        radarScreen.appendChild(radarSweep);
        radarScreen.appendChild(radarCenter);
        radarScreen.appendChild(radarCircles);
        radarMask.appendChild(radarScreen);
        
        this.networkContainer.appendChild(radarMask);
    }
    
    /**
     * Create legends for the metro map
     */
    createLegends() {
        const legend = document.createElement('div');
        legend.className = 'metro-legend';
        
        const legendTitle = document.createElement('div');
        legendTitle.className = 'legend-title';
        legendTitle.textContent = 'NETWORK PATHS';
        legend.appendChild(legendTitle);
        
        // Add legend items
        const legendItems = [
            { color: 'var(--vault-yellow)', label: 'PRIMARY CONNECTION' },
            { color: 'var(--pip-green)', label: 'SECONDARY CONNECTION' },
            { color: '#00585f', label: 'SYSTEM PROMPT', style: 'dotted' }
        ];
        
        legendItems.forEach(item => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            
            const legendColor = document.createElement('div');
            legendColor.className = 'legend-color';
            
            if (item.style === 'dotted') {
                legendColor.classList.add('dotted');
                legendColor.style.backgroundColor = 'transparent';
                legendColor.style.backgroundImage = `repeating-linear-gradient(
                    to right,
                    ${item.color},
                    ${item.color} 4px,
                    transparent 4px,
                    transparent 8px
                )`;
            } else {
                legendColor.style.backgroundColor = item.color;
            }
            
            const legendLabel = document.createElement('div');
            legendLabel.className = 'legend-label';
            legendLabel.textContent = item.label;
            
            legendItem.appendChild(legendColor);
            legendItem.appendChild(legendLabel);
            legend.appendChild(legendItem);
        });
        
        // Add API Status legend
        const apiLegend = document.createElement('div');
        apiLegend.className = 'legend-title api-legend-title';
        apiLegend.textContent = 'API STATUS';
        legend.appendChild(apiLegend);
        
        const apiLegendItems = [
            { class: 'api-active', label: 'WORKING API' },
            { class: 'api-inactive', label: 'OFFLINE API' }
        ];
        
        apiLegendItems.forEach(item => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            
            const legendIndicator = document.createElement('div');
            legendIndicator.className = `legend-indicator ${item.class}`;
            
            const legendLabel = document.createElement('div');
            legendLabel.className = 'legend-label';
            legendLabel.textContent = item.label;
            
            legendItem.appendChild(legendIndicator);
            legendItem.appendChild(legendLabel);
            legend.appendChild(legendItem);
        });
        
        this.networkContainer.appendChild(legend);
    }
    
    /**
     * Create info panel for agent details
     */
    createInfoPanel() {
        this.infoPanel = document.createElement('div');
        this.infoPanel.className = 'info-panel';
        
        const infoPanelHeader = document.createElement('div');
        infoPanelHeader.className = 'info-panel-header';
        infoPanelHeader.textContent = 'AGENT DETAILS';
        this.infoPanel.appendChild(infoPanelHeader);
        
        this.infoContent = document.createElement('div');
        this.infoContent.className = 'info-content';
        this.infoContent.innerHTML = 'Select an agent node to view details';
        this.infoPanel.appendChild(this.infoContent);
        
        this.networkContainer.appendChild(this.infoPanel);
    }
    
    /**
     * Create the toggle button to open the modal
     */
    createToggleButton() {
        this.toggleButton = document.createElement('button');
        this.toggleButton.className = 'agent-network-toggle';
        this.toggleButton.textContent = 'AGENT NETWORK';
        
        this.toggleButton.addEventListener('click', () => {
            this.toggleModal(true);
            if (!this.initialized) {
                this.initializeMetroMap();
            }
        });
        
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
     * Initialize the metro map visualization
     */
    initializeMetroMap() {
        // Define stations (nodes) in a layout matching the reference image
        this.stations = [
            // Core agents horizontal central line
            { id: 1, label: 'Orchestrator Agent', type: 'orchestrator', status: 'inactive', x: 50, y: 50 },
            
            // Top row - retrieval, synthesis, critic path
            { id: 2, label: 'Retriever Agent', type: 'retriever', status: 'inactive', x: 20, y: 20 },
            { id: 3, label: 'Synthesizer Agent', type: 'synthesizer', status: 'inactive', x: 50, y: 20 },
            { id: 4, label: 'Critic Agent', type: 'critic', status: 'inactive', x: 80, y: 20 },
            
            // Bottom row - code, adapter, presentation
            { id: 5, label: 'Code Agent', type: 'coder', status: 'inactive', x: 20, y: 80 },
            { id: 6, label: 'Persona Adapter', type: 'adapter', status: 'inactive', x: 50, y: 80 },
            { id: 7, label: 'Presentation Agent', type: 'presenter', status: 'inactive', x: 80, y: 80 },
            
            // Input/Output nodes on the central line
            { id: 8, label: 'System Prompt', type: 'system', status: 'active', x: 25, y: 50 },
            { id: 9, label: 'User Query', type: 'user', status: 'active', x: 5, y: 50 },
            { id: 10, label: 'Final Response', type: 'response', status: 'inactive', x: 95, y: 50 }
        ];
        
        // Define connections (metro lines) matching the reference image
        this.connections = [
            // Main central line - User to System Prompt to Orchestrator to Response
            { from: 9, to: 8, type: 'active', status: 'active' },        // User Query to System Prompt
            { from: 8, to: 1, type: 'active', status: 'active' },        // System Prompt to Orchestrator
            { from: 1, to: 10, type: 'active', status: 'inactive' },     // Orchestrator to Final Response
            
            // Top rows - horizontal connections between agents
            { from: 2, to: 3, type: 'primary', status: 'inactive' },     // Retriever to Synthesizer
            { from: 3, to: 4, type: 'primary', status: 'inactive' },     // Synthesizer to Critic
            
            // Bottom rows - horizontal connections between agents
            { from: 5, to: 6, type: 'secondary', status: 'inactive' },   // Code to Persona Adapter
            { from: 6, to: 7, type: 'secondary', status: 'inactive' },   // Persona Adapter to Presentation
            
            // Vertical connections from agents
            { from: 3, to: 1, type: 'primary', status: 'inactive' },     // Synthesizer to Orchestrator
            { from: 4, to: 1, type: 'primary', status: 'inactive' },     // Critic to Orchestrator 
            { from: 1, to: 6, type: 'secondary', status: 'inactive' },   // Orchestrator to Persona Adapter
            
            // Special connections
            { from: 6, to: 10, type: 'secondary', status: 'inactive' },   // Persona Adapter to Final Response (alternative path)
            { from: 1, to: 2, type: 'primary', status: 'inactive' },     // Orchestrator to Retriever
            
            // System prompt connections (dotted lines)
            { from: 8, to: 2, type: 'system', status: 'active' },  // System to Retriever
            { from: 8, to: 3, type: 'system', status: 'active' },  // System to Synthesizer
            { from: 8, to: 4, type: 'system', status: 'active' },  // System to Critic
            { from: 8, to: 5, type: 'system', status: 'active' },  // System to Code
            { from: 8, to: 6, type: 'system', status: 'active' },  // System to Adapter
            { from: 8, to: 7, type: 'system', status: 'active' }   // System to Presentation
        ];
        
        // Agent descriptions
        this.agentDescriptions = {
            orchestrator: 'Central control node that coordinates all agent activities and manages the workflow. Handles request routing and orchestrates the entire agent network.',
            retriever: 'Specialized in retrieving relevant documents and entities from knowledge sources to provide context for processing.',
            synthesizer: 'Processes retrieved information and combines it with instructions to generate coherent content and answers.',
            critic: 'Reviews and validates content for accuracy, quality, and adherence to guidelines. Provides feedback for refinement.',
            coder: 'Handles generation and review of code when programming tasks are requested. Works closely with the Synthesizer.',
            adapter: 'Adapts generated content to match specified persona characteristics, tone, and style requirements.',
            presenter: 'Formats and prepares the final content for optimal presentation to the user interface.',
            system: 'Central system prompt that provides core instructions and guidelines to all agents in the network.',
            user: 'User query input node that initiates the agent workflow and defines the processing requirements.',
            response: 'Final output node where processed and validated content is delivered back to the user.'
        };
        
        // Clear any existing elements
        this.metroContainer.innerHTML = '';
        
        // Create metro lines first (so they appear behind stations)
        this.createMetroLines();
        
        // Create stations
        this.createStations();
        
        // Hide loading overlay after a short delay
        setTimeout(() => {
            this.loadingOverlay.style.display = 'none';
            this.initialized = true;
        }, 1500);
    }
    
    /**
     * Create metro lines (connections between stations)
     */
    createMetroLines() {
        this.connections.forEach((connection, index) => {
            const fromStation = this.findStationById(connection.from);
            const toStation = this.findStationById(connection.to);
            
            if (!fromStation || !toStation) return;
            
            // Create a path element for the curved line
            const path = this.createConnectionPath(fromStation, toStation, connection.type);
            this.metroContainer.appendChild(path);
            
            // Store the connection data
            path.dataset.from = connection.from;
            path.dataset.to = connection.to;
            path.dataset.status = connection.status;
            path.dataset.type = connection.type;
            
            // Add class based on connection type
            if (connection.type === 'system') {
                path.classList.add('dashed');
            } else if (connection.type === 'active') {
                path.classList.add('active');
            } else if (connection.type === 'primary') {
                path.classList.add('primary');
            } else if (connection.type === 'secondary') {
                path.classList.add('secondary');
            } else if (connection.type === 'feedback') {
                path.classList.add('feedback');
            }
            
            // If the connection is active, add data flow particles
            if (connection.status === 'active') {
                this.addDataFlowParticles(path, connection);
            }
        });
    }
    
    /**
     * Create a curved path between two stations
     */
    createConnectionPath(fromStation, toStation, type) {
        const path = document.createElement('div');
        path.className = 'metro-line';
        
        // Get station positions
        const x1 = fromStation.x;
        const y1 = fromStation.y;
        const x2 = toStation.x;
        const y2 = toStation.y;
        
        // For system prompt connections, use straight dotted lines regardless of distance
        if (type === 'system') {
            // Calculate length and angle for straight line
            const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
            
            path.style.width = `${length}%`;
            path.style.height = '3px';
            path.style.left = `${x1}%`;
            path.style.top = `${y1}%`;
            path.style.transform = `rotate(${angle}deg)`;
            
            return path;
        }
        
        // Simple direct path for short distances
        if (Math.abs(x1 - x2) < 2 || Math.abs(y1 - y2) < 2) {
            // Calculate length and angle for straight line
            const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
            const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
            
            path.style.width = `${length}%`;
            path.style.height = '3px';
            path.style.left = `${x1}%`;
            path.style.top = `${y1}%`;
            path.style.transform = `rotate(${angle}deg)`;
            
            return path;
        }
        
        // For non-system connections, create angled paths
        if (Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
            // Horizontal dominant - create path with horizontal segments
            const pathElement = document.createElement('div');
            pathElement.className = 'metro-path';
            
            // First segment (horizontal)
            const firstSegment = document.createElement('div');
            firstSegment.className = 'metro-line';
            firstSegment.style.width = `${Math.abs(x2 - x1)}%`;
            firstSegment.style.height = '3px';
            firstSegment.style.left = `${Math.min(x1, x2)}%`;
            firstSegment.style.top = `${y1}%`;
            
            // Add classes based on connection type
            if (type === 'primary') firstSegment.classList.add('primary');
            if (type === 'secondary') firstSegment.classList.add('secondary');
            if (type === 'feedback') firstSegment.classList.add('feedback');
            if (type === 'active') firstSegment.classList.add('active');
            
            // Second segment (vertical)
            const secondSegment = document.createElement('div');
            secondSegment.className = 'metro-line vertical';
            secondSegment.style.height = `${Math.abs(y2 - y1)}%`;
            secondSegment.style.width = '3px';
            secondSegment.style.left = `${x2}%`;
            secondSegment.style.top = `${Math.min(y1, y2)}%`;
            
            // Add same classes
            if (type === 'primary') secondSegment.classList.add('primary');
            if (type === 'secondary') secondSegment.classList.add('secondary');
            if (type === 'feedback') secondSegment.classList.add('feedback');
            if (type === 'active') secondSegment.classList.add('active');
            
            pathElement.appendChild(firstSegment);
            pathElement.appendChild(secondSegment);
            
            return pathElement;
        } else {
            // Vertical dominant - create path with vertical segments
            const pathElement = document.createElement('div');
            pathElement.className = 'metro-path';
            
            // First segment (vertical)
            const firstSegment = document.createElement('div');
            firstSegment.className = 'metro-line vertical';
            firstSegment.style.height = `${Math.abs(y2 - y1)}%`;
            firstSegment.style.width = '3px';
            firstSegment.style.left = `${x1}%`;
            firstSegment.style.top = `${Math.min(y1, y2)}%`;
            
            // Add classes based on connection type
            if (type === 'primary') firstSegment.classList.add('primary');
            if (type === 'secondary') firstSegment.classList.add('secondary');
            if (type === 'feedback') firstSegment.classList.add('feedback');
            if (type === 'active') firstSegment.classList.add('active');
            
            // Second segment (horizontal)
            const secondSegment = document.createElement('div');
            secondSegment.className = 'metro-line';
            secondSegment.style.width = `${Math.abs(x2 - x1)}%`;
            secondSegment.style.height = '3px';
            secondSegment.style.left = `${Math.min(x1, x2)}%`;
            secondSegment.style.top = `${y2}%`;
            
            // Add same classes
            if (type === 'primary') secondSegment.classList.add('primary');
            if (type === 'secondary') secondSegment.classList.add('secondary');
            if (type === 'feedback') secondSegment.classList.add('feedback');
            if (type === 'active') secondSegment.classList.add('active');
            
            pathElement.appendChild(firstSegment);
            pathElement.appendChild(secondSegment);
            
            return pathElement;
        }
    }
    
    /**
     * Add animated data flow particles to active connections
     */
    addDataFlowParticles(lineElement, connection) {
        // Only add particles to direct lines, not path containers
        if (lineElement.classList.contains('metro-path')) {
            // For path containers, add particles to both segments
            const segments = lineElement.querySelectorAll('.metro-line');
            segments.forEach(segment => {
                this.createParticlesForSegment(segment, connection);
            });
            return;
        }
        
        this.createParticlesForSegment(lineElement, connection);
    }
    
    /**
     * Create particles for a line segment
     */
    createParticlesForSegment(segment, connection) {
        const numParticles = 2;
        const isVertical = segment.classList.contains('vertical');
        
        for (let i = 0; i < numParticles; i++) {
            const particle = document.createElement('div');
            particle.className = isVertical ? 'data-particle vertical' : 'data-particle';
            
            // Delay the start of animation for each particle
            particle.style.animationDelay = `${i * 1.0}s`;
            
            segment.appendChild(particle);
        }
    }
    
    /**
     * Create metro stations (nodes)
     */
    createStations() {
        this.stations.forEach(station => {
            // Create station element
            const stationEl = document.createElement('div');
            stationEl.className = `metro-station ${station.type}`;
            
            // Set status
            if (station.status === 'active') {
                stationEl.classList.add('active');
            }
            
            // Add API status for agent nodes
            if (this.workingAPIAgents.includes(station.type)) {
                stationEl.classList.add('api-working');
            }
            
            // Position the station
            stationEl.style.left = `${station.x}%`;
            stationEl.style.top = `${station.y}%`;
            
            // Add data attributes
            stationEl.dataset.id = station.id;
            stationEl.dataset.type = station.type;
            stationEl.dataset.status = station.status;
            
            // Add click event listener
            stationEl.addEventListener('click', () => this.showStationInfo(station));
            
            // Create label
            const label = document.createElement('div');
            label.className = 'station-label';
            label.textContent = station.label;
            
            // Position the label based on station position
            if (station.y <= 30) {
                // Station is at the top, place label below
                label.classList.add('label-bottom');
                label.style.top = `${station.y + 4}%`;
                label.style.left = `${station.x}%`;
            } else if (station.y >= 70) {
                // Station is at the bottom, place label above
                label.classList.add('label-top');
                label.style.top = `${station.y - 4}%`;
                label.style.left = `${station.x}%`;
            } else if (station.x <= 20) {
                // Station is at the left, place label to the right
                label.classList.add('label-right');
                label.style.top = `${station.y}%`;
                label.style.left = `${station.x + 4}%`;
            } else if (station.x >= 80) {
                // Station is at the right, place label to the left
                label.classList.add('label-left');
                label.style.top = `${station.y}%`;
                label.style.left = `${station.x - 4}%`;
            } else {
                // Default: based on quadrant
                if (station.x < 50 && station.y < 50) {
                    // Top-left quadrant
                    label.classList.add('label-bottom-right');
                    label.style.top = `${station.y + 3}%`;
                    label.style.left = `${station.x + 3}%`;
                } else if (station.x >= 50 && station.y < 50) {
                    // Top-right quadrant
                    label.classList.add('label-bottom-left');
                    label.style.top = `${station.y + 3}%`;
                    label.style.left = `${station.x - 3}%`;
                } else if (station.x < 50 && station.y >= 50) {
                    // Bottom-left quadrant
                    label.classList.add('label-top-right');
                    label.style.top = `${station.y - 3}%`;
                    label.style.left = `${station.x + 3}%`;
                } else {
                    // Bottom-right quadrant
                    label.classList.add('label-top-left');
                    label.style.top = `${station.y - 3}%`;
                    label.style.left = `${station.x - 3}%`;
                }
            }
            
            // Add to container
            this.metroContainer.appendChild(stationEl);
            this.metroContainer.appendChild(label);
        });
    }
    
    /**
     * Find a station by its ID
     */
    findStationById(id) {
        return this.stations.find(station => station.id === id);
    }
    
    /**
     * Toggle the modal visibility
     */
    toggleModal(show) {
        if (show) {
            this.modalContainer.style.display = 'flex';
            this.modalContainer.style.opacity = '1';
            this.modalContainer.style.pointerEvents = 'all';
        } else {
            this.modalContainer.style.opacity = '0';
            this.modalContainer.style.pointerEvents = 'none';
            setTimeout(() => {
                this.modalContainer.style.display = 'none';
            }, 300);
        }
    }
    
    /**
     * Show station information in the info panel
     */
    showStationInfo(station) {
        // Generate API status message
        let apiStatusMessage = '';
        
        if (station.type !== 'system' && station.type !== 'user' && station.type !== 'response') {
            const hasWorkingAPI = this.workingAPIAgents.includes(station.type);
            
            apiStatusMessage = `<div class="api-status-line">
                <span>API STATUS: </span>
                <span class="${hasWorkingAPI ? 'api-online' : 'api-offline'}">
                    ${hasWorkingAPI ? 'CONNECTED' : 'OFFLINE'}
                </span>
            </div>`;
        }
        
        // Update info panel content
        this.infoContent.innerHTML = `
            <div class="agent-name">${station.label}</div>
            <div class="agent-status">
                STATUS: <span class="${station.status === 'active' ? 'status-active' : 'status-inactive'}">
                    ${station.status === 'active' ? 'ACTIVE' : 'STANDBY'}
                </span>
            </div>
            <div class="agent-description">
                ${this.agentDescriptions[station.type] || 'No description available'}
            </div>
            ${apiStatusMessage}
        `;
    }
    
    /**
     * Update station status (active/inactive)
     */
    updateStationStatus(stationType, isActive) {
        // Find the station
        const station = this.stations.find(s => s.type === stationType);
        if (!station) return;
        
        // Update station data
        station.status = isActive ? 'active' : 'inactive';
        
        // Find the DOM element
        const stationEl = this.metroContainer.querySelector(`.metro-station[data-id="${station.id}"]`);
        if (!stationEl) return;
        
        // Update DOM element
        if (isActive) {
            stationEl.classList.add('active');
        } else {
            stationEl.classList.remove('active');
        }
    }
    
    /**
     * Activate a connection between stations
     */
    activateConnection(fromType, toType) {
        // Find the stations
        const fromStation = this.stations.find(s => s.type === fromType);
        const toStation = this.stations.find(s => s.type === toType);
        if (!fromStation || !toStation) return;
        
        // Find the connection
        const connection = this.connections.find(c => 
            c.from === fromStation.id && c.to === toStation.id
        );
        if (!connection) return;
        
        // Update connection data
        connection.status = 'active';
        
        // Find the DOM element - could be a direct line or a path container
        const lineEl = this.metroContainer.querySelector(`.metro-line[data-from="${connection.from}"][data-to="${connection.to}"], .metro-path[data-from="${connection.from}"][data-to="${connection.to}"]`);
        
        if (!lineEl) return;
        
        // Update DOM element - if it's a path container, update all segments
        if (lineEl.classList.contains('metro-path')) {
            lineEl.classList.add('active');
            const segments = lineEl.querySelectorAll('.metro-line');
            segments.forEach(segment => {
                segment.classList.add('active');
                // Add data flow particles
                this.createParticlesForSegment(segment, connection);
            });
        } else {
            lineEl.classList.add('active');
            // Add data flow particles
            this.addDataFlowParticles(lineEl, connection);
        }
    }
    
    /**
     * Deactivate a connection
     */
    deactivateConnection(fromType, toType) {
        // Find the stations
        const fromStation = this.stations.find(s => s.type === fromType);
        const toStation = this.stations.find(s => s.type === toType);
        if (!fromStation || !toStation) return;
        
        // Find the connection
        const connection = this.connections.find(c => 
            c.from === fromStation.id && c.to === toStation.id
        );
        if (!connection) return;
        
        // Update connection data
        connection.status = 'inactive';
        
        // Find the DOM element - could be a direct line or a path container
        const lineEl = this.metroContainer.querySelector(`.metro-line[data-from="${connection.from}"][data-to="${connection.to}"], .metro-path[data-from="${connection.from}"][data-to="${connection.to}"]`);
        
        if (!lineEl) return;
        
        // Update DOM element - if it's a path container, update all segments
        if (lineEl.classList.contains('metro-path')) {
            lineEl.classList.remove('active');
            const segments = lineEl.querySelectorAll('.metro-line');
            segments.forEach(segment => {
                segment.classList.remove('active');
                // Remove particles
                const particles = segment.querySelectorAll('.data-particle');
                particles.forEach(particle => particle.remove());
            });
        } else {
            lineEl.classList.remove('active');
            // Remove particles
            const particles = lineEl.querySelectorAll('.data-particle');
            particles.forEach(particle => particle.remove());
        }
    }
    
    /**
     * Simulate the activation sequence for a query
     */
    simulateQuery() {
        // Reset first
        this.reset();
        
        // Connection from user to system to orchestrator is already active
        
        // Activate orchestrator immediately
        setTimeout(() => this.updateStationStatus('orchestrator', true), 500);
        
        // Top branch activation
        setTimeout(() => this.activateConnection('orchestrator', 'retriever'), 1000);
        setTimeout(() => this.updateStationStatus('retriever', true), 1500);
        
        setTimeout(() => this.activateConnection('retriever', 'synthesizer'), 2000);
        setTimeout(() => this.updateStationStatus('synthesizer', true), 2500);
        
        setTimeout(() => this.activateConnection('synthesizer', 'critic'), 3000);
        setTimeout(() => this.updateStationStatus('critic', true), 3500);
        
        setTimeout(() => this.activateConnection('critic', 'orchestrator'), 4000);
        
        // Check if query contains code-related keywords for code agent
        const queryInput = document.getElementById('query-input');
        if (queryInput && queryInput.value) {
            const codeKeywords = ['code', 'function', 'script', 'program', 'javascript', 'python', 'html', 'css'];
            const hasCodeKeyword = codeKeywords.some(keyword => 
                queryInput.value.toLowerCase().includes(keyword)
            );
            
            if (hasCodeKeyword) {
                // Activate code branch
                setTimeout(() => this.activateConnection('orchestrator', 'coder'), 4500);
                setTimeout(() => this.updateStationStatus('coder', true), 5000);
                setTimeout(() => this.activateConnection('synthesizer', 'coder'), 5500);
                setTimeout(() => this.activateConnection('coder', 'adapter'), 6000);
            } else {
                // Skip code agent
                setTimeout(() => this.activateConnection('orchestrator', 'adapter'), 4500);
            }
        } else {
            // Skip code agent
            setTimeout(() => this.activateConnection('orchestrator', 'adapter'), 4500);
        }
        
        // Bottom branch completion
        setTimeout(() => this.updateStationStatus('adapter', true), 6500);
        setTimeout(() => this.activateConnection('adapter', 'presenter'), 7000);
        setTimeout(() => this.updateStationStatus('presenter', true), 7500);
        setTimeout(() => this.activateConnection('presenter', 'orchestrator'), 8000);
        
        // Final response
        setTimeout(() => this.activateConnection('orchestrator', 'response'), 8500);
        setTimeout(() => this.updateStationStatus('response', true), 9000);
        
        // Feedback loop for critic to synthesizer
        setTimeout(() => this.activateConnection('critic', 'synthesizer'), 9500);
    }
    
    /**
     * Reset all stations and connections to inactive state
     */
    reset() {
        if (!this.initialized) {
            this.initializeMetroMap();
            return;
        }
        
        // Reset stations
        this.stations.forEach(station => {
            // Skip system prompt node and user query node
            if (station.type === 'system' || station.type === 'user') return;
            
            // Update station data
            station.status = 'inactive';
            
            // Find and update DOM element
            const stationEl = this.metroContainer.querySelector(`.metro-station[data-id="${station.id}"]`);
            if (stationEl) {
                stationEl.classList.remove('active');
            }
        });
        
        // Reset connections
        this.connections.forEach(connection => {
            // Skip system prompt connections and user to system to orchestrator
            if (connection.type === 'system' || 
                (connection.from === 9 && connection.to === 8) ||
                (connection.from === 8 && connection.to === 1)) return;
            
            // Update connection data
            connection.status = 'inactive';
            
            // Find the DOM element - could be direct line or path container
            const lineEl = this.metroContainer.querySelector(`.metro-line[data-from="${connection.from}"][data-to="${connection.to}"], .metro-path[data-from="${connection.from}"][data-to="${connection.to}"]`);
            
            if (!lineEl) return;
            
            // Update DOM element
            if (lineEl.classList.contains('metro-path')) {
                lineEl.classList.remove('active');
                const segments = lineEl.querySelectorAll('.metro-line');
                segments.forEach(segment => {
                    segment.classList.remove('active');
                    // Remove particles
                    const particles = segment.querySelectorAll('.data-particle');
                    particles.forEach(particle => particle.remove());
                });
            } else {
                lineEl.classList.remove('active');
                // Remove particles
                const particles = lineEl.querySelectorAll('.data-particle');
                particles.forEach(particle => particle.remove());
            }
        });
    }
}

// Initialize when the page has loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create a new instance of the MetroVisualizer
    window.metroVisualizer = new MetroVisualizer();
    
    // Add event listener for the query input
    const queryInput = document.getElementById('query-input');
    const submitButton = document.getElementById('submit-query');
    
    if (submitButton) {
        submitButton.addEventListener('click', () => {
            if (window.metroVisualizer && window.metroVisualizer.initialized) {
                window.metroVisualizer.reset();
                window.metroVisualizer.simulateQuery();
            } else if (window.metroVisualizer) {
                window.metroVisualizer.toggleModal(true);
                setTimeout(() => {
                    window.metroVisualizer.simulateQuery();
                }, 1500);
            }
        });
    }
    
    if (queryInput) {
        queryInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (window.metroVisualizer && window.metroVisualizer.initialized) {
                    window.metroVisualizer.reset();
                    window.metroVisualizer.simulateQuery();
                } else if (window.metroVisualizer) {
                    window.metroVisualizer.toggleModal(true);
                    setTimeout(() => {
                        window.metroVisualizer.simulateQuery();
                    }, 1500);
                }
            }
        });
    }
});
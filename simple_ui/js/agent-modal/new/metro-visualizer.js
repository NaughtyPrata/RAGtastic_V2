/**
 * Agent Network Metro-Style Visualizer
 * Improved version with Fallout Vault-Tech aesthetic and GSAP animations
 */

class MetroVisualizer {
    constructor() {
        this.initModal();
        this.createToggleButton();
        this.initialized = false;
        this.workingAPIAgents = ['orchestrator', 'retriever', 'synthesizer', 'critic', 'adapter', 'presenter', 'coder']; // Agents with working API keys
        this.gsapTimelines = {}; // Store GSAP timelines
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
        
        // Create SVG container for connections
        this.connectionsContainer = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.connectionsContainer.setAttribute('class', 'connections-container');
        this.connectionsContainer.setAttribute('width', '100%');
        this.connectionsContainer.setAttribute('height', '100%');
        this.connectionsContainer.style.position = 'absolute';
        this.connectionsContainer.style.top = '0';
        this.connectionsContainer.style.left = '0';
        this.connectionsContainer.style.zIndex = '8';
        this.connectionsContainer.style.pointerEvents = 'none';
        this.networkContainer.appendChild(this.connectionsContainer);
        
        // Create metro map container
        this.metroContainer = document.createElement('div');
        this.metroContainer.className = 'metro-container';
        this.networkContainer.appendChild(this.metroContainer);
        
        // Add grid overlay
        const gridOverlay = document.createElement('div');
        gridOverlay.className = 'grid-overlay';
        this.networkContainer.appendChild(gridOverlay);
        
        // Add grid overlay for enhanced visual effect
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
            { color: '#00585f', label: 'CONDITIONAL PATH', style: 'dotted' }
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
        
        // Directly append to the system monitor header in the right panel
        const systemMonitorHeader = document.querySelector('.system-monitor-header');
        if (systemMonitorHeader) {
            systemMonitorHeader.appendChild(this.toggleButton);
        } else {
            // Try the right panel header as a fallback
            const rightPanelHeader = document.querySelector('.right-panel .panel-header');
            if (rightPanelHeader) {
                rightPanelHeader.appendChild(this.toggleButton);
            } else {
                // Last resort - append to body if all else fails
                document.body.appendChild(this.toggleButton);
            }
        }
    }
    
    /**
     * Initialize the metro map visualization
     */
    initializeMetroMap() {
        // Define all agent names but without rendering the station dots
        this.stations = [
            // Orchestrator (central)
            { id: 1, label: 'Orchestrator Agent', type: 'orchestrator', status: 'active', x: 50, y: 50 },
            
            // Top row - retrieval-related agents
            { id: 2, label: 'Retriever Agent', type: 'retriever', status: 'inactive', x: 20, y: 30 },
            { id: 3, label: 'Synthesizer Agent', type: 'synthesizer', status: 'inactive', x: 50, y: 20 },
            { id: 4, label: 'Critic Agent', type: 'critic', status: 'inactive', x: 80, y: 30 },
            
            // Bottom row - output-related agents
            { id: 5, label: 'Code Agent', type: 'coder', status: 'inactive', x: 20, y: 70 },
            { id: 6, label: 'Persona Adapter', type: 'adapter', status: 'inactive', x: 50, y: 80 },
            { id: 7, label: 'Presentation Agent', type: 'presenter', status: 'inactive', x: 80, y: 70 },
            
            // Input/Output nodes
            { id: 8, label: 'User Query', type: 'user', status: 'active', x: 5, y: 50 },
            { id: 9, label: 'Final Response', type: 'response', status: 'inactive', x: 95, y: 50 }
        ];
        
        // Define connections between stations
        this.connections = [
            // Orchestrator to all agents
            { from: 1, to: 2, type: 'primary', status: 'inactive' }, // Orchestrator to Retriever
            { from: 1, to: 3, type: 'primary', status: 'inactive' }, // Orchestrator to Synthesizer
            { from: 1, to: 4, type: 'primary', status: 'inactive' }, // Orchestrator to Critic
            { from: 1, to: 5, type: 'primary', status: 'inactive' }, // Orchestrator to Code
            { from: 1, to: 6, type: 'primary', status: 'inactive' }, // Orchestrator to Persona
            { from: 1, to: 7, type: 'primary', status: 'inactive' }, // Orchestrator to Presentation
            
            // Direct agent interactions
            { from: 2, to: 3, type: 'primary', status: 'inactive' }, // Retriever to Synthesizer
            { from: 3, to: 4, type: 'primary', status: 'inactive' }, // Synthesizer to Critic
            { from: 4, to: 6, type: 'primary', status: 'inactive' }, // Critic to Persona
            { from: 4, to: 3, type: 'primary', status: 'inactive' }, // Critic to Synthesizer (feedback loop)
            { from: 6, to: 7, type: 'primary', status: 'inactive' }, // Persona to Presentation
            
            // Conditional interactions
            { from: 5, to: 3, type: 'conditional', status: 'inactive' }, // Code to Synthesizer
            { from: 5, to: 4, type: 'conditional', status: 'inactive' }, // Code to Critic
            
            // User to Orchestrator and Presentation to Final Response
            { from: 8, to: 1, type: 'primary', status: 'inactive' }, // User to Orchestrator
            { from: 7, to: 9, type: 'primary', status: 'inactive' }  // Presentation to Final Response
        ];
        
        // Agent descriptions
        this.agentDescriptions = {
            orchestrator: 'Central coordination node that manages the entire agent workflow. Routes user queries to specialized agents and controls the information flow between them. Makes strategic decisions about which agents to activate based on query content.',
            retriever: 'Specialized in retrieving relevant documents, context, and entities from knowledge sources. Provides the factual foundation needed for accurate responses.',
            synthesizer: 'Processes retrieved information and combines it with user instructions to generate coherent content and answers. Core content generation component that handles the initial draft.',
            critic: 'Reviews and validates content for accuracy, quality, and adherence to guidelines. Provides feedback to the Synthesizer for content refinement in a feedback loop to improve quality.',
            coder: 'Generates, reviews, and debugs code when programming tasks are requested. Provides specialized code content to both Synthesizer and Critic agents for integration or validation.',
            adapter: 'Adapts generated content to match specified persona characteristics, tone, and style requirements. Ensures consistent voice and presentation across outputs.',
            presenter: 'Formats and prepares the final content for optimal presentation to the user. Handles formatting, styling, and delivery of the final response with appropriate structure.',
            user: 'Entry point for user queries that initiates the agent workflow. All processing begins here with the user\'s natural language input.',
            response: 'Final output point where processed, validated, and formatted content is delivered back to the user.'
        };
        
        // Clear any existing elements
        this.metroContainer.innerHTML = '';
        
        // Create stations
        this.createStations();
        
        // Create metro lines after stations (so they appear behind stations)
        this.createMetroLines();
        
        // Add floating animation to stations
        this.animateStations();
        
        // Setup GSAP animations
        this.setupAnimations();
        
        // Hide loading overlay after a short delay
        setTimeout(() => {
            this.loadingOverlay.style.display = 'none';
            this.initialized = true;
        }, 1500);
    }
    
    /**
     * Create metro lines (connections between stations) using SVG
     */
    createMetroLines() {
        // Clear existing connections
        while (this.connectionsContainer.firstChild) {
            this.connectionsContainer.removeChild(this.connectionsContainer.firstChild);
        }
        
        this.connections.forEach((connection, index) => {
            const fromStation = this.findStationById(connection.from);
            const toStation = this.findStationById(connection.to);
            
            if (!fromStation || !toStation) return;
            
            // Create an SVG line element
            const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            line.setAttribute('id', `connection-${index}`);
            line.setAttribute('class', `connection-line ${connection.type}`);
            
            // Set initial line positions - will be updated in updateConnectionLines
            line.setAttribute('x1', `${fromStation.x}%`);
            line.setAttribute('y1', `${fromStation.y}%`);
            line.setAttribute('x2', `${toStation.x}%`);
            line.setAttribute('y2', `${toStation.y}%`);
            
            // Store the connection data as attributes
            line.setAttribute('data-from', connection.from);
            line.setAttribute('data-to', connection.to);
            line.setAttribute('data-status', connection.status);
            line.setAttribute('data-type', connection.type);
            
            // Add styling based on connection type according to legend
            if (connection.type === 'conditional') {
                line.setAttribute('stroke', '#00585f'); // Conditional Path color
                line.setAttribute('stroke-width', '0.75'); // Thinner line
                line.setAttribute('stroke-dasharray', '3,3'); // Dotted line
            } else if (connection.type === 'active') {
                line.setAttribute('stroke', 'var(--vault-yellow)'); // Active line color
                line.setAttribute('stroke-width', '1'); // Slightly thicker
                line.setAttribute('filter', 'drop-shadow(0 0 5px var(--vault-yellow))');
            } else if (connection.type === 'primary') {
                line.setAttribute('stroke', 'var(--vault-yellow)'); // PRIMARY CONNECTION color
                line.setAttribute('stroke-width', '0.75'); // Thinner line
            } else if (connection.type === 'secondary') {
                line.setAttribute('stroke', 'var(--pip-green)'); // SECONDARY CONNECTION color
                line.setAttribute('stroke-width', '0.5'); // Thinnest line
            }
            
            // Add the line to the SVG container
            this.connectionsContainer.appendChild(line);
        });
    }
    
    /**
     * Update the positions of connection lines based on station positions
     */
    updateConnectionLines() {
        this.connections.forEach((connection, index) => {
            const fromStation = this.findStationById(connection.from);
            const toStation = this.findStationById(connection.to);
            
            if (!fromStation || !toStation) return;
            
            // Find the corresponding SVG line element
            const line = document.getElementById(`connection-${index}`);
            if (!line) return;
            
            // Update the line position
            line.setAttribute('x1', `${fromStation.x}%`);
            line.setAttribute('y1', `${fromStation.y}%`);
            line.setAttribute('x2', `${toStation.x}%`);
            line.setAttribute('y2', `${toStation.y}%`);
        });
    }
    
    /**
     * Create a direct straight path between stations
     */
    createDirectPath(fromStation, toStation, type) {
        const path = document.createElement('div');
        path.className = 'metro-line';
        
        // Get station positions
        const x1 = fromStation.x;
        const y1 = fromStation.y;
        const x2 = toStation.x;
        const y2 = toStation.y;
        
        // Calculate length and angle for straight line
        const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;
        
        path.style.width = `${length}%`;
        path.style.height = '3px';
        path.style.left = `${x1}%`;
        path.style.top = `${y1}%`;
        path.style.transform = `rotate(${angle}deg)`;
        
        // For conditional paths, make them dashed
        if (type === 'conditional') {
            path.classList.add('dashed');
        }
        
        return path;
    }
    
    /**
     * Create a metro-style path with right angles
     */
    createMetroStylePath(fromStation, toStation, type) {
        const pathElement = document.createElement('div');
        pathElement.className = 'metro-path';
        
        // Get station positions
        const x1 = fromStation.x;
        const y1 = fromStation.y;
        const x2 = toStation.x;
        const y2 = toStation.y;
        
        // Determine if horizontal or vertical dominant
        if (Math.abs(x1 - x2) > Math.abs(y1 - y2)) {
            // Horizontal dominant - create path with horizontal segment first
            
            // First segment (horizontal)
            const firstSegment = document.createElement('div');
            firstSegment.className = 'metro-line';
            firstSegment.style.width = `${Math.abs(x2 - x1)}%`;
            firstSegment.style.height = '3px';
            firstSegment.style.left = `${Math.min(x1, x2)}%`;
            firstSegment.style.top = `${y1}%`;
            
            // Second segment (vertical)
            const secondSegment = document.createElement('div');
            secondSegment.className = 'metro-line vertical';
            secondSegment.style.height = `${Math.abs(y2 - y1)}%`;
            secondSegment.style.width = '3px';
            secondSegment.style.left = `${x2}%`;
            secondSegment.style.top = `${Math.min(y1, y2)}%`;
            
            // Add classes
            if (type === 'conditional') {
                firstSegment.classList.add('dashed');
                secondSegment.classList.add('dashed');
            } else {
                firstSegment.classList.add(type);
                secondSegment.classList.add(type);
            }
            
            pathElement.appendChild(firstSegment);
            pathElement.appendChild(secondSegment);
        } else {
            // Vertical dominant - create path with vertical segment first
            
            // First segment (vertical)
            const firstSegment = document.createElement('div');
            firstSegment.className = 'metro-line vertical';
            firstSegment.style.height = `${Math.abs(y2 - y1)}%`;
            firstSegment.style.width = '3px';
            firstSegment.style.left = `${x1}%`;
            firstSegment.style.top = `${Math.min(y1, y2)}%`;
            
            // Second segment (horizontal)
            const secondSegment = document.createElement('div');
            secondSegment.className = 'metro-line';
            secondSegment.style.width = `${Math.abs(x2 - x1)}%`;
            secondSegment.style.height = '3px';
            secondSegment.style.left = `${Math.min(x1, x2)}%`;
            secondSegment.style.top = `${y2}%`;
            
            // Add classes
            if (type === 'conditional') {
                firstSegment.classList.add('dashed');
                secondSegment.classList.add('dashed');
            } else {
                firstSegment.classList.add(type);
                secondSegment.classList.add(type);
            }
            
            pathElement.appendChild(firstSegment);
            pathElement.appendChild(secondSegment);
        }
        
        return pathElement;
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
     * Add orbital animation to station nodes
     */
    animateStations() {
        // Get the orchestrator agent as the center of the orbital system
        const orchestratorStation = this.stations.find(s => s.type === 'orchestrator');
        if (!orchestratorStation) return;
        
        // Get center point of the orbital system
        const centerX = orchestratorStation.x;
        const centerY = orchestratorStation.y;
        
        // Reference to the center for calculations
        const center = { x: centerX, y: centerY };
        
        // Initialize each agent's orbital parameters
        this.stations.forEach((station, index) => {
            // Skip the center (orchestrator) and fixed points (user/response)
            if (station.type === 'orchestrator' || 
                station.type === 'user' || 
                station.type === 'response') return;
            
            // Get station elements
            const stationEl = document.getElementById(`station-${station.id}`);
            const labelEl = document.getElementById(`label-${station.id}`);
            if (!stationEl) return;
            
            // Calculate distance from center
            const dx = station.x - centerX;
            const dy = station.y - centerY;
            const baseDistance = Math.sqrt(dx * dx + dy * dy);
            const initialAngle = Math.atan2(dy, dx);
            
            // Set parameters based on agent type - different speeds and variations
            let rotationSpeed;
            switch (index % 6) {
                case 0: // Medium
                    rotationSpeed = 0.02 + (Math.random() * 0.01);
                    break;
                case 1: // Medium-fast
                    rotationSpeed = 0.025 + (Math.random() * 0.01);
                    break;
                case 2: // Fast
                    rotationSpeed = 0.03 + (Math.random() * 0.01);
                    break;
                case 3: // Faster
                    rotationSpeed = 0.035 + (Math.random() * 0.01);
                    break;
                case 4: // Very fast
                    rotationSpeed = 0.04 + (Math.random() * 0.01);
                    break;
                default:
                    rotationSpeed = 0.03 + (Math.random() * 0.01);
            }
            
            // Calculate distance variation
            let maxVariationPercent;
            switch (index % 4) {
                case 0: // Minimal elliptical path
                    maxVariationPercent = 0.04;
                    break;
                case 1: // Moderate elliptical path
                    maxVariationPercent = 0.06;
                    break;
                case 2: // Significant elliptical path
                    maxVariationPercent = 0.08;
                    break;
                case 3: // Maximum elliptical path
                    maxVariationPercent = 0.1;
                    break;
                default:
                    maxVariationPercent = 0.05;
            }
            const distanceVariation = baseDistance * maxVariationPercent;
            
            // Set distance speed
            let distanceSpeed;
            switch (index % 3) {
                case 0: // Fast distance variation
                    distanceSpeed = 0.01 + (Math.random() * 0.005);
                    break;
                case 1: // Faster distance variation
                    distanceSpeed = 0.015 + (Math.random() * 0.005);
                    break;
                case 2: // Very fast distance variation
                    distanceSpeed = 0.02 + (Math.random() * 0.005);
                    break;
                default:
                    distanceSpeed = 0.015 + (Math.random() * 0.005);
            }
            
            // Alternate clockwise/counterclockwise
            const direction = index % 2 === 0 ? 1 : -1;
            
            // Store these parameters with the station
            station._orbital = {
                angle: initialAngle,
                rotationSpeed: rotationSpeed,
                baseDistance: baseDistance,
                distanceVariation: distanceVariation,
                distanceSpeed: distanceSpeed,
                timeOffset: Math.random() * Math.PI * 2, // Random phase offset
                direction: direction
            };
            
            // Start the orbital animation
            this.animateOrbitalStation(station, stationEl, labelEl, center);
        });
        
        // Add ticker to constantly update connection lines
        gsap.ticker.add(() => this.updateConnectionLines());
    }
    
    /**
     * Animate a single station in orbit
     */
    animateOrbitalStation(station, stationEl, labelEl, center) {
        const params = station._orbital;
        if (!params) return;
        
        gsap.to(params, {
            angle: params.angle + (Math.PI * 2 * params.direction), // Full circle in the specified direction
            duration: Math.PI * 2 / params.rotationSpeed, // Time for a full circle
            ease: "none",
            repeat: -1,
            onUpdate: () => {
                // Calculate distance using sine wave for elliptical orbit
                const distanceFactor = Math.sin((gsap.ticker.time * params.distanceSpeed) + params.timeOffset);
                const currentDistance = params.baseDistance + (distanceFactor * params.distanceVariation);
                
                // Calculate new position
                const newX = center.x + Math.cos(params.angle) * currentDistance;
                const newY = center.y + Math.sin(params.angle) * currentDistance;
                
                // Update station position
                station.x = newX;
                station.y = newY;
                
                // Update station element position
                gsap.set(stationEl, {
                    left: `${newX}%`,
                    top: `${newY}%`
                });
                
                // Update label position
                if (labelEl) {
                    gsap.set(labelEl, {
                        left: `${newX}%`,
                        top: `${newY}%`
                    });
                }
            }
        });
    }
    
    /**
     * Create metro stations with both dots and labels
     */
    createStations() {
        this.stations.forEach(station => {
            // Create station dot
            const stationEl = document.createElement('div');
            stationEl.className = `metro-station ${station.type}`;
            stationEl.id = `station-${station.id}`;
            stationEl.dataset.id = station.id;
            
            // Add API status class if applicable
            if (this.workingAPIAgents.includes(station.type)) {
                stationEl.classList.add('api-working');
            }
            
            // Add active class if station is active
            if (station.status === 'active') {
                stationEl.classList.add('active');
            }
            
            // Position the station
            stationEl.style.top = `${station.y}%`;
            stationEl.style.left = `${station.x}%`;
            
            // Add event listener to show station info when clicked
            stationEl.addEventListener('click', () => this.showStationInfo(station));
            
            // Create the label
            const label = document.createElement('div');
            label.className = 'station-label';
            label.textContent = station.label;
            label.id = `label-${station.id}`;
            
            // Position the label based on station position
            label.style.top = `${station.y}%`;
            label.style.left = `${station.x}%`;
            
            // Adjust label position based on station position
            if (station.y < 30) {
                label.classList.add('label-top');
            } else if (station.y > 70) {
                label.classList.add('label-bottom');
            } else if (station.x < 30) {
                label.classList.add('label-left');
            } else if (station.x > 70) {
                label.classList.add('label-right');
            } else {
                // Default positioning for central stations
                label.classList.add('label-bottom');
            }
            
            // Add to container
            this.metroContainer.appendChild(stationEl);
            this.metroContainer.appendChild(label);
        });
    }
    
    /**
     * Setup GSAP animations for nodes and connections
     */
    setupAnimations() {
        // Create pulse animation for API active nodes
        this.stations.forEach(station => {
            if (this.workingAPIAgents.includes(station.type)) {
                const stationEl = document.getElementById(`station-${station.id}`);
                
                // Create timeline for this station
                const timeline = gsap.timeline({
                    repeat: -1, 
                    yoyo: true
                });
                
                // Add animation to timeline
                timeline.to(stationEl, {
                    boxShadow: '0 0 15px var(--vault-yellow), 0 0 25px #00ffaa',
                    duration: 1.5,
                    ease: "sine.inOut"
                });
                
                // Store timeline
                this.gsapTimelines[`station-${station.id}`] = timeline;
            }
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
        
        if (station.type !== 'user' && station.type !== 'response') {
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
     * Simulate the activation sequence for a query using GSAP
     */
    simulateQuery() {
        // Reset first
        this.reset();
        
        // Create a master timeline for the simulation
        const masterTimeline = gsap.timeline();
        
        // User to Orchestrator
        masterTimeline.call(() => this.activateConnection(8, 1), [], 0.5);
        
        // Activate orchestrator immediately
        masterTimeline.call(() => this.updateStationStatus('orchestrator', true), [], 1.0);
        
        // Orchestrator to Retriever
        masterTimeline.call(() => this.activateConnection(1, 2), [], 1.5);
        masterTimeline.call(() => this.updateStationStatus('retriever', true), [], 2.0);
        
        // Retriever to Synthesizer
        masterTimeline.call(() => this.activateConnection(2, 3), [], 2.5);
        masterTimeline.call(() => this.updateStationStatus('synthesizer', true), [], 3.0);
        
        // Synthesizer to Critic
        masterTimeline.call(() => this.activateConnection(3, 4), [], 3.5);
        masterTimeline.call(() => this.updateStationStatus('critic', true), [], 4.0);
        
        // Check if query contains code-related keywords for code agent
        const queryInput = document.getElementById('query-input');
        if (queryInput && queryInput.value) {
            const codeKeywords = ['code', 'function', 'script', 'program', 'javascript', 'python', 'html', 'css'];
            const hasCodeKeyword = codeKeywords.some(keyword => 
                queryInput.value.toLowerCase().includes(keyword)
            );
            
            if (hasCodeKeyword) {
                // Activate code branch
                masterTimeline.call(() => this.activateConnection(1, 5), [], 4.5); // Orchestrator to Code
                masterTimeline.call(() => this.updateStationStatus('coder', true), [], 5.0);
                masterTimeline.call(() => this.activateConnection(5, 3), [], 5.5); // Code to Synthesizer
                masterTimeline.call(() => this.activateConnection(5, 4), [], 6.0); // Code to Critic
            }
        }
        
        // Critic to Persona (happens whether code is involved or not)
        masterTimeline.call(() => this.activateConnection(4, 6), [], 6.5);
        masterTimeline.call(() => this.updateStationStatus('adapter', true), [], 7.0);
        
        // Persona to Presentation
        masterTimeline.call(() => this.activateConnection(6, 7), [], 7.5);
        masterTimeline.call(() => this.updateStationStatus('presenter', true), [], 8.0);
        
        // Presentation to Response
        masterTimeline.call(() => this.activateConnection(7, 9), [], 8.5);
        masterTimeline.call(() => this.updateStationStatus('response', true), [], 9.0);
        
        // Feedback loop for critic to synthesizer
        masterTimeline.call(() => this.activateConnection(4, 3), [], 9.5); // Critic to Synthesizer feedback
        
        // Play the master timeline
        masterTimeline.play();
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
        
        // Use GSAP to animate the activation
        if (isActive) {
            gsap.to(stationEl, {
                boxShadow: '0 0 20px var(--vault-yellow)',
                scale: 1.1,
                duration: 0.5,
                onComplete: () => {
                    stationEl.classList.add('active');
                    gsap.to(stationEl, {
                        scale: 1,
                        duration: 0.3
                    });
                }
            });
        } else {
            gsap.to(stationEl, {
                boxShadow: '0 0 5px rgba(95, 253, 126, 0.5)',
                duration: 0.5,
                onComplete: () => {
                    stationEl.classList.remove('active');
                }
            });
        }
    }
    
    /**
     * Activate a connection between stations
     */
    activateConnection(fromId, toId) {
        // Find the connection and its index
        const connectionIndex = this.connections.findIndex(c => 
            c.from === fromId && c.to === toId
        );
        if (connectionIndex === -1) return;
        
        const connection = this.connections[connectionIndex];
        
        // Update connection data
        connection.status = 'active';
        
        // Find the SVG line element
        const lineId = `connection-${connectionIndex}`;
        const lineEl = document.getElementById(lineId);
        
        if (!lineEl) return;
        
        // Animate the connection activation with GSAP
        gsap.fromTo(lineEl, 
            { 
                opacity: 0.3,
                strokeWidth: 0.75,
                stroke: 'var(--pip-green)'
            },
            { 
                opacity: 1,
                strokeWidth: 1,
                stroke: 'var(--vault-yellow)',
                duration: 0.5,
                onComplete: () => {
                    // Update the line's appearance
                    lineEl.setAttribute('class', 'connection-line active');
                    lineEl.setAttribute('data-status', 'active');
                    lineEl.setAttribute('filter', 'drop-shadow(0 0 5px var(--vault-yellow))');
                    
                    // Create animated particles along the line
                    this.createFlowingParticle(fromId, toId);
                }
            }
        );
    }
    
    /**
     * Create an animated particle flowing along a connection line
     */
    createFlowingParticle(fromId, toId) {
        const connectionIndex = this.connections.findIndex(c => 
            c.from === fromId && c.to === toId
        );
        if (connectionIndex === -1) return;
        
        const line = document.getElementById(`connection-${connectionIndex}`);
        if (!line) return;
        
        // Create a circle element that will move along the line
        const particle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        particle.setAttribute('class', 'flow-particle');
        particle.setAttribute('r', '1'); // Even smaller particle
        particle.setAttribute('fill', 'var(--vault-yellow)');
        particle.setAttribute('filter', 'drop-shadow(0 0 1px var(--vault-yellow))');
        
        // Add the particle to the SVG container
        this.connectionsContainer.appendChild(particle);
        
        // Animate the particle along the line
        const x1 = parseFloat(line.getAttribute('x1'));
        const y1 = parseFloat(line.getAttribute('y1'));
        const x2 = parseFloat(line.getAttribute('x2'));
        const y2 = parseFloat(line.getAttribute('y2'));
        
        // Calculate total animation distance
        const dist = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        
        // Create a timeline for the particle animation
        const timeline = gsap.timeline({
            repeat: 2,
            onComplete: () => {
                // Remove the particle when animation completes
                if (particle.parentNode) {
                    particle.parentNode.removeChild(particle);
                }
            }
        });
        
        // Initial position
        gsap.set(particle, { 
            attr: { cx: `${x1}%`, cy: `${y1}%` },
            opacity: 0
        });
        
        // Animation sequence
        timeline
            .to(particle, { opacity: 1, duration: 0.2 })
            .to(particle, {
                attr: { cx: `${x2}%`, cy: `${y2}%` },
                duration: 1 + (dist / 100), // Duration based on distance
                ease: "none"
            })
            .to(particle, { opacity: 0, duration: 0.2 });
    }
    
    /**
     * Deactivate a connection
     */
    deactivateConnection(fromId, toId) {
        // Find the connection and its index
        const connectionIndex = this.connections.findIndex(c => 
            c.from === fromId && c.to === toId
        );
        if (connectionIndex === -1) return;
        
        const connection = this.connections[connectionIndex];
        
        // Update connection data
        connection.status = 'inactive';
        
        // Find the SVG line element
        const lineId = `connection-${connectionIndex}`;
        const lineEl = document.getElementById(lineId);
        
        if (!lineEl) return;
        
        // Animate the deactivation with GSAP
        gsap.to(lineEl, {
            opacity: 0.7,
            strokeWidth: 0.5,
            stroke: 'var(--pip-green)',
            filter: 'none',
            duration: 0.5,
            onComplete: () => {
                // Update the line's appearance
                lineEl.setAttribute('class', `connection-line ${connection.type}`);
                lineEl.setAttribute('data-status', 'inactive');
                
                // Remove any flowing particles
                const particles = this.connectionsContainer.querySelectorAll('.flow-particle');
                particles.forEach(particle => {
                    gsap.to(particle, {
                        opacity: 0,
                        duration: 0.3,
                        onComplete: () => {
                            if (particle.parentNode) {
                                particle.parentNode.removeChild(particle);
                            }
                        }
                    });
                });
            }
        });
    }
    
    /**
     * Reset all stations and connections to inactive state
     */
    reset() {
        if (!this.initialized) {
            this.initializeMetroMap();
            return;
        }
        
        // Kill all existing GSAP animations
        gsap.killAll();
        
        // Reset stations
        this.stations.forEach(station => {
            // Skip user query nodes
            if (station.type === 'user') return;
            
            // Update station data
            station.status = station.type === 'orchestrator' ? 'active' : 'inactive';
            
            // Find and update DOM element
            const stationEl = document.getElementById(`station-${station.id}`);
            if (stationEl) {
                if (station.type === 'orchestrator') {
                    stationEl.classList.add('active');
                } else {
                    stationEl.classList.remove('active');
                    
                    // Reset any GSAP properties
                    gsap.set(stationEl, {
                        boxShadow: '0 0 5px rgba(95, 253, 126, 0.5)',
                        scale: 1
                    });
                }
            }
        });
        
        // Reset connections
        this.connections.forEach((connection, index) => {
            // Skip user to orchestrator connection if it exists
            if (connection.from === 8 && connection.to === 1) return;
            
            // Update connection data
            connection.status = 'inactive';
            
            // Find the SVG line element
            const lineEl = document.getElementById(`connection-${index}`);
            if (!lineEl) return;
            
            // Reset the element
            lineEl.setAttribute('class', `connection-line ${connection.type}`);
            lineEl.setAttribute('data-status', 'inactive');
            
            // Set appropriate style based on connection type
            if (connection.type === 'conditional') {
                lineEl.setAttribute('stroke', '#00585f');
                lineEl.setAttribute('stroke-width', '0.75');
                lineEl.setAttribute('stroke-dasharray', '3,3');
            } else if (connection.type === 'primary') {
                lineEl.setAttribute('stroke', 'var(--vault-yellow)');
                lineEl.setAttribute('stroke-width', '0.75');
            } else if (connection.type === 'secondary') {
                lineEl.setAttribute('stroke', 'var(--pip-green)');
                lineEl.setAttribute('stroke-width', '0.5');
            } else {
                lineEl.setAttribute('stroke', 'var(--pip-green)');
                lineEl.setAttribute('stroke-width', '0.5');
            }
            
            lineEl.setAttribute('filter', 'none');
            lineEl.setAttribute('opacity', '0.7');
        });
        
        // Remove all flow particles
        const particles = this.connectionsContainer.querySelectorAll('.flow-particle');
        particles.forEach(particle => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        });
        
        // Restart API status animations
        this.setupAnimations();
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
/**
 * Simple Agent Network Modal
 * Stripped down version of the metro visualizer for quick implementation
 */

document.addEventListener('DOMContentLoaded', function() {
    // Get DOM elements
    const modal = document.getElementById('agent-network-modal');
    const modalButton = document.getElementById('agent-network-btn');
    const closeButton = document.querySelector('.agent-network-close');
    const loadingOverlay = document.querySelector('.loading-overlay');
    
    // Open modal when button is clicked
    modalButton.addEventListener('click', function() {
        openModal();
        // Simulate initialization delay
        setTimeout(() => {
            loadingOverlay.classList.add('hidden');
            initializeMetroMap();
        }, 1500);
    });
    
    // Close modal when close button is clicked
    closeButton.addEventListener('click', function() {
        closeModal();
    });
    
    // Close modal when clicking outside of content
    modal.addEventListener('click', function(event) {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    // Function to open modal - using classList instead of style properties
    function openModal() {
        modal.classList.add('show');
    }
    
    // Function to close modal - using classList instead of style properties
    function closeModal() {
        modal.classList.remove('show');
    }
    
    // Global variable to store connections data
    let connections = [];
    
    // Mock function to initialize the metro map visualization
    function initializeMetroMap() {
        const metroContainer = document.querySelector('.metro-container');
        const connectionsContainer = document.querySelector('.connections-container');
        const infoContent = document.querySelector('.info-content');
        
        // Clear containers
        metroContainer.innerHTML = '';
        
        // Clear SVG connections
        while (connectionsContainer.firstChild) {
            connectionsContainer.removeChild(connectionsContainer.firstChild);
        }
        
        // Define sample agents
        const agents = [
            { id: 1, label: 'Orchestrator Agent', type: 'orchestrator', x: 50, y: 50, active: true },
            { id: 2, label: 'Retriever Agent', type: 'retriever', x: 20, y: 30, active: false },
            { id: 3, label: 'Synthesizer Agent', type: 'synthesizer', x: 50, y: 20, active: false },
            { id: 4, label: 'Critic Agent', type: 'critic', x: 80, y: 30, active: false },
            { id: 5, label: 'Presentation Agent', type: 'presenter', x: 80, y: 70, active: false },
            { id: 6, label: 'User Query', type: 'user', x: 5, y: 50, active: true },
            { id: 7, label: 'Final Response', type: 'response', x: 95, y: 50, active: false }
        ];
        
        // Define connections (using the global connections variable)
        connections = [
            { from: 1, to: 2 }, // Orchestrator to Retriever
            { from: 1, to: 3 }, // Orchestrator to Synthesizer
            { from: 1, to: 4 }, // Orchestrator to Critic
            { from: 1, to: 5 }, // Orchestrator to Presentation
            { from: 2, to: 3 }, // Retriever to Synthesizer
            { from: 3, to: 4 }, // Synthesizer to Critic
            { from: 4, to: 5 }, // Critic to Presentation (if approved)
            { from: 4, to: 2 }, // Critic back to Retriever (if rejected for refinement)
            { from: 6, to: 1 }, // User to Orchestrator
            { from: 5, to: 7 }  // Presentation to Final Response
        ];
        
        // Create SVG connections
        connections.forEach((connection, index) => {
            const fromAgent = agents.find(a => a.id === connection.from);
            const toAgent = agents.find(a => a.id === connection.to);
            
            if (fromAgent && toAgent) {
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('id', `connection-${index}`);
                line.setAttribute('x1', `${fromAgent.x}%`);
                line.setAttribute('y1', `${fromAgent.y}%`);
                line.setAttribute('x2', `${toAgent.x}%`);
                line.setAttribute('y2', `${toAgent.y}%`);
                line.setAttribute('stroke', 'var(--pip-green)');
                line.setAttribute('stroke-width', '0.75');
                line.setAttribute('opacity', '0.7');
                
                connectionsContainer.appendChild(line);
                
                // Flow particles removed as they weren't working properly
            }
        });
        
        // Create agent nodes with orbital animation
        agents.forEach((agent, index) => {
            // Skip animation for central points
            const isFixed = agent.type === 'orchestrator' || agent.type === 'user' || agent.type === 'response';
            
            // Create station dot
            const stationEl = document.createElement('div');
            stationEl.className = `metro-station ${agent.type}`;
            stationEl.id = `station-${agent.id}`;
            stationEl.dataset.type = agent.type;
            stationEl.dataset.posX = agent.x;
            stationEl.dataset.posY = agent.y;
            
            if (agent.active) {
                stationEl.classList.add('active');
            }
            
            // Position - still need these for dynamic movement
            stationEl.style.top = `${agent.y}%`;
            stationEl.style.left = `${agent.x}%`;
            
            // Add click event
            stationEl.addEventListener('click', () => showAgentInfo(agent));
            
            // Create label
            const label = document.createElement('div');
            label.className = 'station-label';
            label.textContent = agent.label;
            label.id = `label-${agent.id}`;
            label.dataset.forType = agent.type;
            label.dataset.posX = agent.x;
            label.dataset.posY = agent.y;
            
            // Position label - still need these for dynamic movement
            label.style.top = `${agent.y}%`;
            label.style.left = `${agent.x}%`;
            
            // Add to container
            metroContainer.appendChild(stationEl);
            metroContainer.appendChild(label);
            
            // Add orbital animation for non-fixed points
            if (!isFixed) {
                addOrbitalAnimation(agent, stationEl, label);
            }
        });
        
        // Simulate query flow after 3 seconds
        setTimeout(() => {
            simulateQueryFlow();
        }, 3000);
        
        // Start GSAP ticker to continuously update connection lines
        gsap.ticker.add(updateConnectionLines);
    }
    
    // Removed particle flow animation as it wasn't working correctly
    
    // Add orbital animation to a station
    function addOrbitalAnimation(agent, stationEl, labelEl) {
        // Center point (orchestrator)
        const center = { x: 50, y: 50 };
        
        // Calculate distance from center and angle
        const dx = agent.x - center.x;
        const dy = agent.y - center.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const baseAngle = Math.atan2(dy, dx);
        
        // Animation parameters - randomize for variation
        const speed = 0.00005 + (Math.random() * 0.00005); // Speed of orbit
        const variation = distance * 0.1; // Distance variation
        const startTime = Date.now();
        const startOffset = Math.random() * Math.PI * 2; // Random starting point
        
        function updatePosition() {
            const elapsed = Date.now() - startTime;
            const angle = baseAngle + (speed * elapsed);
            
            // Add distance variation using sine
            const distVariation = Math.sin(elapsed * 0.0005) * variation;
            const currentDistance = distance + distVariation;
            
            // Calculate new position
            const newX = center.x + Math.cos(angle) * currentDistance;
            const newY = center.y + Math.sin(angle) * currentDistance;
            
            // Update station position
            stationEl.style.left = `${newX}%`;
            stationEl.style.top = `${newY}%`;
            
            // Update label position
            labelEl.style.left = `${newX}%`;
            labelEl.style.top = `${newY}%`;
            
            // Update agent data
            agent.x = newX;
            agent.y = newY;
            
            // Update connection lines
            updateConnectionLines();
            
            // Continue animation
            requestAnimationFrame(updatePosition);
        }
        
        requestAnimationFrame(updatePosition);
    }
    
    // Function to update connection lines based on current node positions
    function updateConnectionLines() {
        // Get all connections
        const lines = document.querySelectorAll('.connections-container line');
        if (!lines.length) return;
        
        // Get all stations
        const stations = document.querySelectorAll('.metro-station');
        if (!stations.length) return;
        
        // For each line, find the corresponding stations and update line positions
        lines.forEach(line => {
            // Get station IDs from the line's ID (connection-X)
            const lineId = line.id;
            const connectionIndex = parseInt(lineId.split('-')[1], 10);
            if (isNaN(connectionIndex)) return;
            
            // Find the agents connected by this line
            const fromElement = document.getElementById(`station-${connections[connectionIndex].from}`);
            const toElement = document.getElementById(`station-${connections[connectionIndex].to}`);
            
            if (!fromElement || !toElement) return;
            
            // Get station positions
            const fromRect = fromElement.getBoundingClientRect();
            const toRect = toElement.getBoundingClientRect();
            
            // Get the SVG container dimensions for coordinate conversion
            const svgRect = line.ownerSVGElement.getBoundingClientRect();
            
            // Calculate center points of stations
            const fromCenter = {
                x: fromRect.left + (fromRect.width / 2),
                y: fromRect.top + (fromRect.height / 2)
            };
            
            const toCenter = {
                x: toRect.left + (toRect.width / 2),
                y: toRect.top + (toRect.height / 2)
            };
            
            // Convert to SVG coordinate percentages
            const x1 = ((fromCenter.x - svgRect.left) / svgRect.width) * 100;
            const y1 = ((fromCenter.y - svgRect.top) / svgRect.height) * 100;
            const x2 = ((toCenter.x - svgRect.left) / svgRect.width) * 100;
            const y2 = ((toCenter.y - svgRect.top) / svgRect.height) * 100;
            
            // Update the line position
            line.setAttribute('x1', `${x1}%`);
            line.setAttribute('y1', `${y1}%`);
            line.setAttribute('x2', `${x2}%`);
            line.setAttribute('y2', `${y2}%`);
        });
    }
    
    // Simulate the query flow through the network
    function simulateQueryFlow() {
        const flow = [
            { from: 8, to: 1 }, // User to Orchestrator
            { from: 1, to: 2 }, // Orchestrator to Retriever
            { from: 2, to: 3 }, // Retriever to Synthesizer
            { from: 3, to: 4 }, // Synthesizer to Critic
            
            // Add refinement loop - Critic rejects and sends back to Retriever
            { from: 4, to: 2 }, // Critic back to Retriever (rejection/refinement)
            { from: 2, to: 3 }, // Retriever to Synthesizer (second attempt)
            { from: 3, to: 4 }, // Synthesizer to Critic (second review)
            
            // Now the response is approved
            { from: 4, to: 5 }, // Critic to Presenter (approval)
            { from: 5, to: 7 }  // Presenter to Response
        ];
        
        // Keep track of refinement iteration
        let criticsIterationCount = 0;
        
        flow.forEach((conn, index) => {
            setTimeout(() => {
                // Check if this is the critic to retriever refinement path
                let options = {};
                if (conn.from === 4 && conn.to === 2) {
                    criticsIterationCount++;
                    options.iteration = criticsIterationCount;
                }
                
                // Activate the connection line
                activateConnection(conn.from, conn.to, options);
                
                // Activate the destination node
                if (index < flow.length - 1) {
                    setTimeout(() => {
                        activateNode(conn.to);
                    }, 500);
                }
            }, index * 1000); // Stagger each activation by 1 second
        });
    }
    
    // Activate a connection between nodes
    function activateConnection(fromId, toId, options = {}) {
        // Find the connection line in SVG
        const lines = document.querySelectorAll('.connections-container line');
        let line;
        
        for (let i = 0; i < lines.length; i++) {
            const l = lines[i];
            const nodes = document.querySelectorAll('.metro-station');
            
            // Find from/to coordinates
            let fromNode, toNode;
            for (let j = 0; j < nodes.length; j++) {
                const node = nodes[j];
                if (node.id === `station-${fromId}`) {
                    fromNode = node;
                } else if (node.id === `station-${toId}`) {
                    toNode = node;
                }
            }
            
            if (fromNode && toNode) {
                const fromX = parseFloat(fromNode.style.left);
                const fromY = parseFloat(fromNode.style.top);
                const toX = parseFloat(toNode.style.left);
                const toY = parseFloat(toNode.style.top);
                
                const x1 = parseFloat(l.getAttribute('x1'));
                const y1 = parseFloat(l.getAttribute('y1'));
                const x2 = parseFloat(l.getAttribute('x2'));
                const y2 = parseFloat(l.getAttribute('y2'));
                
                // Check if this is the line connecting our nodes (approximate match)
                if (Math.abs(x1 - fromX) < 10 && Math.abs(y1 - fromY) < 10 &&
                    Math.abs(x2 - toX) < 10 && Math.abs(y2 - toY) < 10) {
                    line = l;
                    break;
                }
            }
        }
        
        if (line) {
            // Clear existing classes
            line.classList.remove('refinement-loop');
            
            // Handle refinement loop (Critic to Retriever) differently
            if (fromId === 4 && toId === 2) {
                // This is the CriticAgent to RetrieverAgent refinement path
                line.classList.add('refinement-loop');
                updateCriticCounter(fromId, options.iteration || 1);
            } else {
                // Normal path highlighting
                line.setAttribute('stroke', 'var(--vault-yellow)');
                line.setAttribute('stroke-width', '1.5');
                line.setAttribute('opacity', '1');
                line.setAttribute('filter', 'drop-shadow(0 0 5px var(--vault-yellow))');
            }
        }
    }
    
    // Update the critic counter badge
    function updateCriticCounter(nodeId, count) {
        // Find the critic node
        const node = document.getElementById(`station-${nodeId}`);
        if (!node) return;
        
        // Remove any existing badge
        const existingBadge = node.querySelector('.notification-badge');
        if (existingBadge) {
            existingBadge.remove();
        }
        
        // Create and add the badge
        const badge = document.createElement('div');
        badge.className = 'notification-badge';
        badge.textContent = count;
        node.appendChild(badge);
    }
    
    // Activate a node
    function activateNode(nodeId) {
        const node = document.getElementById(`station-${nodeId}`);
        if (node) {
            node.classList.add('active');
        }
    }
    
    // Show agent information
    function showAgentInfo(agent) {
        const infoPanel = document.querySelector('.info-panel');
        const infoContent = document.querySelector('.info-content');
        
        // Generate agent status message
        const statusClass = agent.active ? 'status-active' : 'status-inactive';
        const statusText = agent.active ? 'ACTIVE' : 'STANDBY';
        
        // Agent descriptions
        const descriptions = {
            orchestrator: 'Central coordination node that manages the entire agent workflow. Routes user queries to specialized agents and controls the information flow between them.',
            retriever: 'Specialized in retrieving relevant documents, context, and entities from knowledge sources. Provides the factual foundation needed for accurate responses.',
            synthesizer: 'Processes retrieved information and combines it with user instructions to generate coherent content and answers.',
            critic: 'Reviews and validates content for accuracy, quality, and adherence to guidelines. Determines if the response meets quality thresholds and either approves it or refines the query to improve results. Will try up to 3 refinement iterations before accepting the best available response.',

            presenter: 'Formats and prepares the final content for optimal presentation to the user.',
            user: 'Entry point for user queries that initiates the agent workflow.',
            response: 'Final output point where processed, validated, and formatted content is delivered back to the user.'
        };
        
        // Update info panel content
        infoContent.innerHTML = `
            <div class="agent-name">${agent.label}</div>
            <div class="agent-status">
                STATUS: <span class="${statusClass}">${statusText}</span>
            </div>
            <div class="agent-description">
                ${descriptions[agent.type] || 'No description available'}
            </div>
        `;
        
        // Show the info panel with a fade-in animation
        infoPanel.classList.add('show-panel');
    }
});
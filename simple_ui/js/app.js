/**
 * UI application script for Vault-Tec Terminal interface
 * Fallout Vault-Tec themed RAG implementation
 */

// DOM elements
const queryTypeSelect = document.getElementById('query-type');
const sourcesCountInput = document.getElementById('sources-count');
const sourcesCountValue = document.getElementById('sources-count-value');
const queryInput = document.getElementById('query-input');
const submitButton = document.getElementById('submit-query');
const preprocessButton = document.getElementById('preprocess-btn');
const resetButton = document.getElementById('left-reset-btn');
const conversation = document.getElementById('conversation');
const filesContainer = document.getElementById('files-container');
const docCounter = document.getElementById('doc-counter');

// App state
const state = {
    selectedDocuments: [],
    preprocessedDocuments: [],
    loading: false,
    isPreprocessing: false
};

// Reset interface
async function resetInterface() {
    // Show loading message
    addSystemMessage('Resetting system, please wait...');
    
    try {
        // Call API to reset system
        const resetResult = await api.reset();
        console.log('Reset result:', resetResult);
        
        // Clear conversation
        conversation.innerHTML = '';
        
        // Add welcome message back
        const welcomeMessage = document.createElement('div');
        welcomeMessage.className = 'message-container';
        welcomeMessage.innerHTML = `
            <div class="message-header">
                <div class="message-avatar system-avatar">SYS</div>
                <div class="message-sender">VAULT-TEC AI</div>
            </div>
            <div class="message-content system-message">
                <div class="boot-sequence">
                    <div class="boot-line">VAULT-TEC INDUSTRIES (TM) TERMINAL</div>
                    <div class="boot-line">ROBCO INTERFACE ADAPTER 2.1</div>
                    <div class="boot-line">CHECKING SYSTEM... OK</div>
                    <div class="boot-line">INITIALIZING RETRIEVAL AUGMENTED GENERATION...</div>
                    <div class="boot-line">LOADING KNOWLEDGE BASE... COMPLETE</div>
                    <div class="boot-line">ESTABLISHING SECURE CONNECTION...</div>
                    <div class="boot-line">CONNECTION ESTABLISHED</div>
                    <div class="boot-line boot-welcome">WELCOME TO RAGTASTIC (TM) BY VAULT-TEC</div>
                </div>
                <p>VAULT-TEC CHATAGENT: Ready for your queries. System has been reset.</p>
            </div>
        `;
        conversation.appendChild(welcomeMessage);
        
        // Clear query input
        queryInput.value = '';
        
        // Reset state
        state.selectedDocuments = [];
        state.preprocessedDocuments = [];
        
        // Update document counter
        updateDocCounter();
        
        // Update document selection UI to remove processed class
        document.querySelectorAll('.file-item.processed').forEach(item => {
            item.classList.remove('processed');
        });
        
        document.querySelectorAll('.file-item.selected').forEach(item => {
            item.classList.remove('selected');
        });
        
        // Update system stats
        updateSystemStats({
            latency: '0ms',
            tokens: '0',
            score: '100%'
        });
        
        // Refresh documents list to reflect changes
        await loadDocuments();
        
        // Animate new elements
        animateElements();
        
        // Add success message
        addSystemMessage('System reset complete. All document caches have been cleared.');
    } catch (error) {
        console.error('Error resetting system:', error);
        showError(`Reset failed: ${error.message}`);
    }
}

// Initialize the app
async function initApp() {
    try {
        // Start system time updates
        updateSystemTime();
        setInterval(updateSystemTime, 1000);
        
        // Initialize system monitor
        updateSystemMonitor();
        
        // Reset state and counter to ensure clean start
        state.selectedDocuments = [];
        updateDocCounter();
        
        // Test API connection
        const connectionStatus = await api.testConnection();
        if (connectionStatus.status !== 'connected') {
            showError('Could not connect to API. Please check if server is running.');
        }

        // Get documents
        await loadDocuments();

        // Initialize event listeners
        setupEventListeners();

        // Animate elements
        animateElements();
        
        // Disable preprocess button initially
        updatePreprocessButton();
        
        // Initialize system stats
        updateSystemStats({
            latency: '0ms',
            tokens: '0',
            score: '100%',
            docs: '0'
        });
    } catch (error) {
        console.error('Initialization error:', error);
        showError('An error occurred during initialization. Please check console for details.');
    }
}

// Load documents from API
async function loadDocuments() {
    try {
        filesContainer.innerHTML = '<div class="loading">Loading documents...</div>';
        const documents = await api.listDocuments();
        renderDocumentsList(documents);
    } catch (error) {
        console.error('Error loading documents:', error);
        filesContainer.innerHTML = '<div class="error">Failed to load documents. Please try again.</div>';
    }
}

// Render documents list
function renderDocumentsList(documents) {
    if (!documents || documents.length === 0) {
        filesContainer.innerHTML = '<div class="no-docs">No documents available.</div>';
        // Make sure counter shows 0 when no documents available
        state.selectedDocuments = [];
        updateDocCounter();
        return;
    }

    const docElements = documents.map(doc => {
        const docItem = document.createElement('div');
        docItem.className = 'file-item';
        docItem.dataset.document = doc;
        
        const fileIcon = document.createElement('div');
        fileIcon.className = 'file-icon';
        
        const fileName = document.createElement('div');
        fileName.className = 'file-name';
        fileName.textContent = doc;
        
        docItem.appendChild(fileIcon);
        docItem.appendChild(fileName);
        
        docItem.addEventListener('click', () => toggleDocumentSelection(docItem, doc));
        return docItem;
    });

    filesContainer.innerHTML = '';
    docElements.forEach(elem => filesContainer.appendChild(elem));
    
    // Ensure counter is updated after loading documents
    if (state.selectedDocuments.length > 0) {
        state.selectedDocuments = [];
        updateDocCounter();
    }
}

// Toggle document selection
function toggleDocumentSelection(element, document) {
    element.classList.toggle('selected');
    
    if (element.classList.contains('selected')) {
        state.selectedDocuments.push(document);
    } else {
        state.selectedDocuments = state.selectedDocuments.filter(doc => doc !== document);
    }
    
    updateDocCounter();
    updatePreprocessButton();
}

// Update document counter
function updateDocCounter() {
    docCounter.textContent = `${state.selectedDocuments.length} SELECTED`;
}

// Update preprocess button state
function updatePreprocessButton() {
    preprocessButton.disabled = state.selectedDocuments.length === 0 || state.isPreprocessing;
}

// Set up event listeners
function setupEventListeners() {
    // Update sources count display
    sourcesCountInput.addEventListener('input', () => {
        sourcesCountValue.textContent = sourcesCountInput.value;
    });

    // Submit query button
    submitButton.addEventListener('click', handleSubmitQuery);

    // Preprocess button
    preprocessButton.addEventListener('click', handlePreprocessDocuments);
    
    // Reset button
    resetButton.addEventListener('click', resetInterface);

    // Enter key in input field
    queryInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') {
            e.preventDefault();
            handleSubmitQuery();
        }
    });
}

// Handle preprocessing documents
async function handlePreprocessDocuments() {
    if (state.selectedDocuments.length === 0) {
        showError('Please select at least one document to preprocess.');
        return;
    }
    
    try {
        state.isPreprocessing = true;
        preprocessButton.disabled = true;
        preprocessButton.textContent = 'PROCESSING...';
        
        // Show preprocessing message
        addSystemMessage('Preprocessing documents... This may take a moment.');
        
        // Logging before API call for debugging
        console.log('Sending documents for preprocessing:', state.selectedDocuments);
        
        // Call API to preprocess documents
        const result = await api.preprocessDocuments(state.selectedDocuments, {
            chunkSize: 500,
            chunkOverlap: 100,
            chunkingStrategy: 'hybrid',
            extractMetadata: true
        });
        
        // Log response for debugging
        console.log('Preprocessing response:', result);
        
        if (result.success) {
            // Update UI to show processed documents
            state.preprocessedDocuments = state.selectedDocuments.slice();
            updateProcessedDocuments();
            
            // Show success message
            addSystemMessage(`Successfully preprocessed ${result.count} document(s) into ${result.totalChunks} chunks.`);
        } else {
            showError(`Preprocessing failed: ${result.error || 'Unknown error'}`);
        }
    } catch (error) {
        console.error('Preprocessing error:', error);
        showError(`Preprocessing error: ${error.message}`);
    } finally {
        state.isPreprocessing = false;
        preprocessButton.disabled = false;
        preprocessButton.textContent = 'PREPROCESS';
        updatePreprocessButton();
    }
}

// Update UI to show processed documents
function updateProcessedDocuments() {
    // Mark processed documents in the UI
    document.querySelectorAll('.file-item').forEach(item => {
        const docName = item.dataset.document;
        if (state.preprocessedDocuments.includes(docName)) {
            item.classList.add('processed');
        }
    });
    
    // Update the system monitor to show processed documents
    updateSystemMonitor();
    
    // Update document count in stats
    document.getElementById('stats-docs').textContent = state.preprocessedDocuments.length;
}

// Update system monitor with processed documents
function updateSystemMonitor() {
    const systemInfo = document.querySelector('.system-info');
    let infoHtml = `
        <div>VAULT-TEC RAGTASTIC</div>
        <div>MONITOR V1.0</div>
        <div>INITIALIZING SYSTEM...</div>
        <div>CONNECTION TO CENTRAL</div>
        <div>DATABASE: ESTABLISHED</div>
        <div>RETRIEVAL ENGINES: ONLINE</div>
        <div>KNOWLEDGE BASE: LOADED</div>
        <div>STANDING BY FOR USER</div>
        <div>INTERACTION...</div>
    `;
    
    // Add processed documents info
    if (state.preprocessedDocuments.length > 0) {
        infoHtml += `<div>DOCUMENTS LOADED:</div>`;
        state.preprocessedDocuments.forEach(doc => {
            infoHtml += `<div>> ${doc}</div>`;
        });
    }
    
    infoHtml += `<div class="system-cursor">></div>`;
    systemInfo.innerHTML = infoHtml;
}

// Handle query submission
async function handleSubmitQuery() {
    const queryType = queryTypeSelect.value;
    const question = queryInput.value.trim();
    const sourcesCount = parseInt(sourcesCountInput.value, 10);
    
    if (!question) {
        showError('Please enter a question.');
        return;
    }
    
    // Check if any documents have been preprocessed
    if (state.preprocessedDocuments.length === 0) {
        showError('Please preprocess at least one document before querying.');
        return;
    }
    
    // Display user question
    addUserMessage(question);
    
    // Set loading state
    setLoading(true);
    
    try {
        let response;
        const options = {
            numResults: sourcesCount,
            similarityThreshold: 0.3,
            useHybridSearch: true,
            maxAttempts: 3  // Maximum attempts for CriticAgent refinement
        };
        
        // Add processing message
        addSystemMessage('Processing your query...');
        
        // Call appropriate API based on query type
        switch (queryType) {
            case 'query':
                response = await api.query(question, options);
                displayCompleteResponse(response, question);
                break;
                
            case 'answer':
                response = await api.getAnswer(question, options);
                displayAnswer(response.response || response.answer || 'No answer received.');
                break;
                
            case 'sources':
                response = await api.getSources(question, sourcesCount, options);
                // Show a sources-only message with the retrieved sources
                addAIMessage("I've found these relevant sources for your query:\n\n" + 
                    (response.sources ? formatSources(response.sources) : 'No sources found.'));
                break;
                
            default:
                showError('Unknown query type.');
        }
        
        // Update stats with usage information if available
        if (response && response.usage) {
            let totalTokens = 0;
            if (Array.isArray(response.usage)) {
                // Handle array of usage statistics from complete flow
                response.usage.forEach(usage => {
                    if (usage.usage && usage.usage.total_tokens) {
                        totalTokens += usage.usage.total_tokens;
                    }
                });
            } else {
                // Handle single usage object
                totalTokens = response.usage.total_tokens || 0;
            }
            
            // Calculate quality score from evaluation if available
            const qualityScore = response.evaluation?.score ? 
                `${Math.round(response.evaluation.score * 100)}%` : '100%';
            
            updateSystemStats({
                latency: `${response.metrics?.latency || 0}ms`,
                tokens: totalTokens,
                score: qualityScore
            });
        }
    } catch (error) {
        console.error('Query processing error:', error);
        showError('An error occurred while processing your query. Please try again.');
    } finally {
        setLoading(false);
    }
    
    // Clear input after sending
    queryInput.value = '';
}

// Display complete response from RAG system with CriticAgent evaluation
function displayCompleteResponse(response, question) {
    // First display the answer
    displayAnswer(response.response || 'No response received.');
    
    // If we have refinement history, show it
    if (response.history && response.history.length > 0) {
        const refinementCount = response.history.filter(item => 
            item.status === 'refinement_needed' || 
            item.refinedQuery !== item.query
        ).length;
        
        if (refinementCount > 0) {
            setTimeout(() => {
                addSystemMessage(`The CRITIC AGENT refined your query ${refinementCount} times to improve the quality of the response.`);
                
                // Show query refinement process
                let refinementInfo = 'QUERY REFINEMENT DETAILS:\n';
                response.history.forEach((item, index) => {
                    if (index === 0) {
                        refinementInfo += `➤ ORIGINAL QUERY: "${item.query}"\n`;
                    }
                    
                    if (item.status === 'refinement_needed' && item.refinedQuery && item.refinedQuery !== item.query) {
                        refinementInfo += `➤ REFINEMENT ${item.attempt}: "${item.refinedQuery}"\n`;
                        if (item.reasoning) {
                            refinementInfo += `   REASONING: ${item.reasoning}\n`;
                        }
                    }
                });
                
                // Show the quality evaluation
                if (response.evaluation) {
                    const score = Math.round(response.evaluation.score * 100);
                    refinementInfo += `\nFINAL QUALITY SCORE: ${score}%\n`;
                    refinementInfo += `ATTEMPTS: ${response.evaluation.attempts}/${response.evaluation.maxAttempts}\n`;
                }
                
                addSystemMessage(refinementInfo);
            }, 1000); // Delay to create a more natural conversation flow
        }
    }
}

// Format sources for display
function formatSources(sources) {
    if (!sources || !Array.isArray(sources) || sources.length === 0) {
        return 'No sources available.';
    }
    
    return sources.map((source, index) => {
        const sourceName = source.metadata?.source || 'Unknown source';
        const sourceContent = source.page_content || source.content || 'No content available.';
        
        return `Source ${index + 1}: ${sourceName}\n${truncateText(sourceContent, 200)}`;
    }).join('\n\n');
}

// Display answer
function displayAnswer(answer) {
    addAIMessage(answer);
}

// Add system message
function addSystemMessage(message) {
    const messageContainer = document.createElement('div');
    messageContainer.className = 'message-container';
    
    messageContainer.innerHTML = `
        <div class="message-header">
            <div class="message-avatar system-avatar">SYS</div>
            <div class="message-sender">VAULT-TEC AI</div>
        </div>
        <div class="message-content system-message">
            <p>${message}</p>
        </div>
    `;
    
    conversation.appendChild(messageContainer);
    conversation.scrollTop = conversation.scrollHeight;
}

// Add user message
function addUserMessage(message) {
    // Create a new user message container
    const userMessageContainer = document.createElement('div');
    userMessageContainer.className = 'message-container user-container';
    
    userMessageContainer.innerHTML = `
        <div class="message-header">
            <div class="message-avatar user-avatar">YOU</div>
            <div class="message-sender">OVERSEER</div>
        </div>
        <div class="message-content user-message">
            <p>${formatContent(message)}</p>
        </div>
    `;
    
    conversation.appendChild(userMessageContainer);
    conversation.scrollTop = conversation.scrollHeight;
}

// Add AI message
function addAIMessage(message) {
    // Create a new AI message container
    const aiMessageContainer = document.createElement('div');
    aiMessageContainer.className = 'message-container ai-container';
    
    aiMessageContainer.innerHTML = `
        <div class="message-header">
            <div class="message-avatar ai-avatar">AI</div>
            <div class="message-sender">VAULT-TEC AI</div>
        </div>
        <div class="message-content ai-message">
            <p>${formatContent(message)}</p>
        </div>
    `;
    
    conversation.appendChild(aiMessageContainer);
    conversation.scrollTop = conversation.scrollHeight;
}

// Update system stats
function updateSystemStats(stats) {
    if (stats.latency) document.getElementById('stats-latency').textContent = stats.latency;
    if (stats.tokens) document.getElementById('stats-tokens').textContent = stats.tokens;
    if (stats.score) document.getElementById('stats-score').textContent = stats.score;
    if (stats.docs) document.getElementById('stats-docs').textContent = stats.docs;
    
    // Update system time
    updateSystemTime();
}

// Update system time
function updateSystemTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    document.querySelector('.system-time').textContent = `[${hours}:${minutes}:${seconds}]`;
}

// Set loading state
function setLoading(isLoading) {
    state.loading = isLoading;
    submitButton.disabled = isLoading;
    
    if (isLoading) {
        submitButton.innerHTML = '<div class="btn-icon loading">⟳</div>';
    } else {
        submitButton.innerHTML = '<div class="btn-icon">▶</div>';
    }
}

// Show error message
function showError(message) {
    // Add to system info
    const systemInfo = document.querySelector('.system-info');
    const errorLine = document.createElement('div');
    errorLine.className = 'error-message';
    errorLine.textContent = `ERROR: ${message}`;
    
    // Insert before the cursor
    const cursor = systemInfo.querySelector('.system-cursor');
    systemInfo.insertBefore(errorLine, cursor);
    
    // Scroll system info to bottom if needed
    systemInfo.scrollTop = systemInfo.scrollHeight;
    
    console.error(message);
}

// Helper function to truncate text
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Format content for display
function formatContent(content) {
    if (!content) return '';
    
    // Convert newlines to HTML line breaks
    content = content.replace(/\n/g, '<br>');
    
    return content;
}

// Animate elements using GSAP
function animateElements() {
    gsap.from('.panel-header', { 
        y: -50, 
        opacity: 0, 
        duration: 0.8, 
        ease: 'power2.out',
        stagger: 0.2
    });
    
    gsap.from('.left-panel, .right-panel', { 
        x: -20, 
        opacity: 0, 
        duration: 0.5, 
        delay: 0.3, 
        ease: 'power2.out',
        stagger: 0.2
    });
    
    gsap.from('.center-panel', { 
        y: 20, 
        opacity: 0, 
        duration: 0.5, 
        delay: 0.5, 
        ease: 'power2.out' 
    });
    
    gsap.from('.boot-line', {
        opacity: 0,
        duration: 0.3,
        stagger: 0.1,
        ease: 'power2.out'
    });
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', initApp);
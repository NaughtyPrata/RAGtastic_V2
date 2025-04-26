/**
 * UI application script for Vault-Tec Terminal interface
 * This is a UI-only demo with all logic removed
 */

// DOM elements
const queryTypeSelect = document.getElementById('query-type');
const sourcesCountInput = document.getElementById('sources-count');
const sourcesCountValue = document.getElementById('sources-count-value');
const queryInput = document.getElementById('query-input');
const submitButton = document.getElementById('submit-query');
const preprocessButton = document.getElementById('preprocess-btn');
const resetButton = document.getElementById('left-reset-btn');
const answerDisplay = document.getElementById('answer-display');
const sourcesContainer = document.getElementById('sources-container');
const filesContainer = document.getElementById('files-container');
const docCounter = document.getElementById('doc-counter');
const conversation = document.getElementById('conversation');

// App state - UI demo only
const state = {
    selectedDocuments: [],
    preprocessedDocuments: [],
    loading: false,
    isPreprocessing: false
};

// Reset interface - UI only function
function resetInterface() {
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
            <p>Welcome to the VAULT-TEC Retrieval Augmented Knowledge System. I'm your virtual assistant, ready to provide information and guidance using our proprietary document retrieval technology.</p>
            <p>How may I assist you today?</p>
        </div>
    `;
    conversation.appendChild(welcomeMessage);
    
    // Clear query input
    queryInput.value = '';
    
    // Reset state
    state.preprocessedDocuments = [];
    
    // Update document selection UI to remove processed class
    document.querySelectorAll('.file-item.processed').forEach(item => {
        item.classList.remove('processed');
    });
    
    // Update system stats
    updateSystemStats({
        latency: '0ms',
        tokens: '0',
        score: '100%'
    });
    
    // Animate new elements
    animateElements();
}

// Initialize the app - UI setup only
async function initApp() {
    try {
        // Start system time updates
        updateSystemTime();
        setInterval(updateSystemTime, 1000);
        
        // Initialize system monitor
        updateSystemMonitor();
        

        // Get mock documents for UI demo
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
            score: '100%'
        });
    } catch (error) {
        console.error('Initialization error:', error);
        showError('An error occurred during initialization. Please check console for details.');
    }
}

// Load documents - simplified for UI demo
async function loadDocuments() {
    try {
        const documents = await api.listDocuments();
        renderDocumentsList(documents);
    } catch (error) {
        console.error('Error loading documents:', error);
        filesContainer.innerHTML = '<div class="error">Failed to load documents. Please try again.</div>';
    }
}

// Render documents list - UI only function
function renderDocumentsList(documents) {
    if (!documents || documents.length === 0) {
        filesContainer.innerHTML = '<div class="no-docs">No documents available.</div>';
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
}

// Toggle document selection - UI only function
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

// Update document counter - UI only function
function updateDocCounter() {
    docCounter.textContent = `${state.selectedDocuments.length} SELECTED`;
}

// Update preprocess button state - UI only function
function updatePreprocessButton() {
    preprocessButton.disabled = state.selectedDocuments.length === 0 || state.isPreprocessing;
}

// Set up event listeners - UI only function
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

// Handle preprocessing documents - UI only mock
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
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Update UI to show processed documents
        state.preprocessedDocuments = state.selectedDocuments.slice();
        updateProcessedDocuments();
        
        // Show success message
        addSystemMessage(`Successfully preprocessed ${state.preprocessedDocuments.length} document(s).`);
    } finally {
        state.isPreprocessing = false;
        preprocessButton.disabled = false;
        preprocessButton.textContent = 'PREPROCESS';
        updatePreprocessButton();
    }
}

// Update UI to show processed documents - UI only function
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

// Update system monitor with processed documents - UI only function
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

// Handle query submission - UI demo only
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
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Display mock responses based on query type
        switch (queryType) {
            case 'query':
                displayAnswer("This is a mock response for the UI demo. In a real implementation, this would show an answer generated from the selected documents.");
                break;
                
            case 'answer':
                displayAnswer("This is a simple mock answer for the UI demo.");
                break;
                
            case 'sources':
                // Show a sources-only message
                addAIMessage("I've found these relevant sources for your query (demo only).");
                break;
                
            default:
                showError('Unknown query type.');
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

// Display answer - simplified for UI demo
function displayAnswer(answer) {
    addAIMessage(answer);
}

// Add system message - UI only function
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

// Add user message - UI only function
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

// Add AI message - UI only function
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
    
    // Update system stats
    updateSystemStats({
        latency: Math.floor(Math.random() * 200) + 100 + 'ms',
        tokens: Math.floor(Math.random() * 300) + 100,
        score: Math.floor(Math.random() * 20) + 80 + '%'
    });
}

// Update system stats - UI only function
function updateSystemStats(stats) {
    if (stats.latency) document.getElementById('stats-latency').textContent = stats.latency;
    if (stats.tokens) document.getElementById('stats-tokens').textContent = stats.tokens;
    if (stats.score) document.getElementById('stats-score').textContent = stats.score;
    
    // Update document count
    document.getElementById('stats-docs').textContent = state.preprocessedDocuments.length;
    
    // Update system time
    updateSystemTime();
}

// Update system time - UI only function
function updateSystemTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    document.querySelector('.system-time').textContent = `[${hours}:${minutes}:${seconds}]`;
}

// Set loading state - UI only function
function setLoading(isLoading) {
    state.loading = isLoading;
    submitButton.disabled = isLoading;
    
    if (isLoading) {
        submitButton.innerHTML = '<div class="btn-icon loading">⟳</div>';
    } else {
        submitButton.innerHTML = '<div class="btn-icon">▶</div>';
    }
}

// Show error message - UI only function
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
}

// Helper function to truncate text - UI utility
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Format content for display - UI utility
function formatContent(content) {
    if (!content) return '';
    
    // Convert newlines to HTML line breaks
    content = content.replace(/\n/g, '<br>');
    
    return content;
}

// Animate elements using GSAP - UI animation only
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

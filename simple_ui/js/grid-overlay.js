/**
 * Vault-Tec Grid Overlay System
 * Provides a retro-futuristic grid overlay for Fallout-inspired UI
 */

class VaultGridOverlay {
  constructor(options = {}) {
    this.options = {
      color: options.color || 'green', // green, amber, blue
      initiallyActive: options.initiallyActive || false,
      showToggle: options.showToggle !== undefined ? options.showToggle : true,
      showScanLine: options.showScanLine !== undefined ? options.showScanLine : true,
    };
    
    this.isActive = this.options.initiallyActive;
    this.init();
  }
  
  init() {
    // Create grid overlay element
    this.overlay = document.createElement('div');
    this.overlay.className = `vault-grid-overlay ${this.options.color !== 'green' ? this.options.color : ''}`;
    this.overlay.style.opacity = '0.1'; // Ensure grid opacity is correctly applied
    
    if (this.isActive) {
      this.overlay.classList.add('active');
    }
    
    // Add scan line if enabled
    if (this.options.showScanLine) {
      this.scanLine = document.createElement('div');
      this.scanLine.className = 'vault-grid-scan';
      this.scanLine.style.opacity = '0.05'; // Force inline style for opacity
      this.overlay.appendChild(this.scanLine);
    }
=======
=======
    
    // Add overlay to body
    document.body.appendChild(this.overlay);
    
    // Create toggle button if enabled
    if (this.options.showToggle) {
      this.createToggleButton();
    }
    
    // Setup keyboard shortcut (Ctrl+G)
    this.setupKeyboardShortcut();
  }
  
  createToggleButton() {
    this.toggleBtn = document.createElement('button');
    this.toggleBtn.className = 'vault-grid-toggle';
    this.toggleBtn.innerHTML = 'G';
    this.toggleBtn.title = 'Toggle Grid Overlay (Ctrl+G)';
    
    // Add click event
    this.toggleBtn.addEventListener('click', () => this.toggle());
    
    // Add to body
    document.body.appendChild(this.toggleBtn);
  }
  
  setupKeyboardShortcut() {
    document.addEventListener('keydown', (e) => {
      // Ctrl+G to toggle grid
      if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        this.toggle();
      }
    });
  }
  
  toggle() {
    this.isActive = !this.isActive;
    
    if (this.isActive) {
      this.overlay.classList.add('active');
    } else {
      this.overlay.classList.remove('active');
    }
    
    // Dispatch event
    document.dispatchEvent(new CustomEvent('vault-grid-toggle', { 
      detail: { active: this.isActive } 
    }));
    
    return this.isActive;
  }
  
  setColor(color) {
    // Remove existing color classes
    this.overlay.classList.remove('green', 'amber', 'blue');
    
    // Only add class if not the default green
    if (color !== 'green') {
      this.overlay.classList.add(color);
    }
    
    this.options.color = color;
  }
  
  setOpacity(opacity) {
    this.overlay.style.opacity = opacity;
  }
  
  destroy() {
    // Remove event listeners
    document.removeEventListener('keydown', this.setupKeyboardShortcut);
    
    // Remove elements
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
    }
    
    if (this.toggleBtn && this.toggleBtn.parentNode) {
      this.toggleBtn.parentNode.removeChild(this.toggleBtn);
    }
  }
}

// Initialize on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  // Make globally available
  window.vaultGrid = new VaultGridOverlay({
    color: 'green',
    initiallyActive: true, // Start with grid active by default
    showToggle: true,
    showScanLine: true
  });
});

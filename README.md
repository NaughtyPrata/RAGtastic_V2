# sRAG - Simple RAG Interface Demo

A clean, retro-inspired user interface for Retrieval Augmented Generation systems with a Fallout/Vault-Tec aesthetic.

## Overview

This project provides a standalone UI demonstration for RAG (Retrieval Augmented Generation) systems. The interface simulates document processing, querying, and displaying results in a stylized terminal-like environment.

## Features

- **Document Selection and Processing**: Select documents from a list and simulate preprocessing
- **Query Interface**: Submit questions with different retrieval options
- **Conversation View**: View AI responses in a chat-like interface
- **System Monitor**: View system statistics and status
- **Agent Network Visualization**: Interactive visualization of the underlying agent system
- **Retro Terminal Design**: CRT-style interface with scan lines and visual effects

## Getting Started

1. Clone the repository
2. Navigate to the project directory
3. Start the UI with:

```bash
./start_ui.sh
```

## UI Structure

The interface consists of three main panels:

1. **Left Panel**: Document selection and query controls
2. **Center Panel**: Conversation display and input field
3. **Right Panel**: System monitor with statistics
4. **Modal**: Agent network visualization (accessible via button)

## Technologies Used

- Vanilla JavaScript for UI interactions
- CSS for styling with a modular approach
- GSAP for animations
- SVG for agent network visualization

## File Organization

- **css/**: Modular CSS files
  - **components/**: Component-specific styles
  - **base.css**: Base styling elements
  - **theme.css**: Color variables and theme definitions
  - **layout.css**: Layout structure
  - **scanlines.css**: CRT-style effects
  - **agent-modal.css**: Modal-specific styling
  
- **js/**: JavaScript files
  - **app.js**: Main application logic
  - **api.js**: Mock API functions
  - **agent-modal.js**: Agent network visualization
  - **select-enhancer.js**: Enhanced select input

- **images/**: Contains the logo and icons

## Customization

The interface uses CSS variables for theming, defined in `theme.css`. To modify the appearance:

1. Edit color variables in `theme.css`
2. Adjust component-specific styles in their respective CSS files
3. Update layout properties in `layout.css`

## Notes

This is a demonstration UI only - the backend functionality is simulated with mock responses.

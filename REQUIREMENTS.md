# sRAG Interface Requirements

## Design Principles

- **Modularity**: Keep CSS and JS files modular and focused on specific functionality
- **Maintainability**: Clearly separate concerns in both styling and functionality
- **Performance**: Minimize unnecessary DOM operations and optimize animations
- **Theming**: Use CSS variables for consistent theming throughout the application

## Style Requirements

- **Base Layout**: Three-panel design with responsive adjustments
- **Aesthetic**: Retro terminal look with CRT effects and scanlines
- **Color Scheme**: Pip-Boy green (#5ffd7e) as primary accent with dark backgrounds
- **Typography**: Monospace fonts for terminal aesthetic (Share Tech Mono, VT323)
- **Animations**: Subtle animations for UI feedback and visual interest
- **Effects**: CRT flicker, scanlines, and vignette for immersion

## Technical Implementation

- **Vanilla JS**: Use standard DOM manipulation without frameworks
- **Modular CSS**: Separate CSS files by component and functionality
- **GSAP**: Use for more complex animations
- **SVG**: Use for agent network visualization
- **BEM-inspired**: Follow consistent naming conventions for CSS classes
- **CSS Variables**: For theming and consistent styling

## Components

- **Document List**: For selecting and tracking document processing
- **Query Controls**: For selecting query type and parameters
- **Conversation View**: For displaying message history between user and system
- **System Monitor**: For displaying system status and statistics
- **Agent Network Modal**: For visualizing the agent workflow and interactions

## Code Organization

### CSS Files

- **theme.css**: Theme variables and color definitions
- **base.css**: Base styling elements
- **layout.css**: Layout structure
- **scanlines.css**: CRT-style visual effects
- **agent-modal.css**: Styles specific to the agent network modal
- **components/**: Directory with component-specific CSS

### JavaScript Files  

- **app.js**: Main application logic and DOM interactions
- **api.js**: Mock API interface for simulating backend
- **agent-modal.js**: Agent network visualization functionality
- **select-enhancer.js**: Custom enhancements for select inputs

## Performance Considerations

- Minimize repaints and reflows
- Use CSS animations where possible
- Optimize GSAP animations
- Lazy-load the agent network visualization

## Maintenance Guidelines

- Document CSS variables in theme.css
- Keep JS functions small and focused
- Use descriptive class and function names
- Add comments for non-obvious functionality
- Avoid !important directives in CSS
- Use consistent indentation and formatting
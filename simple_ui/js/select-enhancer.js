/**
 * Custom dropdown enhancer
 */

document.addEventListener('DOMContentLoaded', function() {
  const selects = document.querySelectorAll('select');
  
  selects.forEach(select => {
    // Add custom styling to the select element
    select.addEventListener('click', function(e) {
      // Add a class to the body to indicate a dropdown is open
      document.body.classList.add('dropdown-open');
    });
    
    // Handle dropdown closing
    document.addEventListener('click', function(e) {
      if (!e.target.closest('select')) {
        document.body.classList.remove('dropdown-open');
      }
    });
    
    // Handle option hover effects
    const options = select.querySelectorAll('option');
    options.forEach(option => {
      option.addEventListener('mouseover', function() {
        this.style.backgroundColor = 'var(--pip-dark-green)';
        this.style.color = 'var(--pip-green)';
      });
      
      option.addEventListener('mouseout', function() {
        if (!this.selected) {
          this.style.backgroundColor = 'var(--bg-terminal)';
        }
      });
    });
  });
});

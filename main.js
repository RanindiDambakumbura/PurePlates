// ============================================
// MAIN NAVIGATION SCRIPT
// Handles navigation highlighting and smooth scrolling
// ============================================

// Wait for page to fully load before running code
document.addEventListener('DOMContentLoaded', function() {
  
  // STEP 1: Highlight active navigation link
  highlightActiveNavLink();
  
  // STEP 2: Setup smooth scrolling for anchor links
  setupSmoothScrolling();
});

// Function to highlight the current page in navigation
function highlightActiveNavLink() {
  // Get all navigation links
  const navLinks = document.querySelectorAll('.nav-menu a');
  
  // Get current page name (e.g., 'index.html')
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // Loop through each link
  navLinks.forEach(function(link) {
    // Get the page this link points to
    const linkPage = link.getAttribute('href');
    
    // If this link matches current page, add 'active' class
    if (linkPage === currentPage) {
      link.classList.add('active');
    }
  });
}

// Function to make anchor links scroll smoothly
function setupSmoothScrolling() {
  // Get all links that start with '#' (like #section1)
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  // Add click handler to each link
  anchorLinks.forEach(function(anchor) {
    anchor.addEventListener('click', function(event) {
      // Stop the default jump behavior
      event.preventDefault();
      
      // Get the target element ID from href (remove the #)
      const targetId = this.getAttribute('href');
      const targetElement = document.querySelector(targetId);
      
      // If target exists, scroll to it smoothly
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: 'smooth',  // Smooth animation
          block: 'start'        // Align to top
        });
      }
    });
  });
}

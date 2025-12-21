// Wait for DOM content to be fully loaded before executing
document.addEventListener('DOMContentLoaded', function() {
  // Select all navigation menu links
  const navLinks = document.querySelectorAll('.nav-menu a');
  // Get current page filename from URL path (e.g., 'index.html' from '/path/index.html')
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // Loop through each navigation link
  navLinks.forEach(link => {
    // Get the href attribute value of the link
    const linkPage = link.getAttribute('href');
    // Check if this link matches the current page
    if (linkPage === currentPage) {
      // Add 'active' class to highlight the current page in navigation
      link.classList.add('active');
    }
  });

  // Select all anchor links that start with '#' (internal page links)
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    // Add click event listener to each anchor link
    anchor.addEventListener('click', function (e) {
      // Prevent default anchor link behavior (jumping to section)
      e.preventDefault();
      // Get the target element using the href attribute (e.g., '#section')
      const target = document.querySelector(this.getAttribute('href'));
      // Check if target element exists
      if (target) {
        // Smoothly scroll to the target element
        target.scrollIntoView({
          behavior: 'smooth',  // Use smooth scrolling animation
          block: 'start'        // Align element to top of viewport
        });
      }
    });
  });
});

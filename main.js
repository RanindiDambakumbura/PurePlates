document.addEventListener('DOMContentLoaded', function() {
  // Highlight active navigation link based on current page
  const navLinks = document.querySelectorAll('.nav-menu a');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
 //k
  navLinks.forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.classList.add('active');
    }
  });

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
});

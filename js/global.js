/**
 * AGNI FOUNDERS - GLOBAL JAVASCRIPT
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Page Fade-In Transition
  document.body.classList.add('page-fade-in');

  // 2. Lucide Icons Initialisation
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  // 3. Navbar Scroll Behavior
  const header = document.querySelector('.header');
  const handleScroll = () => {
    if (window.scrollY > 50) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  };
  window.addEventListener('scroll', handleScroll);
  handleScroll(); // Initial check on load

  // 4. Mobile Drawer Menu Logic
  const hamburger = document.querySelector('.hamburger');
  const mobileDrawer = document.querySelector('.mobile-drawer');
  const drawerOverlay = document.querySelector('.drawer-overlay');
  
  if (hamburger && mobileDrawer && drawerOverlay) {
    const toggleMenu = () => {
      hamburger.classList.toggle('open');
      mobileDrawer.classList.toggle('open');
      drawerOverlay.classList.toggle('open');
      
      // Prevent body scrolling when menu is open
      if (mobileDrawer.classList.contains('open')) {
        document.body.style.overflow = 'hidden';
      } else {
        document.body.style.overflow = '';
      }
    };

    hamburger.addEventListener('click', toggleMenu);
    drawerOverlay.addEventListener('click', toggleMenu);

    // Close mobile menu on clicking any link inside it
    const drawerLinks = mobileDrawer.querySelectorAll('a');
    drawerLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (mobileDrawer.classList.contains('open')) {
          toggleMenu();
        }
      });
    });
  }

  // 5. IntersectionObserver for Reveal Animations
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length > 0) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('active');
          // Once animated, no need to track again
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -50px 0px'
    });

    reveals.forEach(el => revealObserver.observe(el));
  }

  // 6. Cookie Consent / Analytics Banner
  const cookieBanner = document.getElementById('analytics-banner');
  const acceptBtn = document.getElementById('accept-cookies');
  const declineBtn = document.getElementById('decline-cookies');

  if (cookieBanner && acceptBtn && declineBtn) {
    // Check if user has already made a choice
    const consent = localStorage.getItem('agni_analytics_consent');
    if (!consent) {
      setTimeout(() => {
        cookieBanner.classList.add('show');
      }, 1500); // Small delay before appearing
    }

    acceptBtn.addEventListener('click', () => {
      localStorage.setItem('agni_analytics_consent', 'accepted');
      cookieBanner.classList.remove('show');
    });

    declineBtn.addEventListener('click', () => {
      localStorage.setItem('agni_analytics_consent', 'declined');
      cookieBanner.classList.remove('show');
    });
  }

  // 7. Active Navigation State Link Highlight
  const currentPath = window.location.pathname;
  const pageName = currentPath.split("/").pop() || 'index.html';
  
  const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-link');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === pageName || (pageName === 'index.html' && href === '/')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
});

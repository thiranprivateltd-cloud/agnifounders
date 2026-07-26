/**
 * AGNI FOUNDERS - HOMEPAGE JAVASCRIPT
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Dynamic Member Stats & Count-Up Animation Setup
  const statNumbers = document.querySelectorAll('.stat-number');
  
  // Set members target dynamically from local storage list
  const memberStat = document.getElementById('stat-members');
  if (memberStat) {
    let activeMembersCount = 0;
    try {
      const stored = localStorage.getItem('agni_members');
      if (stored) {
        activeMembersCount = JSON.parse(stored).length;
      }
    } catch (e) {
      console.error('Error loading members count:', e);
    }
    // Update local storage and set element target attribute
    localStorage.setItem('agni_member_count', activeMembersCount.toString());
    memberStat.setAttribute('data-target', activeMembersCount.toString());
  }
  
  const countUp = (element) => {
    const target = parseInt(element.getAttribute('data-target'), 10);
    if (target === 0) {
      element.textContent = '0';
      return;
    }
    const duration = 2000; // 2 seconds
    const stepTime = Math.abs(Math.floor(duration / target));
    let current = 0;
    
    // Custom logic to handle faster counts
    const increment = target > 100 ? Math.ceil(target / 100) : 1;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        element.textContent = target + '+';
        clearInterval(timer);
      } else {
        element.textContent = current;
      }
    }, Math.max(stepTime, 15));
  };

  if (statNumbers.length > 0) {
    const statsObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          countUp(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.5
    });

    statNumbers.forEach(num => statsObserver.observe(num));
  }

  // 2. Dynamic Upcoming Events Teaser Logic
  // Define upcoming events here. If array is empty, section stays hidden.
  const upcomingEvents = [
    // EXAMPLE EVENT (Uncomment or add events here to publish them on homepage):
    /*
    {
      format: 'Virtual Webinar',
      formatClass: 'virtual',
      date: 'Aug 12, 2026',
      time: '6:00 PM IST',
      title: 'Agni Sparks: Getting Your First 100 Users',
      location: 'Online Webinar',
      excerpt: 'A interactive masterclass on marketing channels and building user loops for early projects.',
      link: 'events.html'
    }
    */
  ];

  const upcomingEventsSection = document.getElementById('upcoming-events-teaser');
  const eventsGrid = document.getElementById('events-preview-grid');

  if (upcomingEventsSection && eventsGrid) {
    if (upcomingEvents.length > 0) {
      // Display the section
      upcomingEventsSection.style.display = 'block';
      eventsGrid.innerHTML = '';
      
      // Render each event card
      upcomingEvents.forEach(event => {
        const card = document.createElement('div');
        card.className = 'card event-preview-card';
        card.innerHTML = `
          <div class="event-meta">
            <span class="event-format badge-${event.formatClass}">${event.format}</span>
            <span class="event-date"><i data-lucide="calendar"></i> ${event.date}</span>
          </div>
          <h3>${event.title}</h3>
          <p class="event-city"><i data-lucide="map-pin"></i> ${event.location}</p>
          <p class="event-excerpt">${event.excerpt}</p>
          <a href="${event.link}" class="btn btn-secondary btn-sm mt-2" aria-label="Register for event">Register Now</a>
        `;
        eventsGrid.appendChild(card);
      });

      // Render Lucide icons
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    } else {
      upcomingEventsSection.style.display = 'none';
    }
  }

  // 3. Interactive Particle/Plexus Canvas Background
  const canvas = document.getElementById('particle-canvas');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let particlesArray = [];
    const numberOfParticles = 60;
    let mouse = {
      x: null,
      y: null,
      radius: 120
    };

    const setCanvasSize = () => {
      canvas.width = canvas.parentElement.offsetWidth;
      canvas.height = canvas.parentElement.offsetHeight;
    };
    
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    window.addEventListener('mousemove', (event) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = event.clientX - rect.left;
      mouse.y = event.clientY - rect.top;
    });

    window.addEventListener('mouseleave', () => {
      mouse.x = null;
      mouse.y = null;
    });

    class Particle {
      constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 0.3;
        this.speedY = (Math.random() - 0.5) * 0.3;
        this.opacity = Math.random() * 0.5 + 0.2;
      }

      update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0 || this.x > canvas.width) this.speedX = -this.speedX;
        if (this.y < 0 || this.y > canvas.height) this.speedY = -this.speedY;

        if (mouse.x !== null && mouse.y !== null) {
          let dx = mouse.x - this.x;
          let dy = mouse.y - this.y;
          let distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < mouse.radius) {
            const force = (mouse.radius - distance) / mouse.radius;
            this.x -= dx * force * 0.02;
            this.y -= dy * force * 0.02;
          }
        }
      }

      draw() {
        ctx.fillStyle = `rgba(245, 166, 35, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const init = () => {
      particlesArray = [];
      for (let i = 0; i < numberOfParticles; i++) {
        particlesArray.push(new Particle());
      }
    };

    const connect = () => {
      for (let a = 0; a < particlesArray.length; a++) {
        for (let b = a; b < particlesArray.length; b++) {
          let dx = particlesArray[a].x - particlesArray[b].x;
          let dy = particlesArray[a].y - particlesArray[b].y;
          let distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 120) {
            let opacity = (1 - (distance / 120)) * 0.15;
            ctx.strokeStyle = `rgba(123, 94, 167, ${opacity})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particlesArray[a].x, particlesArray[a].y);
            ctx.lineTo(particlesArray[b].x, particlesArray[b].y);
            ctx.stroke();
          }
        }
      }
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particlesArray.length; i++) {
        particlesArray[i].update();
        particlesArray[i].draw();
      }
      connect();
      requestAnimationFrame(animate);
    };

    init();
    animate();
  }
});

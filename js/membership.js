/**
 * AGNI FOUNDERS - MEMBERSHIP PAGE JAVASCRIPT
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Expandable Google Form Panels Toggle
  const toggleFormBtns = document.querySelectorAll('.toggle-form-btn');
  const formPanels = document.querySelectorAll('.form-container-panel');

  toggleFormBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
      const targetFormId = btn.getAttribute('data-form');
      const targetPanel = document.getElementById(targetFormId);
      const isAlreadyActive = targetPanel.classList.contains('active');

      // Close all form panels first
      formPanels.forEach(panel => {
        panel.classList.remove('active');
      });

      // Reset all buttons' state
      toggleFormBtns.forEach(otherBtn => {
        otherBtn.setAttribute('aria-expanded', 'false');
        const icon = otherBtn.querySelector('i');
        if (icon && typeof lucide !== 'undefined') {
          icon.setAttribute('data-lucide', 'chevron-down');
        }
      });

      if (!isAlreadyActive) {
        // Activate target panel
        targetPanel.classList.add('active');
        btn.setAttribute('aria-expanded', 'true');
        const icon = btn.querySelector('i');
        if (icon && typeof lucide !== 'undefined') {
          icon.setAttribute('data-lucide', 'chevron-up');
        }

        // Refresh lucide icons inside the activated panel
        if (typeof lucide !== 'undefined') {
          lucide.createIcons();
        }

        // Smooth scroll to the form panel with offset
        setTimeout(() => {
          const offset = 100;
          const bodyRect = document.body.getBoundingClientRect().top;
          const elementRect = targetPanel.getBoundingClientRect().top;
          const elementPosition = elementRect - bodyRect;
          const offsetPosition = elementPosition - offset;

          window.scrollTo({
            top: offsetPosition,
            behavior: 'smooth'
          });
        }, 100);
      }
    });
  });

  // 2. FAQ Accordion Logic
  const faqQuestions = document.querySelectorAll('.faq-question');

  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const parentItem = question.parentElement;
      const isActive = parentItem.classList.contains('active');

      // Close all other FAQs
      document.querySelectorAll('.faq-item').forEach(item => {
        item.classList.remove('active');
        item.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
        
        // Reset icon
        const icon = item.querySelector('.faq-icon');
        if (icon && typeof lucide !== 'undefined') {
          icon.setAttribute('data-lucide', 'plus');
        }
      });

      if (!isActive) {
        // Open clicked FAQ
        parentItem.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
        
        // Change icon to minus (handled as rotate(45deg) on plus in CSS, but let's update data-lucide for accessibility/fallback)
        const icon = question.querySelector('.faq-icon');
        if (icon && typeof lucide !== 'undefined') {
          icon.setAttribute('data-lucide', 'plus');
        }
      }

      // Re-create icons to reflect update
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    });
  });

  // 3. Native Form Local Storage Database Integration
  const nativeForms = document.querySelectorAll('.native-member-form');
  nativeForms.forEach(form => {
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Gather form inputs
      const tier = form.getAttribute('data-tier');
      const formData = new FormData(form);
      const name = formData.get('name');
      const college = formData.get('college');
      const city = formData.get('city');
      const domain = formData.get('domain');
      const startup = formData.get('startup') || 'Exploring Ideas';
      const linkedin = formData.get('linkedin') || '#';

      // 1. Get/Initialize members list in localStorage
      let members = [];
      try {
        const stored = localStorage.getItem('agni_members');
        if (stored) {
          members = JSON.parse(stored);
        }
      } catch (err) {
        console.error('Error reading localStorage members:', err);
      }

      // 2. Append new member
      const newMember = {
        name: name,
        college: college,
        city: city,
        domain: domain,
        startup: startup,
        tier: tier,
        linkedin: linkedin
      };
      members.push(newMember);
      localStorage.setItem('agni_members', JSON.stringify(members));

      // 3. Increment total count
      let currentCount = 0;
      const countVal = localStorage.getItem('agni_member_count');
      if (countVal) {
        currentCount = parseInt(countVal, 10);
      }
      localStorage.setItem('agni_member_count', currentCount + 1);

      // 4. Toggle success messages on screen
      form.classList.add('hidden');
      const successBox = form.parentElement.querySelector('.form-success-message');
      if (successBox) {
        successBox.classList.remove('hidden');
      }

      // Re-render Lucide check icon
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    });
  });
});


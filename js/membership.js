/**
 * AGNI FOUNDERS - MEMBERSHIP PAGE JAVASCRIPT
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Expandable Form Panels Toggle
  const toggleFormBtns = document.querySelectorAll('.toggle-form-btn');
  const formPanels = document.querySelectorAll('.form-container-panel');

  toggleFormBtns.forEach(btn => {
    btn.addEventListener('click', () => {
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
        
        const icon = item.querySelector('.faq-icon');
        if (icon && typeof lucide !== 'undefined') {
          icon.setAttribute('data-lucide', 'plus');
        }
      });

      if (!isActive) {
        // Open clicked FAQ
        parentItem.classList.add('active');
        question.setAttribute('aria-expanded', 'true');
        
        const icon = question.querySelector('.faq-icon');
        if (icon && typeof lucide !== 'undefined') {
          icon.setAttribute('data-lucide', 'plus');
        }
      }

      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    });
  });

  // 3. Native Form submission to backend Express API
  const nativeForms = document.querySelectorAll('.native-member-form');
  nativeForms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const tier = form.getAttribute('data-tier');
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalBtnHTML = submitBtn ? submitBtn.innerHTML : 'Submit Application';
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Submitting Application... <span class="spinner" style="display:inline-block; width:12px; height:12px; border:2px solid #fff; border-top:2px solid transparent; border-radius:50%; animation:spin 1s linear infinite;"></span>';
      }

      // Collect inputs into multipart FormData
      const formData = new FormData(form);
      formData.append('tier', tier);

      try {
        const response = await fetch('/api/applications', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const result = await response.json();

          // Hide form
          form.classList.add('hidden');
          
          // Populate custom success status message details
          const successBox = form.parentElement.querySelector('.form-success-message');
          if (successBox) {
            successBox.innerHTML = `
              <div class="success-icon-box" style="margin: 0 auto 1.5rem auto; width: 64px; height: 64px; background-color: rgba(46, 204, 113, 0.1); color: var(--color-spark); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
                <i data-lucide="check-circle" style="width: 36px; height: 36px;"></i>
              </div>
              <h3 style="color: var(--accent-primary); font-size: 1.6rem; margin-bottom: 0.75rem;">Application Submitted Successfully</h3>
              
              <div style="background-color: #1A1A24; padding: 1.25rem; border-radius: 8px; border: 1px solid var(--border-color); margin-bottom: 1.5rem;">
                <p style="font-size: 1.05rem; color: var(--text-primary); margin: 0.25rem 0;"><strong>Application ID:</strong> <span style="font-family: monospace; color: var(--accent-primary); font-weight: bold;">${result.application_id}</span></p>
                <p style="font-size: 1.05rem; color: var(--text-primary); margin: 0.25rem 0;"><strong>Current Status:</strong> <span style="color: #e67e22; font-weight: bold;">${result.status}</span></p>
              </div>

              <div style="text-align: left; color: var(--text-secondary); line-height: 1.6; font-size: 0.95rem; max-width: 500px; margin: 0 auto 1.5rem auto;">
                <p style="margin-bottom: 0.75rem;">Thank you for applying to AgniFounders.</p>
                <p style="margin-bottom: 0.75rem;">Your application has been successfully received.</p>
                <p style="margin-bottom: 0.75rem;">Our Membership Team will verify your submitted details and payment before approving your membership.</p>
                <p>You will receive an email once your application has been reviewed.</p>
              </div>
              <a href="/portal/track" class="btn btn-primary w-full">Track Application Status</a>
            `;
            successBox.classList.remove('hidden');
          }

          // Trigger icons reload
          if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }

          // Scroll success box into view
          successBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          const errData = await response.json();
          alert(errData.error || 'Failed to submit application. Please try again.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
          }
        }
      } catch (err) {
        console.error('Error submitting application:', err);
        alert('A network connection error occurred. Please verify your connection and try again.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHTML;
        }
      }
    });
  });
});

// CSS styles helper for button spinners
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

/**
 * AGNI FOUNDERS - CONTACT PAGE JAVASCRIPT
 */

document.addEventListener('DOMContentLoaded', () => {
  
  // ==========================================
  // 1. General Contact Form (Formspree Submit)
  // ==========================================
  const contactForm = document.getElementById('contact-form') || document.querySelector('.contact-form:not(#campus-rep-form)');
  const successBox = document.getElementById('contact-success-message');
  const successSubjectMsg = document.getElementById('success-subject-msg');

  if (contactForm && successBox) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalBtnHTML = submitBtn ? submitBtn.innerHTML : 'Send Message';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = 'Sending Message... <span class="spinner" style="display:inline-block; width:12px; height:12px; border:2px solid #fff; border-top:2px solid transparent; border-radius:50%; animation:spin 1s linear infinite;"></span>';
      }

      // Capture inputs
      const formData = new FormData(contactForm);
      const subjectCode = formData.get('subject');
      
      // Map subjects to human-readable text
      const subjectMapping = {
        'Partnership': 'Partnership Inquiry',
        'Media': 'Media / Press',
        'General': 'General Question',
        'Speaker': 'I want to speak at an event'
      };
      const subjectLabel = subjectMapping[subjectCode] || subjectCode || 'your inquiry';

      try {
        const response = await fetch(contactForm.action, {
          method: 'POST',
          body: formData,
          headers: {
            'Accept': 'application/json'
          }
        });

        if (response.ok) {
          contactForm.classList.add('hidden');
          
          if (successSubjectMsg) {
            successSubjectMsg.innerHTML = `Your message has been received successfully regarding the <strong>${subjectLabel}</strong>.`;
          }
          
          successBox.classList.remove('hidden');
          
          if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }
        } else {
          const errorData = await response.json();
          alert(errorData.errors ? errorData.errors.map(err => err.message).join(', ') : 'Failed to send message. Please try again.');
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalBtnHTML;
          }
        }
      } catch (err) {
        console.error('Error submitting form:', err);
        alert('A network error occurred. Please check your internet connection and try again.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHTML;
        }
      }
    });
  }

  // ==========================================
  // 2. Campus Representative Multi-Step Form
  // ==========================================
  const repForm = document.getElementById('campus-rep-form');
  const repSuccessBox = document.getElementById('rep-success-box');
  const stepIndicatorText = document.getElementById('step-indicator-text');
  const stepPercentage = document.getElementById('step-percentage');
  const progressBarFill = document.getElementById('progress-bar-fill');
  
  const prevBtn = document.getElementById('rep-prev-btn');
  const nextBtn = document.getElementById('rep-next-btn');
  const submitRepBtn = document.getElementById('rep-submit-btn');

  if (repForm && repSuccessBox) {
    let currentStep = 1;
    const totalSteps = 9;
    const stepPanels = repForm.querySelectorAll('.step-panel');

    const updateStepUI = () => {
      // Toggle visibility of panels
      stepPanels.forEach(panel => {
        const stepNum = parseInt(panel.getAttribute('data-step'), 10);
        if (stepNum === currentStep) {
          panel.classList.add('active');
          // Update texts
          if (stepIndicatorText) {
            stepIndicatorText.textContent = panel.getAttribute('data-title');
          }
        } else {
          panel.classList.remove('active');
        }
      });

      // Update progress bar
      const percentage = Math.round((currentStep / totalSteps) * 100);
      if (stepPercentage) stepPercentage.textContent = `${percentage}%`;
      if (progressBarFill) progressBarFill.style.width = `${percentage}%`;

      // Handle buttons visibility
      if (currentStep === 1) {
        prevBtn.style.display = 'none';
        nextBtn.style.display = 'block';
        submitRepBtn.style.display = 'none';
      } else if (currentStep === totalSteps) {
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'none';
        submitRepBtn.style.display = 'block';
      } else {
        prevBtn.style.display = 'block';
        nextBtn.style.display = 'block';
        submitRepBtn.style.display = 'none';
      }

      // Re-trigger icon rendering
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    };

    const validateStep = (step) => {
      const activePanel = repForm.querySelector(`.step-panel[data-step="${step}"]`);
      if (!activePanel) return true;

      const inputs = activePanel.querySelectorAll('input[required], select[required], textarea[required]');
      let isValid = true;

      // Reset previous error outlines
      inputs.forEach(input => {
        input.style.borderColor = '';
      });

      for (let input of inputs) {
        // Handle text, date, select, textarea validation
        if (!input.value.trim()) {
          input.style.borderColor = '#e74c3c';
          isValid = false;
        }

        // Specific pattern validation for telephone numbers
        if (input.type === 'tel' && input.pattern) {
          const regex = new RegExp(`^${input.pattern}$`);
          if (!regex.test(input.value.trim())) {
            input.style.borderColor = '#e74c3c';
            isValid = false;
          }
        }

        // Specific email validation
        if (input.type === 'email') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(input.value.trim())) {
            input.style.borderColor = '#e74c3c';
            isValid = false;
          }
        }
      }

      // Radio button groups validation (if required)
      const radioGroups = {};
      activePanel.querySelectorAll('input[type="radio"][required]').forEach(radio => {
        radioGroups[radio.name] = true;
      });

      for (let name of Object.keys(radioGroups)) {
        const checkedRadio = activePanel.querySelector(`input[name="${name}"]:checked`);
        if (!checkedRadio) {
          isValid = false;
          // Highlight option items
          activePanel.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
            const label = radio.closest('.checkbox-option-item');
            if (label) label.style.color = '#e74c3c';
          });
        } else {
          // Reset colors
          activePanel.querySelectorAll(`input[name="${name}"]`).forEach(radio => {
            const label = radio.closest('.checkbox-option-item');
            if (label) label.style.color = '';
          });
        }
      }

      // Checkbox agreements validation (specifically for Section 9 agreement checkboxes)
      const requiredCheckboxes = activePanel.querySelectorAll('input[type="checkbox"][required]');
      requiredCheckboxes.forEach(cb => {
        if (!cb.checked) {
          isValid = false;
          cb.style.outline = '2px solid #e74c3c';
        } else {
          cb.style.outline = '';
        }
      });

      if (!isValid) {
        alert('Please fill in all the required fields correctly before moving to the next section.');
      }

      return isValid;
    };

    // Next Button Click
    nextBtn.addEventListener('click', () => {
      if (validateStep(currentStep)) {
        if (currentStep < totalSteps) {
          currentStep++;
          updateStepUI();
          // Scroll to top of card form
          repForm.closest('.card').scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });

    // Prev Button Click
    prevBtn.addEventListener('click', () => {
      if (currentStep > 1) {
        currentStep--;
        updateStepUI();
        repForm.closest('.card').scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });

    // Form Submit
    repForm.addEventListener('submit', (e) => {
      e.preventDefault();

      if (!validateStep(currentStep)) {
        return;
      }

      // Process submission: Save to localStorage for dynamic management
      const formData = new FormData(repForm);
      const repData = {};
      
      formData.forEach((value, key) => {
        if (repData[key]) {
          if (!Array.isArray(repData[key])) {
            repData[key] = [repData[key]];
          }
          repData[key].push(value);
        } else {
          repData[key] = value;
        }
      });

      // Save to localStorage list
      try {
        const storedReps = localStorage.getItem('agni_campus_reps') || '[]';
        const repsList = JSON.parse(storedReps);
        repsList.push(repData);
        localStorage.setItem('agni_campus_reps', JSON.stringify(repsList));
      } catch (err) {
        console.error('Error saving Campus Rep Application:', err);
      }

      // Hide progress indicator, form title, and form elements
      const parentCard = repForm.closest('.card');
      if (parentCard) {
        parentCard.querySelectorAll('h3, p, .step-progress-wrapper, form').forEach(el => {
          if (el.id !== 'rep-success-box') {
            el.classList.add('hidden');
          }
        });
      }

      // Display the final success notification
      repSuccessBox.classList.remove('hidden');
      
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }

      // Scroll into view
      repSuccessBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  }
});

// CSS styles helper for form button spinner animation
const styleSheet = document.createElement("style");
styleSheet.innerText = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);

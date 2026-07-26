/**
 * AGNI FOUNDERS - CONTACT PAGE JAVASCRIPT
 */

document.addEventListener('DOMContentLoaded', () => {
  const contactForm = document.querySelector('.contact-form');
  const successBox = document.getElementById('contact-success-message');
  const successSubjectMsg = document.getElementById('success-subject-msg');

  if (contactForm && successBox) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = contactForm.querySelector('button[type="submit"]');
      const originalBtnHTML = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = 'Sending Message... <span class="spinner" style="display:inline-block; width:12px; height:12px; border:2px solid #fff; border-top:2px solid transparent; border-radius:50%; animation:spin 1s linear infinite;"></span>';

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
          // Hide form and display custom notification
          contactForm.classList.add('hidden');
          
          if (successSubjectMsg) {
            successSubjectMsg.innerHTML = `Your message has been received successfully regarding the <strong>${subjectLabel}</strong>.`;
          }
          
          successBox.classList.remove('hidden');
          
          // Trigger lucide icons updates
          if (typeof lucide !== 'undefined') {
            lucide.createIcons();
          }
        } else {
          const errorData = await response.json();
          alert(errorData.errors ? errorData.errors.map(err => err.message).join(', ') : 'Failed to send message. Please try again.');
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnHTML;
        }
      } catch (err) {
        console.error('Error submitting form:', err);
        alert('An network error occurred. Please check your internet connection and try again.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnHTML;
      }
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

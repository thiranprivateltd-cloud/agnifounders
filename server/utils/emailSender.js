/**
 * AgniFounders Email Automation Dispatcher
 * Sends Nodemailer emails if SMTP configs are present,
 * otherwise logs the complete formatted email templates locally to server/logs/sent_emails.log
 */

const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const logDir = path.join(__dirname, '..', 'logs');
const emailLogPath = path.join(logDir, 'sent_emails.log');

// Ensure log directories exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

// Initialize Nodemailer Transporter
let transporter = null;
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for others
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

/**
 * Dispatch an email notification to the recipient
 * @param {string} to - Recipient Email
 * @param {string} subject - Subject line
 * @param {string} htmlTemplate - HTML body
 * @param {string} textFallback - Plaintext backup
 */
async function sendEmail({ to, subject, htmlTemplate, textFallback = '' }) {
  const fromEmail = process.env.SMTP_FROM || 'no-reply@agnifounders.in';
  
  if (transporter) {
    try {
      await transporter.sendMail({
        from: `"AgniFounders" <${fromEmail}>`,
        to: to,
        subject: subject,
        text: textFallback || subject,
        html: htmlTemplate
      });
      console.log(`Email successfully sent to: ${to}`);
    } catch (err) {
      console.error(`Nodemailer error sending email to ${to}:`, err);
    }
  } else {
    // Log to file for development debugging
    const timestamp = new Date().toISOString();
    const logEntry = `
========================================================================
TIMESTAMP: ${timestamp}
TO: ${to}
SUBJECT: ${subject}
BODY:
${htmlTemplate.replace(/<[^>]*>/g, '\n').replace(/\n\s*\n/g, '\n')}
========================================================================
`;
    fs.appendFileSync(emailLogPath, logEntry, 'utf8');
    console.log(`[Email Logged Locally to server/logs/sent_emails.log] Subject: "${subject}" to: ${to}`);
  }
}

/**
 * Send Application Submitted Email
 */
async function sendApplicationSubmittedEmail(appId, email, plan) {
  const subject = 'Application Received – AgniFounders Membership';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #0A0A0F; color: #ffffff;">
      <h2 style="color: #F5A623; text-align: center;">AgniFounders</h2>
      <hr style="border-color: #333;" />
      <p>Hello Applicant,</p>
      <p>Thank you for applying to AgniFounders. Your application has been successfully received.</p>
      <div style="background-color: #1A1A24; padding: 15px; border-radius: 6px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Application ID:</strong> ${appId}</p>
        <p style="margin: 5px 0;"><strong>Membership Type:</strong> ${plan}</p>
        <p style="margin: 5px 0;"><strong>Current Status:</strong> Pending Review</p>
        <p style="margin: 5px 0;"><strong>Date Submitted:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      <p>Our Membership Team will verify your submitted details and payment transaction receipt before final approval.</p>
      <p>You will receive another notification once your application review proceeds to the next stage.</p>
      <p style="margin-top: 30px; font-size: 0.85rem; color: #8A8A9A;">
        Support: <a href="mailto:thiranprivateltd@gmail.com" style="color: #F5A623;">thiranprivateltd@gmail.com</a><br/>
        Website: <a href="http://localhost:8000" style="color: #F5A623;">agnifounders.in</a>
      </p>
    </div>
  `;
  await sendEmail({ to: email, subject, htmlTemplate: html, textFallback: `Application Received. ID: ${appId}` });
}

/**
 * Send Details Approved Email
 */
async function sendDetailsApprovedEmail(appId, email) {
  const subject = 'Details Approved – AgniFounders Membership';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #0A0A0F; color: #ffffff;">
      <h2 style="color: #F5A623; text-align: center;">AgniFounders</h2>
      <hr style="border-color: #333;" />
      <p>Dear Applicant,</p>
      <p>Your profile details have been verified and **Approved** by our Membership Team!</p>
      <p>Your application is now in the <strong>Payment Verification</strong> phase. We are validating your transaction reference number against our banking statement. You will receive a password setup email once this is completed.</p>
      <p style="margin-top: 20px;">Application ID: <strong>${appId}</strong></p>
    </div>
  `;
  await sendEmail({ to: email, subject, htmlTemplate: html });
}

/**
 * Send Payment Verified Email
 */
async function sendPaymentVerifiedEmail(appId, email) {
  const subject = 'Payment Verified – AgniFounders Membership';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #0A0A0F; color: #ffffff;">
      <h2 style="color: #F5A623; text-align: center;">AgniFounders</h2>
      <hr style="border-color: #333;" />
      <p>Dear Applicant,</p>
      <p>Your membership payment has been verified successfully!</p>
      <p>Your application has moved to the **Final Approval** stage. You will receive your welcome credentials and membership card generation links shortly.</p>
      <p style="margin-top: 20px;">Application ID: <strong>${appId}</strong></p>
    </div>
  `;
  await sendEmail({ to: email, subject, htmlTemplate: html });
}

/**
 * Send Membership Approved / Welcome Email
 */
async function sendMembershipApprovedEmail(appId, email, setupUrl) {
  const subject = 'Welcome to AgniFounders – Membership Approved!';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #0A0A0F; color: #ffffff;">
      <h2 style="color: #F5A623; text-align: center;">AgniFounders</h2>
      <hr style="border-color: #333;" />
      <p>Congratulations!</p>
      <p>Your application <strong>${appId}</strong> has been fully approved by the committee. You are now a recognized member of AgniFounders.</p>
      <p>To access your member profile, premium SaaS credits, networking portals, and download your digital membership card, please configure your account password using the link below:</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${setupUrl}" style="background-color: #F5A623; color: #0A0A0F; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Setup Account Password</a>
      </p>
      <p style="font-size: 0.85rem; color: #8A8A9A;">If the button above does not work, copy and paste this link in your browser: ${setupUrl}</p>
      <p>Welcome aboard!</p>
    </div>
  `;
  await sendEmail({ to: email, subject, htmlTemplate: html });
}

/**
 * Send Membership Rejected Email
 */
async function sendMembershipRejectedEmail(appId, email, reason = '') {
  const subject = 'Application Update – AgniFounders Membership';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #0A0A0F; color: #ffffff;">
      <h2 style="color: #e74c3c; text-align: center;">AgniFounders</h2>
      <hr style="border-color: #333;" />
      <p>Hello Applicant,</p>
      <p>We regret to inform you that your membership application <strong>${appId}</strong> could not be approved at this time.</p>
      ${reason ? `<p><strong>Reason for decision:</strong> ${reason}</p>` : ''}
      <p>If you believe there was an error or wish to submit an appeal, please reach out to us at <a href="mailto:thiranprivateltd@gmail.com" style="color: #F5A623;">thiranprivateltd@gmail.com</a>.</p>
    </div>
  `;
  await sendEmail({ to: email, subject, htmlTemplate: html });
}

/**
 * Send Password Reset Email
 */
async function sendPasswordResetEmail(email, resetUrl) {
  const subject = 'Password Reset Request – AgniFounders';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #0A0A0F; color: #ffffff;">
      <h2 style="color: #F5A623; text-align: center;">AgniFounders</h2>
      <hr style="border-color: #333;" />
      <p>Hello,</p>
      <p>We received a request to reset the password associated with your account.</p>
      <p>Click the link below to configure a new password. This link will expire in 1 hour.</p>
      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="background-color: #F5A623; color: #0A0A0F; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 6px; display: inline-block;">Reset Password</a>
      </p>
      <p>If you did not request this, you can safely ignore this email.</p>
    </div>
  `;
  await sendEmail({ to: email, subject, htmlTemplate: html });
}

module.exports = {
  sendApplicationSubmittedEmail,
  sendDetailsApprovedEmail,
  sendPaymentVerifiedEmail,
  sendMembershipApprovedEmail,
  sendMembershipRejectedEmail,
  sendPasswordResetEmail
};

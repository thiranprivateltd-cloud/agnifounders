/**
 * AgniFounders API Server Gateway
 */

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const { db, initializeDatabase } = require('./db/db');
const { generateQRCode, generateMembershipCard } = require('./utils/cardGenerator');
const {
  sendApplicationSubmittedEmail,
  sendDetailsApprovedEmail,
  sendPaymentVerifiedEmail,
  sendMembershipApprovedEmail,
  sendMembershipRejectedEmail,
  sendPasswordResetEmail
} = require('./utils/emailSender');

const app = express();
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'agnifounders_portal_secret_key_2026';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Folders Setup
const uploadsDir = path.join(__dirname, 'public', 'uploads');
const cardsDir = path.join(__dirname, 'public', 'cards');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
if (!fs.existsSync(cardsDir)) fs.mkdirSync(cardsDir, { recursive: true });

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}_${Date.now()}${ext}`);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Serve public static folder
app.use(express.static(path.join(__dirname, 'public')));

// Serve React Portal SPA routing fallback (placed before parent static directory to avoid source folder conflicts)
app.get('/portal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal', 'index.html'));
});
app.get('/portal/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'portal', 'index.html'));
});

// Serve static landing pages from the root
app.use(express.static(path.join(__dirname, '..')));

// JWT Token Verification Middleware
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token missing' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Access token invalid or expired' });
    req.user = user;
    next();
  });
};

// Admin Role Check Middleware
const verifyAdmin = (req, res, next) => {
  verifyToken(req, res, () => {
    if (req.user.role !== 'Super Admin') {
      return res.status(403).json({ error: 'Forbidden: Admin access required' });
    }
    next();
  });
};

// ==========================================
// API ROUTES
// ==========================================

// 1. Submit Application
app.post('/api/applications', upload.fields([
  { name: 'screenshot', maxCount: 1 },
  { name: 'pitch_doc', maxCount: 1 },
  { name: 'pitch_deck', maxCount: 1 }
]), async (req, res) => {
  try {
    let { name, email, college, city, txn, tier } = req.body;
    
    if (!name || !college || !city || !txn || !tier) {
      return res.status(400).json({ error: 'Required fields are missing.' });
    }

    if (!email) {
      email = `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@agnifounders-temp.in`;
    }

    // Determine ID prefix based on membership type
    let prefix = 'SPA';
    if (tier === 'Builder') prefix = 'BUI';
    if (tier === 'Founder Pro') prefix = 'FPO';

    // Generate unique sequential Application ID
    const appId = await db.applications.getNextSequenceId(prefix);
    
    // Store file paths
    const files = req.files || {};
    const screenshotUrl = files.screenshot ? `/uploads/${files.screenshot[0].filename}` : '';
    const pitchDocUrl = files.pitch_doc ? `/uploads/${files.pitch_doc[0].filename}` : (files.pitch_deck ? `/uploads/${files.pitch_deck[0].filename}` : '');

    // Compile form details
    const formData = {
      ...req.body,
      email,
      screenshot_url: screenshotUrl,
      pitch_doc_url: pitchDocUrl
    };

    // Save Application record
    const application = await db.applications.create({
      application_id: appId,
      membership_type: tier,
      status: 'Pending Review',
      form_data: formData,
      details_verified: false,
      payment_verified: false
    });

    // Save Payment record
    const amountMapping = { 'Spark': 299, 'Builder': 599, 'Founder Pro': 999 };
    const amount = amountMapping[tier] || 0;
    
    await db.payments.create({
      application_id: appId,
      transaction_id: txn,
      screenshot_url: screenshotUrl,
      amount: amount,
      status: 'Pending'
    });

    // Write audit log
    await db.auditLogs.log('System', 'Application Submitted', `Application created for ${name} (${appId})`);

    // Dispatch submission notification email asynchronously
    await sendApplicationSubmittedEmail(appId, email, tier);

    res.status(201).json({
      success: true,
      application_id: appId,
      status: 'Pending Review'
    });
  } catch (err) {
    console.error('Error submitting application:', err);
    res.status(500).json({ error: 'Failed to process application' });
  }
});

// 2. Auth Login (Double-tab endpoint)
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, loginType } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    let user = null;
    
    if (loginType === 'admin') {
      // Find Admin by Email
      user = await db.users.findByEmail(username);
      if (!user || user.role !== 'Super Admin') {
        return res.status(400).json({ error: 'Invalid admin credentials' });
      }
    } else {
      // Find Member by Application ID
      user = await db.users.findByAppId(username);
      if (!user) {
        return res.status(400).json({ error: 'Invalid application ID or password credentials' });
      }
    }

    // Verify bcrypt hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials password' });
    }

    // Sign JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, application_id: user.application_id, forceChange: !user.password_changed },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        application_id: user.application_id,
        forceChange: !user.password_changed
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server authentication failure' });
  }
});

// 3. Force Admin / Member Password Change
app.post('/api/auth/change-password', verifyToken, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.users.updatePassword(req.user.id, hashedPassword, true);
    await db.auditLogs.log(req.user.id, 'Password Changed', `Password updated successfully`);

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    console.error('Error changing password:', err);
    res.status(500).json({ error: 'Failed to update password' });
  }
});

// 4. Reset / Setup Member Password (public via token or AppID setup)
app.post('/api/auth/setup-password', async (req, res) => {
  try {
    const { application_id, password } = req.body;
    if (!application_id || !password) {
      return res.status(400).json({ error: 'Missing fields' });
    }

    const appRecord = await db.applications.find(application_id);
    if (!appRecord || appRecord.status !== 'Approved') {
      return res.status(400).json({ error: 'This application is not approved for login' });
    }

    // Check if account already exists
    const userExists = await db.users.findByAppId(application_id);
    if (userExists && userExists.password_changed) {
      return res.status(400).json({ error: 'Account password has already been configured' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    if (userExists) {
      await db.users.updatePassword(userExists.id, hashedPassword, true);
    } else {
      await db.users.create({
        email: appRecord.form_data.email,
        password_hash: hashedPassword,
        role: 'Member',
        application_id: application_id,
        password_changed: true
      });
    }

    await db.auditLogs.log(application_id, 'Member Password Setup', `Member profile account activated`);

    res.json({ success: true, message: 'Password setup completed successfully. You can now login.' });
  } catch (err) {
    console.error('Password setup error:', err);
    res.status(500).json({ error: 'Failed to configure account' });
  }
});

// 5. Public Application Status Tracker
app.get('/api/public/track/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const appRecord = await db.applications.find(appId);
    
    if (!appRecord) {
      return res.status(404).json({ error: 'Application ID not found' });
    }

    // Process step statuses
    const stages = {
      submitted: { name: 'Application Submitted', status: 'Completed' },
      profile: { name: 'Profile Verification', status: appRecord.details_verified ? 'Completed' : (appRecord.status === 'Rejected' ? 'Rejected' : 'In Progress') },
      payment: { name: 'Payment Verification', status: appRecord.payment_verified ? 'Completed' : (appRecord.status === 'Rejected' ? 'Rejected' : (appRecord.details_verified ? 'In Progress' : 'Pending')) },
      approval: { name: 'Membership Approval', status: appRecord.status === 'Approved' ? 'Completed' : (appRecord.status === 'Rejected' ? 'Rejected' : 'Pending') },
      card: { name: 'Membership Card Generated', status: appRecord.status === 'Approved' ? 'Completed' : 'Pending' },
      completed: { name: 'Completed', status: appRecord.status === 'Approved' ? 'Completed' : 'Pending' }
    };

    res.json({
      application_id: appRecord.application_id,
      membership_type: appRecord.membership_type,
      current_status: appRecord.status,
      stages
    });
  } catch (err) {
    console.error('Track error:', err);
    res.status(500).json({ error: 'Failed to fetch status' });
  }
});

// 6. Admin: List Applications
app.get('/api/admin/applications', verifyAdmin, async (req, res) => {
  try {
    const list = await db.applications.listAll();
    res.json(list);
  } catch (err) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ error: 'Failed to list records' });
  }
});

// 7. Admin: Approve Application Details
app.put('/api/admin/applications/:appId/verify-details', verifyAdmin, async (req, res) => {
  try {
    const { appId } = req.params;
    const appRecord = await db.applications.find(appId);
    if (!appRecord) return res.status(404).json({ error: 'Record not found' });

    await db.applications.updateStatus(appId, 'In Progress', true, appRecord.payment_verified);
    await db.auditLogs.log(req.user.id, 'Approve Details', `Details approved for ${appId}`);

    // Trigger details approved email notification
    await sendDetailsApprovedEmail(appId, appRecord.form_data.email);

    res.json({ success: true, message: 'Details verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Update failed' });
  }
});

// 8. Admin: Verify & Approve Payment (Triggers Final Membership Generation)
app.put('/api/admin/applications/:appId/verify-payment', verifyAdmin, async (req, res) => {
  try {
    const { appId } = req.params;
    const appRecord = await db.applications.find(appId);
    if (!appRecord) return res.status(404).json({ error: 'Record not found' });

    if (!appRecord.details_verified) {
      return res.status(400).json({ error: 'Details must be verified before payment verification' });
    }

    // Set payment verified
    await db.applications.updateStatus(appId, 'Approved', true, true);
    await db.payments.verify(appId, 'Verified');

    // Create user login shell if not existing
    const userExists = await db.users.findByAppId(appId);
    if (!userExists) {
      const tempHash = await bcrypt.hash(appId, 10); // Hashed Application ID as the initial password
      await db.users.create({
        email: appRecord.form_data.email,
        password_hash: tempHash,
        role: 'Member',
        application_id: appId,
        password_changed: false
      });
    }

    // Generate PDF card and dynamic QR Code
    const cardData = {
      application_id: appId,
      member_name: appRecord.form_data.name,
      membership_type: appRecord.membership_type,
      startup_name: appRecord.form_data.startup || '',
      college_name: appRecord.form_data.college,
      issue_date: new Date(),
      expiry_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)) // 1 year validity
    };
    
    const cardAssets = await generateMembershipCard(cardData);
    await db.cards.create({
      ...cardData,
      qr_code_url: cardAssets.qr_code_url,
      card_pdf_url: cardAssets.card_pdf_url,
      card_png_url: cardAssets.card_png_url
    });

    await db.auditLogs.log(req.user.id, 'Approve Payment & Generate Card', `Payment verified and member credentials issued for ${appId}`);

    // Dispatch welcome email with credentials password setup URL
    const setupUrl = `http://localhost:8000/portal/setup-password?id=${appId}`;
    await sendPaymentVerifiedEmail(appId, appRecord.form_data.email);
    await sendMembershipApprovedEmail(appId, appRecord.form_data.email, setupUrl);

    res.json({ success: true, message: 'Payment verified and membership generated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// 9. Admin: Reject Application
app.put('/api/admin/applications/:appId/reject', verifyAdmin, async (req, res) => {
  try {
    const { appId } = req.params;
    const { reason } = req.body;
    const appRecord = await db.applications.find(appId);
    if (!appRecord) return res.status(404).json({ error: 'Record not found' });

    await db.applications.updateStatus(appId, 'Rejected', false, false);
    await db.payments.verify(appId, 'Rejected');
    await db.auditLogs.log(req.user.id, 'Reject Application', `Application ${appId} rejected. Reason: ${reason}`);

    // Dispatch rejection notification email
    await sendMembershipRejectedEmail(appId, appRecord.form_data.email, reason);

    res.json({ success: true, message: 'Application rejected successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Rejection processing failed' });
  }
});

// 10. Member Profile Details fetch
app.get('/api/member/profile', verifyToken, async (req, res) => {
  try {
    const appId = req.user.application_id;
    if (!appId) return res.status(400).json({ error: 'Not a member profile' });

    const appRecord = await db.applications.find(appId);
    const cardRecord = await db.cards.findByAppId(appId);

    if (!appRecord) return res.status(404).json({ error: 'Profile not found' });

    res.json({
      profile: {
        application_id: appId,
        name: appRecord.form_data.name,
        email: appRecord.form_data.email,
        phone: appRecord.form_data.phone || appRecord.form_data.social || '',
        college: appRecord.form_data.college,
        city: appRecord.form_data.city,
        state: appRecord.form_data.state || 'N/A',
        domain: appRecord.form_data.domain || 'General',
        startup: appRecord.form_data.startup || 'Exploring Ideas',
        linkedin: appRecord.form_data.linkedin || '#',
        tier: appRecord.membership_type,
        status: appRecord.status,
        issue_date: cardRecord ? cardRecord.issue_date : 'Pending',
        expiry_date: cardRecord ? cardRecord.expiry_date : 'Pending',
        card: cardRecord || null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve profile info' });
  }
});

// 11. Public verification check (scanned QR endpoint router)
app.get('/verify/:appId', async (req, res) => {
  try {
    const { appId } = req.params;
    const card = await db.cards.findByAppId(appId);
    const appRecord = await db.applications.find(appId);

    if (!card || !appRecord || appRecord.status !== 'Approved') {
      return res.status(404).send(`
        <html>
          <body style="background-color:#0A0A0F; color:#e74c3c; font-family:sans-serif; text-align:center; padding: 4rem;">
            <h2>❌ Invalid Membership</h2>
            <p style="color:#8A8A9A;">No active AgniFounders credentials associated with ID: ${appId}</p>
          </body>
        </html>
      `);
    }

    res.send(`
      <html>
        <body style="background-color:#0A0A0F; color:#ffffff; font-family:sans-serif; display:flex; justify-content:center; align-items:center; min-height:100vh; margin:0;">
          <div style="background-color:#1A1A24; padding:3rem; border-radius:12px; border:1px solid #F5A623; text-align:center; max-width:450px;">
            <h2 style="color:#2ecc71; margin-bottom:1rem;">✓ Verified Member</h2>
            <h3 style="margin: 0 0 1.5rem 0; font-size:1.8rem; letter-spacing:0.5px;">${card.member_name}</h3>
            <div style="text-align:left; border-top:1px solid #333; padding-top:1.5rem;">
              <p style="margin:8px 0; color:#8A8A9A;"><strong>Application ID:</strong> ${card.application_id}</p>
              <p style="margin:8px 0; color:#8A8A9A;"><strong>Membership Type:</strong> ${card.membership_type}</p>
              <p style="margin:8px 0; color:#8A8A9A;"><strong>Startup Name:</strong> ${card.startup_name || 'Exploring Ideas'}</p>
              <p style="margin:8px 0; color:#8A8A9A;"><strong>Membership Status:</strong> <span style="color:#2ecc71; font-weight:bold;">Active</span></p>
              <p style="margin:8px 0; color:#8A8A9A;"><strong>Issue Date:</strong> ${new Date(card.issue_date).toLocaleDateString()}</p>
              <p style="margin:8px 0; color:#8A8A9A;"><strong>Expiry Date:</strong> ${new Date(card.expiry_date).toLocaleDateString()}</p>
            </div>
            <div style="margin-top:2.5rem; font-weight:bold; color:#F5A623; font-size:1.1rem;">
              Dream • Build • Launch
            </div>
          </div>
        </body>
      </html>
    `);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error');
  }
});



// Initialize database schema and fire up listener
if (process.env.VERCEL) {
  initializeDatabase().catch(err => console.error('Database init error:', err));
} else {
  initializeDatabase().then(() => {
    app.listen(PORT, () => {
      console.log(`AgniFounders API Server running on port ${PORT}`);
    });
  }).catch(err => {
    console.error('Fatal: Database initialization failed:', err);
  });
}

module.exports = app;

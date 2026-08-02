/**
 * AgniFounders Database Layer
 * Supports PostgreSQL connection pooling if configured,
 * otherwise falls back to a secure JSON file persistence engine for local development.
 */

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const isProduction = process.env.NODE_ENV === 'production';
const dbUrl = process.env.postgresql://neondb_owner:npg_trpO2j6HGVwn@ep-long-silence-au7x2342-pooler.c-10.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
;

let pgPool = null;
const jsonDbPath = path.join(__dirname, 'database.json');

// Initialize PG Pool if configuration is present
if (dbUrl || (process.env.DB_HOST && process.env.DB_USER)) {
  console.log('Database Mode: PostgreSQL');
  pgPool = new Pool({
    connectionString: dbUrl,
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 5432,
    ssl: isProduction ? { rejectUnauthorized: false } : false
  });
} else {
  console.log('Database Mode: Local JSON File Fallback (server/db/database.json)');
  // Ensure JSON database file exists
  if (!fs.existsSync(jsonDbPath)) {
    const initialSchema = {
      users: [],
      applications: [],
      payments: [],
      membership_cards: [],
      audit_logs: [],
      settings: {}
    };
    fs.writeFileSync(jsonDbPath, JSON.stringify(initialSchema, null, 2), 'utf8');
  }
}

// Helper: Read JSON DB
function readJsonDb() {
  const data = fs.readFileSync(jsonDbPath, 'utf8');
  return JSON.parse(data);
}

// Helper: Write JSON DB
function writeJsonDb(data) {
  fs.writeFileSync(jsonDbPath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Run database migrations or initial schemas setup
 */
async function initializeDatabase() {
  const defaultAdminEmail = 'Admin@agnifounders.in';
  const defaultAdminPass = 'Thiran2026';
  
  if (pgPool) {
    // Run PostgreSQL DDL Migrations
    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      
      // Users Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id SERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) NOT NULL,
          application_id VARCHAR(100),
          password_changed BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Applications Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS applications (
          id SERIAL PRIMARY KEY,
          application_id VARCHAR(100) UNIQUE NOT NULL,
          date_submitted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          membership_type VARCHAR(100) NOT NULL,
          status VARCHAR(100) NOT NULL,
          form_data JSONB NOT NULL,
          details_verified BOOLEAN DEFAULT FALSE,
          payment_verified BOOLEAN DEFAULT FALSE
        );
      `);

      // Payments Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id SERIAL PRIMARY KEY,
          application_id VARCHAR(100) REFERENCES applications(application_id),
          transaction_id VARCHAR(100) NOT NULL,
          screenshot_url TEXT,
          amount NUMERIC NOT NULL,
          payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          status VARCHAR(100) DEFAULT 'Pending'
        );
      `);

      // Membership Cards Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS membership_cards (
          id SERIAL PRIMARY KEY,
          application_id VARCHAR(100) REFERENCES applications(application_id),
          member_name VARCHAR(255) NOT NULL,
          membership_type VARCHAR(100) NOT NULL,
          startup_name VARCHAR(255),
          qr_code_url TEXT,
          issue_date TIMESTAMP NOT NULL,
          expiry_date TIMESTAMP NOT NULL,
          card_pdf_url TEXT,
          card_png_url TEXT
        );
      `);

      // Audit Logs Table
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          user_id VARCHAR(100),
          action TEXT NOT NULL,
          details TEXT,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Seed Super Admin if missing
      const res = await client.query('SELECT * FROM users WHERE email = $1', [defaultAdminEmail]);
      if (res.rows.length === 0) {
        const hashedPassword = await bcrypt.hash(defaultAdminPass, 10);
        await client.query(
          'INSERT INTO users (email, password_hash, role, password_changed) VALUES ($1, $2, $3, $4)',
          [defaultAdminEmail, hashedPassword, 'Super Admin', false]
        );
        console.log('Super Admin user created successfully in PG Database.');
      }

      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      console.error('Error running PG database migrations:', err);
    } finally {
      client.release();
    }
  } else {
    // Setup local JSON file schema / seed
    const db = readJsonDb();
    const adminExists = db.users.find(u => u.email.toLowerCase() === defaultAdminEmail.toLowerCase());
    
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash(defaultAdminPass, 10);
      db.users.push({
        id: Date.now(),
        email: defaultAdminEmail,
        password_hash: hashedPassword,
        role: 'Super Admin',
        password_changed: false,
        created_at: new Date().toISOString()
      });
      writeJsonDb(db);
      console.log('Super Admin user created successfully in JSON Local Database.');
    }
  }
}

// Database query interfaces
const db = {
  query: async (text, params) => {
    if (pgPool) {
      return pgPool.query(text, params);
    } else {
      throw new Error('Raw SQL querying not supported in JSON file mode. Use helper methods.');
    }
  },
  
  // Custom helper operations for unified backend controllers
  users: {
    findByEmail: async (email) => {
      if (pgPool) {
        const res = await pgPool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
        return res.rows[0];
      } else {
        const dbData = readJsonDb();
        return dbData.users.find(u => u.email.toLowerCase() === email.toLowerCase());
      }
    },
    
    findByAppId: async (appId) => {
      if (pgPool) {
        const res = await pgPool.query('SELECT * FROM users WHERE application_id = $1', [appId]);
        return res.rows[0];
      } else {
        const dbData = readJsonDb();
        return dbData.users.find(u => u.application_id === appId);
      }
    },

    create: async (userData) => {
      if (pgPool) {
        const res = await pgPool.query(
          'INSERT INTO users (email, password_hash, role, application_id, password_changed) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [userData.email, userData.password_hash, userData.role, userData.application_id, userData.password_changed]
        );
        return res.rows[0];
      } else {
        const dbData = readJsonDb();
        const newUser = {
          id: Date.now() + Math.random(),
          email: userData.email,
          password_hash: userData.password_hash,
          role: userData.role,
          application_id: userData.application_id,
          password_changed: userData.password_changed,
          created_at: new Date().toISOString()
        };
        dbData.users.push(newUser);
        writeJsonDb(dbData);
        return newUser;
      }
    },

    updatePassword: async (userId, newHash, passChanged = true) => {
      if (pgPool) {
        await pgPool.query(
          'UPDATE users SET password_hash = $1, password_changed = $2 WHERE id = $3',
          [newHash, passChanged, userId]
        );
      } else {
        const dbData = readJsonDb();
        const user = dbData.users.find(u => u.id === userId);
        if (user) {
          user.password_hash = newHash;
          user.password_changed = passChanged;
          writeJsonDb(dbData);
        }
      }
    }
  },

  applications: {
    create: async (appData) => {
      if (pgPool) {
        const res = await pgPool.query(
          'INSERT INTO applications (application_id, membership_type, status, form_data, details_verified, payment_verified) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
          [appData.application_id, appData.membership_type, appData.status, JSON.stringify(appData.form_data), appData.details_verified, appData.payment_verified]
        );
        return res.rows[0];
      } else {
        const dbData = readJsonDb();
        const newApp = {
          id: Date.now() + Math.random(),
          application_id: appData.application_id,
          date_submitted: new Date().toISOString(),
          membership_type: appData.membership_type,
          status: appData.status,
          form_data: appData.form_data,
          details_verified: appData.details_verified,
          payment_verified: appData.payment_verified
        };
        dbData.applications.push(newApp);
        writeJsonDb(dbData);
        return newApp;
      }
    },

    find: async (appId) => {
      if (pgPool) {
        const res = await pgPool.query('SELECT * FROM applications WHERE application_id = $1', [appId]);
        return res.rows[0];
      } else {
        const dbData = readJsonDb();
        return dbData.applications.find(a => a.application_id === appId);
      }
    },

    findByEmail: async (email) => {
      if (pgPool) {
        const res = await pgPool.query("SELECT * FROM applications WHERE form_data->>'email' = $1", [email]);
        return res.rows[0];
      } else {
        const dbData = readJsonDb();
        return dbData.applications.find(a => a.form_data && a.form_data.email && a.form_data.email.toLowerCase() === email.toLowerCase());
      }
    },

    listAll: async () => {
      if (pgPool) {
        const res = await pgPool.query('SELECT * FROM applications ORDER BY date_submitted DESC');
        return res.rows;
      } else {
        const dbData = readJsonDb();
        return [...dbData.applications].sort((a, b) => new Date(b.date_submitted) - new Date(a.date_submitted));
      }
    },

    getCountByPlan: async (plan) => {
      if (pgPool) {
        const res = await pgPool.query('SELECT COUNT(*) FROM applications WHERE membership_type = $1', [plan]);
        return parseInt(res.rows[0].count, 10);
      } else {
        const dbData = readJsonDb();
        return dbData.applications.filter(a => a.membership_type.toLowerCase() === plan.toLowerCase()).length;
      }
    },

    getNextSequenceId: async (planPrefix) => {
      // Find the count of applications for this specific plan to build the sequential count-up
      let count = 0;
      if (pgPool) {
        const res = await pgPool.query(
          'SELECT COUNT(*) FROM applications WHERE application_id LIKE $1',
          [`AG-${planPrefix}-2026-%`]
        );
        count = parseInt(res.rows[0].count, 10) + 1;
      } else {
        const dbData = readJsonDb();
        const matches = dbData.applications.filter(a => a.application_id.startsWith(`AG-${planPrefix}-2026-`));
        count = matches.length + 1;
      }
      const pad = String(count).padStart(4, '0');
      return `AG-${planPrefix}-2026-${pad}`;
    },

    updateStatus: async (appId, status, detailsVerified = null, paymentVerified = null) => {
      if (pgPool) {
        let query = 'UPDATE applications SET status = $1';
        const params = [status, appId];
        let index = 3;
        if (detailsVerified !== null) {
          query += `, details_verified = $${index}`;
          params.push(detailsVerified);
          index++;
        }
        if (paymentVerified !== null) {
          query += `, payment_verified = $${index}`;
          params.push(paymentVerified);
          index++;
        }
        query += ` WHERE application_id = $2`;
        await pgPool.query(query, params);
      } else {
        const dbData = readJsonDb();
        const app = dbData.applications.find(a => a.application_id === appId);
        if (app) {
          app.status = status;
          if (detailsVerified !== null) app.details_verified = detailsVerified;
          if (paymentVerified !== null) app.payment_verified = paymentVerified;
          writeJsonDb(dbData);
        }
      }
    }
  },

  payments: {
    create: async (payData) => {
      if (pgPool) {
        const res = await pgPool.query(
          'INSERT INTO payments (application_id, transaction_id, screenshot_url, amount, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [payData.application_id, payData.transaction_id, payData.screenshot_url, payData.amount, payData.status]
        );
        return res.rows[0];
      } else {
        const dbData = readJsonDb();
        const newPay = {
          id: Date.now() + Math.random(),
          application_id: payData.application_id,
          transaction_id: payData.transaction_id,
          screenshot_url: payData.screenshot_url,
          amount: payData.amount,
          payment_date: new Date().toISOString(),
          status: payData.status
        };
        dbData.payments.push(newPay);
        writeJsonDb(dbData);
        return newPay;
      }
    },

    findByAppId: async (appId) => {
      if (pgPool) {
        const res = await pgPool.query('SELECT * FROM payments WHERE application_id = $1', [appId]);
        return res.rows[0];
      } else {
        const dbData = readJsonDb();
        return dbData.payments.find(p => p.application_id === appId);
      }
    },

    verify: async (appId, status) => {
      if (pgPool) {
        await pgPool.query('UPDATE payments SET status = $1 WHERE application_id = $2', [status, appId]);
      } else {
        const dbData = readJsonDb();
        const pay = dbData.payments.find(p => p.application_id === appId);
        if (pay) {
          pay.status = status;
          writeJsonDb(dbData);
        }
      }
    }
  },

  cards: {
    create: async (cardData) => {
      if (pgPool) {
        const res = await pgPool.query(
          'INSERT INTO membership_cards (application_id, member_name, membership_type, startup_name, qr_code_url, issue_date, expiry_date, card_pdf_url, card_png_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
          [cardData.application_id, cardData.member_name, cardData.membership_type, cardData.startup_name, cardData.qr_code_url, cardData.issue_date, cardData.expiry_date, cardData.card_pdf_url, cardData.card_png_url]
        );
        return res.rows[0];
      } else {
        const dbData = readJsonDb();
        const newCard = {
          id: Date.now() + Math.random(),
          application_id: cardData.application_id,
          member_name: cardData.member_name,
          membership_type: cardData.membership_type,
          startup_name: cardData.startup_name,
          qr_code_url: cardData.qr_code_url,
          issue_date: cardData.issue_date,
          expiry_date: cardData.expiry_date,
          card_pdf_url: cardData.card_pdf_url,
          card_png_url: cardData.card_png_url
        };
        dbData.membership_cards.push(newCard);
        writeJsonDb(dbData);
        return newCard;
      }
    },

    findByAppId: async (appId) => {
      if (pgPool) {
        const res = await pgPool.query('SELECT * FROM membership_cards WHERE application_id = $1', [appId]);
        return res.rows[0];
      } else {
        const dbData = readJsonDb();
        return dbData.membership_cards.find(c => c.application_id === appId);
      }
    }
  },

  auditLogs: {
    log: async (userId, action, details = '') => {
      if (pgPool) {
        await pgPool.query(
          'INSERT INTO audit_logs (user_id, action, details) VALUES ($1, $2, $3)',
          [userId, action, details]
        );
      } else {
        const dbData = readJsonDb();
        dbData.audit_logs.push({
          id: Date.now() + Math.random(),
          user_id: userId,
          action: action,
          details: details,
          timestamp: new Date().toISOString()
        });
        writeJsonDb(dbData);
      }
    },

    listAll: async () => {
      if (pgPool) {
        const res = await pgPool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC');
        return res.rows;
      } else {
        const dbData = readJsonDb();
        return [...dbData.audit_logs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
    }
  }
};

module.exports = {
  db,
  initializeDatabase
};

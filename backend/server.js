// Backend API Server for Lunara Invoice Management
// This file should be deployed to your server to handle MySQL connections

const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Database configuration
const dbConfig = {
  host: '107.175.179.122',
  user: 'lunara',
  password: 'SbX7s8aMjf7xZX2e',
  database: 'lunara_invoices',
  port: 3306,
  ssl: false,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';

// Auth middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE id = ? AND is_active = TRUE',
      [decoded.userId]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    req.user = rows[0];
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid token' });
  }
};

// Verify Turnstile token
const verifyTurnstile = async (token) => {
  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=0x4AAAAAABk-oecjI8kuCX-L2BwDbX59Ka4&response=${token}`,
    });
    
    const data = await response.json();
    return data.success;
  } catch (error) {
    console.error('Turnstile verification failed:', error);
    return false;
  }
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, turnstileToken } = req.body;

    // Verify Turnstile
    const turnstileValid = await verifyTurnstile(turnstileToken);
    if (!turnstileValid) {
      return res.status(400).json({ message: 'Security verification failed' });
    }

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user exists
    const [existingUsers] = await pool.execute(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const userId = require('crypto').randomUUID();
    await pool.execute(
      `INSERT INTO users (id, username, email, password_hash, role, is_active, last_login) 
       VALUES (?, ?, ?, ?, 'member', TRUE, NOW())`,
      [userId, username, email, passwordHash]
    );

    // Generate JWT
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' });

    // Get user data
    const [userRows] = await pool.execute(
      'SELECT id, username, email, role, is_active, created_at, updated_at, last_login FROM users WHERE id = ?',
      [userId]
    );

    res.status(201).json({
      user: userRows[0],
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Get user
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = rows[0];

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Update last login
    await pool.execute(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // Generate JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });

    // Remove password from response
    delete user.password_hash;

    res.json({ user, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// User Management Routes
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const [rows] = await pool.execute(
      'SELECT id, username, email, role, is_active, created_at, updated_at, last_login FROM users ORDER BY created_at DESC'
    );

    res.json(rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Invoice Management Routes
app.get('/api/invoices', authenticateToken, async (req, res) => {
  try {
    const [invoiceRows] = await pool.execute(
      'SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    // Get items for each invoice
    for (let invoice of invoiceRows) {
      const [itemRows] = await pool.execute(
        'SELECT id, description, quantity, unit_price as price, total_amount as total FROM invoice_items WHERE invoice_id = ? ORDER BY item_order',
        [invoice.id]
      );
      invoice.items = itemRows;
    }

    res.json(invoiceRows);
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.post('/api/invoices', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();

    const invoice = req.body;
    const invoiceId = invoice.id || require('crypto').randomUUID();

    // Insert invoice
    await connection.execute(
      `INSERT INTO invoices (
        id, invoice_number, user_id, status, invoice_date, due_date,
        company_name, company_address, company_phone, company_email, company_website, company_logo,
        client_name, client_address, client_phone, client_email,
        currency, subtotal, tax_rate, tax_amount, discount_rate, discount_amount, total_amount,
        notes, terms, language, theme
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceId, invoice.invoiceNumber, req.user.id, invoice.status || 'draft',
        invoice.date, invoice.dueDate,
        invoice.companyName, invoice.companyAddress, invoice.companyPhone, 
        invoice.companyEmail, invoice.companyWebsite, invoice.logo,
        invoice.clientName, invoice.clientAddress, invoice.clientPhone, invoice.clientEmail,
        invoice.currency, invoice.subtotal, invoice.taxRate, invoice.taxAmount,
        invoice.discountRate, invoice.discountAmount, invoice.total,
        invoice.notes, invoice.terms, invoice.language, invoice.theme
      ]
    );

    // Insert items
    for (let i = 0; i < invoice.items.length; i++) {
      const item = invoice.items[i];
      await connection.execute(
        'INSERT INTO invoice_items (id, invoice_id, item_order, description, quantity, unit_price, total_amount) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [item.id || require('crypto').randomUUID(), invoiceId, i, item.description, item.quantity, item.price, item.total]
      );
    }

    await connection.commit();

    // Get the created invoice
    const [rows] = await connection.execute('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    const [itemRows] = await connection.execute(
      'SELECT id, description, quantity, unit_price as price, total_amount as total FROM invoice_items WHERE invoice_id = ? ORDER BY item_order',
      [invoiceId]
    );
    
    const createdInvoice = { ...rows[0], items: itemRows };
    res.status(201).json(createdInvoice);
  } catch (error) {
    await connection.rollback();
    console.error('Create invoice error:', error);
    res.status(500).json({ message: 'Internal server error' });
  } finally {
    connection.release();
  }
});

app.patch('/api/invoices/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    await pool.execute(
      'UPDATE invoices SET status = ?, status_updated_at = NOW(), updated_at = NOW() WHERE id = ? AND user_id = ?',
      [status, id, req.user.id]
    );

    const [rows] = await pool.execute('SELECT * FROM invoices WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Lunara API Server running on port ${PORT}`);
  console.log(`📊 Database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
});

module.exports = app;
import mysql from 'mysql2/promise';
import { User } from '../types/user';
import { InvoiceData } from '../types/invoice';
import { testMySQLConnection } from './testMysqlConnection';

// MySQL configuration
const MYSQL_CONFIG = {
  host: '107.175.179.122',
  user: 'lunara',
  password: 'SbX7s8aMjf7xZX2e',
  database: 'lunara', 
  port: 3306,
  ssl: false,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  connectTimeout: 60000
};

// Create connection pool
let pool: mysql.Pool | null = null;

const createPool = () => {
  if (!pool) {
    pool = mysql.createPool(MYSQL_CONFIG);
  }
  return pool;
};

export class MySQLService {
  private pool: mysql.Pool;

  constructor() {
    this.pool = createPool();
  }

  // Test connection
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔄 Testing MySQL connection to lunara database...');
      const connection = await this.pool.getConnection();
      await connection.ping();
      
      // Test database access
      const [result] = await connection.execute('SELECT DATABASE() as db, NOW() as time');
      console.log('📊 Connected to database:', result);
      
      connection.release();
      console.log('✅ MySQL connection successful');
      return true;
    } catch (error) {
      console.error('❌ MySQL connection failed:', {
        message: error.message,
        code: error.code,
        errno: error.errno
      });
      return false;
    }
  }

  // Initialize database tables
  async initializeTables(): Promise<void> {
    try {
      console.log('🔄 Initializing MySQL tables...');
      const connection = await this.pool.getConnection();

      // Check if tables already exist
      const [existingTables] = await connection.execute('SHOW TABLES') as any;
      console.log('📋 Existing tables:', existingTables.map((t: any) => Object.values(t)[0]));

      if (existingTables.length > 0) {
        console.log('✅ Tables already exist, skipping creation');
        connection.release();
        return;
      }

      // Create users table
      console.log('📝 Creating users table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(36) PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role ENUM('admin', 'member') DEFAULT 'member',
          is_active BOOLEAN DEFAULT TRUE,
          full_name VARCHAR(100),
          phone VARCHAR(20),
          avatar TEXT,
          preferences JSON,
          two_factor_enabled BOOLEAN DEFAULT FALSE,
          last_password_change TIMESTAMP NULL,
          email_verified BOOLEAN DEFAULT FALSE,
          whatsapp_verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          last_login TIMESTAMP NULL,
          INDEX idx_username (username),
          INDEX idx_email (email),
          INDEX idx_role (role)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Create invoices table
      console.log('📝 Creating invoices table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS invoices (
          id VARCHAR(36) PRIMARY KEY,
          invoice_number VARCHAR(50) UNIQUE NOT NULL,
          user_id VARCHAR(36) NOT NULL,
          status ENUM('draft', 'pending', 'paid', 'cancelled') DEFAULT 'draft',
          invoice_date DATE NOT NULL,
          due_date DATE NOT NULL,
          status_updated_at TIMESTAMP NULL,
          company_name VARCHAR(255) NOT NULL,
          company_address TEXT,
          company_phone VARCHAR(20),
          company_email VARCHAR(255),
          company_website VARCHAR(255),
          company_logo TEXT,
          client_name VARCHAR(255) NOT NULL,
          client_address TEXT,
          client_phone VARCHAR(20),
          client_email VARCHAR(255),
          currency VARCHAR(3) DEFAULT 'USD',
          subtotal DECIMAL(15,2) DEFAULT 0.00,
          tax_rate DECIMAL(5,2) DEFAULT 0.00,
          tax_amount DECIMAL(15,2) DEFAULT 0.00,
          discount_rate DECIMAL(5,2) DEFAULT 0.00,
          discount_amount DECIMAL(15,2) DEFAULT 0.00,
          total_amount DECIMAL(15,2) DEFAULT 0.00,
          notes TEXT,
          terms TEXT,
          language ENUM('en', 'id') DEFAULT 'en',
          theme VARCHAR(50) DEFAULT 'modern',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_id (user_id),
          INDEX idx_status (status),
          INDEX idx_date (invoice_date)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Create invoice_items table
      console.log('📝 Creating invoice_items table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS invoice_items (
          id VARCHAR(36) PRIMARY KEY,
          invoice_id VARCHAR(36) NOT NULL,
          item_order INT DEFAULT 0,
          description TEXT NOT NULL,
          quantity DECIMAL(10,2) DEFAULT 1.00,
          unit_price DECIMAL(15,2) DEFAULT 0.00,
          total_amount DECIMAL(15,2) DEFAULT 0.00,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
          INDEX idx_invoice_id (invoice_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Create user_sessions table
      console.log('📝 Creating user_sessions table...');
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          token_hash VARCHAR(255) NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_user_id (user_id),
          INDEX idx_token (token_hash),
          INDEX idx_expires (expires_at)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      // Insert default users if not exist
      console.log('👥 Creating default users...');
      await this.createDefaultUsers(connection);

      connection.release();
      console.log('✅ MySQL tables initialized successfully');
    } catch (error) {
      console.error('❌ MySQL table initialization failed:', {
        message: error.message,
        code: error.code,
        errno: error.errno
      });
      throw error;
    }
  }

  private async createDefaultUsers(connection: mysql.PoolConnection): Promise<void> {
    try {
      // Check if users exist
      console.log('🔍 Checking existing users...');
      const [existingUsers] = await connection.execute(
        'SELECT COUNT(*) as count FROM users'
      ) as any;

      console.log('👥 Current user count:', existingUsers[0].count);

      if (existingUsers[0].count === 0) {
        console.log('➕ Inserting default users...');
        // Insert default users
        const defaultUsers = [
          {
            id: 'admin-001',
            username: 'admin',
            email: 'admin@digilunar.com',
            password_hash: 'admin123', // In production, use bcrypt
            role: 'admin',
            full_name: 'Administrator',
            phone: '+6281234567890',
            preferences: JSON.stringify({
              language: 'en',
              theme: 'modern',
              currency: 'USD',
              notifications: { email: true, whatsapp: true }
            })
          },
          {
            id: 'admin-002',
            username: 'lunara',
            email: 'admin@lunara.com',
            password_hash: 'lunara2025', // In production, use bcrypt
            role: 'admin',
            full_name: 'Lunara Admin',
            phone: '+6281234567891',
            preferences: JSON.stringify({
              language: 'en',
              theme: 'modern',
              currency: 'IDR',
              notifications: { email: true, whatsapp: true }
            })
          },
          {
            id: 'user-001',
            username: 'demo',
            email: 'demo@digilunar.com',
            password_hash: 'demo123', // In production, use bcrypt
            role: 'member',
            full_name: 'Demo User',
            phone: '+6281234567892',
            preferences: JSON.stringify({
              language: 'id',
              theme: 'classic',
              currency: 'IDR',
              notifications: { email: true, whatsapp: false }
            })
          }
        ];

        for (const user of defaultUsers) {
          console.log(`➕ Creating user: ${user.username}`);
          await connection.execute(`
            INSERT INTO users (
              id, username, email, password_hash, role, is_active, 
              full_name, phone, preferences, last_login
            ) VALUES (?, ?, ?, ?, ?, TRUE, ?, ?, ?, NOW())
          `, [
            user.id, user.username, user.email, user.password_hash,
            user.role, user.full_name, user.phone, user.preferences
          ]);
        }

        console.log('✅ Default users created in MySQL');
        
        // Verify users were created
        const [newUserCount] = await connection.execute('SELECT COUNT(*) as count FROM users') as any;
        console.log('👥 Total users after creation:', newUserCount[0].count);
      } else {
        console.log('✅ Default users already exist');
      }
    } catch (error) {
      console.error('❌ Failed to create default users:', error);
    }
  }

  // Authentication methods
  async login(username: string, password: string): Promise<User | null> {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM users WHERE username = ? AND is_active = TRUE',
        [username]
      ) as any;

      if (rows.length === 0) {
        console.log('❌ User not found:', username);
        return null;
      }

      const user = rows[0];

      // Simple password check (in production, use bcrypt.compare)
      if (user.password_hash !== password) {
        console.log('❌ Invalid password for user:', username);
        return null;
      }

      // Update last login
      await this.pool.execute(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [user.id]
      );

      console.log('✅ MySQL login successful:', username);

      return {
        id: user.id,
        username: user.username,
        email: user.email,
        password: '', // Don't return password
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLogin: user.last_login,
        fullName: user.full_name,
        phone: user.phone,
        avatar: user.avatar,
        preferences: user.preferences ? JSON.parse(user.preferences) : {
          language: 'en',
          theme: 'modern',
          currency: 'USD',
          notifications: { email: true, whatsapp: true }
        }
      };
    } catch (error) {
      console.error('❌ MySQL login failed:', error);
      return null;
    }
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    turnstileToken: string;
  }): Promise<User> {
    try {
      // Check if user exists
      const [existingUsers] = await this.pool.execute(
        'SELECT id FROM users WHERE username = ? OR email = ?',
        [userData.username, userData.email]
      ) as any;

      if (existingUsers.length > 0) {
        throw new Error('Username or email already exists');
      }

      const userId = `user-${Date.now()}`;
      const now = new Date().toISOString();

      // Create new user
      await this.pool.execute(`
        INSERT INTO users (
          id, username, email, password_hash, role, is_active, 
          created_at, updated_at, last_login
        ) VALUES (?, ?, ?, ?, 'member', TRUE, ?, ?, ?)
      `, [userId, userData.username, userData.email, userData.password, now, now, now]);

      return {
        id: userId,
        username: userData.username,
        email: userData.email,
        password: '',
        role: 'member',
        isActive: true,
        createdAt: now,
        updatedAt: now,
        lastLogin: now,
        preferences: {
          language: 'en',
          theme: 'modern',
          currency: 'USD',
          notifications: { email: true, whatsapp: true }
        }
      };
    } catch (error: any) {
      console.error('❌ MySQL registration failed:', error);
      throw error;
    }
  }

  // User management
  async getAllUsers(): Promise<User[]> {
    try {
      const [rows] = await this.pool.execute(
        'SELECT * FROM users ORDER BY created_at DESC'
      ) as any;

      return rows.map((user: any) => ({
        id: user.id,
        username: user.username,
        email: user.email,
        password: '',
        role: user.role,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLogin: user.last_login,
        fullName: user.full_name,
        phone: user.phone,
        avatar: user.avatar,
        preferences: user.preferences ? JSON.parse(user.preferences) : {}
      }));
    } catch (error: any) {
      console.error('❌ MySQL getAllUsers failed:', error);
      throw error;
    }
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'>): Promise<User> {
    try {
      const userId = `user-${Date.now()}`;
      const now = new Date().toISOString();

      await this.pool.execute(`
        INSERT INTO users (
          id, username, email, password_hash, role, is_active,
          full_name, phone, avatar, preferences, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId, userData.username, userData.email, userData.password,
        userData.role, userData.isActive, userData.fullName, userData.phone,
        userData.avatar, JSON.stringify(userData.preferences || {}), now, now
      ]);

      return {
        ...userData,
        id: userId,
        password: '',
        createdAt: now,
        updatedAt: now
      };
    } catch (error: any) {
      console.error('❌ MySQL createUser failed:', error);
      throw error;
    }
  }

  async updateUser(user: User): Promise<User> {
    try {
      const updateData = [
        user.username, user.email, user.role, user.isActive,
        user.fullName, user.phone, user.avatar,
        JSON.stringify(user.preferences || {}), user.id
      ];

      if (user.password) {
        await this.pool.execute(`
          UPDATE users SET 
            username = ?, email = ?, role = ?, is_active = ?,
            full_name = ?, phone = ?, avatar = ?, preferences = ?,
            password_hash = ?, updated_at = NOW()
          WHERE id = ?
        `, [...updateData.slice(0, -1), user.password, user.id]);
      } else {
        await this.pool.execute(`
          UPDATE users SET 
            username = ?, email = ?, role = ?, is_active = ?,
            full_name = ?, phone = ?, avatar = ?, preferences = ?,
            updated_at = NOW()
          WHERE id = ?
        `, updateData);
      }

      return { ...user, password: '', updatedAt: new Date().toISOString() };
    } catch (error: any) {
      console.error('❌ MySQL updateUser failed:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      await this.pool.execute('DELETE FROM users WHERE id = ?', [userId]);
    } catch (error: any) {
      console.error('❌ MySQL deleteUser failed:', error);
      throw error;
    }
  }

  // Invoice management
  async getAllInvoices(): Promise<InvoiceData[]> {
    try {
      const [invoiceRows] = await this.pool.execute(`
        SELECT * FROM invoices ORDER BY created_at DESC
      `) as any;

      const invoicesWithItems = await Promise.all(
        invoiceRows.map(async (invoice: any) => {
          const [itemRows] = await this.pool.execute(
            'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY item_order',
            [invoice.id]
          ) as any;

          return {
            id: invoice.id,
            invoiceNumber: invoice.invoice_number,
            createdAt: invoice.created_at,
            updatedAt: invoice.updated_at,
            status: invoice.status,
            statusUpdatedAt: invoice.status_updated_at,
            date: invoice.invoice_date,
            dueDate: invoice.due_date,
            companyName: invoice.company_name,
            companyAddress: invoice.company_address || '',
            companyPhone: invoice.company_phone || '',
            companyEmail: invoice.company_email || '',
            companyWebsite: invoice.company_website || '',
            logo: invoice.company_logo,
            clientName: invoice.client_name,
            clientAddress: invoice.client_address || '',
            clientPhone: invoice.client_phone || '',
            clientEmail: invoice.client_email || '',
            items: itemRows.map((item: any) => ({
              id: item.id,
              description: item.description,
              quantity: parseFloat(item.quantity),
              price: parseFloat(item.unit_price),
              total: parseFloat(item.total_amount)
            })),
            subtotal: parseFloat(invoice.subtotal),
            taxRate: parseFloat(invoice.tax_rate),
            taxAmount: parseFloat(invoice.tax_amount),
            discountRate: parseFloat(invoice.discount_rate),
            discountAmount: parseFloat(invoice.discount_amount),
            total: parseFloat(invoice.total_amount),
            notes: invoice.notes || '',
            terms: invoice.terms || '',
            currency: invoice.currency,
            language: invoice.language,
            theme: invoice.theme
          };
        })
      );

      return invoicesWithItems;
    } catch (error: any) {
      console.error('❌ MySQL getAllInvoices failed:', error);
      throw error;
    }
  }

  async saveInvoice(invoice: InvoiceData): Promise<InvoiceData> {
    const connection = await this.pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Check if invoice exists
      const [existingInvoice] = await connection.execute(
        'SELECT id FROM invoices WHERE id = ?',
        [invoice.id]
      ) as any;

      const invoiceData = [
        invoice.invoiceNumber, invoice.status, invoice.date, invoice.dueDate,
        invoice.companyName, invoice.companyAddress, invoice.companyPhone,
        invoice.companyEmail, invoice.companyWebsite, invoice.logo,
        invoice.clientName, invoice.clientAddress, invoice.clientPhone, invoice.clientEmail,
        invoice.currency, invoice.subtotal, invoice.taxRate, invoice.taxAmount,
        invoice.discountRate, invoice.discountAmount, invoice.total,
        invoice.notes, invoice.terms, invoice.language, invoice.theme
      ];

      if (existingInvoice.length > 0) {
        // Update existing invoice
        await connection.execute(`
          UPDATE invoices SET 
            invoice_number = ?, status = ?, invoice_date = ?, due_date = ?,
            company_name = ?, company_address = ?, company_phone = ?, company_email = ?, 
            company_website = ?, company_logo = ?, client_name = ?, client_address = ?, 
            client_phone = ?, client_email = ?, currency = ?, subtotal = ?, tax_rate = ?, 
            tax_amount = ?, discount_rate = ?, discount_amount = ?, total_amount = ?,
            notes = ?, terms = ?, language = ?, theme = ?, updated_at = NOW()
          WHERE id = ?
        `, [...invoiceData, invoice.id]);
      } else {
        // Insert new invoice
        await connection.execute(`
          INSERT INTO invoices (
            id, invoice_number, user_id, status, invoice_date, due_date,
            company_name, company_address, company_phone, company_email, company_website, company_logo,
            client_name, client_address, client_phone, client_email, currency,
            subtotal, tax_rate, tax_amount, discount_rate, discount_amount, total_amount,
            notes, terms, language, theme
          ) VALUES (?, ?, 'admin-001', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [invoice.id, ...invoiceData]);
      }

      // Delete existing items
      await connection.execute('DELETE FROM invoice_items WHERE invoice_id = ?', [invoice.id]);

      // Insert new items
      for (let i = 0; i < invoice.items.length; i++) {
        const item = invoice.items[i];
        await connection.execute(`
          INSERT INTO invoice_items (id, invoice_id, item_order, description, quantity, unit_price, total_amount)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [item.id, invoice.id, i, item.description, item.quantity, item.price, item.total]);
      }

      await connection.commit();
      return invoice;
    } catch (error) {
      await connection.rollback();
      console.error('❌ MySQL saveInvoice failed:', error);
      throw error;
    } finally {
      connection.release();
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    try {
      await this.pool.execute('DELETE FROM invoices WHERE id = ?', [id]);
    } catch (error: any) {
      console.error('❌ MySQL deleteInvoice failed:', error);
      throw error;
    }
  }

  async updateInvoiceStatus(id: string, status: InvoiceData['status']): Promise<void> {
    try {
      await this.pool.execute(
        'UPDATE invoices SET status = ?, status_updated_at = NOW(), updated_at = NOW() WHERE id = ?',
        [status, id]
      );
    } catch (error: any) {
      console.error('❌ MySQL updateInvoiceStatus failed:', error);
      throw error;
    }
  }

  async searchInvoices(query: string): Promise<InvoiceData[]> {
    try {
      const searchPattern = `%${query}%`;
      const [invoiceRows] = await this.pool.execute(`
        SELECT * FROM invoices 
        WHERE invoice_number LIKE ? OR company_name LIKE ? OR client_name LIKE ? OR status LIKE ?
        ORDER BY created_at DESC
      `, [searchPattern, searchPattern, searchPattern, searchPattern]) as any;

      const invoicesWithItems = await Promise.all(
        invoiceRows.map(async (invoice: any) => {
          const [itemRows] = await this.pool.execute(
            'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY item_order',
            [invoice.id]
          ) as any;

          return {
            id: invoice.id,
            invoiceNumber: invoice.invoice_number,
            createdAt: invoice.created_at,
            updatedAt: invoice.updated_at,
            status: invoice.status,
            statusUpdatedAt: invoice.status_updated_at,
            date: invoice.invoice_date,
            dueDate: invoice.due_date,
            companyName: invoice.company_name,
            companyAddress: invoice.company_address || '',
            companyPhone: invoice.company_phone || '',
            companyEmail: invoice.company_email || '',
            companyWebsite: invoice.company_website || '',
            logo: invoice.company_logo,
            clientName: invoice.client_name,
            clientAddress: invoice.client_address || '',
            clientPhone: invoice.client_phone || '',
            clientEmail: invoice.client_email || '',
            items: itemRows.map((item: any) => ({
              id: item.id,
              description: item.description,
              quantity: parseFloat(item.quantity),
              price: parseFloat(item.unit_price),
              total: parseFloat(item.total_amount)
            })),
            subtotal: parseFloat(invoice.subtotal),
            taxRate: parseFloat(invoice.tax_rate),
            taxAmount: parseFloat(invoice.tax_amount),
            discountRate: parseFloat(invoice.discount_rate),
            discountAmount: parseFloat(invoice.discount_amount),
            total: parseFloat(invoice.total_amount),
            notes: invoice.notes || '',
            terms: invoice.terms || '',
            currency: invoice.currency,
            language: invoice.language,
            theme: invoice.theme
          };
        })
      );

      return invoicesWithItems;
    } catch (error: any) {
      console.error('❌ MySQL searchInvoices failed:', error);
      throw error;
    }
  }

  // Cleanup method
  async close(): Promise<void> {
    if (pool) {
      await pool.end();
      pool = null;
    }
  }
}

export const mysqlService = new MySQLService();
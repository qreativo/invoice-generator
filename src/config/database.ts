// Database configuration
export const DATABASE_CONFIG = {
  host: '107.175.179.122',
  user: 'lunara',
  password: 'SbX7s8aMjf7xZX2e',
  database: 'lunara_invoices',
  port: 3306,
  ssl: false
};

// API endpoints configuration
export const API_CONFIG = {
  baseUrl: process.env.NODE_ENV === 'production' 
    ? 'https://your-api-domain.com/api' 
    : 'http://localhost:3001/api',
  endpoints: {
    // User endpoints
    users: '/users',
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    
    // Invoice endpoints
    invoices: '/invoices',
    invoiceById: (id: string) => `/invoices/${id}`,
    updateInvoiceStatus: (id: string) => `/invoices/${id}/status`,
    
    // Search and filter
    searchInvoices: '/invoices/search',
    filterInvoices: '/invoices/filter'
  }
};

export const DB_TABLES = {
  USERS: 'users',
  INVOICES: 'invoices',
  INVOICE_ITEMS: 'invoice_items',
  SESSIONS: 'user_sessions'
};
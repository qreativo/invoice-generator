import { apiService, isApiAvailable } from './api';
import { supabaseService } from './supabase';
import { mysqlService } from './mysql';
import { testMySQLConnection } from './testMysqlConnection';
import { User } from '../types/user';
import { InvoiceData } from '../types/invoice';

// Import existing localStorage functions as fallback
import * as localAuth from './auth';
import * as invoiceStorage from './storage';

// Hybrid data service that uses API when available, localStorage as fallback
class DataService {
  private useApi: boolean = false;
  private useSupabase: boolean = false;
  private useMySQL: boolean = false;

  async initialize(): Promise<void> {
    // Check MySQL connection first
    try {
      console.log('🔄 Initializing Data Service...');
      
      // Test MySQL connection with detailed logging
      await testMySQLConnection();
      
      const mysqlConnected = await mysqlService.testConnection();
      if (mysqlConnected) {
        await mysqlService.initializeTables();
        this.useMySQL = true;
        console.log('✅ Data Service initialized: MySQL Mode');
        return;
      }
    } catch (error) {
      console.log('⚠️ MySQL connection failed, trying Supabase...', error.message);
    }

    // Check if Supabase is configured
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    if (supabaseUrl && supabaseKey) {
      this.useSupabase = true;
      console.log('🔄 Data Service initialized: Supabase Mode');
    } else {
      this.useApi = await isApiAvailable();
      console.log(`🔄 Data Service initialized: ${this.useApi ? 'API Mode' : 'Local Storage Mode'}`);
    }
  }

  // Authentication methods
  async login(username: string, password: string): Promise<User | null> {
    if (this.useMySQL) {
      try {
        console.log('🔄 Using MySQL login for:', username);
        const user = await mysqlService.login(username, password);
        if (user) {
          console.log('✅ MySQL login successful:', user.username);
          window.localStorage.setItem('lunara-current-user', JSON.stringify(user));
          return user;
        }
      } catch (error) {
        console.error('❌ MySQL login error:', error);
      }
    }

    if (this.useSupabase) {
      try {
        console.log('🔄 Using Supabase login for:', username);
        const user = await supabaseService.login(username, password);
        if (!user) {
          // If Supabase login fails or returns null, fall back to localStorage
          console.log('❌ Supabase login failed, falling back to localStorage');
          return localAuth.login(username, password);
        }
        
        console.log('✅ Supabase login successful:', user.username);
        window.localStorage.setItem('lunara-current-user', JSON.stringify(user));
        return user;
      } catch (error) {
        console.error('❌ Supabase login error, falling back to localStorage:', error);
        return localAuth.login(username, password);
      }
    }
    
    if (this.useApi) {
      try {
        const response = await apiService.login(username, password);
        window.localStorage.setItem('auth_token', response.token);
        window.localStorage.setItem('lunara-current-user', JSON.stringify(response.user));
        return response.user;
      } catch (error) {
        console.error('API login failed, falling back to localStorage:', error);
        return localAuth.login(username, password);
      }
    }
    return localAuth.login(username, password);
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    turnstileToken: string;
  }): Promise<User> {
    if (this.useMySQL) {
      try {
        const user = await mysqlService.register(userData);
        window.localStorage.setItem('lunara-current-user', JSON.stringify(user));
        return user;
      } catch (error) {
        console.error('MySQL register failed, falling back to localStorage:', error);
        return localAuth.createUser({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          role: 'member',
          isActive: true
        });
      }
    }

    if (this.useSupabase) {
      try {
        const user = await supabaseService.register(userData);
        window.localStorage.setItem('lunara-current-user', JSON.stringify(user));
        return user;
      } catch (error) {
        console.error('Supabase register failed, falling back to localStorage:', error);
        return localAuth.createUser({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          role: 'member',
          isActive: true
        });
      }
    }
    
    if (this.useApi) {
      try {
        const response = await apiService.register(userData);
        window.localStorage.setItem('auth_token', response.token);
        window.localStorage.setItem('lunara-current-user', JSON.stringify(response.user));
        return response.user;
      } catch (error) {
        console.error('API register failed, falling back to localStorage:', error);
        // For localStorage fallback, we don't need turnstile verification
        return localAuth.createUser({
          username: userData.username,
          email: userData.email,
          password: userData.password,
          role: 'member',
          isActive: true
        });
      }
    }
    
    // localStorage fallback
    return localAuth.createUser({
      username: userData.username,
      email: userData.email,
      password: userData.password,
      role: 'member',
      isActive: true
    });
  }

  async logout(): Promise<void> {
    if (this.useMySQL) {
      // Just clear local storage for MySQL
      window.localStorage.removeItem('lunara-current-user');
      return;
    }

    if (this.useSupabase) {
      // Just clear local storage for Supabase
      window.localStorage.removeItem('lunara-current-user');
      return;
    }
    
    if (this.useApi) {
      try {
        await apiService.logout();
      } catch (error) {
        console.error('API logout failed:', error);
      }
    }
    
    window.localStorage.removeItem('auth_token');
    localAuth.logout();
  }

  getCurrentUser(): User | null {
    return localAuth.getCurrentUser();
  }

  // User management methods
  async getAllUsers(): Promise<User[]> {
    if (this.useMySQL) {
      try {
        return await mysqlService.getAllUsers();
      } catch (error) {
        console.error('MySQL getAllUsers failed, falling back to localStorage:', error);
      }
    }

    if (this.useSupabase) {
      try {
        return await supabaseService.getAllUsers();
      } catch (error) {
        console.error('Supabase getAllUsers failed, falling back to localStorage:', error);
      }
    }
    
    if (this.useApi) {
      try {
        return await apiService.getAllUsers();
      } catch (error) {
        console.error('API getAllUsers failed, falling back to localStorage:', error);
      }
    }
    return localAuth.getAllUsers();
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'>): Promise<User> {
    if (this.useMySQL) {
      try {
        return await mysqlService.createUser(userData);
      } catch (error) {
        console.error('MySQL createUser failed, falling back to localStorage:', error);
      }
    }

    if (this.useSupabase) {
      try {
        return await supabaseService.createUser(userData);
      } catch (error) {
        console.error('Supabase createUser failed, falling back to localStorage:', error);
      }
    }
    
    if (this.useApi) {
      try {
        return await apiService.createUser(userData);
      } catch (error) {
        console.error('API createUser failed, falling back to localStorage:', error);
      }
    }
    return localAuth.createUser(userData);
  }

  async updateUser(user: User): Promise<User> {
    if (this.useMySQL) {
      try {
        return await mysqlService.updateUser(user);
      } catch (error) {
        console.error('MySQL updateUser failed, falling back to localStorage:', error);
      }
    }

    if (this.useSupabase) {
      try {
        return await supabaseService.updateUser(user);
      } catch (error) {
        console.error('Supabase updateUser failed, falling back to localStorage:', error);
      }
    }
    
    if (this.useApi) {
      try {
        return await apiService.updateUser(user);
      } catch (error) {
        console.error('API updateUser failed, falling back to localStorage:', error);
      }
    }
    return localAuth.updateUser(user);
  }

  async deleteUser(userId: string): Promise<void> {
    if (this.useMySQL) {
      try {
        await mysqlService.deleteUser(userId);
        return;
      } catch (error) {
        console.error('MySQL deleteUser failed, falling back to localStorage:', error);
      }
    }

    if (this.useSupabase) {
      try {
        await supabaseService.deleteUser(userId);
        return;
      } catch (error) {
        console.error('Supabase deleteUser failed, falling back to localStorage:', error);
      }
    }
    
    if (this.useApi) {
      try {
        await apiService.deleteUser(userId);
        return;
      } catch (error) {
        console.error('API deleteUser failed, falling back to localStorage:', error);
      }
    }
    localAuth.deleteUser(userId);
  }

  // Invoice management methods
  async getAllInvoices(): Promise<InvoiceData[]> {
    if (this.useMySQL) {
      try {
        return await mysqlService.getAllInvoices();
      } catch (error) {
        console.error('MySQL getAllInvoices failed, falling back to localStorage:', error);
      }
    }

    if (this.useSupabase) {
      try {
        return await supabaseService.getAllInvoices();
      } catch (error) {
        console.error('Supabase getAllInvoices failed, falling back to localStorage:', error);
      }
    }
    
    if (this.useApi) {
      try {
        return await apiService.getAllInvoices();
      } catch (error) {
        console.error('API getAllInvoices failed, falling back to localStorage:', error);
      }
    }
    return invoiceStorage.getAllInvoices();
  }

  async getInvoiceById(id: string): Promise<InvoiceData | null> {
    if (this.useMySQL) {
      try {
        const invoices = await mysqlService.getAllInvoices();
        return invoices.find(inv => inv.id === id) || null;
      } catch (error) {
        console.error('MySQL getInvoiceById failed, falling back to localStorage:', error);
      }
    }

    if (this.useSupabase) {
      try {
        const invoices = await supabaseService.getAllInvoices();
        return invoices.find(inv => inv.id === id) || null;
      } catch (error) {
        console.error('Supabase getInvoiceById failed, falling back to localStorage:', error);
      }
    }
    
    if (this.useApi) {
      try {
        return await apiService.getInvoiceById(id);
      } catch (error) {
        console.error('API getInvoiceById failed, falling back to localStorage:', error);
      }
    }
    return invoiceStorage.getInvoiceById(id);
  }

  async saveInvoice(invoice: InvoiceData): Promise<InvoiceData> {
    if (this.useMySQL) {
      try {
        const savedInvoice = await mysqlService.saveInvoice(invoice);
        // Also save to localStorage for offline access
        invoiceStorage.saveInvoice(savedInvoice);
        return savedInvoice;
      } catch (error) {
        console.error('MySQL saveInvoice failed, falling back to localStorage:', error);
      }
    }

    if (this.useSupabase) {
      try {
        const savedInvoice = await supabaseService.saveInvoice(invoice);
        // Also save to localStorage for offline access
        invoiceStorage.saveInvoice(savedInvoice);
        return savedInvoice;
      } catch (error) {
        console.error('Supabase saveInvoice failed, falling back to localStorage:', error);
      }
    }
    
    if (this.useApi) {
      try {
        const savedInvoice = await apiService.saveInvoice(invoice);
        // Also save to localStorage for offline access
        invoiceStorage.saveInvoice(savedInvoice);
        return savedInvoice;
      } catch (error) {
        console.error('API saveInvoice failed, falling back to localStorage:', error);
      }
    }
    
    invoiceStorage.saveInvoice(invoice);
    return invoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    if (this.useMySQL) {
      try {
        await mysqlService.deleteInvoice(id);
      } catch (error) {
        console.error('MySQL deleteInvoice failed, falling back to localStorage:', error);
      }
    }

    if (this.useSupabase) {
      try {
        await supabaseService.deleteInvoice(id);
      } catch (error) {
        console.error('Supabase deleteInvoice failed, falling back to localStorage:', error);
      }
    }
    
    if (this.useApi) {
      try {
        await apiService.deleteInvoice(id);
      } catch (error) {
        console.error('API deleteInvoice failed, falling back to localStorage:', error);
      }
    }
    invoiceStorage.deleteInvoice(id);
  }

  async updateInvoiceStatus(id: string, status: InvoiceData['status']): Promise<void> {
    if (this.useMySQL) {
      try {
        await mysqlService.updateInvoiceStatus(id, status);
      } catch (error) {
        console.error('MySQL updateInvoiceStatus failed, falling back to localStorage:', error);
      }
    }

    if (this.useSupabase) {
      try {
        await supabaseService.updateInvoiceStatus(id, status);
      } catch (error) {
        console.error('Supabase updateInvoiceStatus failed, falling back to localStorage:', error);
      }
    }
    
    if (this.useApi) {
      try {
        await apiService.updateInvoiceStatus(id, status);
      } catch (error) {
        console.error('API updateInvoiceStatus failed, falling back to localStorage:', error);
      }
    }
    invoiceStorage.updateInvoiceStatus(id, status);
  }

  async searchInvoices(query: string): Promise<InvoiceData[]> {
    if (this.useMySQL) {
      try {
        return await mysqlService.searchInvoices(query);
      } catch (error) {
        console.error('MySQL searchInvoices failed, falling back to localStorage:', error);
      }
    }

    if (this.useSupabase) {
      try {
        return await supabaseService.searchInvoices(query);
      } catch (error) {
        console.error('Supabase searchInvoices failed, falling back to localStorage:', error);
      }
    }
    
    if (this.useApi) {
      try {
        return await apiService.searchInvoices(query);
      } catch (error) {
        console.error('API searchInvoices failed, falling back to localStorage:', error);
      }
    }
    return invoiceStorage.searchInvoices(query);
  }

  // Utility methods
  isUsingApi(): boolean {
    return this.useApi || this.useSupabase || this.useMySQL;
  }
  
  isUsingSupabase(): boolean {
    return this.useSupabase;
  }

  isUsingMySQL(): boolean {
    return this.useMySQL;
  }

  async syncToApi(): Promise<void> {
    if (!this.useApi && !this.useSupabase && !this.useMySQL) return;

    try {
      console.log('🔄 Syncing localStorage data to database...');
      
      // Sync invoices
      const localInvoices = invoiceStorage.getAllInvoices();
      for (const invoice of localInvoices) {
        try {
          if (this.useMySQL) {
            await mysqlService.saveInvoice(invoice);
          } else if (this.useSupabase) {
            await supabaseService.saveInvoice(invoice);
          } else {
            await apiService.saveInvoice(invoice);
          }
        } catch (error) {
          console.error(`Failed to sync invoice ${invoice.id}:`, error);
        }
      }
      
      console.log('✅ Data sync completed');
    } catch (error) {
      console.error('❌ Data sync failed:', error);
    }
  }
}

export const dataService = new DataService();

// Initialize on module load
dataService.initialize();
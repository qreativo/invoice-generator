import { apiService, isApiAvailable } from './api';
import { User } from '../types/user';
import { InvoiceData } from '../types/invoice';

// Import existing localStorage functions as fallback
import * as localAuth from './auth';
import * as localStorage from './storage';

// Hybrid data service that uses API when available, localStorage as fallback
class DataService {
  private useApi: boolean = false;

  async initialize(): Promise<void> {
    this.useApi = await isApiAvailable();
    console.log(`🔄 Data Service initialized: ${this.useApi ? 'API Mode' : 'Local Storage Mode'}`);
  }

  // Authentication methods
  async login(username: string, password: string): Promise<User | null> {
    if (this.useApi) {
      try {
        const response = await apiService.login(username, password);
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('lunara-current-user', JSON.stringify(response.user));
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
    if (this.useApi) {
      try {
        const response = await apiService.register(userData);
        localStorage.setItem('auth_token', response.token);
        localStorage.setItem('lunara-current-user', JSON.stringify(response.user));
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
    if (this.useApi) {
      try {
        await apiService.logout();
      } catch (error) {
        console.error('API logout failed:', error);
      }
    }
    
    localStorage.removeItem('auth_token');
    localAuth.logout();
  }

  getCurrentUser(): User | null {
    return localAuth.getCurrentUser();
  }

  // User management methods
  async getAllUsers(): Promise<User[]> {
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
    if (this.useApi) {
      try {
        return await apiService.getAllInvoices();
      } catch (error) {
        console.error('API getAllInvoices failed, falling back to localStorage:', error);
      }
    }
    return localStorage.getAllInvoices();
  }

  async getInvoiceById(id: string): Promise<InvoiceData | null> {
    if (this.useApi) {
      try {
        return await apiService.getInvoiceById(id);
      } catch (error) {
        console.error('API getInvoiceById failed, falling back to localStorage:', error);
      }
    }
    return localStorage.getInvoiceById(id);
  }

  async saveInvoice(invoice: InvoiceData): Promise<InvoiceData> {
    if (this.useApi) {
      try {
        const savedInvoice = await apiService.saveInvoice(invoice);
        // Also save to localStorage for offline access
        localStorage.saveInvoice(savedInvoice);
        return savedInvoice;
      } catch (error) {
        console.error('API saveInvoice failed, falling back to localStorage:', error);
      }
    }
    
    localStorage.saveInvoice(invoice);
    return invoice;
  }

  async deleteInvoice(id: string): Promise<void> {
    if (this.useApi) {
      try {
        await apiService.deleteInvoice(id);
      } catch (error) {
        console.error('API deleteInvoice failed, falling back to localStorage:', error);
      }
    }
    localStorage.deleteInvoice(id);
  }

  async updateInvoiceStatus(id: string, status: InvoiceData['status']): Promise<void> {
    if (this.useApi) {
      try {
        await apiService.updateInvoiceStatus(id, status);
      } catch (error) {
        console.error('API updateInvoiceStatus failed, falling back to localStorage:', error);
      }
    }
    localStorage.updateInvoiceStatus(id, status);
  }

  async searchInvoices(query: string): Promise<InvoiceData[]> {
    if (this.useApi) {
      try {
        return await apiService.searchInvoices(query);
      } catch (error) {
        console.error('API searchInvoices failed, falling back to localStorage:', error);
      }
    }
    return localStorage.searchInvoices(query);
  }

  // Utility methods
  isUsingApi(): boolean {
    return this.useApi;
  }

  async syncToApi(): Promise<void> {
    if (!this.useApi) return;

    try {
      console.log('🔄 Syncing localStorage data to API...');
      
      // Sync invoices
      const localInvoices = localStorage.getAllInvoices();
      for (const invoice of localInvoices) {
        try {
          await apiService.saveInvoice(invoice);
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
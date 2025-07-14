import { API_CONFIG } from '../config/database';
import { User } from '../types/user';
import { InvoiceData } from '../types/invoice';

// API utility functions
class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.baseUrl;
  }

  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add auth token if available
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${token}`,
      };
    }

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // User Authentication
  async login(username: string, password: string): Promise<{ user: User; token: string }> {
    return this.request(API_CONFIG.endpoints.login, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async register(userData: {
    username: string;
    email: string;
    password: string;
    turnstileToken: string;
  }): Promise<{ user: User; token: string }> {
    return this.request(API_CONFIG.endpoints.register, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async logout(): Promise<void> {
    return this.request(API_CONFIG.endpoints.logout, {
      method: 'POST',
    });
  }

  // User Management
  async getAllUsers(): Promise<User[]> {
    return this.request(API_CONFIG.endpoints.users);
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'>): Promise<User> {
    return this.request(API_CONFIG.endpoints.users, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async updateUser(user: User): Promise<User> {
    return this.request(`${API_CONFIG.endpoints.users}/${user.id}`, {
      method: 'PUT',
      body: JSON.stringify(user),
    });
  }

  async deleteUser(userId: string): Promise<void> {
    return this.request(`${API_CONFIG.endpoints.users}/${userId}`, {
      method: 'DELETE',
    });
  }

  // Invoice Management
  async getAllInvoices(): Promise<InvoiceData[]> {
    return this.request(API_CONFIG.endpoints.invoices);
  }

  async getInvoiceById(id: string): Promise<InvoiceData> {
    return this.request(API_CONFIG.endpoints.invoiceById(id));
  }

  async saveInvoice(invoice: InvoiceData): Promise<InvoiceData> {
    const isUpdate = invoice.id && invoice.createdAt;
    
    if (isUpdate) {
      return this.request(API_CONFIG.endpoints.invoiceById(invoice.id), {
        method: 'PUT',
        body: JSON.stringify(invoice),
      });
    } else {
      return this.request(API_CONFIG.endpoints.invoices, {
        method: 'POST',
        body: JSON.stringify(invoice),
      });
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    return this.request(API_CONFIG.endpoints.invoiceById(id), {
      method: 'DELETE',
    });
  }

  async updateInvoiceStatus(id: string, status: InvoiceData['status']): Promise<InvoiceData> {
    return this.request(API_CONFIG.endpoints.updateInvoiceStatus(id), {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async searchInvoices(query: string): Promise<InvoiceData[]> {
    return this.request(`${API_CONFIG.endpoints.searchInvoices}?q=${encodeURIComponent(query)}`);
  }

  async filterInvoices(filters: {
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    clientName?: string;
  }): Promise<InvoiceData[]> {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    
    return this.request(`${API_CONFIG.endpoints.filterInvoices}?${params.toString()}`);
  }
}

export const apiService = new ApiService();

// Fallback to localStorage when API is not available
export const isApiAvailable = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_CONFIG.baseUrl}/health`);
    return response.ok;
  } catch {
    return false;
  }
};
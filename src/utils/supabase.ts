import { createClient } from '@supabase/supabase-js';
import { User } from '../types/user';
import { InvoiceData } from '../types/invoice';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Service role client for admin operations
export const supabaseAdmin = supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : supabase;

// Database service for Supabase integration
export class SupabaseService {
  // Authentication
  async login(username: string, password: string): Promise<User | null> {
    try {
      // First get user by username
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .single();

      if (userError || !userData) {
        console.error('User not found:', userError);
        return null;
      }

      // In a real app, you'd verify the password hash here
      // For demo purposes, we'll accept the password as-is
      if (password === 'admin123' || password === 'user123') {
        // Update last login
        await supabase
          .from('users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userData.id);

        return {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          password: '', // Don't return password
          role: userData.role as 'admin' | 'member',
          isActive: userData.is_active,
          createdAt: userData.created_at,
          updatedAt: userData.updated_at,
          lastLogin: new Date().toISOString()
        };
      }

      return null;
    } catch (error) {
      console.error('Login error:', error);
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
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .or(`username.eq.${userData.username},email.eq.${userData.email}`)
        .single();

      if (existingUser) {
        throw new Error('Username or email already exists');
      }

      // Create new user
      const { data: newUser, error } = await supabase
        .from('users')
        .insert({
          username: userData.username,
          email: userData.email,
          password_hash: '$2b$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQ', // Demo hash
          role: 'member',
          is_active: true,
          last_login: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        password: '',
        role: newUser.role as 'admin' | 'member',
        isActive: newUser.is_active,
        createdAt: newUser.created_at,
        updatedAt: newUser.updated_at,
        lastLogin: newUser.last_login
      };
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  // User management
  async getAllUsers(): Promise<User[]> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      return data.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        password: '',
        role: user.role as 'admin' | 'member',
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLogin: user.last_login
      }));
    } catch (error: any) {
      console.error('Get users error:', error);
      throw error;
    }
  }

  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'>): Promise<User> {
    try {
      // Use admin client for user creation to bypass RLS
      const { data, error } = await supabaseAdmin
        .from('users')
        .insert({
          username: userData.username,
          email: userData.email,
          password_hash: '$2b$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQ',
          role: userData.role,
          is_active: userData.isActive
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        id: data.id,
        username: data.username,
        email: data.email,
        password: '',
        role: data.role as 'admin' | 'member',
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        lastLogin: data.last_login,
        phone: data.phone,
        fullName: data.full_name,
        avatar: data.avatar,
        preferences: data.preferences
      };
    } catch (error: any) {
      console.error('Create user error:', error);
      throw error;
    }
  }

  async updateUser(user: User): Promise<User> {
    try {
      const updateData: any = {
        username: user.username,
        email: user.email,
        role: user.role,
        is_active: user.isActive
      };

      // Only update password if provided
      if (user.password) {
        updateData.password_hash = '$2b$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQ';
      }

      // Use admin client for user updates to bypass RLS
      const { data, error } = await supabaseAdmin
        .from('users')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return {
        id: data.id,
        username: data.username,
        email: data.email,
        password: '',
        role: data.role as 'admin' | 'member',
        isActive: data.is_active,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        lastLogin: data.last_login
      };
    } catch (error: any) {
      console.error('Update user error:', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      // Use admin client for user deletion to bypass RLS
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Delete user error:', error);
      throw error;
    }
  }

  // Invoice management
  async getAllInvoices(): Promise<InvoiceData[]> {
    try {
      const { data: invoices, error: invoiceError } = await supabase
        .from('invoices')
        .select('*')
        .order('created_at', { ascending: false });

      if (invoiceError) {
        throw new Error(invoiceError.message);
      }

      // Get items for each invoice
      const invoicesWithItems = await Promise.all(
        invoices.map(async (invoice) => {
          const { data: items, error: itemsError } = await supabase
            .from('invoice_items')
            .select('*')
            .eq('invoice_id', invoice.id)
            .order('item_order');

          if (itemsError) {
            console.error('Error fetching items for invoice:', invoice.id, itemsError);
          }

          return {
            id: invoice.id,
            invoiceNumber: invoice.invoice_number,
            createdAt: invoice.created_at,
            updatedAt: invoice.updated_at,
            status: invoice.status as InvoiceData['status'],
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
            items: (items || []).map(item => ({
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
            language: invoice.language as 'en' | 'id',
            theme: invoice.theme
          };
        })
      );

      return invoicesWithItems;
    } catch (error: any) {
      console.error('Get invoices error:', error);
      throw error;
    }
  }

  async saveInvoice(invoice: InvoiceData): Promise<InvoiceData> {
    try {
      const invoiceData = {
        id: invoice.id,
        invoice_number: invoice.invoiceNumber,
        status: invoice.status,
        invoice_date: invoice.date,
        due_date: invoice.dueDate,
        company_name: invoice.companyName,
        company_address: invoice.companyAddress,
        company_phone: invoice.companyPhone,
        company_email: invoice.companyEmail,
        company_website: invoice.companyWebsite,
        company_logo: invoice.logo,
        client_name: invoice.clientName,
        client_address: invoice.clientAddress,
        client_phone: invoice.clientPhone,
        client_email: invoice.clientEmail,
        currency: invoice.currency,
        subtotal: invoice.subtotal,
        tax_rate: invoice.taxRate,
        tax_amount: invoice.taxAmount,
        discount_rate: invoice.discountRate,
        discount_amount: invoice.discountAmount,
        total_amount: invoice.total,
        notes: invoice.notes,
        terms: invoice.terms,
        language: invoice.language,
        theme: invoice.theme
      };

      // Check if invoice exists
      const { data: existingInvoice } = await supabase
        .from('invoices')
        .select('id')
        .eq('id', invoice.id)
        .single();

      let savedInvoice;
      if (existingInvoice) {
        // Update existing invoice
        const { data, error } = await supabase
          .from('invoices')
          .update(invoiceData)
          .eq('id', invoice.id)
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }
        savedInvoice = data;
      } else {
        // Create new invoice
        const { data, error } = await supabase
          .from('invoices')
          .insert(invoiceData)
          .select()
          .single();

        if (error) {
          throw new Error(error.message);
        }
        savedInvoice = data;
      }

      // Delete existing items
      await supabase
        .from('invoice_items')
        .delete()
        .eq('invoice_id', invoice.id);

      // Insert new items
      if (invoice.items.length > 0) {
        const itemsData = invoice.items.map((item, index) => ({
          id: item.id,
          invoice_id: invoice.id,
          item_order: index,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.price,
          total_amount: item.total
        }));

        const { error: itemsError } = await supabase
          .from('invoice_items')
          .insert(itemsData);

        if (itemsError) {
          throw new Error(itemsError.message);
        }
      }

      return invoice;
    } catch (error: any) {
      console.error('Save invoice error:', error);
      throw error;
    }
  }

  async deleteInvoice(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('invoices')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Delete invoice error:', error);
      throw error;
    }
  }

  async updateInvoiceStatus(id: string, status: InvoiceData['status']): Promise<void> {
    try {
      const { error } = await supabase
        .from('invoices')
        .update({ 
          status, 
          status_updated_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error: any) {
      console.error('Update invoice status error:', error);
      throw error;
    }
  }

  async searchInvoices(query: string): Promise<InvoiceData[]> {
    try {
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .or(`invoice_number.ilike.%${query}%,company_name.ilike.%${query}%,client_name.ilike.%${query}%,status.ilike.%${query}%`)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      // Get items for each invoice (simplified for search)
      const invoicesWithItems = await Promise.all(
        invoices.map(async (invoice) => {
          const { data: items } = await supabase
            .from('invoice_items')
            .select('*')
            .eq('invoice_id', invoice.id)
            .order('item_order');

          return {
            id: invoice.id,
            invoiceNumber: invoice.invoice_number,
            createdAt: invoice.created_at,
            updatedAt: invoice.updated_at,
            status: invoice.status as InvoiceData['status'],
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
            items: (items || []).map(item => ({
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
            language: invoice.language as 'en' | 'id',
            theme: invoice.theme
          };
        })
      );

      return invoicesWithItems;
    } catch (error: any) {
      console.error('Search invoices error:', error);
      throw error;
    }
  }
}

export const supabaseService = new SupabaseService();
import { InvoiceData } from '../types/invoice';

const STORAGE_KEY = 'invoice-generator-data';
const INVOICES_LIST_KEY = 'invoice-generator-invoices';

export const saveInvoiceData = (data: InvoiceData): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving invoice data:', error);
  }
};

export const loadInvoiceData = (): InvoiceData | null => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading invoice data:', error);
    return null;
  }
};

export const clearInvoiceData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing invoice data:', error);
  }
};

// Multi-invoice management
export const saveInvoice = (invoice: InvoiceData): void => {
  try {
    const invoices = getAllInvoices();
    const existingIndex = invoices.findIndex(inv => inv.id === invoice.id);
    
    if (existingIndex >= 0) {
      invoices[existingIndex] = { ...invoice, updatedAt: new Date().toISOString() };
    } else {
      invoices.push({ ...invoice, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    
    localStorage.setItem(INVOICES_LIST_KEY, JSON.stringify(invoices));
  } catch (error) {
    console.error('Error saving invoice:', error);
  }
};

export const getAllInvoices = (): InvoiceData[] => {
  try {
    const data = localStorage.getItem(INVOICES_LIST_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading invoices:', error);
    return [];
  }
};

export const deleteInvoice = (id: string): void => {
  try {
    const invoices = getAllInvoices();
    const filteredInvoices = invoices.filter(inv => inv.id !== id);
    localStorage.setItem(INVOICES_LIST_KEY, JSON.stringify(filteredInvoices));
  } catch (error) {
    console.error('Error deleting invoice:', error);
  }
};

export const getInvoiceById = (id: string): InvoiceData | null => {
  try {
    const invoices = getAllInvoices();
    return invoices.find(inv => inv.id === id) || null;
  } catch (error) {
    console.error('Error getting invoice by id:', error);
    return null;
  }
};

export const searchInvoices = (query: string): InvoiceData[] => {
  try {
    const invoices = getAllInvoices();
    const lowercaseQuery = query.toLowerCase();
    
    return invoices.filter(invoice => 
      invoice.invoiceNumber.toLowerCase().includes(lowercaseQuery) ||
      invoice.companyName.toLowerCase().includes(lowercaseQuery) ||
      invoice.clientName.toLowerCase().includes(lowercaseQuery) ||
      invoice.status.toLowerCase().includes(lowercaseQuery)
    );
  } catch (error) {
    console.error('Error searching invoices:', error);
    return [];
  }
};

export const updateInvoiceStatus = (invoiceId: string, newStatus: InvoiceData['status']): void => {
  try {
    const invoices = getAllInvoices();
    const updatedInvoices = invoices.map(invoice => {
      if (invoice.id === invoiceId) {
        return {
          ...invoice,
          status: newStatus,
          statusUpdatedAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      return invoice;
    });
    
    localStorage.setItem(INVOICES_LIST_KEY, JSON.stringify(updatedInvoices));
  } catch (error) {
    console.error('Error updating invoice status:', error);
  }
};
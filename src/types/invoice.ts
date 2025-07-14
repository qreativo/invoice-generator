export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  price: number;
  total: number;
}

export interface InvoiceData {
  id: string;
  invoiceNumber: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'pending' | 'paid' | 'cancelled';
  statusUpdatedAt?: string;
  date: string;
  dueDate: string;
  
  // Company Info
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite: string;
  logo?: string;
  
  // Client Info
  clientName: string;
  clientAddress: string;
  clientPhone: string;
  clientEmail: string;
  
  // Items
  items: InvoiceItem[];
  
  // Totals
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discountRate: number;
  discountAmount: number;
  total: number;
  
  // Additional
  notes: string;
  terms: string;
  
  // Settings
  currency: string;
  language: 'en' | 'id';
  theme: string;
}

export interface Theme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  textColor: string;
  backgroundColor: string;
  borderColor: string;
  headerStyle: 'modern' | 'classic' | 'minimal';
}
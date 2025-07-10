export const formatCurrency = (amount: number, currency: string): string => {
  const currencySymbols: { [key: string]: string } = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    IDR: 'Rp',
    SGD: 'S$',
    MYR: 'RM'
  };

  const symbol = currencySymbols[currency] || '$';
  
  if (currency === 'IDR') {
    return `${symbol} ${amount.toLocaleString('id-ID')}`;
  }
  
  return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
};

export const generateInvoiceNumber = (): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 100).toString().padStart(2, '0');
  return `INV-${timestamp}-${random}`;
};

export const formatDate = (date: string): string => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const calculateItemTotal = (quantity: number, price: number): number => {
  return quantity * price;
};

export const calculateSubtotal = (items: Array<{ total: number }>): number => {
  return items.reduce((sum, item) => sum + item.total, 0);
};

export const calculateTax = (subtotal: number, taxRate: number): number => {
  return (subtotal * taxRate) / 100;
};

export const calculateDiscount = (subtotal: number, discountRate: number): number => {
  return (subtotal * discountRate) / 100;
};

export const calculateGrandTotal = (
  subtotal: number,
  taxAmount: number,
  discountAmount: number
): number => {
  return subtotal + taxAmount - discountAmount;
};
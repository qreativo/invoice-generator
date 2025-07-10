import React from 'react';
import { Plus, Minus, Save, Trash2 } from 'lucide-react';
import { InvoiceData, InvoiceItem } from '../types/invoice';
import { translations, currencies } from '../utils/translations';
import { LogoUploader } from './LogoUploader';
import { 
  calculateItemTotal, 
  calculateSubtotal, 
  calculateTax, 
  calculateDiscount, 
  calculateGrandTotal,
  generateInvoiceNumber 
} from '../utils/helpers';

interface InvoiceFormProps {
  data: InvoiceData;
  onDataChange: (data: InvoiceData) => void;
  onSave: () => void;
  onClear: () => void;
  language: 'en' | 'id';
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  data,
  onDataChange,
  onSave,
  onClear,
  language
}) => {
  const t = translations[language];

  const updateField = (field: keyof InvoiceData, value: any) => {
    const newData = { ...data, [field]: value };
    
    // Recalculate totals when items change
    if (field === 'items' || field === 'taxRate' || field === 'discountRate') {
      const subtotal = calculateSubtotal(newData.items);
      const taxAmount = calculateTax(subtotal, newData.taxRate);
      const discountAmount = calculateDiscount(subtotal, newData.discountRate);
      const total = calculateGrandTotal(subtotal, taxAmount, discountAmount);
      
      newData.subtotal = subtotal;
      newData.taxAmount = taxAmount;
      newData.discountAmount = discountAmount;
      newData.total = total;
    }
    
    onDataChange(newData);
  };

  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: '',
      quantity: 1,
      price: 0,
      total: 0
    };
    updateField('items', [...data.items, newItem]);
  };

  const removeItem = (id: string) => {
    updateField('items', data.items.filter(item => item.id !== id));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    const updatedItems = data.items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          updatedItem.total = calculateItemTotal(updatedItem.quantity, updatedItem.price);
        }
        return updatedItem;
      }
      return item;
    });
    updateField('items', updatedItems);
  };

  const generateNewInvoiceNumber = () => {
    updateField('invoiceNumber', generateInvoiceNumber());
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 space-y-8">
      {/* Company Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
          {t.companyInfo}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <LogoUploader
              logo={data.logo}
              onLogoChange={(logo) => updateField('logo', logo)}
              language={language}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.companyName}
            </label>
            <input
              type="text"
              value={data.companyName}
              onChange={(e) => updateField('companyName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.companyEmail}
            </label>
            <input
              type="email"
              value={data.companyEmail}
              onChange={(e) => updateField('companyEmail', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.companyPhone}
            </label>
            <input
              type="tel"
              value={data.companyPhone}
              onChange={(e) => updateField('companyPhone', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.companyWebsite}
            </label>
            <input
              type="url"
              value={data.companyWebsite}
              onChange={(e) => updateField('companyWebsite', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.companyAddress}
            </label>
            <textarea
              value={data.companyAddress}
              onChange={(e) => updateField('companyAddress', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Client Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
          {t.clientInfo}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.clientName}
            </label>
            <input
              type="text"
              value={data.clientName}
              onChange={(e) => updateField('clientName', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.clientEmail}
            </label>
            <input
              type="email"
              value={data.clientEmail}
              onChange={(e) => updateField('clientEmail', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.clientPhone}
            </label>
            <input
              type="tel"
              value={data.clientPhone}
              onChange={(e) => updateField('clientPhone', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.clientAddress}
            </label>
            <textarea
              value={data.clientAddress}
              onChange={(e) => updateField('clientAddress', e.target.value)}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Invoice Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
          {t.invoiceDetails}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.invoiceNumber}
            </label>
            <div className="flex">
              <input
                type="text"
                value={data.invoiceNumber}
                onChange={(e) => updateField('invoiceNumber', e.target.value)}
                className="flex-1 border border-gray-300 rounded-l-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={generateNewInvoiceNumber}
                className="px-3 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition-colors"
                title="Generate new number"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.invoiceDate}
            </label>
            <input
              type="date"
              value={data.date}
              onChange={(e) => updateField('date', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t.dueDate}
            </label>
            <input
              type="date"
              value={data.dueDate}
              onChange={(e) => updateField('dueDate', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency
            </label>
            <select
              value={data.currency}
              onChange={(e) => updateField('currency', e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {currencies.map((currency) => (
                <option key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.code}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
            {t.items}
          </h3>
          <button
            onClick={addItem}
            className="flex items-center space-x-2 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>{t.addItem}</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full border border-gray-300 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                  {t.description}
                </th>
                <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">
                  {t.quantity}
                </th>
                <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">
                  {t.price}
                </th>
                <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">
                  {t.total}
                </th>
                <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="px-4 py-2">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      placeholder={t.enterDescription}
                      className="w-full border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      value={item.price}
                      onChange={(e) => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                      min="0"
                      step="0.01"
                      className="w-full border border-gray-300 rounded px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-4 py-2 text-center font-medium">
                    {item.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-2 text-center">
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.discount} (%)
              </label>
              <input
                type="number"
                value={data.discountRate}
                onChange={(e) => updateField('discountRate', parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t.tax} (%)
              </label>
              <input
                type="number"
                value={data.taxRate}
                onChange={(e) => updateField('taxRate', parseFloat(e.target.value) || 0)}
                min="0"
                max="100"
                step="0.01"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{t.subtotal}:</span>
              <span className="font-medium">{data.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{t.discount}:</span>
              <span className="font-medium">-{data.discountAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">{t.tax}:</span>
              <span className="font-medium">{data.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between border-t pt-3">
              <span className="text-lg font-bold">{t.grandTotal}:</span>
              <span className="text-lg font-bold">{data.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes and Terms */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.notes}
          </label>
          <textarea
            value={data.notes}
            onChange={(e) => updateField('notes', e.target.value)}
            rows={4}
            placeholder={t.enterNotes}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t.terms}
          </label>
          <textarea
            value={data.terms}
            onChange={(e) => updateField('terms', e.target.value)}
            rows={4}
            placeholder={t.enterTerms}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <button
          onClick={onClear}
          className="flex items-center space-x-2 bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600 transition-colors"
        >
          <Trash2 className="h-4 w-4" />
          <span>{t.clear}</span>
        </button>
        <button
          onClick={onSave}
          className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors"
        >
          <Save className="h-4 w-4" />
          <span>{t.save}</span>
        </button>
      </div>
    </div>
  );
};
import React from 'react';
import { InvoiceData } from '../types/invoice';
import { getTheme } from '../utils/themes';
import { formatCurrency, formatDate } from '../utils/helpers';
import { translations } from '../utils/translations';

interface InvoicePreviewProps {
  data: InvoiceData;
  language: 'en' | 'id';
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ data, language }) => {
  const theme = getTheme(data.theme);
  const t = translations[language];

  const themeStyles = {
    '--primary-color': theme.primaryColor,
    '--secondary-color': theme.secondaryColor,
    '--accent-color': theme.accentColor,
    '--text-color': theme.textColor,
    '--bg-color': theme.backgroundColor,
    '--border-color': theme.borderColor,
  } as React.CSSProperties;

  return (
    <div 
      className="bg-white rounded-lg shadow-lg p-8 max-w-4xl mx-auto print:shadow-none print:p-0" 
      style={themeStyles}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center space-x-4">
          {data.logo && (
            <img 
              src={data.logo} 
              alt="Company Logo" 
              className="h-16 w-auto max-w-xs object-contain"
            />
          )}
          <div>
            <h1 
              className="text-3xl font-bold mb-2"
              style={{ color: theme.primaryColor }}
            >
              {t.invoice}
            </h1>
            <p className="text-lg text-gray-600">#{data.invoiceNumber}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">{t.invoiceDate}</p>
          <p className="font-medium">{formatDate(data.date)}</p>
          <p className="text-sm text-gray-600 mt-2">{t.dueDate}</p>
          <p className="font-medium">{formatDate(data.dueDate)}</p>
        </div>
      </div>

      {/* Company and Client Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 
            className="text-sm font-semibold mb-3 uppercase tracking-wide"
            style={{ color: theme.primaryColor }}
          >
            {t.from}
          </h3>
          <div className="space-y-1">
            <p className="font-semibold text-lg">{data.companyName}</p>
            <p className="text-gray-600 whitespace-pre-line">{data.companyAddress}</p>
            {data.companyPhone && <p className="text-gray-600">{data.companyPhone}</p>}
            {data.companyEmail && <p className="text-gray-600">{data.companyEmail}</p>}
            {data.companyWebsite && <p className="text-gray-600">{data.companyWebsite}</p>}
          </div>
        </div>
        
        <div>
          <h3 
            className="text-sm font-semibold mb-3 uppercase tracking-wide"
            style={{ color: theme.primaryColor }}
          >
            {t.billTo}
          </h3>
          <div className="space-y-1">
            <p className="font-semibold text-lg">{data.clientName}</p>
            <p className="text-gray-600 whitespace-pre-line">{data.clientAddress}</p>
            {data.clientPhone && <p className="text-gray-600">{data.clientPhone}</p>}
            {data.clientEmail && <p className="text-gray-600">{data.clientEmail}</p>}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr 
                className="border-b-2"
                style={{ borderColor: theme.primaryColor }}
              >
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  {t.description}
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  {t.quantity}
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">
                  {t.price}
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700">
                  {t.total}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-800">{item.description}</td>
                  <td className="py-3 px-4 text-center text-gray-600">{item.quantity}</td>
                  <td className="py-3 px-4 text-right text-gray-600">
                    {formatCurrency(item.price, data.currency)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium">
                    {formatCurrency(item.total, data.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end mb-8">
        <div className="w-full max-w-xs space-y-2">
          <div className="flex justify-between py-2">
            <span className="text-gray-600">{t.subtotal}:</span>
            <span className="font-medium">{formatCurrency(data.subtotal, data.currency)}</span>
          </div>
          
          {data.discountAmount > 0 && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">{t.discount} ({data.discountRate}%):</span>
              <span className="font-medium text-red-600">
                -{formatCurrency(data.discountAmount, data.currency)}
              </span>
            </div>
          )}
          
          {data.taxAmount > 0 && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600">{t.tax} ({data.taxRate}%):</span>
              <span className="font-medium">{formatCurrency(data.taxAmount, data.currency)}</span>
            </div>
          )}
          
          <div 
            className="flex justify-between py-3 border-t-2 font-bold text-lg"
            style={{ borderColor: theme.primaryColor }}
          >
            <span>{t.grandTotal}:</span>
            <span style={{ color: theme.primaryColor }}>
              {formatCurrency(data.total, data.currency)}
            </span>
          </div>
        </div>
      </div>

      {/* Notes and Terms */}
      {(data.notes || data.terms) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-200">
          {data.notes && (
            <div>
              <h4 className="font-semibold mb-2 text-gray-700">{t.notes}</h4>
              <p className="text-gray-600 text-sm whitespace-pre-line">{data.notes}</p>
            </div>
          )}
          
          {data.terms && (
            <div>
              <h4 className="font-semibold mb-2 text-gray-700">{t.terms}</h4>
              <p className="text-gray-600 text-sm whitespace-pre-line">{data.terms}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
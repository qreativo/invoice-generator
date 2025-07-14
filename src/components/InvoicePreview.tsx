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
    <>
      {/* Print Styles */}
      <style jsx>{`
        @media print {
          /* Reset all margins and paddings for print */
          * {
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          
          /* A4 Page Setup with 1 inch margins */
          @page {
            size: A4;
            margin: 1in; /* 2.54cm on all sides */
          }
          
          /* Hide everything except the invoice */
          body * {
            visibility: hidden;
          }
          
          .invoice-print-container,
          .invoice-print-container * {
            visibility: visible;
          }
          
          .invoice-print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            padding: 0 !important;
            margin: 0 !important;
            max-width: none !important;
          }
          
          /* Ensure proper font sizes for print */
          .print-title {
            font-size: 28pt !important;
            line-height: 1.2 !important;
          }
          
          .print-subtitle {
            font-size: 14pt !important;
            line-height: 1.3 !important;
          }
          
          .print-body {
            font-size: 11pt !important;
            line-height: 1.4 !important;
          }
          
          .print-small {
            font-size: 9pt !important;
            line-height: 1.3 !important;
          }
          
          .print-table-header {
            font-size: 10pt !important;
            font-weight: bold !important;
            line-height: 1.3 !important;
          }
          
          .print-table-cell {
            font-size: 10pt !important;
            line-height: 1.3 !important;
          }
          
          .print-total {
            font-size: 12pt !important;
            font-weight: bold !important;
            line-height: 1.3 !important;
          }
          
          /* Spacing adjustments for print */
          .print-section-spacing {
            margin-bottom: 20pt !important;
          }
          
          .print-header-spacing {
            margin-bottom: 24pt !important;
          }
          
          .print-table-spacing {
            margin-bottom: 16pt !important;
          }
          
          /* Logo sizing for print */
          .print-logo {
            max-height: 60pt !important;
            max-width: 200pt !important;
          }
          
          /* Table styling for print */
          .print-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          
          .print-table th,
          .print-table td {
            padding: 8pt !important;
            border-bottom: 1pt solid #ddd !important;
          }
          
          .print-table thead th {
            border-bottom: 2pt solid var(--primary-color) !important;
          }
          
          /* Prevent page breaks in important sections */
          .print-no-break {
            page-break-inside: avoid !important;
          }
          
          /* Totals section styling */
          .print-totals {
            width: 250pt !important;
            margin-left: auto !important;
          }
        }
        
        /* Screen styles remain the same */
        @media screen {
          .invoice-print-container {
            background: white;
            border-radius: 0.5rem;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            padding: 2rem;
            max-width: 56rem;
            margin: 0 auto;
          }
        }
      `}</style>
      
      <div 
        className="invoice-print-container" 
        style={themeStyles}
      >
      {/* Header */}
      <div className="flex justify-between items-start print-header-spacing">
        <div className="flex items-center space-x-4">
          {data.logo && (
            <img 
              src={data.logo} 
              alt="Company Logo" 
              className="h-16 w-auto max-w-xs object-contain print-logo"
            />
          )}
          <div>
            <h1 
              className="text-3xl font-bold mb-2 print-title"
              style={{ color: theme.primaryColor }}
            >
              {t.invoice}
            </h1>
            <p className="text-lg text-gray-600 print-subtitle">#{data.invoiceNumber}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 print-small">{t.invoiceDate}</p>
          <p className="font-medium print-body">{formatDate(data.date)}</p>
          <p className="text-sm text-gray-600 mt-2 print-small">{t.dueDate}</p>
          <p className="font-medium print-body">{formatDate(data.dueDate)}</p>
        </div>
      </div>

      {/* Company and Client Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print-section-spacing print-no-break">
        <div>
          <h3 
            className="text-sm font-semibold mb-3 uppercase tracking-wide print-small"
            style={{ color: theme.primaryColor }}
          >
            {t.from}
          </h3>
          <div className="space-y-1">
            <p className="font-semibold text-lg print-subtitle">{data.companyName}</p>
            <p className="text-gray-600 whitespace-pre-line print-body">{data.companyAddress}</p>
            {data.companyPhone && <p className="text-gray-600 print-body">{data.companyPhone}</p>}
            {data.companyEmail && <p className="text-gray-600 print-body">{data.companyEmail}</p>}
            {data.companyWebsite && <p className="text-gray-600 print-body">{data.companyWebsite}</p>}
          </div>
        </div>
        
        <div>
          <h3 
            className="text-sm font-semibold mb-3 uppercase tracking-wide print-small"
            style={{ color: theme.primaryColor }}
          >
            {t.billTo}
          </h3>
          <div className="space-y-1">
            <p className="font-semibold text-lg print-subtitle">{data.clientName}</p>
            <p className="text-gray-600 whitespace-pre-line print-body">{data.clientAddress}</p>
            {data.clientPhone && <p className="text-gray-600 print-body">{data.clientPhone}</p>}
            {data.clientEmail && <p className="text-gray-600 print-body">{data.clientEmail}</p>}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="print-table-spacing">
        <div className="overflow-x-auto">
          <table className="w-full print-table">
            <thead>
              <tr 
                className="border-b-2"
                style={{ borderColor: theme.primaryColor }}
              >
                <th className="text-left py-3 px-4 font-semibold text-gray-700 print-table-header">
                  {t.description}
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700 print-table-header">
                  {t.quantity}
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 print-table-header">
                  {t.price}
                </th>
                <th className="text-right py-3 px-4 font-semibold text-gray-700 print-table-header">
                  {t.total}
                </th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((item) => (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="py-3 px-4 text-gray-800 print-table-cell">{item.description}</td>
                  <td className="py-3 px-4 text-center text-gray-600 print-table-cell">{item.quantity}</td>
                  <td className="py-3 px-4 text-right text-gray-600 print-table-cell">
                    {formatCurrency(item.price, data.currency)}
                  </td>
                  <td className="py-3 px-4 text-right font-medium print-table-cell">
                    {formatCurrency(item.total, data.currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end print-section-spacing print-no-break">
        <div className="w-full max-w-xs space-y-2 print-totals">
          <div className="flex justify-between py-2">
            <span className="text-gray-600 print-body">{t.subtotal}:</span>
            <span className="font-medium print-body">{formatCurrency(data.subtotal, data.currency)}</span>
          </div>
          
          {data.discountAmount > 0 && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600 print-body">{t.discount} ({data.discountRate}%):</span>
              <span className="font-medium text-red-600 print-body">
                -{formatCurrency(data.discountAmount, data.currency)}
              </span>
            </div>
          )}
          
          {data.taxAmount > 0 && (
            <div className="flex justify-between py-2">
              <span className="text-gray-600 print-body">{t.tax} ({data.taxRate}%):</span>
              <span className="font-medium print-body">{formatCurrency(data.taxAmount, data.currency)}</span>
            </div>
          )}
          
          <div 
            className="flex justify-between py-3 border-t-2 font-bold text-lg print-total"
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-gray-200 print-no-break">
          {data.notes && (
            <div>
              <h4 className="font-semibold mb-2 text-gray-700 print-body">{t.notes}</h4>
              <p className="text-gray-600 text-sm whitespace-pre-line print-small">{data.notes}</p>
            </div>
          )}
          
          {data.terms && (
            <div>
              <h4 className="font-semibold mb-2 text-gray-700 print-body">{t.terms}</h4>
              <p className="text-gray-600 text-sm whitespace-pre-line print-small">{data.terms}</p>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
};
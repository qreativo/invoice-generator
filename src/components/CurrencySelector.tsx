import React from 'react';
import { DollarSign } from 'lucide-react';
import { currencies } from '../utils/translations';

interface CurrencySelectorProps {
  selectedCurrency: string;
  onCurrencyChange: (currency: string) => void;
  label?: string;
  className?: string;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({
  selectedCurrency,
  onCurrencyChange,
  label = 'Display Currency',
  className = ''
}) => {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <DollarSign className="h-5 w-5 text-gray-500" />
      <select
        value={selectedCurrency}
        onChange={(e) => onCurrencyChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
      >
        {currencies.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.symbol} {currency.code}
          </option>
        ))}
      </select>
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </div>
  );
};
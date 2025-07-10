import React from 'react';
import { FileText, Globe, Palette } from 'lucide-react';
import { translations } from '../utils/translations';
import { themes } from '../utils/themes';

interface HeaderProps {
  language: 'en' | 'id';
  theme: string;
  onLanguageChange: (language: 'en' | 'id') => void;
  onThemeChange: (theme: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  theme,
  onLanguageChange,
  onThemeChange
}) => {
  const t = translations[language];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <FileText className="h-8 w-8 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-900">{t.invoiceGenerator}</h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="flex items-center space-x-2">
              <Globe className="h-5 w-5 text-gray-500" />
              <select
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as 'en' | 'id')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="en">English</option>
                <option value="id">Bahasa Indonesia</option>
              </select>
            </div>

            {/* Theme Selector */}
            <div className="flex items-center space-x-2">
              <Palette className="h-5 w-5 text-gray-500" />
              <select
                value={theme}
                onChange={(e) => onThemeChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {themes.map((themeOption) => (
                  <option key={themeOption.id} value={themeOption.id}>
                    {t[`${themeOption.id}Theme` as keyof typeof t] || themeOption.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
import React, { useRef } from 'react';
import { Upload, X } from 'lucide-react';
import { translations } from '../utils/translations';

interface LogoUploaderProps {
  logo?: string;
  onLogoChange: (logo: string | undefined) => void;
  language: 'en' | 'id';
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({
  logo,
  onLogoChange,
  language
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onLogoChange(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    onLogoChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700">
        {t.uploadLogo}
      </label>
      
      {logo ? (
        <div className="relative inline-block">
          <img
            src={logo}
            alt="Company Logo"
            className="h-20 w-auto max-w-xs object-contain border border-gray-300 rounded-lg"
          />
          <button
            onClick={handleRemoveLogo}
            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 transition-colors"
        >
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-600">{t.uploadLogo}</p>
          <p className="text-xs text-gray-500">PNG, JPG, SVG (max 2MB)</p>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  );
};
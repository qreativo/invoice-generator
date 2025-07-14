import React, { useState } from 'react';
import { FileText, Globe, Palette, User, LogOut, Settings, Shield, ChevronDown, Key } from 'lucide-react';
import { translations } from '../utils/translations';
import { themes } from '../utils/themes';
import { User as UserType } from '../types/user';

interface HeaderProps {
  language: 'en' | 'id';
  theme: string;
  onLanguageChange: (language: 'en' | 'id') => void;
  onThemeChange: (theme: string) => void;
  user?: UserType;
  onLogin: () => void;
  onLogout: () => void;
  onAdminPanel?: () => void;
  onPasswordReset?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  language,
  theme,
  onLanguageChange,
  onThemeChange,
  user,
  onLogin,
  onLogout,
  onAdminPanel,
  onPasswordReset
}) => {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const t = translations[language];

  return (
    <header className="bg-white shadow-lg border-b border-gray-200 relative overflow-hidden">
      {/* Background gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-purple-50 to-pink-50 opacity-50"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg transform rotate-3 opacity-20"></div>
              <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-lg shadow-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Lunara
              </h1>
              <p className="text-xs text-gray-500 -mt-1">Invoice Management System</p>
            </div>
          </div>

          {/* Right side controls */}
          <div className="flex items-center space-x-4">
            {/* Language Selector */}
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-gray-500" />
              <select
                value={language}
                onChange={(e) => onLanguageChange(e.target.value as 'en' | 'id')}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm hover:shadow-md transition-all duration-300"
              >
                <option value="en">English</option>
                <option value="id">Bahasa Indonesia</option>
              </select>
            </div>

            {/* Theme Selector */}
            <div className="flex items-center space-x-2">
              <Palette className="h-4 w-4 text-gray-500" />
              <select
                value={theme}
                onChange={(e) => onThemeChange(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm hover:shadow-md transition-all duration-300"
              >
                {themes.map((themeOption) => (
                  <option key={themeOption.id} value={themeOption.id}>
                    {t[`${themeOption.id}Theme` as keyof typeof t] || themeOption.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Authentication Section */}
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Admin Panel Button */}
                {user.role === 'admin' && onAdminPanel && (
                  <button
                    onClick={onAdminPanel}
                    className="group relative bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                    <div className="relative flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span className="hidden sm:inline">{t.adminPanel}</span>
                    </div>
                  </button>
                )}

                {/* User Profile Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-3 bg-white border border-gray-300 rounded-lg px-4 py-2 hover:bg-gray-50 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-white" />
                      </div>
                      <div className="text-left hidden sm:block">
                        <p className="text-sm font-medium text-gray-900">{user.username}</p>
                        <p className="text-xs text-gray-500 capitalize">{user.role}</p>
                      </div>
                    </div>
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform duration-200 ${showUserMenu ? 'rotate-180' : ''}`} />
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 z-50">
                      <div className="p-4 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <User className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{user.username}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-1 ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role === 'admin' ? '👑 Admin' : '👤 Member'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="p-2">
                        <div className="px-3 py-2 text-xs text-gray-500">
                          {t.lastLogin}: {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'N/A'}
                        </div>
                        
                        {onPasswordReset && (
                          <button
                            onClick={() => {
                              setShowUserMenu(false);
                              onPasswordReset();
                            }}
                            className="w-full flex items-center space-x-2 px-3 py-2 text-left text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                          >
                            <Key className="h-4 w-4" />
                            <span>Reset Password</span>
                          </button>
                        )}
                        
                        <button
                          onClick={() => {
                            setShowUserMenu(false);
                            onLogout();
                          }}
                          className="w-full flex items-center space-x-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                        >
                          <LogOut className="h-4 w-4" />
                          <span>{t.logout}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Logout Button (Alternative) */}
                <button
                  onClick={onLogout}
                  className="group relative bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                  <div className="relative flex items-center space-x-2">
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">{t.logout}</span>
                  </div>
                </button>
              </div>
            ) : (
              /* Login Button */
              <button
                onClick={onLogin}
                className="group relative bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-lg font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>{t.login}</span>
                </div>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close dropdown */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        ></div>
      )}
    </header>
  );
};
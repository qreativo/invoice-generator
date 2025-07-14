import React, { useState } from 'react';
import { FileText, Eye, EyeOff, User, Lock } from 'lucide-react';
import { translations } from '../utils/translations';
import { dataService } from '../utils/dataService';
import { User as UserType } from '../types/user';

interface LoginFormProps {
  language: 'en' | 'id';
  onLogin: (user: UserType) => void;
  onClose: () => void;
  onShowRegister: () => void;
  onShowPasswordReset: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  language,
  onLogin,
  onClose,
  onShowRegister,
  onShowPasswordReset
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const t = translations[language];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await dataService.login(username, password);
      if (user) {
        onLogin(user);
      } else {
        setError(t.invalidCredentials || 'Invalid username or password');
      }
    } catch (err) {
      setError(t.loginError || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-600 rounded-full opacity-20 animate-pulse"></div>
      </div>

      <div className="relative w-full max-w-md">
        {/* 3D Card Effect */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl transform rotate-1 opacity-20"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform hover:scale-[1.02] transition-all duration-300">
            <div className="text-center mb-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transform rotate-6 opacity-20"></div>
                <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 p-4 rounded-full shadow-lg">
                  <FileText className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mt-4">
                Lunara
              </h2>
              <p className="text-gray-600 mt-2">{t.loginToAccess}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t.username || 'Username'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                    placeholder={t.enterUsername || 'Enter your username'}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t.password || 'Password'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                    placeholder={t.enterPassword || 'Enter your password'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}


              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="group relative w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{t.loggingIn || 'Logging in...'}</span>
                    </>
                  ) : (
                    <>
                      <User className="h-5 w-5" />
                      <span>{t.login}</span>
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Register Link */}
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                {t.dontHaveAccount || "Don't have an account?"}{' '}
                <button
                  onClick={onShowRegister}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                >
                  {t.signUp || 'Sign up'}
                </button>
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Forgot your password?{' '}
                <button
                  onClick={onShowPasswordReset}
                  className="text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
                >
                  Reset it here
                </button>
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="mt-4 w-full text-gray-600 hover:text-gray-800 transition-colors duration-200 text-sm"
            >
              {t.cancel || 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
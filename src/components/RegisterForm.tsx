import React, { useState } from 'react';
import { FileText, Eye, EyeOff, User, Lock, Mail, UserPlus, ArrowLeft } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import { translations } from '../utils/translations';
import { createUser } from '../utils/auth';
import { User as UserType } from '../types/user';

interface RegisterFormProps {
  language: 'en' | 'id';
  onRegister: (user: UserType) => void;
  onBackToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  language,
  onRegister,
  onBackToLogin
}) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  const t = translations[language];

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // Clear error when user types
  };

  const validateForm = (): boolean => {
    if (!formData.username.trim()) {
      setError(t.usernameRequired || 'Username is required');
      return false;
    }

    if (formData.username.length < 3) {
      setError(t.usernameMinLength || 'Username must be at least 3 characters');
      return false;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError(t.usernameInvalid || 'Username can only contain letters, numbers, and underscores');
      return false;
    }

    if (!formData.email.trim()) {
      setError(t.emailRequired || 'Email is required');
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError(t.emailInvalid || 'Please enter a valid email address');
      return false;
    }

    if (!formData.password) {
      setError(t.passwordRequired || 'Password is required');
      return false;
    }

    if (formData.password.length < 6) {
      setError(t.passwordMinLength || 'Password must be at least 6 characters');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t.passwordMismatch || 'Passwords do not match');
      return false;
    }

    if (!turnstileToken) {
      setError(t.captchaRequired || 'Please complete the security verification');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // Verify Turnstile token with backend (in real app)
      // For demo purposes, we'll just check if token exists
      if (!turnstileToken) {
        throw new Error(t.captchaRequired || 'Please complete the security verification');
      }

      const newUser = createUser({
        username: formData.username.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: 'member',
        isActive: true
      });

      onRegister(newUser);
    } catch (err: any) {
      setError(err.message || (t.registrationError || 'Registration failed. Please try again.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleTurnstileSuccess = (token: string) => {
    setTurnstileToken(token);
    setError('');
  };

  const handleTurnstileError = () => {
    setTurnstileToken(null);
    setError(t.captchaError || 'Security verification failed. Please try again.');
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
          <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-blue-600 rounded-2xl transform rotate-1 opacity-20"></div>
          <div className="relative bg-white rounded-2xl shadow-2xl p-8 transform hover:scale-[1.02] transition-all duration-300">
            {/* Back to Login Button */}
            <button
              onClick={onBackToLogin}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors duration-300 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">{t.backToLogin || 'Back to Login'}</span>
            </button>

            <div className="text-center mb-8">
              <div className="relative inline-block">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-blue-600 rounded-full transform rotate-6 opacity-20"></div>
                <div className="relative bg-gradient-to-r from-green-500 to-blue-600 p-4 rounded-full shadow-lg">
                  <UserPlus className="h-8 w-8 text-white" />
                </div>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent mt-4">
                {t.createAccount || 'Create Account'}
              </h2>
              <p className="text-gray-600 mt-2">{t.joinLunara || 'Join Lunara today'}</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t.username || 'Username'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => handleInputChange('username', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                    placeholder={t.enterUsername || 'Enter your username'}
                    required
                  />
                </div>
                <p className="text-xs text-gray-500">
                  {t.usernameHint || 'At least 3 characters, letters, numbers, and underscores only'}
                </p>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t.email || 'Email'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                    placeholder={t.enterEmail || 'Enter your email'}
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t.password || 'Password'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
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
                <p className="text-xs text-gray-500">
                  {t.passwordHint || 'At least 6 characters'}
                </p>
              </div>

              {/* Confirm Password Field */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t.confirmPassword || 'Confirm Password'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-300 bg-gray-50 hover:bg-white"
                    placeholder={t.confirmPasswordPlaceholder || 'Confirm your password'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Cloudflare Turnstile */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  {t.securityVerification || 'Security Verification'} <span className="text-red-500">*</span>
                </label>
                <div className="flex justify-center">
                  <Turnstile
                    siteKey="0x4AAAAAABk-oQfMyjJDTVZT"
                    onSuccess={handleTurnstileSuccess}
                    onError={handleTurnstileError}
                    onExpire={() => setTurnstileToken(null)}
                    theme="light"
                    size="normal"
                  />
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
                disabled={isLoading || !turnstileToken}
                className="group relative w-full bg-gradient-to-r from-green-500 to-blue-600 text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none overflow-hidden"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative flex items-center justify-center space-x-2">
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>{t.creatingAccount || 'Creating account...'}</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-5 w-5" />
                      <span>{t.createAccount || 'Create Account'}</span>
                    </>
                  )}
                </div>
              </button>
            </form>

            {/* Terms and Privacy */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                {t.termsAgreement || 'By creating an account, you agree to our'}{' '}
                <a href="#" className="text-green-600 hover:text-green-700 underline">
                  {t.termsOfService || 'Terms of Service'}
                </a>{' '}
                {t.and || 'and'}{' '}
                <a href="#" className="text-green-600 hover:text-green-700 underline">
                  {t.privacyPolicy || 'Privacy Policy'}
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
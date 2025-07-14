import React, { useState, useEffect } from 'react';
import { Mail, Phone, Save, TestTube, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { SMTPSettings, WhatsAppSettings } from '../types/passwordReset';
import { getSMTPSettings, saveSMTPSettings, getWhatsAppSettings, saveWhatsAppSettings, testWhatsAppConnection } from '../utils/passwordReset';
import { translations } from '../utils/translations';

interface PasswordResetSettingsProps {
  language: 'en' | 'id';
}

export const PasswordResetSettings: React.FC<PasswordResetSettingsProps> = ({ language }) => {
  const [smtpSettings, setSMTPSettings] = useState<SMTPSettings>({
    host: '',
    port: 587,
    username: '',
    password: '',
    encryption: 'TLS',
    fromEmail: '',
    enabled: false
  });

  const [whatsappSettings, setWhatsAppSettings] = useState<WhatsAppSettings>({
    apiKey: '',
    senderNumber: '',
    enabled: false
  });

  const [showSMTPPassword, setShowSMTPPassword] = useState(false);
  const [showWhatsAppKey, setShowWhatsAppKey] = useState(false);
  const [isTestingWhatsApp, setIsTestingWhatsApp] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const t = translations[language];

  useEffect(() => {
    setSMTPSettings(getSMTPSettings());
    setWhatsAppSettings(getWhatsAppSettings());
  }, []);

  const handleSaveSMTP = () => {
    try {
      saveSMTPSettings(smtpSettings);
      setSuccess('SMTP settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save SMTP settings');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleSaveWhatsApp = () => {
    try {
      saveWhatsAppSettings(whatsappSettings);
      setSuccess('WhatsApp settings saved successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save WhatsApp settings');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleTestWhatsApp = async () => {
    if (!whatsappSettings.apiKey || !whatsappSettings.senderNumber) {
      setTestResult({
        success: false,
        message: 'Please fill in API key and sender number first'
      });
      return;
    }

    setIsTestingWhatsApp(true);
    setTestResult(null);

    try {
      const success = await testWhatsAppConnection();
      setTestResult({
        success,
        message: success 
          ? 'WhatsApp connection test successful!' 
          : 'WhatsApp connection test failed. Please check your settings.'
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Connection test failed'
      });
    } finally {
      setIsTestingWhatsApp(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* SMTP Email Settings */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
            <Mail className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">SMTP Email Settings</h3>
            <p className="text-gray-600">Configure email server for password reset emails</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Enable SMTP */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-semibold text-gray-900">Enable Email Reset</h4>
              <p className="text-sm text-gray-600">Allow users to reset password via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={smtpSettings.enabled}
                onChange={(e) => setSMTPSettings({...smtpSettings, enabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                SMTP Host <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={smtpSettings.host}
                onChange={(e) => setSMTPSettings({...smtpSettings, host: e.target.value})}
                placeholder="smtp.gmail.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!smtpSettings.enabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Port <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={smtpSettings.port}
                onChange={(e) => setSMTPSettings({...smtpSettings, port: parseInt(e.target.value) || 587})}
                placeholder="587"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!smtpSettings.enabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Username <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={smtpSettings.username}
                onChange={(e) => setSMTPSettings({...smtpSettings, username: e.target.value})}
                placeholder="your-email@gmail.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!smtpSettings.enabled}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showSMTPPassword ? 'text' : 'password'}
                  value={smtpSettings.password}
                  onChange={(e) => setSMTPSettings({...smtpSettings, password: e.target.value})}
                  placeholder="App password or SMTP password"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!smtpSettings.enabled}
                />
                <button
                  type="button"
                  onClick={() => setShowSMTPPassword(!showSMTPPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  disabled={!smtpSettings.enabled}
                >
                  {showSMTPPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Encryption
              </label>
              <select
                value={smtpSettings.encryption}
                onChange={(e) => setSMTPSettings({...smtpSettings, encryption: e.target.value as 'TLS' | 'SSL' | 'NONE'})}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!smtpSettings.enabled}
              >
                <option value="TLS">TLS</option>
                <option value="SSL">SSL</option>
                <option value="NONE">None</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                From Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                value={smtpSettings.fromEmail}
                onChange={(e) => setSMTPSettings({...smtpSettings, fromEmail: e.target.value})}
                placeholder="noreply@yourdomain.com"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!smtpSettings.enabled}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSaveSMTP}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save SMTP Settings</span>
            </button>
          </div>
        </div>
      </div>

      {/* WhatsApp Settings */}
      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
            <Phone className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">WhatsApp Gateway Settings</h3>
            <p className="text-gray-600">Configure WhatsApp API for password reset messages</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Enable WhatsApp */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-semibold text-gray-900">Enable WhatsApp Reset</h4>
              <p className="text-sm text-gray-600">Allow users to reset password via WhatsApp</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={whatsappSettings.enabled}
                onChange={(e) => setWhatsAppSettings({...whatsappSettings, enabled: e.target.checked})}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showWhatsAppKey ? 'text' : 'password'}
                  value={whatsappSettings.apiKey}
                  onChange={(e) => setWhatsAppSettings({...whatsappSettings, apiKey: e.target.value})}
                  placeholder="Your WhatsApp API key"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-green-500"
                  disabled={!whatsappSettings.enabled}
                />
                <button
                  type="button"
                  onClick={() => setShowWhatsAppKey(!showWhatsAppKey)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  disabled={!whatsappSettings.enabled}
                >
                  {showWhatsAppKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sender Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={whatsappSettings.senderNumber}
                onChange={(e) => setWhatsAppSettings({...whatsappSettings, senderNumber: e.target.value})}
                placeholder="+1234567890"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                disabled={!whatsappSettings.enabled}
              />
              <p className="text-xs text-gray-500 mt-1">
                Include country code (e.g., +62 for Indonesia)
              </p>
            </div>
          </div>

          {/* API Information */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-800 mb-2">API Information</h4>
            <div className="text-sm text-green-700 space-y-1">
              <p><strong>Endpoint:</strong> https://sender.digilunar.com/send-message</p>
              <p><strong>Method:</strong> POST</p>
              <p><strong>Required Parameters:</strong> api_key, sender, number, message</p>
            </div>
          </div>

          {/* Test Connection */}
          <div className="flex items-center space-x-4">
            <button
              onClick={handleTestWhatsApp}
              disabled={isTestingWhatsApp || !whatsappSettings.enabled || !whatsappSettings.apiKey || !whatsappSettings.senderNumber}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center space-x-2"
            >
              {isTestingWhatsApp ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Testing...</span>
                </>
              ) : (
                <>
                  <TestTube className="h-4 w-4" />
                  <span>Test Connection</span>
                </>
              )}
            </button>

            <button
              onClick={handleSaveWhatsApp}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
            >
              <Save className="h-4 w-4" />
              <span>Save WhatsApp Settings</span>
            </button>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`flex items-center space-x-2 p-3 rounded-lg ${
              testResult.success 
                ? 'bg-green-50 border border-green-200 text-green-700'
                : 'bg-red-50 border border-red-200 text-red-700'
            }`}>
              {testResult.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <XCircle className="h-5 w-5" />
              )}
              <span className="text-sm font-medium">{testResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Success/Error Messages */}
      {(success || error) && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`px-6 py-4 rounded-lg shadow-lg ${
            success ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {success || error}
          </div>
        </div>
      )}
    </div>
  );
};
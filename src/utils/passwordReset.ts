import { PasswordResetToken, SMTPSettings, WhatsAppSettings, PasswordResetRequest } from '../types/passwordReset';
import { User } from '../types/user';
import { dataService } from './dataService';

const RESET_TOKENS_KEY = 'lunara-reset-tokens';
const SMTP_SETTINGS_KEY = 'lunara-smtp-settings';
const WHATSAPP_SETTINGS_KEY = 'lunara-whatsapp-settings';

// Generate secure random token
export const generateResetToken = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

// Get stored reset tokens
export const getResetTokens = (): PasswordResetToken[] => {
  try {
    const tokens = localStorage.getItem(RESET_TOKENS_KEY);
    return tokens ? JSON.parse(tokens) : [];
  } catch (error) {
    console.error('Error loading reset tokens:', error);
    return [];
  }
};

// Save reset tokens
export const saveResetTokens = (tokens: PasswordResetToken[]): void => {
  try {
    localStorage.setItem(RESET_TOKENS_KEY, JSON.stringify(tokens));
  } catch (error) {
    console.error('Error saving reset tokens:', error);
  }
};

// Clean expired tokens
export const cleanExpiredTokens = (): void => {
  const tokens = getResetTokens();
  const now = new Date();
  const validTokens = tokens.filter(token => new Date(token.expiresAt) > now);
  saveResetTokens(validTokens);
};

// Create reset token
export const createResetToken = (userId: string, method: 'email' | 'whatsapp'): PasswordResetToken => {
  cleanExpiredTokens();
  
  const token: PasswordResetToken = {
    id: Date.now().toString(),
    userId,
    token: generateResetToken(),
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour
    method,
    used: false,
    createdAt: new Date().toISOString()
  };

  const tokens = getResetTokens();
  tokens.push(token);
  saveResetTokens(tokens);

  // Log the attempt
  logPasswordResetAttempt(userId, method, 'TOKEN_CREATED');

  return token;
};

// Validate reset token
export const validateResetToken = (tokenString: string): PasswordResetToken | null => {
  cleanExpiredTokens();
  
  const tokens = getResetTokens();
  const token = tokens.find(t => t.token === tokenString && !t.used);
  
  if (!token) {
    return null;
  }

  if (new Date(token.expiresAt) <= new Date()) {
    return null;
  }

  return token;
};

// Use reset token
export const useResetToken = (tokenString: string): boolean => {
  const tokens = getResetTokens();
  const tokenIndex = tokens.findIndex(t => t.token === tokenString);
  
  if (tokenIndex === -1) {
    return false;
  }

  tokens[tokenIndex].used = true;
  saveResetTokens(tokens);
  
  // Log the usage
  logPasswordResetAttempt(tokens[tokenIndex].userId, tokens[tokenIndex].method, 'TOKEN_USED');
  
  return true;
};

// SMTP Settings
export const getSMTPSettings = (): SMTPSettings => {
  try {
    const settings = localStorage.getItem(SMTP_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : {
      host: '',
      port: 587,
      username: '',
      password: '',
      encryption: 'TLS' as const,
      fromEmail: '',
      enabled: false
    };
  } catch (error) {
    console.error('Error loading SMTP settings:', error);
    return {
      host: '',
      port: 587,
      username: '',
      password: '',
      encryption: 'TLS' as const,
      fromEmail: '',
      enabled: false
    };
  }
};

export const saveSMTPSettings = (settings: SMTPSettings): void => {
  try {
    localStorage.setItem(SMTP_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving SMTP settings:', error);
  }
};

// WhatsApp Settings
export const getWhatsAppSettings = (): WhatsAppSettings => {
  try {
    const settings = localStorage.getItem(WHATSAPP_SETTINGS_KEY);
    return settings ? JSON.parse(settings) : {
      apiKey: '',
      senderNumber: '',
      enabled: false
    };
  } catch (error) {
    console.error('Error loading WhatsApp settings:', error);
    return {
      apiKey: '',
      senderNumber: '',
      enabled: false
    };
  }
};

export const saveWhatsAppSettings = (settings: WhatsAppSettings): void => {
  try {
    localStorage.setItem(WHATSAPP_SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving WhatsApp settings:', error);
  }
};

// Send reset email (mock implementation)
export const sendResetEmail = async (email: string, token: string): Promise<boolean> => {
  const smtpSettings = getSMTPSettings();
  
  if (!smtpSettings.enabled || !smtpSettings.host) {
    throw new Error('SMTP not configured');
  }

  // In a real implementation, this would use the SMTP settings to send email
  // For demo purposes, we'll simulate the email sending
  console.log('Sending reset email to:', email);
  console.log('Reset link:', `${window.location.origin}/reset-password?token=${token}`);
  
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return true;
};

// Send reset WhatsApp message
export const sendResetWhatsApp = async (phone: string, token: string): Promise<boolean> => {
  const whatsappSettings = getWhatsAppSettings();
  
  if (!whatsappSettings.enabled || !whatsappSettings.apiKey) {
    throw new Error('WhatsApp gateway not configured');
  }

  const resetLink = `${window.location.origin}/reset-password?token=${token}`;
  const message = `🔐 Lunara Password Reset\n\nClick the link below to reset your password:\n${resetLink}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this message.`;

  try {
    const response = await fetch('https://sender.digilunar.com/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: whatsappSettings.apiKey,
        sender: whatsappSettings.senderNumber,
        number: phone,
        message: message
      })
    });

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.status}`);
    }

    const result = await response.json();
    return result.success || true;
  } catch (error) {
    console.error('WhatsApp send error:', error);
    throw error;
  }
};

// Test WhatsApp connection
export const testWhatsAppConnection = async (): Promise<boolean> => {
  const whatsappSettings = getWhatsAppSettings();
  
  if (!whatsappSettings.apiKey || !whatsappSettings.senderNumber) {
    throw new Error('WhatsApp settings incomplete');
  }

  // Skip actual API call in development/non-production environments
  if (import.meta.env.MODE !== 'production') {
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log('WhatsApp connection test (simulated): Success');
    return true;
  }

  try {
    const response = await fetch('https://sender.digilunar.com/send-message', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        api_key: whatsappSettings.apiKey,
        sender: whatsappSettings.senderNumber,
        number: whatsappSettings.senderNumber, // Send test to self
        message: '🧪 Lunara WhatsApp Gateway Test - Connection successful!'
      })
    });

    return response.ok;
  } catch (error) {
    console.error('WhatsApp test error:', error);
    return false;
  }
};

// Password validation
export const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Logging
export const logPasswordResetAttempt = (userId: string, method: 'email' | 'whatsapp', action: string): void => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId,
    method,
    action,
    ip: 'unknown', // In a real app, you'd get this from the request
    userAgent: navigator.userAgent
  };
  
  console.log('Password Reset Log:', logEntry);
  
  // In a real implementation, this would be sent to your logging service
  const logs = JSON.parse(localStorage.getItem('password-reset-logs') || '[]');
  logs.push(logEntry);
  localStorage.setItem('password-reset-logs', JSON.stringify(logs.slice(-100))); // Keep last 100 logs
};

// Request password reset
export const requestPasswordReset = async (request: PasswordResetRequest): Promise<void> => {
  const users = await dataService.getAllUsers();
  let user: User | undefined;

  if (request.method === 'email' && request.email) {
    user = users.find(u => u.email.toLowerCase() === request.email!.toLowerCase() && u.isActive);
  } else if (request.method === 'whatsapp' && request.phone) {
    // Assuming phone is stored in a custom field or we need to add it to User type
    // For now, we'll use email field as fallback
    user = users.find(u => u.email.toLowerCase() === request.phone!.toLowerCase() && u.isActive);
  }

  if (!user) {
    // Don't reveal if user exists or not for security
    logPasswordResetAttempt('unknown', request.method, 'USER_NOT_FOUND');
    return;
  }

  const token = createResetToken(user.id, request.method);

  if (request.method === 'email' && request.email) {
    await sendResetEmail(request.email, token.token);
  } else if (request.method === 'whatsapp' && request.phone) {
    await sendResetWhatsApp(request.phone, token.token);
  }

  logPasswordResetAttempt(user.id, request.method, 'RESET_REQUESTED');
};

// Reset password with token
export const resetPasswordWithToken = async (token: string, newPassword: string): Promise<void> => {
  const resetToken = validateResetToken(token);
  
  if (!resetToken) {
    throw new Error('Invalid or expired reset token');
  }

  const passwordValidation = validatePassword(newPassword);
  if (!passwordValidation.isValid) {
    throw new Error(passwordValidation.errors.join(', '));
  }

  const users = await dataService.getAllUsers();
  const user = users.find(u => u.id === resetToken.userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  // Update user password
  const updatedUser: User = {
    ...user,
    password: newPassword, // In real app, this would be hashed
    updatedAt: new Date().toISOString()
  };

  await dataService.updateUser(updatedUser);
  
  // Mark token as used
  useResetToken(token);
  
  logPasswordResetAttempt(user.id, resetToken.method, 'PASSWORD_RESET_COMPLETED');
};
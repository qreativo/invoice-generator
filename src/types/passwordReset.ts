export interface PasswordResetToken {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  method: 'email' | 'whatsapp';
  used: boolean;
  createdAt: string;
}

export interface SMTPSettings {
  host: string;
  port: number;
  username: string;
  password: string;
  encryption: 'TLS' | 'SSL' | 'NONE';
  fromEmail: string;
  enabled: boolean;
}

export interface WhatsAppSettings {
  apiKey: string;
  senderNumber: string;
  enabled: boolean;
}

export interface PasswordResetRequest {
  email?: string;
  phone?: string;
  method: 'email' | 'whatsapp';
}

export interface PasswordResetConfirm {
  token: string;
  newPassword: string;
  confirmPassword: string;
}
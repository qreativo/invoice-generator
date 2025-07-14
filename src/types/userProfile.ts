export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  whatsappNumber?: string;
  profilePicture?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  bio?: string;
  website?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
  preferences: {
    language: 'en' | 'id';
    theme: string;
    currency: string;
    notifications: {
      email: boolean;
      whatsapp: boolean;
      push: boolean;
      marketing: boolean;
    };
    privacy: {
      profileVisibility: 'public' | 'private' | 'contacts';
      showEmail: boolean;
      showWhatsapp: boolean;
    };
  };
  twoFactorEnabled: boolean;
  lastPasswordChange?: string;
  emailVerified: boolean;
  whatsappVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PasswordChangeRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface EmailChangeRequest {
  newEmail: string;
  password: string;
  verificationCode?: string;
}

export interface WhatsAppChangeRequest {
  newWhatsappNumber: string;
  verificationCode?: string;
}

export interface ProfileUpdateRequest {
  fullName?: string;
  dateOfBirth?: string;
  address?: string;
  city?: string;
  country?: string;
  timezone?: string;
  bio?: string;
  website?: string;
  socialLinks?: {
    linkedin?: string;
    twitter?: string;
    github?: string;
  };
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface UpdateResponse {
  success: boolean;
  message: string;
  data?: any;
  requiresVerification?: boolean;
}
export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'member';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  phone?: string;
  fullName?: string;
  avatar?: string;
  preferences?: {
    language: 'en' | 'id';
    theme: string;
    currency: string;
    notifications: {
      email: boolean;
      whatsapp: boolean;
    };
  };
}
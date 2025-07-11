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
}
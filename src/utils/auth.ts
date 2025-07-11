import { User } from '../types/user';

const USERS_STORAGE_KEY = 'lunara-users';
const CURRENT_USER_KEY = 'lunara-current-user';

// Default admin user
const defaultUsers: User[] = [
  {
    id: 'admin-001',
    username: 'admin',
    email: 'admin@lunara.com',
    password: 'admin123',
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'user-001',
    username: 'user',
    email: 'user@lunara.com',
    password: 'user123',
    role: 'member',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

// Initialize users if not exists
const initializeUsers = (): void => {
  const existingUsers = localStorage.getItem(USERS_STORAGE_KEY);
  if (!existingUsers) {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(defaultUsers));
  }
};

// Get all users
export const getAllUsers = (): User[] => {
  initializeUsers();
  try {
    const users = localStorage.getItem(USERS_STORAGE_KEY);
    return users ? JSON.parse(users) : defaultUsers;
  } catch (error) {
    console.error('Error loading users:', error);
    return defaultUsers;
  }
};

// Save users to storage
const saveUsers = (users: User[]): void => {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (error) {
    console.error('Error saving users:', error);
  }
};

// Login function
export const login = (username: string, password: string): User | null => {
  const users = getAllUsers();
  const user = users.find(u => 
    u.username === username && 
    u.password === password && 
    u.isActive
  );

  if (user) {
    // Update last login
    const updatedUser = { ...user, lastLogin: new Date().toISOString() };
    const updatedUsers = users.map(u => u.id === user.id ? updatedUser : u);
    saveUsers(updatedUsers);
    
    // Save current user session
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  }

  return null;
};

// Logout function
export const logout = (): void => {
  localStorage.removeItem(CURRENT_USER_KEY);
};

// Get current user
export const getCurrentUser = (): User | null => {
  try {
    const currentUser = localStorage.getItem(CURRENT_USER_KEY);
    return currentUser ? JSON.parse(currentUser) : null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Create new user
export const createUser = (userData: Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'>): User => {
  const users = getAllUsers();
  
  // Check if username or email already exists
  const existingUser = users.find(u => 
    u.username === userData.username || u.email === userData.email
  );
  
  if (existingUser) {
    throw new Error('Username or email already exists');
  }

  // Validate username (alphanumeric + underscore, min 3 chars)
  if (!/^[a-zA-Z0-9_]{3,}$/.test(userData.username)) {
    throw new Error('Username must be at least 3 characters and contain only letters, numbers, and underscores');
  }

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
    throw new Error('Please enter a valid email address');
  }

  // Validate password
  if (userData.password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  const newUser: User = {
    ...userData,
    id: `user-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const updatedUsers = [...users, newUser];
  saveUsers(updatedUsers);
  
  return newUser;
};

// Update user
export const updateUser = (updatedUser: User): User => {
  const users = getAllUsers();
  const userIndex = users.findIndex(u => u.id === updatedUser.id);
  
  if (userIndex === -1) {
    throw new Error('User not found');
  }

  // Check if username or email conflicts with other users
  const conflictingUser = users.find(u => 
    u.id !== updatedUser.id && 
    (u.username === updatedUser.username || u.email === updatedUser.email)
  );
  
  if (conflictingUser) {
    throw new Error('Username or email already exists');
  }

  // Validate username
  if (!/^[a-zA-Z0-9_]{3,}$/.test(updatedUser.username)) {
    throw new Error('Username must be at least 3 characters and contain only letters, numbers, and underscores');
  }

  // Validate email
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(updatedUser.email)) {
    throw new Error('Please enter a valid email address');
  }

  // Validate password if provided
  if (updatedUser.password && updatedUser.password.length < 6) {
    throw new Error('Password must be at least 6 characters long');
  }

  const finalUser = {
    ...updatedUser,
    updatedAt: new Date().toISOString()
  };

  users[userIndex] = finalUser;
  saveUsers(users);
  
  // Update current user session if it's the same user
  const currentUser = getCurrentUser();
  if (currentUser && currentUser.id === finalUser.id) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(finalUser));
  }
  
  return finalUser;
};

// Delete user
export const deleteUser = (userId: string): void => {
  const users = getAllUsers();
  const currentUser = getCurrentUser();
  
  // Prevent deleting current user
  if (currentUser && currentUser.id === userId) {
    throw new Error('Cannot delete currently logged in user');
  }
  
  // Prevent deleting the last admin
  const admins = users.filter(u => u.role === 'admin');
  const userToDelete = users.find(u => u.id === userId);
  
  if (userToDelete?.role === 'admin' && admins.length <= 1) {
    throw new Error('Cannot delete the last admin user');
  }
  
  const updatedUsers = users.filter(u => u.id !== userId);
  
  if (updatedUsers.length === users.length) {
    throw new Error('User not found');
  }
  
  saveUsers(updatedUsers);
};

// Check if user is admin
export const isAdmin = (user: User | null): boolean => {
  return user?.role === 'admin' && user?.isActive === true;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const user = getCurrentUser();
  return user !== null && user.isActive;
};
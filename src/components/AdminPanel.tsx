import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Edit, Trash2, Search, Shield, User, Eye, EyeOff, Save, X, Settings, Globe, Key } from 'lucide-react';
import { User as UserType } from '../types/user';
import { dataService } from '../utils/dataService';
import { translations } from '../utils/translations';
import { PasswordResetSettings } from './PasswordResetSettings';

interface AdminPanelProps {
  language: 'en' | 'id';
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ language }) => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'settings' | 'password-reset'>('users');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'member' as 'admin' | 'member',
    isActive: true
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Google Auth Settings
  const [googleAuthSettings, setGoogleAuthSettings] = useState({
    enabled: false,
    clientId: '',
    clientSecret: '',
    redirectUri: ''
  });

  const t = translations[language];

  useEffect(() => {
    loadUsers();
    loadGoogleAuthSettings();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery]);

  const loadUsers = () => {
    dataService.getAllUsers().then(setUsers);
  };

  const loadGoogleAuthSettings = () => {
    const settings = localStorage.getItem('google-auth-settings');
    if (settings) {
      setGoogleAuthSettings(JSON.parse(settings));
    }
  };

  const saveGoogleAuthSettings = () => {
    localStorage.setItem('google-auth-settings', JSON.stringify(googleAuthSettings));
    setSuccess(t.settingsSaved || 'Settings saved successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const filterUsers = () => {
    if (!searchQuery) {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user =>
      user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'member',
      isActive: true
    });
    setEditingUser(null);
    setShowCreateForm(false);
    setError('');
    setSuccess('');
    setShowPassword(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (editingUser) {
        // Update existing user
        const updatedUser: UserType = {
          ...editingUser,
          username: formData.username,
          email: formData.email,
          role: formData.role,
          isActive: formData.isActive,
          updatedAt: new Date().toISOString()
        };

        // Only update password if provided
        if (formData.password) {
          updatedUser.password = formData.password;
        }

        await dataService.updateUser(updatedUser);
        setSuccess(t.userUpdated || 'User updated successfully!');
      } else {
        // Create new user
        const newUser: Omit<UserType, 'id' | 'createdAt' | 'updatedAt' | 'lastLogin'> = {
          username: formData.username,
          email: formData.email,
          password: formData.password,
          role: formData.role,
          isActive: formData.isActive
        };

        await dataService.createUser(newUser);
        setSuccess(t.userCreated || 'User created successfully!');
      }

      loadUsers();
      resetForm();
    } catch (err: any) {
      setError(err.message || (t.operationFailed || 'Operation failed'));
    }
  };

  const handleEdit = (user: UserType) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      isActive: user.isActive
    });
    setShowCreateForm(true);
  };

  const handleDelete = (userId: string) => {
    if (window.confirm(t.confirmDeleteUser || 'Are you sure you want to delete this user?')) {
      try {
        deleteUser(userId);
        setSuccess(t.userDeleted || 'User deleted successfully!');
        loadUsers();
      } catch (err: any) {
        setError(err.message || (t.deleteFailed || 'Delete failed'));
      }
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    admins: users.filter(u => u.role === 'admin').length
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl transform rotate-1 opacity-20"></div>
        <div className="relative bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t.adminPanel || 'Admin Panel'}
              </h2>
              <p className="text-gray-600 mt-2">{t.manageUsers || 'Manage system users and settings'}</p>
            </div>
            
            {/* Tab Navigation */}
            <div className="flex space-x-2">
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'users'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                {t.users || 'Users'}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'settings'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Settings className="h-4 w-4 inline mr-2" />
                {t.settings || 'Settings'}
              </button>
              <button
                onClick={() => setActiveTab('password-reset')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${
                  activeTab === 'password-reset'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Key className="h-4 w-4 inline mr-2" />
                Password Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'users' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: t.totalUsers || 'Total Users', value: stats.total, icon: Users, color: 'from-blue-500 to-blue-600' },
              { label: t.activeUsers || 'Active Users', value: stats.active, icon: User, color: 'from-green-500 to-green-600' },
              { label: t.adminUsers || 'Admin Users', value: stats.admins, icon: Shield, color: 'from-purple-500 to-purple-600' }
            ].map((stat, index) => (
              <div key={index} className="group relative">
                <div className="absolute inset-0 bg-gradient-to-r opacity-20 rounded-xl transform rotate-1 group-hover:rotate-2 transition-transform duration-300" style={{ background: `linear-gradient(to right, ${stat.color.split(' ')[1]}, ${stat.color.split(' ')[3]})` }}></div>
                <div className="relative bg-white rounded-xl shadow-lg p-6 transform group-hover:scale-105 transition-all duration-300">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stat.value}</p>
                    </div>
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${stat.color} shadow-lg`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Search and Create Button */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.searchUsers || 'Search users...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
                />
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className="group relative bg-gradient-to-r from-purple-500 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"></div>
                <div className="relative flex items-center space-x-2">
                  <UserPlus className="h-5 w-5" />
                  <span>{t.createUser || 'Create User'}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-purple-500 to-pink-600 text-white">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold">{t.username || 'Username'}</th>
                    <th className="px-6 py-4 text-left font-semibold">{t.email || 'Email'}</th>
                    <th className="px-6 py-4 text-left font-semibold">{t.role || 'Role'}</th>
                    <th className="px-6 py-4 text-left font-semibold">{t.status || 'Status'}</th>
                    <th className="px-6 py-4 text-left font-semibold">{t.lastLogin || 'Last Login'}</th>
                    <th className="px-6 py-4 text-center font-semibold">{t.actions || 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors duration-200">
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            user.role === 'admin' 
                              ? 'bg-gradient-to-r from-purple-500 to-pink-600' 
                              : 'bg-gradient-to-r from-blue-500 to-blue-600'
                          }`}>
                            {user.role === 'admin' ? (
                              <Shield className="h-4 w-4 text-white" />
                            ) : (
                              <User className="h-4 w-4 text-white" />
                            )}
                          </div>
                          <span className="font-medium text-gray-900">{user.username}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{user.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.role === 'admin' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role === 'admin' ? '👑 Admin' : '👤 Member'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-gray-600 text-sm">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center space-x-2">
                          <button
                            onClick={() => handleEdit(user)}
                            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(user.id)}
                            className="bg-gradient-to-r from-red-500 to-red-600 text-white p-2 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {t.noUsersFound || 'No users found'}
              </h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? (t.noUsersMatchSearch || 'No users match your search criteria')
                  : (t.createFirstUser || 'Create your first user to get started')
                }
              </p>
            </div>
          )}
        </>
      ) : activeTab === 'password-reset' ? (
        <PasswordResetSettings language={language} />
      ) : (
        /* Settings Tab */
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Globe className="h-6 w-6 mr-3 text-blue-500" />
            {t.googleAuthSettings || 'Google Authentication Settings'}
          </h3>
          
          <div className="space-y-6">
            {/* Enable Google Auth */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-semibold text-gray-900">{t.enableGoogleAuth || 'Enable Google Authentication'}</h4>
                <p className="text-sm text-gray-600">{t.enableGoogleAuthDesc || 'Allow users to login with their Google accounts'}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={googleAuthSettings.enabled}
                  onChange={(e) => setGoogleAuthSettings({...googleAuthSettings, enabled: e.target.checked})}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* Google OAuth Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.googleClientId || 'Google Client ID'}
                </label>
                <input
                  type="text"
                  value={googleAuthSettings.clientId}
                  onChange={(e) => setGoogleAuthSettings({...googleAuthSettings, clientId: e.target.value})}
                  placeholder="Enter Google OAuth Client ID"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!googleAuthSettings.enabled}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.googleClientSecret || 'Google Client Secret'}
                </label>
                <input
                  type="password"
                  value={googleAuthSettings.clientSecret}
                  onChange={(e) => setGoogleAuthSettings({...googleAuthSettings, clientSecret: e.target.value})}
                  placeholder="Enter Google OAuth Client Secret"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!googleAuthSettings.enabled}
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t.redirectUri || 'Redirect URI'}
                </label>
                <input
                  type="url"
                  value={googleAuthSettings.redirectUri}
                  onChange={(e) => setGoogleAuthSettings({...googleAuthSettings, redirectUri: e.target.value})}
                  placeholder="https://yourdomain.com/auth/google/callback"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={!googleAuthSettings.enabled}
                />
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-800 mb-2">{t.setupInstructions || 'Setup Instructions'}</h4>
              <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                <li>{t.instruction1 || 'Go to Google Cloud Console and create a new project'}</li>
                <li>{t.instruction2 || 'Enable the Google+ API for your project'}</li>
                <li>{t.instruction3 || 'Create OAuth 2.0 credentials (Web application)'}</li>
                <li>{t.instruction4 || 'Add your domain to authorized origins'}</li>
                <li>{t.instruction5 || 'Copy the Client ID and Client Secret here'}</li>
              </ol>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={saveGoogleAuthSettings}
                className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-3 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center space-x-2"
              >
                <Save className="h-4 w-4" />
                <span>{t.saveSettings || 'Save Settings'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create/Edit User Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                {editingUser ? (t.editUser || 'Edit User') : (t.createUser || 'Create User')}
              </h3>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.username || 'Username'}
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.email || 'Email'}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.password || 'Password'} {editingUser && '(leave blank to keep current)'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required={!editingUser}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t.role || 'Role'}
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'member' })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="member">Member</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                  {t.activeUser || 'Active User'}
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-green-600 text-sm">{success}</p>
                </div>
              )}

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-600 text-white py-2 px-4 rounded-lg hover:shadow-lg transform hover:scale-105 transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingUser ? (t.update || 'Update') : (t.create || 'Create')}</span>
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-gray-500 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors duration-300"
                >
                  {t.cancel || 'Cancel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
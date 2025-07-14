import React, { useState, useEffect, useRef } from 'react';
import { 
  User, Mail, Phone, Camera, Save, Eye, EyeOff, Shield, 
  Globe, Palette, Bell, Lock, AlertTriangle, CheckCircle,
  X, Upload, Loader, Settings, Key, Smartphone
} from 'lucide-react';
import { UserProfile, PasswordChangeRequest, EmailChangeRequest, WhatsAppChangeRequest, ProfileUpdateRequest } from '../types/userProfile';
import { ProfileService } from '../utils/profileService';
import { ProfileValidator } from '../utils/profileValidation';
import { translations, currencies } from '../utils/translations';
import { themes } from '../utils/themes';

interface UserProfileManagerProps {
  userId: string;
  language: 'en' | 'id';
  onClose: () => void;
  onProfileUpdate?: (profile: UserProfile) => void;
}

export const UserProfileManager: React.FC<UserProfileManagerProps> = ({
  userId,
  language,
  onClose,
  onProfileUpdate
}) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'privacy'>('profile');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showConfirmDialog, setShowConfirmDialog] = useState<string | null>(null);
  
  // Form states
  const [profileForm, setProfileForm] = useState<ProfileUpdateRequest>({});
  const [passwordForm, setPasswordForm] = useState<PasswordChangeRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [emailForm, setEmailForm] = useState<EmailChangeRequest>({
    newEmail: '',
    password: '',
    verificationCode: ''
  });
  const [whatsappForm, setWhatsappForm] = useState<WhatsAppChangeRequest>({
    newWhatsappNumber: '',
    verificationCode: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const t = translations[language];

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const userProfile = await ProfileService.getUserProfile(userId);
      if (userProfile) {
        setProfile(userProfile);
        setProfileForm({
          fullName: userProfile.fullName,
          dateOfBirth: userProfile.dateOfBirth,
          address: userProfile.address,
          city: userProfile.city,
          country: userProfile.country,
          timezone: userProfile.timezone,
          bio: userProfile.bio,
          website: userProfile.website,
          socialLinks: userProfile.socialLinks
        });
        setEmailForm(prev => ({ ...prev, newEmail: userProfile.email }));
        setWhatsappForm(prev => ({ ...prev, newWhatsappNumber: userProfile.whatsappNumber || '' }));
      }
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  };

  const showMessage = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      setSuccess(message);
      setError('');
    } else {
      setError(message);
      setSuccess('');
    }
    setTimeout(() => {
      setSuccess('');
      setError('');
    }, 5000);
  };

  const handleProfileUpdate = async () => {
    setIsSaving(true);
    try {
      const response = await ProfileService.updateProfile(userId, profileForm);
      if (response.success) {
        showMessage(response.message, 'success');
        if (response.data) {
          setProfile(response.data);
          onProfileUpdate?.(response.data);
        }
      } else {
        showMessage(response.message, 'error');
      }
    } catch (err) {
      showMessage('Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setIsSaving(true);
    try {
      const response = await ProfileService.changePassword(userId, passwordForm);
      if (response.success) {
        showMessage(response.message, 'success');
        setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        setShowConfirmDialog(null);
      } else {
        showMessage(response.message, 'error');
      }
    } catch (err) {
      showMessage('Failed to change password', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEmailChange = async () => {
    setIsSaving(true);
    try {
      const response = await ProfileService.changeEmail(userId, emailForm);
      if (response.success) {
        showMessage(response.message, 'success');
        if (!response.requiresVerification) {
          setShowConfirmDialog(null);
          loadProfile(); // Reload to get updated email
        }
      } else {
        showMessage(response.message, 'error');
      }
    } catch (err) {
      showMessage('Failed to change email', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleWhatsAppChange = async () => {
    setIsSaving(true);
    try {
      const response = await ProfileService.changeWhatsAppNumber(userId, whatsappForm);
      if (response.success) {
        showMessage(response.message, 'success');
        if (!response.requiresVerification) {
          setShowConfirmDialog(null);
          loadProfile(); // Reload to get updated number
        }
      } else {
        showMessage(response.message, 'error');
      }
    } catch (err) {
      showMessage('Failed to change WhatsApp number', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleProfilePictureUpload = async (file: File) => {
    setIsSaving(true);
    try {
      const response = await ProfileService.updateProfilePicture(userId, file);
      if (response.success) {
        showMessage(response.message, 'success');
        loadProfile(); // Reload to get updated picture
      } else {
        showMessage(response.message, 'error');
      }
    } catch (err) {
      showMessage('Failed to upload profile picture', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreferencesUpdate = async (newPreferences: UserProfile['preferences']) => {
    setIsSaving(true);
    try {
      const response = await ProfileService.updatePreferences(userId, newPreferences);
      if (response.success) {
        showMessage(response.message, 'success');
        setProfile(prev => prev ? { ...prev, preferences: newPreferences } : null);
        onProfileUpdate?.(profile ? { ...profile, preferences: newPreferences } : profile!);
      } else {
        showMessage(response.message, 'error');
      }
    } catch (err) {
      showMessage('Failed to update preferences', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTwoFactorToggle = async (enable: boolean, password: string) => {
    setIsSaving(true);
    try {
      const response = await ProfileService.toggleTwoFactor(userId, enable, password);
      if (response.success) {
        showMessage(response.message, 'success');
        setProfile(prev => prev ? { ...prev, twoFactorEnabled: enable } : null);
        setShowConfirmDialog(null);
      } else {
        showMessage(response.message, 'error');
      }
    } catch (err) {
      showMessage('Failed to update two-factor authentication', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const validateForm = (formType: string): boolean => {
    setError('');
    
    switch (formType) {
      case 'profile':
        const profileValidation = ProfileValidator.validateProfileUpdate(profileForm);
        if (!profileValidation.isValid) {
          setError(profileValidation.errors.join(', '));
          return false;
        }
        break;
        
      case 'password':
        const passwordValidation = ProfileValidator.validatePasswordChange(passwordForm, profile?.username);
        if (!passwordValidation.isValid) {
          setError(passwordValidation.errors.join(', '));
          return false;
        }
        break;
        
      case 'email':
        const emailValidation = ProfileValidator.validateEmailChange(emailForm);
        if (!emailValidation.isValid) {
          setError(emailValidation.errors.join(', '));
          return false;
        }
        break;
        
      case 'whatsapp':
        const whatsappValidation = ProfileValidator.validateWhatsAppChange(whatsappForm);
        if (!whatsappValidation.isValid) {
          setError(whatsappValidation.errors.join(', '));
          return false;
        }
        break;
    }
    
    return true;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 flex items-center space-x-4">
          <Loader className="h-6 w-6 animate-spin text-blue-600" />
          <span>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Profile Not Found</h3>
          <p className="text-gray-600 mb-4">Unable to load user profile</p>
          <button
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center overflow-hidden">
                  {profile.profilePicture ? (
                    <img 
                      src={profile.profilePicture} 
                      alt="Profile" 
                      className="w-16 h-16 rounded-full object-cover" 
                    />
                  ) : (
                    <User className="h-8 w-8" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-white text-blue-600 rounded-full p-1 cursor-pointer hover:bg-gray-100 transition-colors">
                  <Camera className="h-4 w-4" />
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleProfilePictureUpload(file);
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <h2 className="text-2xl font-bold">Profile Management</h2>
                <p className="text-blue-100">@{profile.username}</p>
                <div className="flex items-center space-x-4 mt-2">
                  {profile.emailVerified && (
                    <span className="flex items-center space-x-1 text-green-200 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>Email Verified</span>
                    </span>
                  )}
                  {profile.whatsappVerified && (
                    <span className="flex items-center space-x-1 text-green-200 text-sm">
                      <CheckCircle className="h-4 w-4" />
                      <span>WhatsApp Verified</span>
                    </span>
                  )}
                  {profile.twoFactorEnabled && (
                    <span className="flex items-center space-x-1 text-yellow-200 text-sm">
                      <Shield className="h-4 w-4" />
                      <span>2FA Enabled</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200">
          <div className="flex space-x-8 px-6">
            {[
              { id: 'profile', label: 'Profile Information', icon: User },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'preferences', label: 'Preferences', icon: Settings },
              { id: 'privacy', label: 'Privacy', icon: Lock }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileForm.fullName || ''}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, fullName: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={profileForm.dateOfBirth || ''}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bio
                  </label>
                  <textarea
                    value={profileForm.bio || ''}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, bio: e.target.value }))}
                    rows={3}
                    maxLength={500}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Tell us about yourself..."
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(profileForm.bio || '').length}/500 characters
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={profileForm.website || ''}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, website: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    value={profileForm.timezone || ''}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select timezone</option>
                    <option value="UTC">UTC</option>
                    <option value="Asia/Jakarta">Asia/Jakarta</option>
                    <option value="America/New_York">America/New_York</option>
                    <option value="Europe/London">Europe/London</option>
                    <option value="Asia/Tokyo">Asia/Tokyo</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={profileForm.address || ''}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, address: e.target.value }))}
                    rows={2}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    value={profileForm.city || ''}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your city"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Country
                  </label>
                  <input
                    type="text"
                    value={profileForm.country || ''}
                    onChange={(e) => setProfileForm(prev => ({ ...prev, country: e.target.value }))}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter your country"
                  />
                </div>
              </div>

              {/* Social Links */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Social Links</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      LinkedIn
                    </label>
                    <input
                      type="url"
                      value={profileForm.socialLinks?.linkedin || ''}
                      onChange={(e) => setProfileForm(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, linkedin: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Twitter
                    </label>
                    <input
                      type="url"
                      value={profileForm.socialLinks?.twitter || ''}
                      onChange={(e) => setProfileForm(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, twitter: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://twitter.com/username"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GitHub
                    </label>
                    <input
                      type="url"
                      value={profileForm.socialLinks?.github || ''}
                      onChange={(e) => setProfileForm(prev => ({
                        ...prev,
                        socialLinks: { ...prev.socialLinks, github: e.target.value }
                      }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://github.com/username"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => {
                    if (validateForm('profile')) {
                      handleProfileUpdate();
                    }
                  }}
                  disabled={isSaving}
                  className="flex items-center space-x-2 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader className="h-4 w-4 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4" />
                  )}
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-8">
              {/* Email Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-blue-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">Email Address</h4>
                      <p className="text-sm text-gray-600">{profile.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {profile.emailVerified && (
                      <span className="flex items-center space-x-1 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span>Verified</span>
                      </span>
                    )}
                    <button
                      onClick={() => setShowConfirmDialog('email')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      Change Email
                    </button>
                  </div>
                </div>
              </div>

              {/* WhatsApp Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="h-5 w-5 text-green-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">WhatsApp Number</h4>
                      <p className="text-sm text-gray-600">
                        {profile.whatsappNumber || 'Not set'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {profile.whatsappVerified && (
                      <span className="flex items-center space-x-1 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span>Verified</span>
                      </span>
                    )}
                    <button
                      onClick={() => setShowConfirmDialog('whatsapp')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {profile.whatsappNumber ? 'Change Number' : 'Add Number'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Password Section */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Key className="h-5 w-5 text-red-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">Password</h4>
                      <p className="text-sm text-gray-600">
                        Last changed: {profile.lastPasswordChange 
                          ? new Date(profile.lastPasswordChange).toLocaleDateString()
                          : 'Never'
                        }
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowConfirmDialog('password')}
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Change Password
                  </button>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Shield className="h-5 w-5 text-purple-500" />
                    <div>
                      <h4 className="font-medium text-gray-900">Two-Factor Authentication</h4>
                      <p className="text-sm text-gray-600">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm ${profile.twoFactorEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                      {profile.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </span>
                    <button
                      onClick={() => setShowConfirmDialog('2fa')}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                    >
                      {profile.twoFactorEnabled ? 'Disable' : 'Enable'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Preferences</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="h-4 w-4 inline mr-2" />
                    Language
                  </label>
                  <select
                    value={profile.preferences.language}
                    onChange={(e) => {
                      const newPrefs = {
                        ...profile.preferences,
                        language: e.target.value as 'en' | 'id'
                      };
                      handlePreferencesUpdate(newPrefs);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="en">English</option>
                    <option value="id">Bahasa Indonesia</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Palette className="h-4 w-4 inline mr-2" />
                    Theme
                  </label>
                  <select
                    value={profile.preferences.theme}
                    onChange={(e) => {
                      const newPrefs = {
                        ...profile.preferences,
                        theme: e.target.value
                      };
                      handlePreferencesUpdate(newPrefs);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {themes.map((theme) => (
                      <option key={theme.id} value={theme.id}>
                        {theme.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Currency
                  </label>
                  <select
                    value={profile.preferences.currency}
                    onChange={(e) => {
                      const newPrefs = {
                        ...profile.preferences,
                        currency: e.target.value
                      };
                      handlePreferencesUpdate(newPrefs);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {currencies.map((currency) => (
                      <option key={currency.code} value={currency.code}>
                        {currency.symbol} {currency.code} - {currency.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notification Preferences */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Bell className="h-4 w-4 mr-2" />
                  Notification Preferences
                </h4>
                
                <div className="space-y-3">
                  {[
                    { key: 'email', label: 'Email Notifications', icon: Mail },
                    { key: 'whatsapp', label: 'WhatsApp Notifications', icon: Phone },
                    { key: 'push', label: 'Push Notifications', icon: Bell },
                    { key: 'marketing', label: 'Marketing Communications', icon: Mail }
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <item.icon className="h-5 w-5 text-gray-600" />
                        <span className="font-medium text-gray-900">{item.label}</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={profile.preferences.notifications[item.key as keyof typeof profile.preferences.notifications]}
                          onChange={(e) => {
                            const newPrefs = {
                              ...profile.preferences,
                              notifications: {
                                ...profile.preferences.notifications,
                                [item.key]: e.target.checked
                              }
                            };
                            handlePreferencesUpdate(newPrefs);
                          }}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Privacy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Privacy Settings</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profile Visibility
                  </label>
                  <select
                    value={profile.preferences.privacy.profileVisibility}
                    onChange={(e) => {
                      const newPrefs = {
                        ...profile.preferences,
                        privacy: {
                          ...profile.preferences.privacy,
                          profileVisibility: e.target.value as 'public' | 'private' | 'contacts'
                        }
                      };
                      handlePreferencesUpdate(newPrefs);
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="public">Public - Anyone can see your profile</option>
                    <option value="contacts">Contacts Only - Only your contacts can see your profile</option>
                    <option value="private">Private - Only you can see your profile</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Contact Information Visibility</h4>
                  
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">Show Email Address</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.preferences.privacy.showEmail}
                        onChange={(e) => {
                          const newPrefs = {
                            ...profile.preferences,
                            privacy: {
                              ...profile.preferences.privacy,
                              showEmail: e.target.checked
                            }
                          };
                          handlePreferencesUpdate(newPrefs);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium text-gray-900">Show WhatsApp Number</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={profile.preferences.privacy.showWhatsapp}
                        onChange={(e) => {
                          const newPrefs = {
                            ...profile.preferences,
                            privacy: {
                              ...profile.preferences.privacy,
                              showWhatsapp: e.target.checked
                            }
                          };
                          handlePreferencesUpdate(newPrefs);
                        }}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error/Success Messages */}
        {(error || success) && (
          <div className="px-6 pb-4">
            <div className={`p-3 rounded-lg ${
              success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center">
                {success ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                )}
                <p className={`text-sm ${success ? 'text-green-600' : 'text-red-600'}`}>
                  {success || error}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialogs */}
        {showConfirmDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                {showConfirmDialog === 'password' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Change Password</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Confirm New Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                        <Shield className="h-4 w-4 mr-2" />
                        Password Requirements
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• At least 8 characters long</li>
                        <li>• Contains uppercase and lowercase letters</li>
                        <li>• Contains at least one number</li>
                        <li>• Contains at least one special character</li>
                      </ul>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={() => setShowConfirmDialog(null)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (validateForm('password')) {
                            handlePasswordChange();
                          }
                        }}
                        disabled={isSaving}
                        className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                      >
                        {isSaving ? 'Changing...' : 'Change Password'}
                      </button>
                    </div>
                  </div>
                )}

                {showConfirmDialog === 'email' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Change Email Address</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New Email Address
                      </label>
                      <input
                        type="email"
                        value={emailForm.newEmail}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, newEmail: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={emailForm.password}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={() => setShowConfirmDialog(null)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (validateForm('email')) {
                            handleEmailChange();
                          }
                        }}
                        disabled={isSaving}
                        className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                      >
                        {isSaving ? 'Changing...' : 'Change Email'}
                      </button>
                    </div>
                  </div>
                )}

                {showConfirmDialog === 'whatsapp' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">Change WhatsApp Number</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        New WhatsApp Number
                      </label>
                      <input
                        type="tel"
                        value={whatsappForm.newWhatsappNumber}
                        onChange={(e) => setWhatsappForm(prev => ({ ...prev, newWhatsappNumber: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="+1234567890"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Include country code (e.g., +62 for Indonesia)
                      </p>
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={() => setShowConfirmDialog(null)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (validateForm('whatsapp')) {
                            handleWhatsAppChange();
                          }
                        }}
                        disabled={isSaving}
                        className="flex-1 bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 disabled:opacity-50"
                      >
                        {isSaving ? 'Changing...' : 'Change Number'}
                      </button>
                    </div>
                  </div>
                )}

                {showConfirmDialog === '2fa' && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {profile.twoFactorEnabled ? 'Disable' : 'Enable'} Two-Factor Authentication
                    </h3>
                    
                    <p className="text-gray-600">
                      {profile.twoFactorEnabled 
                        ? 'Are you sure you want to disable two-factor authentication? This will make your account less secure.'
                        : 'Two-factor authentication adds an extra layer of security to your account.'
                      }
                    </p>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Current Password
                      </label>
                      <input
                        type="password"
                        value={passwordForm.currentPassword}
                        onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div className="flex space-x-4">
                      <button
                        onClick={() => setShowConfirmDialog(null)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleTwoFactorToggle(!profile.twoFactorEnabled, passwordForm.currentPassword)}
                        disabled={isSaving || !passwordForm.currentPassword}
                        className={`flex-1 px-4 py-2 rounded-lg text-white disabled:opacity-50 ${
                          profile.twoFactorEnabled 
                            ? 'bg-red-500 hover:bg-red-600' 
                            : 'bg-green-500 hover:bg-green-600'
                        }`}
                      >
                        {isSaving ? 'Processing...' : (profile.twoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
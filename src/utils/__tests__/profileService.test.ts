import { ProfileService } from '../profileService';
import { UserProfile, PasswordChangeRequest, EmailChangeRequest, WhatsAppChangeRequest, ProfileUpdateRequest } from '../../types/userProfile';

// Mock Supabase
jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      })),
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      })),
      insert: jest.fn(() => ({
        select: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    })),
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn()
      }))
    }
  }
}));

// Mock bcrypt
jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn()
}));

describe('ProfileService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Clear rate limit map
    (ProfileService as any).rateLimitMap.clear();
  });

  describe('getUserProfile', () => {
    it('should return user profile when found', async () => {
      const mockUserData = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Test User',
        phone: '+1234567890',
        avatar: 'https://example.com/avatar.jpg',
        preferences: {
          language: 'en',
          theme: 'modern',
          currency: 'USD',
          notifications: {
            email: true,
            whatsapp: true,
            push: true,
            marketing: false
          },
          privacy: {
            profileVisibility: 'private',
            showEmail: false,
            showWhatsapp: false
          }
        },
        two_factor_enabled: false,
        email_verified: true,
        whatsapp_verified: false,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const { supabase } = require('../supabase');
      supabase.from().select().eq().single.mockResolvedValue({
        data: mockUserData,
        error: null
      });

      const result = await ProfileService.getUserProfile('user-1');

      expect(result).toBeDefined();
      expect(result?.id).toBe('user-1');
      expect(result?.username).toBe('testuser');
      expect(result?.email).toBe('test@example.com');
      expect(result?.fullName).toBe('Test User');
      expect(result?.whatsappNumber).toBe('+1234567890');
      expect(result?.profilePicture).toBe('https://example.com/avatar.jpg');
      expect(result?.twoFactorEnabled).toBe(false);
      expect(result?.emailVerified).toBe(true);
      expect(result?.whatsappVerified).toBe(false);
    });

    it('should return null when user not found', async () => {
      const { supabase } = require('../supabase');
      supabase.from().select().eq().single.mockResolvedValue({
        data: null,
        error: { message: 'User not found' }
      });

      const result = await ProfileService.getUserProfile('nonexistent');

      expect(result).toBeNull();
    });

    it('should handle database errors gracefully', async () => {
      const { supabase } = require('../supabase');
      supabase.from().select().eq().single.mockRejectedValue(new Error('Database error'));

      const result = await ProfileService.getUserProfile('user-1');

      expect(result).toBeNull();
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const profileData: ProfileUpdateRequest = {
        fullName: 'Updated Name',
        bio: 'Updated bio',
        city: 'New York'
      };

      const mockUpdatedData = {
        id: 'user-1',
        username: 'testuser',
        email: 'test@example.com',
        full_name: 'Updated Name',
        bio: 'Updated bio',
        city: 'New York',
        preferences: {},
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };

      const { supabase } = require('../supabase');
      supabase.from().update().eq().select().single.mockResolvedValue({
        data: mockUpdatedData,
        error: null
      });

      const result = await ProfileService.updateProfile('user-1', profileData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Profile updated successfully');
      expect(result.data).toBeDefined();
      expect(result.data?.fullName).toBe('Updated Name');
    });

    it('should reject invalid profile data', async () => {
      const profileData: ProfileUpdateRequest = {
        fullName: 'a'.repeat(101) // Too long
      };

      const result = await ProfileService.updateProfile('user-1', profileData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Full name is too long');
    });

    it('should handle rate limiting', async () => {
      // Simulate rate limit exceeded
      for (let i = 0; i < 11; i++) {
        await ProfileService.updateProfile('user-1', { fullName: 'Test' });
      }

      const result = await ProfileService.updateProfile('user-1', { fullName: 'Test' });

      expect(result.success).toBe(false);
      expect(result.message).toBe('Too many requests. Please try again later.');
    });

    it('should handle database errors', async () => {
      const profileData: ProfileUpdateRequest = {
        fullName: 'Valid Name'
      };

      const { supabase } = require('../supabase');
      supabase.from().update().eq().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Database error' }
      });

      const result = await ProfileService.updateProfile('user-1', profileData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to update profile. Please try again.');
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const passwordData: PasswordChangeRequest = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!'
      };

      const mockUserData = {
        username: 'testuser',
        password_hash: 'hashed_old_password'
      };

      const { supabase } = require('../supabase');
      const bcrypt = require('bcryptjs');

      // Mock user data fetch
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockUserData,
        error: null
      });

      // Mock password comparison
      bcrypt.compare.mockResolvedValue(true);

      // Mock password hash
      bcrypt.hash.mockResolvedValue('hashed_new_password');

      // Mock password update
      supabase.from().update().eq.mockResolvedValue({
        error: null
      });

      const result = await ProfileService.changePassword('user-1', passwordData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Password changed successfully');
      expect(bcrypt.compare).toHaveBeenCalledWith('OldPass123!', 'hashed_old_password');
      expect(bcrypt.hash).toHaveBeenCalledWith('NewPass123!', 12);
    });

    it('should reject invalid current password', async () => {
      const passwordData: PasswordChangeRequest = {
        currentPassword: 'WrongPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!'
      };

      const mockUserData = {
        username: 'testuser',
        password_hash: 'hashed_old_password'
      };

      const { supabase } = require('../supabase');
      const bcrypt = require('bcryptjs');

      supabase.from().select().eq().single.mockResolvedValue({
        data: mockUserData,
        error: null
      });

      bcrypt.compare.mockResolvedValue(false);

      const result = await ProfileService.changePassword('user-1', passwordData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Current password is incorrect');
    });

    it('should reject weak passwords', async () => {
      const passwordData: PasswordChangeRequest = {
        currentPassword: 'OldPass123!',
        newPassword: 'weak',
        confirmPassword: 'weak'
      };

      const result = await ProfileService.changePassword('user-1', passwordData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Password must be at least 8 characters long');
    });
  });

  describe('changeEmail', () => {
    it('should initiate email change successfully', async () => {
      const emailData: EmailChangeRequest = {
        newEmail: 'newemail@example.com',
        password: 'CurrentPass123!'
      };

      const mockUserData = {
        password_hash: 'hashed_password'
      };

      const { supabase } = require('../supabase');
      const bcrypt = require('bcryptjs');

      // Mock email uniqueness check
      supabase.from().select().eq().neq().single.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock user data fetch
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockUserData,
        error: null
      });

      // Mock password verification
      bcrypt.compare.mockResolvedValue(true);

      const result = await ProfileService.changeEmail('user-1', emailData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Verification code sent to your new email address');
      expect(result.requiresVerification).toBe(true);
    });

    it('should reject duplicate email', async () => {
      const emailData: EmailChangeRequest = {
        newEmail: 'existing@example.com',
        password: 'CurrentPass123!'
      };

      const { supabase } = require('../supabase');

      // Mock existing email found
      supabase.from().select().eq().neq().single.mockResolvedValue({
        data: { id: 'other-user' },
        error: null
      });

      const result = await ProfileService.changeEmail('user-1', emailData);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Email address is already in use');
    });

    it('should complete email change with verification code', async () => {
      const emailData: EmailChangeRequest = {
        newEmail: 'newemail@example.com',
        password: 'CurrentPass123!',
        verificationCode: '123456'
      };

      const mockUserData = {
        password_hash: 'hashed_password'
      };

      const { supabase } = require('../supabase');
      const bcrypt = require('bcryptjs');

      // Mock email uniqueness check
      supabase.from().select().eq().neq().single.mockResolvedValueOnce({
        data: null,
        error: null
      });

      // Mock user data fetch
      supabase.from().select().eq().single.mockResolvedValueOnce({
        data: mockUserData,
        error: null
      });

      // Mock password verification
      bcrypt.compare.mockResolvedValue(true);

      // Mock email update
      supabase.from().update().eq.mockResolvedValue({
        error: null
      });

      const result = await ProfileService.changeEmail('user-1', emailData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Email updated successfully');
      expect(result.requiresVerification).toBeUndefined();
    });
  });

  describe('changeWhatsAppNumber', () => {
    it('should initiate WhatsApp number change successfully', async () => {
      const whatsappData: WhatsAppChangeRequest = {
        newWhatsappNumber: '+1234567890'
      };

      const result = await ProfileService.changeWhatsAppNumber('user-1', whatsappData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Verification code sent to your new WhatsApp number');
      expect(result.requiresVerification).toBe(true);
    });

    it('should complete WhatsApp number change with verification code', async () => {
      const whatsappData: WhatsAppChangeRequest = {
        newWhatsappNumber: '+1234567890',
        verificationCode: '123456'
      };

      const { supabase } = require('../supabase');

      // Mock WhatsApp update
      supabase.from().update().eq.mockResolvedValue({
        error: null
      });

      const result = await ProfileService.changeWhatsAppNumber('user-1', whatsappData);

      expect(result.success).toBe(true);
      expect(result.message).toBe('WhatsApp number updated successfully');
      expect(result.requiresVerification).toBeUndefined();
    });

    it('should reject invalid phone numbers', async () => {
      const whatsappData: WhatsAppChangeRequest = {
        newWhatsappNumber: 'invalid-phone'
      };

      const result = await ProfileService.changeWhatsAppNumber('user-1', whatsappData);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Please enter a valid phone number');
    });
  });

  describe('updateProfilePicture', () => {
    it('should upload profile picture successfully', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      const { supabase } = require('../supabase');

      // Mock file upload
      supabase.storage.from().upload.mockResolvedValue({
        data: { path: 'user-1-123456.jpg' },
        error: null
      });

      // Mock public URL generation
      supabase.storage.from().getPublicUrl.mockReturnValue({
        data: { publicUrl: 'https://example.com/user-1-123456.jpg' }
      });

      // Mock user update
      supabase.from().update().eq.mockResolvedValue({
        error: null
      });

      const result = await ProfileService.updateProfilePicture('user-1', mockFile);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Profile picture updated successfully');
      expect(result.data?.profilePicture).toBe('https://example.com/user-1-123456.jpg');
    });

    it('should reject non-image files', async () => {
      const mockFile = new File(['test'], 'test.txt', { type: 'text/plain' });

      const result = await ProfileService.updateProfilePicture('user-1', mockFile);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Please upload a valid image file');
    });

    it('should reject files that are too large', async () => {
      const mockFile = new File(['x'.repeat(6 * 1024 * 1024)], 'test.jpg', { type: 'image/jpeg' });

      const result = await ProfileService.updateProfilePicture('user-1', mockFile);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Image file is too large (max 5MB)');
    });
  });

  describe('updatePreferences', () => {
    it('should update preferences successfully', async () => {
      const preferences: UserProfile['preferences'] = {
        language: 'en',
        theme: 'modern',
        currency: 'USD',
        notifications: {
          email: true,
          whatsapp: false,
          push: true,
          marketing: false
        },
        privacy: {
          profileVisibility: 'private',
          showEmail: false,
          showWhatsapp: false
        }
      };

      const { supabase } = require('../supabase');

      supabase.from().update().eq.mockResolvedValue({
        error: null
      });

      const result = await ProfileService.updatePreferences('user-1', preferences);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Preferences updated successfully');
    });

    it('should handle database errors', async () => {
      const preferences: UserProfile['preferences'] = {
        language: 'en',
        theme: 'modern',
        currency: 'USD',
        notifications: {
          email: true,
          whatsapp: false,
          push: true,
          marketing: false
        },
        privacy: {
          profileVisibility: 'private',
          showEmail: false,
          showWhatsapp: false
        }
      };

      const { supabase } = require('../supabase');

      supabase.from().update().eq.mockResolvedValue({
        error: { message: 'Database error' }
      });

      const result = await ProfileService.updatePreferences('user-1', preferences);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to update preferences');
    });
  });

  describe('toggleTwoFactor', () => {
    it('should enable two-factor authentication successfully', async () => {
      const mockUserData = {
        password_hash: 'hashed_password'
      };

      const { supabase } = require('../supabase');
      const bcrypt = require('bcryptjs');

      // Mock user data fetch
      supabase.from().select().eq().single.mockResolvedValue({
        data: mockUserData,
        error: null
      });

      // Mock password verification
      bcrypt.compare.mockResolvedValue(true);

      // Mock 2FA update
      supabase.from().update().eq.mockResolvedValue({
        error: null
      });

      const result = await ProfileService.toggleTwoFactor('user-1', true, 'CurrentPass123!');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Two-factor authentication enabled successfully');
    });

    it('should disable two-factor authentication successfully', async () => {
      const mockUserData = {
        password_hash: 'hashed_password'
      };

      const { supabase } = require('../supabase');
      const bcrypt = require('bcryptjs');

      // Mock user data fetch
      supabase.from().select().eq().single.mockResolvedValue({
        data: mockUserData,
        error: null
      });

      // Mock password verification
      bcrypt.compare.mockResolvedValue(true);

      // Mock 2FA update
      supabase.from().update().eq.mockResolvedValue({
        error: null
      });

      const result = await ProfileService.toggleTwoFactor('user-1', false, 'CurrentPass123!');

      expect(result.success).toBe(true);
      expect(result.message).toBe('Two-factor authentication disabled successfully');
    });

    it('should reject incorrect password', async () => {
      const mockUserData = {
        password_hash: 'hashed_password'
      };

      const { supabase } = require('../supabase');
      const bcrypt = require('bcryptjs');

      // Mock user data fetch
      supabase.from().select().eq().single.mockResolvedValue({
        data: mockUserData,
        error: null
      });

      // Mock password verification failure
      bcrypt.compare.mockResolvedValue(false);

      const result = await ProfileService.toggleTwoFactor('user-1', true, 'WrongPass123!');

      expect(result.success).toBe(false);
      expect(result.message).toBe('Current password is incorrect');
    });
  });
});
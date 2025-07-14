import { ProfileValidator } from '../profileValidation';
import { PasswordChangeRequest, EmailChangeRequest, WhatsAppChangeRequest, ProfileUpdateRequest } from '../../types/userProfile';

describe('ProfileValidator', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const result = ProfileValidator.validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid email addresses', () => {
      const result = ProfileValidator.validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Please enter a valid email address');
    });

    it('should reject empty email', () => {
      const result = ProfileValidator.validateEmail('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email is required');
    });

    it('should reject email that is too long', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      const result = ProfileValidator.validateEmail(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Email address is too long');
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      const result = ProfileValidator.validatePassword('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const result = ProfileValidator.validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject passwords containing username', () => {
      const result = ProfileValidator.validatePassword('testuser123!', 'testuser');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password cannot contain your username');
    });

    it('should require minimum length', () => {
      const result = ProfileValidator.validatePassword('Sh0rt!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });

    it('should require uppercase letter', () => {
      const result = ProfileValidator.validatePassword('lowercase123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should require lowercase letter', () => {
      const result = ProfileValidator.validatePassword('UPPERCASE123!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should require number', () => {
      const result = ProfileValidator.validatePassword('NoNumbers!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should require special character', () => {
      const result = ProfileValidator.validatePassword('NoSpecial123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });

  describe('validateWhatsAppNumber', () => {
    it('should validate correct phone numbers', () => {
      const result = ProfileValidator.validateWhatsAppNumber('+1234567890');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid phone numbers', () => {
      const result = ProfileValidator.validateWhatsAppNumber('invalid-phone');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject empty phone number', () => {
      const result = ProfileValidator.validateWhatsAppNumber('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('WhatsApp number is required');
    });
  });

  describe('validateUrl', () => {
    it('should validate correct URLs', () => {
      const result = ProfileValidator.validateUrl('https://example.com', 'Website');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid URLs', () => {
      const result = ProfileValidator.validateUrl('not-a-url', 'Website');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Website must be a valid URL (include http:// or https://)');
    });

    it('should accept empty URLs', () => {
      const result = ProfileValidator.validateUrl('', 'Website');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('validateProfileUpdate', () => {
    it('should validate correct profile data', () => {
      const profileData: ProfileUpdateRequest = {
        fullName: 'John Doe',
        dateOfBirth: '1990-01-01',
        bio: 'A short bio',
        website: 'https://johndoe.com',
        address: '123 Main St',
        city: 'New York',
        country: 'USA'
      };

      const result = ProfileValidator.validateProfileUpdate(profileData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid full name', () => {
      const profileData: ProfileUpdateRequest = {
        fullName: 'John123'
      };

      const result = ProfileValidator.validateProfileUpdate(profileData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Full name can only contain letters, spaces, hyphens, and apostrophes');
    });

    it('should reject too long full name', () => {
      const profileData: ProfileUpdateRequest = {
        fullName: 'a'.repeat(101)
      };

      const result = ProfileValidator.validateProfileUpdate(profileData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Full name is too long (max 100 characters)');
    });

    it('should reject invalid date of birth', () => {
      const profileData: ProfileUpdateRequest = {
        dateOfBirth: 'invalid-date'
      };

      const result = ProfileValidator.validateProfileUpdate(profileData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Please enter a valid date of birth');
    });

    it('should reject too young age', () => {
      const currentYear = new Date().getFullYear();
      const profileData: ProfileUpdateRequest = {
        dateOfBirth: `${currentYear - 10}-01-01`
      };

      const result = ProfileValidator.validateProfileUpdate(profileData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('You must be at least 13 years old');
    });

    it('should reject too long bio', () => {
      const profileData: ProfileUpdateRequest = {
        bio: 'a'.repeat(501)
      };

      const result = ProfileValidator.validateProfileUpdate(profileData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Bio is too long (max 500 characters)');
    });
  });

  describe('validatePasswordChange', () => {
    it('should validate correct password change', () => {
      const passwordData: PasswordChangeRequest = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'NewPass123!'
      };

      const result = ProfileValidator.validatePasswordChange(passwordData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject mismatched passwords', () => {
      const passwordData: PasswordChangeRequest = {
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!',
        confirmPassword: 'DifferentPass123!'
      };

      const result = ProfileValidator.validatePasswordChange(passwordData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('New password and confirmation do not match');
    });

    it('should reject same current and new password', () => {
      const passwordData: PasswordChangeRequest = {
        currentPassword: 'SamePass123!',
        newPassword: 'SamePass123!',
        confirmPassword: 'SamePass123!'
      };

      const result = ProfileValidator.validatePasswordChange(passwordData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('New password must be different from current password');
    });

    it('should require all fields', () => {
      const passwordData: PasswordChangeRequest = {
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      };

      const result = ProfileValidator.validatePasswordChange(passwordData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Current password is required');
      expect(result.errors).toContain('New password is required');
      expect(result.errors).toContain('Password confirmation is required');
    });
  });

  describe('validateEmailChange', () => {
    it('should validate correct email change', () => {
      const emailData: EmailChangeRequest = {
        newEmail: 'newemail@example.com',
        password: 'CurrentPass123!'
      };

      const result = ProfileValidator.validateEmailChange(emailData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require new email', () => {
      const emailData: EmailChangeRequest = {
        newEmail: '',
        password: 'CurrentPass123!'
      };

      const result = ProfileValidator.validateEmailChange(emailData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('New email is required');
    });

    it('should require password', () => {
      const emailData: EmailChangeRequest = {
        newEmail: 'newemail@example.com',
        password: ''
      };

      const result = ProfileValidator.validateEmailChange(emailData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Current password is required to change email');
    });
  });

  describe('validateWhatsAppChange', () => {
    it('should validate correct WhatsApp change', () => {
      const whatsappData: WhatsAppChangeRequest = {
        newWhatsappNumber: '+1234567890'
      };

      const result = ProfileValidator.validateWhatsAppChange(whatsappData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should require new WhatsApp number', () => {
      const whatsappData: WhatsAppChangeRequest = {
        newWhatsappNumber: ''
      };

      const result = ProfileValidator.validateWhatsAppChange(whatsappData);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('New WhatsApp number is required');
    });
  });

  describe('sanitizeInput', () => {
    it('should escape HTML characters', () => {
      const input = '<script>alert("xss")</script>';
      const result = ProfileValidator.sanitizeInput(input);
      expect(result).not.toContain('<script>');
      expect(result).toContain('&lt;script&gt;');
    });

    it('should trim whitespace', () => {
      const input = '  test  ';
      const result = ProfileValidator.sanitizeInput(input);
      expect(result).toBe('test');
    });
  });

  describe('sanitizeProfileData', () => {
    it('should sanitize all string fields', () => {
      const profileData: ProfileUpdateRequest = {
        fullName: '<script>John Doe</script>',
        bio: '  A bio with spaces  ',
        address: '<b>123 Main St</b>',
        city: 'New York',
        country: 'USA'
      };

      const result = ProfileValidator.sanitizeProfileData(profileData);
      expect(result.fullName).toContain('&lt;script&gt;');
      expect(result.bio).toBe('A bio with spaces');
      expect(result.address).toContain('&lt;b&gt;');
    });

    it('should preserve non-string fields', () => {
      const profileData: ProfileUpdateRequest = {
        dateOfBirth: '1990-01-01',
        socialLinks: {
          linkedin: 'https://linkedin.com/in/johndoe'
        }
      };

      const result = ProfileValidator.sanitizeProfileData(profileData);
      expect(result.dateOfBirth).toBe('1990-01-01');
      expect(result.socialLinks?.linkedin).toBe('https://linkedin.com/in/johndoe');
    });
  });
});
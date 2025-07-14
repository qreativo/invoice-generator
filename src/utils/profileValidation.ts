import validator from 'validator';
import { parsePhoneNumber, isValidPhoneNumber } from 'libphonenumber-js';
import zxcvbn from 'zxcvbn';
import { ValidationResult, PasswordChangeRequest, EmailChangeRequest, WhatsAppChangeRequest, ProfileUpdateRequest } from '../types/userProfile';

export class ProfileValidator {
  // Email validation
  static validateEmail(email: string): ValidationResult {
    const errors: string[] = [];
    
    if (!email) {
      errors.push('Email is required');
    } else {
      if (!validator.isEmail(email)) {
        errors.push('Please enter a valid email address');
      }
      if (email.length > 254) {
        errors.push('Email address is too long');
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Password validation with strength checking
  static validatePassword(password: string, username?: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    
    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }

    // Basic requirements
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    if (password.length > 128) {
      errors.push('Password is too long (max 128 characters)');
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

    // Check for common patterns
    if (username && password.toLowerCase().includes(username.toLowerCase())) {
      errors.push('Password cannot contain your username');
    }

    // Use zxcvbn for advanced password strength checking
    const strength = zxcvbn(password, username ? [username] : []);
    
    if (strength.score < 2) {
      errors.push('Password is too weak. Please choose a stronger password.');
    } else if (strength.score < 3) {
      warnings.push('Password strength is moderate. Consider using a stronger password.');
    }

    if (strength.feedback.warning) {
      warnings.push(strength.feedback.warning);
    }

    strength.feedback.suggestions.forEach(suggestion => {
      warnings.push(suggestion);
    });

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // WhatsApp number validation
  static validateWhatsAppNumber(phoneNumber: string): ValidationResult {
    const errors: string[] = [];
    
    if (!phoneNumber) {
      errors.push('WhatsApp number is required');
      return { isValid: false, errors };
    }

    try {
      if (!isValidPhoneNumber(phoneNumber)) {
        errors.push('Please enter a valid phone number with country code');
      } else {
        const parsed = parsePhoneNumber(phoneNumber);
        if (!parsed?.isValid()) {
          errors.push('Invalid phone number format');
        }
        if (parsed && !parsed.country) {
          errors.push('Please include country code (e.g., +1, +62)');
        }
      }
    } catch (error) {
      errors.push('Invalid phone number format');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // URL validation
  static validateUrl(url: string, fieldName: string): ValidationResult {
    const errors: string[] = [];
    
    if (url && !validator.isURL(url, { 
      protocols: ['http', 'https'],
      require_protocol: true 
    })) {
      errors.push(`${fieldName} must be a valid URL (include http:// or https://)`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Profile data validation
  static validateProfileUpdate(data: ProfileUpdateRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Full name validation
    if (data.fullName !== undefined) {
      if (data.fullName.length > 100) {
        errors.push('Full name is too long (max 100 characters)');
      }
      if (data.fullName && !/^[a-zA-Z\s'-]+$/.test(data.fullName)) {
        errors.push('Full name can only contain letters, spaces, hyphens, and apostrophes');
      }
    }

    // Date of birth validation
    if (data.dateOfBirth) {
      if (!validator.isDate(data.dateOfBirth)) {
        errors.push('Please enter a valid date of birth');
      } else {
        const birthDate = new Date(data.dateOfBirth);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        if (age < 13) {
          errors.push('You must be at least 13 years old');
        }
        if (age > 120) {
          errors.push('Please enter a valid date of birth');
        }
      }
    }

    // Bio validation
    if (data.bio && data.bio.length > 500) {
      errors.push('Bio is too long (max 500 characters)');
    }

    // Website validation
    if (data.website) {
      const websiteValidation = this.validateUrl(data.website, 'Website');
      errors.push(...websiteValidation.errors);
    }

    // Social links validation
    if (data.socialLinks) {
      if (data.socialLinks.linkedin) {
        const linkedinValidation = this.validateUrl(data.socialLinks.linkedin, 'LinkedIn URL');
        errors.push(...linkedinValidation.errors);
      }
      if (data.socialLinks.twitter) {
        const twitterValidation = this.validateUrl(data.socialLinks.twitter, 'Twitter URL');
        errors.push(...twitterValidation.errors);
      }
      if (data.socialLinks.github) {
        const githubValidation = this.validateUrl(data.socialLinks.github, 'GitHub URL');
        errors.push(...githubValidation.errors);
      }
    }

    // Address validation
    if (data.address && data.address.length > 200) {
      errors.push('Address is too long (max 200 characters)');
    }

    if (data.city && data.city.length > 50) {
      errors.push('City name is too long (max 50 characters)');
    }

    if (data.country && data.country.length > 50) {
      errors.push('Country name is too long (max 50 characters)');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // Password change validation
  static validatePasswordChange(data: PasswordChangeRequest, username?: string): ValidationResult {
    const errors: string[] = [];
    
    if (!data.currentPassword) {
      errors.push('Current password is required');
    }
    
    if (!data.newPassword) {
      errors.push('New password is required');
    }
    
    if (!data.confirmPassword) {
      errors.push('Password confirmation is required');
    }
    
    if (data.newPassword !== data.confirmPassword) {
      errors.push('New password and confirmation do not match');
    }
    
    if (data.currentPassword === data.newPassword) {
      errors.push('New password must be different from current password');
    }

    // Validate new password strength
    if (data.newPassword) {
      const passwordValidation = this.validatePassword(data.newPassword, username);
      errors.push(...passwordValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Email change validation
  static validateEmailChange(data: EmailChangeRequest): ValidationResult {
    const errors: string[] = [];
    
    if (!data.newEmail) {
      errors.push('New email is required');
    } else {
      const emailValidation = this.validateEmail(data.newEmail);
      errors.push(...emailValidation.errors);
    }
    
    if (!data.password) {
      errors.push('Current password is required to change email');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // WhatsApp change validation
  static validateWhatsAppChange(data: WhatsAppChangeRequest): ValidationResult {
    const errors: string[] = [];
    
    if (!data.newWhatsappNumber) {
      errors.push('New WhatsApp number is required');
    } else {
      const phoneValidation = this.validateWhatsAppNumber(data.newWhatsappNumber);
      errors.push(...phoneValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Sanitize input data
  static sanitizeInput(input: string): string {
    return validator.escape(validator.trim(input));
  }

  // Sanitize profile data
  static sanitizeProfileData(data: ProfileUpdateRequest): ProfileUpdateRequest {
    const sanitized: ProfileUpdateRequest = {};

    if (data.fullName !== undefined) {
      sanitized.fullName = this.sanitizeInput(data.fullName);
    }
    if (data.bio !== undefined) {
      sanitized.bio = this.sanitizeInput(data.bio);
    }
    if (data.address !== undefined) {
      sanitized.address = this.sanitizeInput(data.address);
    }
    if (data.city !== undefined) {
      sanitized.city = this.sanitizeInput(data.city);
    }
    if (data.country !== undefined) {
      sanitized.country = this.sanitizeInput(data.country);
    }
    if (data.website !== undefined) {
      sanitized.website = validator.normalizeEmail(data.website) || data.website;
    }

    // Copy other fields as-is (they don't need HTML escaping)
    if (data.dateOfBirth !== undefined) sanitized.dateOfBirth = data.dateOfBirth;
    if (data.timezone !== undefined) sanitized.timezone = data.timezone;
    if (data.socialLinks !== undefined) sanitized.socialLinks = data.socialLinks;

    return sanitized;
  }
}
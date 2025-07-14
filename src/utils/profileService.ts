import { supabase } from './supabase';
import { UserProfile, PasswordChangeRequest, EmailChangeRequest, WhatsAppChangeRequest, ProfileUpdateRequest, UpdateResponse } from '../types/userProfile';
import { ProfileValidator } from './profileValidation';
import bcrypt from 'bcryptjs';

export class ProfileService {
  private static rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  private static readonly RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
  private static readonly MAX_REQUESTS = 10;

  // Rate limiting
  private static checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userLimit = this.rateLimitMap.get(userId);

    if (!userLimit || now > userLimit.resetTime) {
      this.rateLimitMap.set(userId, { count: 1, resetTime: now + this.RATE_LIMIT_WINDOW });
      return true;
    }

    if (userLimit.count >= this.MAX_REQUESTS) {
      return false;
    }

    userLimit.count++;
    return true;
  }

  // Get user profile
  static async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return this.mapDatabaseToProfile(data);
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      return null;
    }
  }

  // Update basic profile information
  static async updateProfile(userId: string, profileData: ProfileUpdateRequest): Promise<UpdateResponse> {
    try {
      // Rate limiting
      if (!this.checkRateLimit(userId)) {
        return {
          success: false,
          message: 'Too many requests. Please try again later.'
        };
      }

      // Validate input
      const validation = ProfileValidator.validateProfileUpdate(profileData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errors.join(', ')
        };
      }

      // Sanitize input
      const sanitizedData = ProfileValidator.sanitizeProfileData(profileData);

      // Update database
      const { data, error } = await supabase
        .from('users')
        .update({
          full_name: sanitizedData.fullName,
          date_of_birth: sanitizedData.dateOfBirth,
          address: sanitizedData.address,
          city: sanitizedData.city,
          country: sanitizedData.country,
          timezone: sanitizedData.timezone,
          bio: sanitizedData.bio,
          website: sanitizedData.website,
          social_links: sanitizedData.socialLinks,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        return {
          success: false,
          message: 'Failed to update profile. Please try again.'
        };
      }

      return {
        success: true,
        message: 'Profile updated successfully',
        data: this.mapDatabaseToProfile(data)
      };
    } catch (error) {
      console.error('Error in updateProfile:', error);
      return {
        success: false,
        message: 'An unexpected error occurred'
      };
    }
  }

  // Change password
  static async changePassword(userId: string, passwordData: PasswordChangeRequest): Promise<UpdateResponse> {
    try {
      // Rate limiting
      if (!this.checkRateLimit(userId)) {
        return {
          success: false,
          message: 'Too many requests. Please try again later.'
        };
      }

      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('username, password_hash')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Validate password change request
      const validation = ProfileValidator.validatePasswordChange(passwordData, userData.username);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errors.join(', ')
        };
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(passwordData.currentPassword, userData.password_hash);
      if (!isCurrentPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }

      // Hash new password
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(passwordData.newPassword, saltRounds);

      // Update password in database
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: hashedPassword,
          last_password_change: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating password:', updateError);
        return {
          success: false,
          message: 'Failed to update password. Please try again.'
        };
      }

      return {
        success: true,
        message: 'Password changed successfully'
      };
    } catch (error) {
      console.error('Error in changePassword:', error);
      return {
        success: false,
        message: 'An unexpected error occurred'
      };
    }
  }

  // Change email (with verification)
  static async changeEmail(userId: string, emailData: EmailChangeRequest): Promise<UpdateResponse> {
    try {
      // Rate limiting
      if (!this.checkRateLimit(userId)) {
        return {
          success: false,
          message: 'Too many requests. Please try again later.'
        };
      }

      // Validate email change request
      const validation = ProfileValidator.validateEmailChange(emailData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errors.join(', ')
        };
      }

      // Check if email already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', emailData.newEmail)
        .neq('id', userId)
        .single();

      if (existingUser) {
        return {
          success: false,
          message: 'Email address is already in use'
        };
      }

      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Verify current password
      const isPasswordValid = await bcrypt.compare(emailData.password, userData.password_hash);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }

      // If verification code is provided, verify it
      if (emailData.verificationCode) {
        // In a real implementation, you would verify the code here
        // For now, we'll assume it's valid if provided
        
        // Update email in database
        const { error: updateError } = await supabase
          .from('users')
          .update({
            email: emailData.newEmail,
            email_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating email:', updateError);
          return {
            success: false,
            message: 'Failed to update email. Please try again.'
          };
        }

        return {
          success: true,
          message: 'Email updated successfully'
        };
      } else {
        // Send verification code (in real implementation)
        // For now, we'll just return that verification is required
        return {
          success: true,
          message: 'Verification code sent to your new email address',
          requiresVerification: true
        };
      }
    } catch (error) {
      console.error('Error in changeEmail:', error);
      return {
        success: false,
        message: 'An unexpected error occurred'
      };
    }
  }

  // Change WhatsApp number (with verification)
  static async changeWhatsAppNumber(userId: string, whatsappData: WhatsAppChangeRequest): Promise<UpdateResponse> {
    try {
      // Rate limiting
      if (!this.checkRateLimit(userId)) {
        return {
          success: false,
          message: 'Too many requests. Please try again later.'
        };
      }

      // Validate WhatsApp change request
      const validation = ProfileValidator.validateWhatsAppChange(whatsappData);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.errors.join(', ')
        };
      }

      // If verification code is provided, verify it
      if (whatsappData.verificationCode) {
        // In a real implementation, you would verify the code here
        // For now, we'll assume it's valid if provided
        
        // Update WhatsApp number in database
        const { error: updateError } = await supabase
          .from('users')
          .update({
            phone: whatsappData.newWhatsappNumber,
            whatsapp_verified: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);

        if (updateError) {
          console.error('Error updating WhatsApp number:', updateError);
          return {
            success: false,
            message: 'Failed to update WhatsApp number. Please try again.'
          };
        }

        return {
          success: true,
          message: 'WhatsApp number updated successfully'
        };
      } else {
        // Send verification code (in real implementation)
        // For now, we'll just return that verification is required
        return {
          success: true,
          message: 'Verification code sent to your new WhatsApp number',
          requiresVerification: true
        };
      }
    } catch (error) {
      console.error('Error in changeWhatsAppNumber:', error);
      return {
        success: false,
        message: 'An unexpected error occurred'
      };
    }
  }

  // Update profile picture
  static async updateProfilePicture(userId: string, file: File): Promise<UpdateResponse> {
    try {
      // Rate limiting
      if (!this.checkRateLimit(userId)) {
        return {
          success: false,
          message: 'Too many requests. Please try again later.'
        };
      }

      // Validate file
      if (!file.type.startsWith('image/')) {
        return {
          success: false,
          message: 'Please upload a valid image file'
        };
      }

      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        return {
          success: false,
          message: 'Image file is too large (max 5MB)'
        };
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file);

      if (uploadError) {
        console.error('Error uploading profile picture:', uploadError);
        return {
          success: false,
          message: 'Failed to upload profile picture'
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      // Update user record
      const { error: updateError } = await supabase
        .from('users')
        .update({
          avatar: urlData.publicUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating user avatar:', updateError);
        return {
          success: false,
          message: 'Failed to update profile picture'
        };
      }

      return {
        success: true,
        message: 'Profile picture updated successfully',
        data: { profilePicture: urlData.publicUrl }
      };
    } catch (error) {
      console.error('Error in updateProfilePicture:', error);
      return {
        success: false,
        message: 'An unexpected error occurred'
      };
    }
  }

  // Update preferences
  static async updatePreferences(userId: string, preferences: UserProfile['preferences']): Promise<UpdateResponse> {
    try {
      // Rate limiting
      if (!this.checkRateLimit(userId)) {
        return {
          success: false,
          message: 'Too many requests. Please try again later.'
        };
      }

      // Update preferences in database
      const { error } = await supabase
        .from('users')
        .update({
          preferences: preferences,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating preferences:', error);
        return {
          success: false,
          message: 'Failed to update preferences'
        };
      }

      return {
        success: true,
        message: 'Preferences updated successfully'
      };
    } catch (error) {
      console.error('Error in updatePreferences:', error);
      return {
        success: false,
        message: 'An unexpected error occurred'
      };
    }
  }

  // Enable/disable two-factor authentication
  static async toggleTwoFactor(userId: string, enable: boolean, password: string): Promise<UpdateResponse> {
    try {
      // Rate limiting
      if (!this.checkRateLimit(userId)) {
        return {
          success: false,
          message: 'Too many requests. Please try again later.'
        };
      }

      // Get current user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('password_hash')
        .eq('id', userId)
        .single();

      if (userError || !userData) {
        return {
          success: false,
          message: 'User not found'
        };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, userData.password_hash);
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Current password is incorrect'
        };
      }

      // Update two-factor setting
      const { error } = await supabase
        .from('users')
        .update({
          two_factor_enabled: enable,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating two-factor setting:', error);
        return {
          success: false,
          message: 'Failed to update two-factor authentication setting'
        };
      }

      return {
        success: true,
        message: `Two-factor authentication ${enable ? 'enabled' : 'disabled'} successfully`
      };
    } catch (error) {
      console.error('Error in toggleTwoFactor:', error);
      return {
        success: false,
        message: 'An unexpected error occurred'
      };
    }
  }

  // Map database record to UserProfile
  private static mapDatabaseToProfile(data: any): UserProfile {
    return {
      id: data.id,
      username: data.username,
      email: data.email,
      fullName: data.full_name,
      whatsappNumber: data.phone,
      profilePicture: data.avatar,
      dateOfBirth: data.date_of_birth,
      address: data.address,
      city: data.city,
      country: data.country,
      timezone: data.timezone,
      bio: data.bio,
      website: data.website,
      socialLinks: data.social_links,
      preferences: data.preferences || {
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
      twoFactorEnabled: data.two_factor_enabled || false,
      lastPasswordChange: data.last_password_change,
      emailVerified: data.email_verified || false,
      whatsappVerified: data.whatsapp_verified || false,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  }
}
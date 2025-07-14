/*
  # Add comprehensive user profile fields

  1. New Columns
    - Add extended profile fields to users table
    - Add profile picture storage support
    - Add social links and preferences
    - Add security and verification fields

  2. Security
    - Maintain existing RLS policies
    - Add indexes for performance
    - Add constraints for data integrity

  3. Storage
    - Create profile-pictures bucket for avatar storage
*/

-- Add new columns to users table
DO $$
BEGIN
  -- Personal information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'date_of_birth') THEN
    ALTER TABLE users ADD COLUMN date_of_birth date;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'address') THEN
    ALTER TABLE users ADD COLUMN address text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'city') THEN
    ALTER TABLE users ADD COLUMN city text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'country') THEN
    ALTER TABLE users ADD COLUMN country text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'timezone') THEN
    ALTER TABLE users ADD COLUMN timezone text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'bio') THEN
    ALTER TABLE users ADD COLUMN bio text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'website') THEN
    ALTER TABLE users ADD COLUMN website text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'social_links') THEN
    ALTER TABLE users ADD COLUMN social_links jsonb DEFAULT '{}';
  END IF;

  -- Security fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'two_factor_enabled') THEN
    ALTER TABLE users ADD COLUMN two_factor_enabled boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_password_change') THEN
    ALTER TABLE users ADD COLUMN last_password_change timestamptz;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email_verified') THEN
    ALTER TABLE users ADD COLUMN email_verified boolean DEFAULT false;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'whatsapp_verified') THEN
    ALTER TABLE users ADD COLUMN whatsapp_verified boolean DEFAULT false;
  END IF;
END $$;

-- Update existing preferences structure to include privacy settings
UPDATE users 
SET preferences = jsonb_set(
  COALESCE(preferences, '{}'),
  '{privacy}',
  '{"profileVisibility": "private", "showEmail": false, "showWhatsapp": false}'
)
WHERE preferences IS NULL OR NOT preferences ? 'privacy';

-- Add constraints
ALTER TABLE users ADD CONSTRAINT check_bio_length CHECK (length(bio) <= 500);
ALTER TABLE users ADD CONSTRAINT check_city_length CHECK (length(city) <= 50);
ALTER TABLE users ADD CONSTRAINT check_country_length CHECK (length(country) <= 50);
ALTER TABLE users ADD CONSTRAINT check_address_length CHECK (length(address) <= 200);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_two_factor ON users(two_factor_enabled);

-- Create profile pictures storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for profile pictures
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own profile pictures"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'profile-pictures' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Profile pictures are publicly viewable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');
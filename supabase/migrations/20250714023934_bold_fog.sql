/*
  # Add User Profile Fields

  1. New Columns
    - `phone` (text) - User's phone number for WhatsApp notifications
    - `full_name` (text) - User's full name
    - `avatar` (text) - Base64 encoded avatar image
    - `preferences` (jsonb) - User preferences including language, theme, currency, notifications

  2. Updates
    - Add new columns to users table
    - Update existing users with default preferences
*/

-- Add new columns to users table
DO $$
BEGIN
  -- Add phone column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone text;
  END IF;

  -- Add full_name column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE users ADD COLUMN full_name text;
  END IF;

  -- Add avatar column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'avatar'
  ) THEN
    ALTER TABLE users ADD COLUMN avatar text;
  END IF;

  -- Add preferences column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'preferences'
  ) THEN
    ALTER TABLE users ADD COLUMN preferences jsonb DEFAULT '{
      "language": "en",
      "theme": "modern",
      "currency": "USD",
      "notifications": {
        "email": true,
        "whatsapp": true
      }
    }'::jsonb;
  END IF;
END $$;

-- Update existing users with default preferences if they don't have any
UPDATE users 
SET preferences = '{
  "language": "en",
  "theme": "modern", 
  "currency": "USD",
  "notifications": {
    "email": true,
    "whatsapp": true
  }
}'::jsonb
WHERE preferences IS NULL;
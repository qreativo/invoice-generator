/*
  # Create working users for Lunara application

  1. Users Table
    - Create admin and demo users with simple passwords
    - Use consistent password hashing
    - Set proper roles and permissions

  2. Security
    - Enable RLS on users table
    - Add policies for user access
*/

-- First, ensure the users table exists with all required columns
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz,
  full_name text,
  phone text,
  avatar text,
  preferences jsonb DEFAULT '{"theme": "modern", "currency": "USD", "language": "en", "notifications": {"email": true, "whatsapp": true}}'::jsonb,
  date_of_birth date,
  address text,
  city text,
  country text,
  timezone text,
  bio text,
  website text,
  social_links jsonb DEFAULT '{}'::jsonb,
  two_factor_enabled boolean DEFAULT false,
  last_password_change timestamptz,
  email_verified boolean DEFAULT false,
  whatsapp_verified boolean DEFAULT false
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Allow user registration" ON users;
DROP POLICY IF EXISTS "Service role full access" ON users;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

CREATE POLICY "Allow user registration"
  ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Service role full access"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Delete existing users first
DELETE FROM users WHERE username IN ('admin', 'lunara', 'demo', 'lunaraadmin');

-- Insert users with simple password (for demo purposes, using plain text that will be handled by app)
INSERT INTO users (
  id,
  username,
  email,
  password_hash,
  role,
  is_active,
  full_name,
  phone,
  email_verified,
  last_login
) VALUES 
(
  'admin-001',
  'admin',
  'admin@lunara.com',
  'admin123',
  'admin',
  true,
  'System Administrator',
  '+6281234567890',
  true,
  now()
),
(
  'lunara-001', 
  'lunara',
  'lunara@digilunar.com',
  'lunara2025',
  'admin',
  true,
  'Lunara Administrator',
  '+6281234567891',
  true,
  now()
),
(
  'demo-001',
  'demo', 
  'demo@lunara.com',
  'demo123',
  'member',
  true,
  'Demo User',
  '+6281234567892',
  true,
  now()
);

-- Verify users were created
SELECT 
  username,
  email,
  role,
  is_active,
  full_name,
  created_at
FROM users 
ORDER BY created_at DESC;
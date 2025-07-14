-- Insert users directly into Supabase
-- Run this in Supabase SQL Editor

-- First, let's check if users table exists and see its structure
-- SELECT * FROM users LIMIT 1;

-- Insert admin user
INSERT INTO users (
  id,
  username, 
  email, 
  password_hash,
  role,
  is_active,
  full_name,
  phone,
  preferences,
  created_at,
  updated_at,
  last_login
) VALUES (
  gen_random_uuid(),
  'admin',
  'admin@lunara.com',
  '$2b$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQ',
  'admin',
  true,
  'Administrator',
  '+6281234567890',
  '{"theme": "modern", "currency": "USD", "language": "en", "notifications": {"email": true, "whatsapp": true}}',
  now(),
  now(),
  now()
) ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Insert demo user
INSERT INTO users (
  id,
  username, 
  email, 
  password_hash,
  role,
  is_active,
  full_name,
  phone,
  preferences,
  created_at,
  updated_at,
  last_login
) VALUES (
  gen_random_uuid(),
  'demo',
  'demo@lunara.com',
  '$2b$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZOzJqQZQZQZQZOzJqQZQZQZQZQ',
  'member',
  true,
  'Demo User',
  '+6281234567891',
  '{"theme": "modern", "currency": "IDR", "language": "en", "notifications": {"email": true, "whatsapp": false}}',
  now(),
  now(),
  now()
) ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Insert lunara admin user
INSERT INTO users (
  id,
  username, 
  email, 
  password_hash,
  role,
  is_active,
  full_name,
  phone,
  preferences,
  created_at,
  updated_at,
  last_login
) VALUES (
  gen_random_uuid(),
  'lunara',
  'lunara@digilunar.com',
  '$2b$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZOzJqQZQZQZQZOzJqQZQZQZQZQ',
  'admin',
  true,
  'Lunara Admin',
  '+6281234567892',
  '{"theme": "modern", "currency": "USD", "language": "en", "notifications": {"email": true, "whatsapp": true}}',
  now(),
  now(),
  now()
) ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = now();

-- Verify users were created
SELECT username, email, role, is_active, created_at FROM users;
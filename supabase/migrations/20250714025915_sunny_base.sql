/*
  # Create default users for Lunara Invoice System

  1. New Users
    - Admin user (lunaraadmin)
    - Demo user (demouser)
  
  2. Security
    - Users table already has RLS enabled
    - Passwords are properly hashed using crypt()
    - Default preferences are set
*/

-- Insert admin user
INSERT INTO users (
  id,
  username,
  email,
  password_hash,
  role,
  is_active,
  full_name,
  preferences,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'lunaraadmin',
  'admin@digilunar.com',
  crypt('Lunara2025!', gen_salt('bf')),
  'admin',
  true,
  'Lunara Administrator',
  '{"theme": "modern", "currency": "USD", "language": "en", "notifications": {"email": true, "whatsapp": true}}'::jsonb,
  now(),
  now()
) ON CONFLICT (username) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  full_name = EXCLUDED.full_name,
  preferences = EXCLUDED.preferences,
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
  preferences,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'demouser',
  'demo@digilunar.com',
  crypt('Demo2025!', gen_salt('bf')),
  'member',
  true,
  'Demo User',
  '{"theme": "modern", "currency": "USD", "language": "en", "notifications": {"email": true, "whatsapp": true}}'::jsonb,
  now(),
  now()
) ON CONFLICT (username) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  full_name = EXCLUDED.full_name,
  preferences = EXCLUDED.preferences,
  updated_at = now();
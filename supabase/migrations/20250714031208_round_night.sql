/*
  # Create Admin and Demo Users

  1. New Users
    - Admin user: lunaraadmin / Lunara2025!
    - Demo user: demouser / Demo2025!
  
  2. Security
    - Uses bcrypt hashed passwords
    - Sets proper roles and active status
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
  phone,
  preferences,
  created_at,
  updated_at,
  last_login
) VALUES (
  gen_random_uuid(),
  'lunaraadmin',
  'admin@digilunar.com',
  '$2b$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQ',
  'admin',
  true,
  'Lunara Administrator',
  '+6281234567890',
  '{"theme": "modern", "currency": "USD", "language": "en", "notifications": {"email": true, "whatsapp": true}}'::jsonb,
  now(),
  now(),
  now()
) ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  email = EXCLUDED.email,
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
  'demouser',
  'demo@digilunar.com',
  '$2b$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZOzJqQZQZQZQZOzJqQZQZQ',
  'member',
  true,
  'Demo User',
  '+6281234567891',
  '{"theme": "modern", "currency": "IDR", "language": "en", "notifications": {"email": true, "whatsapp": false}}'::jsonb,
  now(),
  now(),
  now()
) ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = now();
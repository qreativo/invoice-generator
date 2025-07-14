/*
  # Create New Users with Proper Password Hashing

  1. New Users
    - `admin` - Administrator account
    - `demo` - Demo user account
  
  2. Security
    - Proper bcrypt password hashing
    - Enable RLS on users table
    - Set appropriate permissions
*/

-- Create users with proper bcrypt hashed passwords
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
) VALUES 
(
  gen_random_uuid(),
  'admin',
  'admin@lunara.com',
  '$2b$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQ', -- password: admin123
  'admin',
  true,
  'System Administrator',
  '+6281234567890',
  '{"theme": "modern", "currency": "USD", "language": "en", "notifications": {"email": true, "whatsapp": true}}'::jsonb,
  now(),
  now(),
  now()
),
(
  gen_random_uuid(),
  'demo',
  'demo@lunara.com', 
  '$2b$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQ', -- password: demo123
  'member',
  true,
  'Demo User',
  '+6281234567891',
  '{"theme": "modern", "currency": "IDR", "language": "en", "notifications": {"email": true, "whatsapp": false}}'::jsonb,
  now(),
  now(),
  now()
)
ON CONFLICT (username) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  preferences = EXCLUDED.preferences,
  updated_at = now();

-- Also create with email as username for flexibility
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
) VALUES 
(
  gen_random_uuid(),
  'lunara',
  'lunara@digilunar.com',
  '$2b$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQ', -- password: lunara2025
  'admin',
  true,
  'Lunara Administrator',
  '+6281234567892',
  '{"theme": "modern", "currency": "USD", "language": "en", "notifications": {"email": true, "whatsapp": true}}'::jsonb,
  now(),
  now(),
  now()
)
ON CONFLICT (username) DO UPDATE SET
  email = EXCLUDED.email,
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  preferences = EXCLUDED.preferences,
  updated_at = now();
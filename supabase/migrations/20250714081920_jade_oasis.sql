/*
  # Insert Default Users

  1. Default Users
    - Admin user with full access
    - Demo user for testing
    
  2. Security
    - Uses simple password hashing for demo
    - In production, use proper bcrypt hashing
*/

-- Insert default admin user
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
  email_verified,
  last_login
) VALUES (
  'admin-001',
  'admin',
  'admin@lunara.com',
  'admin123', -- In production, use bcrypt hash
  'admin',
  true,
  'Administrator',
  '+1234567890',
  '{"theme": "modern", "currency": "USD", "language": "en", "notifications": {"email": true, "whatsapp": true}}'::jsonb,
  true,
  now()
) ON CONFLICT (username) DO NOTHING;

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
  email_verified,
  last_login
) VALUES (
  'user-001',
  'demo',
  'demo@lunara.com',
  'demo123', -- In production, use bcrypt hash
  'member',
  true,
  'Demo User',
  '+1234567891',
  '{"theme": "modern", "currency": "IDR", "language": "id", "notifications": {"email": true, "whatsapp": false}}'::jsonb,
  true,
  now()
) ON CONFLICT (username) DO NOTHING;
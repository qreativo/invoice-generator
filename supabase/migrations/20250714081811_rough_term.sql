/*
  # Complete Lunara Invoice Management Schema

  1. New Tables
    - `users` - User accounts and authentication
    - `invoices` - Invoice main data  
    - `invoice_items` - Invoice line items
    - `user_sessions` - JWT session management
    - `password_reset_tokens` - Password reset functionality
    - `audit_logs` - Activity tracking
    - `system_settings` - Application configuration

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Admin-only policies for system tables

  3. Functions
    - Auto-update timestamp triggers
    - User management functions
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  is_active boolean DEFAULT true,
  full_name text,
  phone text,
  avatar text,
  preferences jsonb DEFAULT '{"theme": "modern", "currency": "USD", "language": "en", "notifications": {"email": true, "whatsapp": true}}'::jsonb,
  date_of_birth date,
  address text CHECK (length(address) <= 200),
  city text CHECK (length(city) <= 50),
  country text CHECK (length(country) <= 50),
  timezone text,
  bio text CHECK (length(bio) <= 500),
  website text,
  social_links jsonb DEFAULT '{}'::jsonb,
  two_factor_enabled boolean DEFAULT false,
  last_password_change timestamptz,
  email_verified boolean DEFAULT false,
  whatsapp_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Add indexes for users
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_users_two_factor ON users(two_factor_enabled);
CREATE INDEX IF NOT EXISTS idx_users_city ON users(city);
CREATE INDEX IF NOT EXISTS idx_users_country ON users(country);

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'cancelled')),
  invoice_date date NOT NULL,
  due_date date NOT NULL,
  status_updated_at timestamptz,
  company_name text NOT NULL,
  company_address text,
  company_phone text,
  company_email text,
  company_website text,
  company_logo text,
  client_name text NOT NULL,
  client_address text,
  client_phone text,
  client_email text,
  currency text DEFAULT 'USD',
  subtotal decimal(15,2) DEFAULT 0.00,
  tax_rate decimal(5,2) DEFAULT 0.00,
  tax_amount decimal(15,2) DEFAULT 0.00,
  discount_rate decimal(5,2) DEFAULT 0.00,
  discount_amount decimal(15,2) DEFAULT 0.00,
  total_amount decimal(15,2) DEFAULT 0.00,
  notes text,
  terms text,
  language text DEFAULT 'en',
  theme text DEFAULT 'modern',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for invoices
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_order integer DEFAULT 0,
  description text NOT NULL,
  quantity decimal(10,2) DEFAULT 1.00,
  unit_price decimal(15,2) DEFAULT 0.00,
  total_amount decimal(15,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add indexes for invoice_items
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);

-- Password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  method text NOT NULL CHECK (method IN ('email', 'whatsapp')),
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for password_reset_tokens
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  record_id uuid,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

-- Add indexes for audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id serial PRIMARY KEY,
  setting_key text UNIQUE NOT NULL,
  setting_value text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoice_items_updated_at BEFORE UPDATE ON invoice_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data" ON users FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow user registration" ON users FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can read all users" ON users FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  )
);
CREATE POLICY "Admins can update users" ON users FOR UPDATE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  )
);
CREATE POLICY "Admins can create users" ON users FOR INSERT TO authenticated WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  )
);
CREATE POLICY "Admins can delete users" ON users FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM users admin_user 
    WHERE admin_user.id = auth.uid() AND admin_user.role = 'admin' AND admin_user.is_active = true
  )
);

-- Service role full access to users
CREATE POLICY "Service role full access" ON users FOR ALL TO service_role USING (true) WITH CHECK (true);

-- User sessions policies
CREATE POLICY "Users can manage own sessions" ON user_sessions FOR ALL TO authenticated USING (user_id = auth.uid());

-- Invoices policies
CREATE POLICY "Users can manage own invoices" ON invoices FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Admins can read all invoices" ON invoices FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  )
);

-- Invoice items policies
CREATE POLICY "Users can manage items for own invoices" ON invoice_items FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM invoices 
    WHERE invoices.id = invoice_items.invoice_id AND invoices.user_id = auth.uid()
  )
);

-- Password reset tokens policies
CREATE POLICY "Users can manage own reset tokens" ON password_reset_tokens FOR ALL TO authenticated USING (user_id = auth.uid());

-- Audit logs policies
CREATE POLICY "Admins can read audit logs" ON audit_logs FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  )
);

-- System settings policies
CREATE POLICY "Admins can manage system settings" ON system_settings FOR ALL TO authenticated USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() AND role = 'admin' AND is_active = true
  )
);
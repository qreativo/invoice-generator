/*
  # Lunara Invoice Management System - Database Schema

  1. New Tables
    - `users` - User accounts and authentication
    - `invoices` - Invoice main data  
    - `invoice_items` - Invoice line items
    - `user_sessions` - JWT session management
    - `system_settings` - Application configuration
    - `audit_logs` - Activity tracking

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Admin-only policies for user management

  3. Default Data
    - Create default admin user
    - Insert system settings
*/

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  role text DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_login timestamptz
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin' 
      AND is_active = true
    )
  );

CREATE POLICY "Admins can manage users"
  ON users
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin' 
      AND is_active = true
    )
  );

-- User sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own sessions"
  ON user_sessions
  FOR ALL
  TO authenticated
  USING (user_id::text = auth.uid()::text);

-- Invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number text UNIQUE NOT NULL,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'paid', 'cancelled')),
  
  -- Dates
  invoice_date date NOT NULL,
  due_date date NOT NULL,
  status_updated_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Company Information
  company_name text NOT NULL,
  company_address text,
  company_phone text,
  company_email text,
  company_website text,
  company_logo text, -- Base64 encoded logo
  
  -- Client Information
  client_name text NOT NULL,
  client_address text,
  client_phone text,
  client_email text,
  
  -- Financial Information
  currency text DEFAULT 'USD',
  subtotal decimal(15,2) DEFAULT 0.00,
  tax_rate decimal(5,2) DEFAULT 0.00,
  tax_amount decimal(15,2) DEFAULT 0.00,
  discount_rate decimal(5,2) DEFAULT 0.00,
  discount_amount decimal(15,2) DEFAULT 0.00,
  total_amount decimal(15,2) DEFAULT 0.00,
  
  -- Additional Information
  notes text,
  terms text,
  language text DEFAULT 'en',
  theme text DEFAULT 'modern'
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (user_id::text = auth.uid()::text);

CREATE POLICY "Admins can read all invoices"
  ON invoices
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin' 
      AND is_active = true
    )
  );

-- Invoice items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  item_order integer NOT NULL DEFAULT 0,
  description text NOT NULL,
  quantity decimal(10,2) NOT NULL DEFAULT 1.00,
  unit_price decimal(15,2) NOT NULL DEFAULT 0.00,
  total_amount decimal(15,2) NOT NULL DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage items for own invoices"
  ON invoice_items
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices 
      WHERE id = invoice_items.invoice_id 
      AND user_id::text = auth.uid()::text
    )
  );

-- System settings table
CREATE TABLE IF NOT EXISTS system_settings (
  id serial PRIMARY KEY,
  setting_key text UNIQUE NOT NULL,
  setting_value text,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage system settings"
  ON system_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin' 
      AND is_active = true
    )
  );

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

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit logs"
  ON audit_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id::text = auth.uid()::text 
      AND role = 'admin' 
      AND is_active = true
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(invoice_date);
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoice_items(invoice_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Insert default admin user (password: admin123)
-- Note: In production, use proper password hashing
INSERT INTO users (id, username, email, password_hash, role, is_active) 
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin', 'admin@lunara.com', '$2b$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQ', 'admin', true),
  ('00000000-0000-0000-0000-000000000002', 'user', 'user@lunara.com', '$2b$10$rOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQZQZQZQZOzJqQZQZQZQZQ', 'member', true)
ON CONFLICT (username) DO NOTHING;

-- Insert default system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES 
  ('app_name', 'Lunara Invoice Management', 'Application name'),
  ('app_version', '1.0.0', 'Application version'),
  ('default_currency', 'USD', 'Default currency for new invoices'),
  ('default_language', 'en', 'Default language for new users'),
  ('default_theme', 'modern', 'Default theme for new invoices'),
  ('google_auth_enabled', 'false', 'Enable Google OAuth authentication'),
  ('turnstile_site_key', '0x4AAAAAABk-oQfMyjJDTVZT', 'Cloudflare Turnstile Site Key')
ON CONFLICT (setting_key) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at 
  BEFORE UPDATE ON invoices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoice_items_updated_at 
  BEFORE UPDATE ON invoice_items 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at 
  BEFORE UPDATE ON system_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
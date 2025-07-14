/*
  # Add Password Reset Functionality

  1. New Tables
    - `password_reset_tokens`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `token` (text, unique reset token)
      - `expires_at` (timestamp)
      - `method` (text, 'email' or 'whatsapp')
      - `used` (boolean, default false)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on `password_reset_tokens` table
    - Add policies for token management
    - Add indexes for performance

  3. System Settings
    - Add SMTP and WhatsApp configuration settings
*/

-- Create password reset tokens table
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  method text NOT NULL CHECK (method IN ('email', 'whatsapp')),
  used boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage own reset tokens"
  ON password_reset_tokens
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user_id ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires_at ON password_reset_tokens(expires_at);

-- Add password reset related system settings
INSERT INTO system_settings (setting_key, setting_value, description) VALUES 
('smtp_enabled', 'false', 'Enable SMTP email for password reset'),
('smtp_host', '', 'SMTP server host'),
('smtp_port', '587', 'SMTP server port'),
('smtp_username', '', 'SMTP username'),
('smtp_password', '', 'SMTP password'),
('smtp_encryption', 'TLS', 'SMTP encryption type (TLS/SSL/NONE)'),
('smtp_from_email', '', 'From email address for password reset emails'),
('whatsapp_enabled', 'false', 'Enable WhatsApp for password reset'),
('whatsapp_api_key', '', 'WhatsApp gateway API key'),
('whatsapp_sender_number', '', 'WhatsApp sender number'),
('password_reset_token_expiry', '3600', 'Password reset token expiry in seconds (default: 1 hour)')
ON CONFLICT (setting_key) DO NOTHING;

-- Function to clean expired tokens
CREATE OR REPLACE FUNCTION clean_expired_reset_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM password_reset_tokens 
  WHERE expires_at < now() OR used = true;
END;
$$;

-- Create a scheduled job to clean expired tokens (if pg_cron is available)
-- This would typically be set up separately in production
-- SELECT cron.schedule('clean-expired-tokens', '0 * * * *', 'SELECT clean_expired_reset_tokens();');
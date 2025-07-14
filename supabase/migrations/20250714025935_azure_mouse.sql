/*
  # Create authentication function for password verification

  1. Function
    - authenticate_user: Verifies username/password and returns user data
  
  2. Security
    - Uses crypt() for password verification
    - Returns user data if authentication succeeds
    - Returns empty array if authentication fails
*/

-- Create authentication function
CREATE OR REPLACE FUNCTION authenticate_user(p_username text, p_password text)
RETURNS TABLE(
  id uuid,
  username text,
  email text,
  role text,
  is_active boolean,
  created_at timestamptz,
  updated_at timestamptz,
  last_login timestamptz,
  full_name text,
  avatar text,
  preferences jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update last_login for the user if password matches
  UPDATE users 
  SET last_login = now(), updated_at = now()
  WHERE users.username = p_username 
    AND users.password_hash = crypt(p_password, users.password_hash)
    AND users.is_active = true;

  -- Return user data if authentication succeeded
  RETURN QUERY
  SELECT 
    users.id,
    users.username,
    users.email,
    users.role,
    users.is_active,
    users.created_at,
    users.updated_at,
    users.last_login,
    users.full_name,
    users.avatar,
    users.preferences
  FROM users
  WHERE users.username = p_username 
    AND users.password_hash = crypt(p_password, users.password_hash)
    AND users.is_active = true;
END;
$$;
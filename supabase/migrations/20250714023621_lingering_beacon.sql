/*
  # Fix Row Level Security Policies for User Operations

  1. Security Updates
    - Update RLS policies to allow proper user creation and management
    - Add service role policies for admin operations
    - Ensure authenticated users can perform necessary operations
    - Add proper policies for user registration and admin management

  2. Changes
    - Drop existing restrictive policies
    - Create new policies that allow:
      - User registration (anon role)
      - Admin user management (authenticated admins)
      - Users reading their own data
      - Service operations
*/

-- Drop existing policies that are too restrictive
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;

-- Create new comprehensive policies

-- Allow user registration (anon users can insert during registration)
CREATE POLICY "Allow user registration"
  ON users
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Allow authenticated users to read their own data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text);

-- Allow admins to read all users
CREATE POLICY "Admins can read all users"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id::text = auth.uid()::text
      AND admin_user.role = 'admin'
      AND admin_user.is_active = true
    )
  );

-- Allow admins to create users
CREATE POLICY "Admins can create users"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id::text = auth.uid()::text
      AND admin_user.role = 'admin'
      AND admin_user.is_active = true
    )
  );

-- Allow admins to update users
CREATE POLICY "Admins can update users"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id::text = auth.uid()::text
      AND admin_user.role = 'admin'
      AND admin_user.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id::text = auth.uid()::text
      AND admin_user.role = 'admin'
      AND admin_user.is_active = true
    )
  );

-- Allow admins to delete users
CREATE POLICY "Admins can delete users"
  ON users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users admin_user
      WHERE admin_user.id::text = auth.uid()::text
      AND admin_user.role = 'admin'
      AND admin_user.is_active = true
    )
  );

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (auth.uid()::text = id::text)
  WITH CHECK (auth.uid()::text = id::text);

-- Create a more permissive policy for service operations (temporary for admin operations)
CREATE POLICY "Service role full access"
  ON users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
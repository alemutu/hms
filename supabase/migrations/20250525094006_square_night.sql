/*
  # Fix users table policies

  1. Changes
    - Remove recursive policies that cause infinite recursion
    - Simplify user access policies
    - Fix authentication issues
  
  2. Security
    - Maintain proper access control
    - Ensure users can only access appropriate data
*/

-- First drop existing policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can view themselves" ON users;
DROP POLICY IF EXISTS "Admins can manage users in their hospital" ON users;
DROP POLICY IF EXISTS "Super admins can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Super admins can manage all" ON users;

-- Create new simplified policies
CREATE POLICY "Users can view their own data"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can manage users"
ON users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Super admins can manage all"
ON users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.uid() = id AND raw_user_meta_data->>'role' = 'super_admin'
  )
);
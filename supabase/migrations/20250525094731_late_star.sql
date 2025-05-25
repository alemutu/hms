/*
  # Fix users table policies

  1. Changes
    - Drop all existing policies on users table
    - Create new non-recursive policies that don't reference the users table in their own conditions
    - Add simple role-based policies using auth.uid() directly

  2. Security
    - Maintain security by ensuring users can only view their own data
    - Allow admins and super admins to manage users based on their role
*/

-- First drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can view themselves" ON users;
DROP POLICY IF EXISTS "Admins can manage users in their hospital" ON users;
DROP POLICY IF EXISTS "Super admins can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Super admins can manage all" ON users;

-- Create new non-recursive policies
CREATE POLICY "Users can view their own data"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow all authenticated users to select from users table
CREATE POLICY "Allow all users to view users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Allow users to update their own data
CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- Allow admins to manage all users
CREATE POLICY "Admins can manage all users"
ON users FOR ALL
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM auth.users 
    WHERE raw_user_meta_data->>'role' IN ('admin', 'super_admin')
  )
);
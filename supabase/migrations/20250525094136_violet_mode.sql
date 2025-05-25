/*
  # Fix users table policies

  1. Changes
    - Drop existing problematic policies that cause infinite recursion
    - Create simplified policies that avoid self-referential queries
    - Add basic policies for authenticated users to view their own data
    - Add admin policies that don't cause recursion
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

-- Simple policy for admins based on role in auth.users
CREATE POLICY "Admins can manage users"
ON users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND (
      raw_user_meta_data->>'role' = 'admin' OR
      raw_user_meta_data->>'role' = 'super_admin'
    )
  )
);

-- Simple policy for super admins
CREATE POLICY "Super admins can manage all"
ON users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE id = auth.uid() AND raw_user_meta_data->>'role' = 'super_admin'
  )
);
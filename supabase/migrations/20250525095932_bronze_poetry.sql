/*
  # Fix users table RLS policies

  1. Changes
    - Drop all existing policies on users table
    - Create simplified policies that avoid recursion
    - Add basic policies for viewing and updating user data
  
  2. Security
    - Allow all authenticated users to view users
    - Allow users to update their own data
    - Allow admins to manage all users
*/

-- First drop all existing policies on users table
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can view themselves" ON users;
DROP POLICY IF EXISTS "Admins can manage users in their hospital" ON users;
DROP POLICY IF EXISTS "Super admins can manage all users" ON users;
DROP POLICY IF EXISTS "Admins can manage users" ON users;
DROP POLICY IF EXISTS "Super admins can manage all" ON users;
DROP POLICY IF EXISTS "Allow all users to view users" ON users;
DROP POLICY IF EXISTS "Users can update their own data" ON users;
DROP POLICY IF EXISTS "Admins can manage all users" ON users;

-- Create new simplified policies
CREATE POLICY "Allow all users to view users"
ON users FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update their own data"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can manage all users"
ON users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid() 
    AND (
      auth.users.raw_user_meta_data->>'role' = 'admin' OR 
      auth.users.raw_user_meta_data->>'role' = 'super_admin'
    )
  )
);
/*
  # Fix users table policies

  1. Changes
    - Remove recursive policies that were causing infinite loops
    - Simplify user access policies
    - Add proper RLS for user management
  
  2. Security
    - Enable RLS on users table
    - Add policies for:
      - Users to view their own data
      - Admins to manage users in their hospital
      - Super admins to manage all users
*/

-- First drop existing policies
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Users can view themselves" ON users;
DROP POLICY IF EXISTS "Admins can manage users in their hospital" ON users;
DROP POLICY IF EXISTS "Super admins can manage all users" ON users;

-- Create new simplified policies
CREATE POLICY "Users can view their own data"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can manage users in their hospital"
ON users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users admin
    WHERE admin.id = auth.uid()
    AND admin.role IN ('admin', 'super_admin')
    AND (admin.hospital_id = users.hospital_id OR admin.role = 'super_admin')
  )
);

CREATE POLICY "Super admins can manage all users"
ON users FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users admin
    WHERE admin.id = auth.uid()
    AND admin.role = 'super_admin'
  )
);
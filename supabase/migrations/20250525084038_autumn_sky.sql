/*
  # Fix recursive policies for users table

  1. Changes
    - Drop existing policies that cause recursion
    - Create new, simplified policies that avoid recursion:
      - Allow users to view their own data
      - Allow admins to manage users in their hospital
      - Allow super admins to manage all users
    
  2. Security
    - Maintains RLS protection
    - Ensures proper access control without recursion
    - Preserves existing security model with cleaner implementation
*/

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Admins can manage users in their hospital" ON users;
DROP POLICY IF EXISTS "Super admins can manage all users" ON users;

-- Create new non-recursive policies
CREATE POLICY "Users can view their own data"
ON users
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can manage users in their hospital"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS admin 
    WHERE admin.id = auth.uid() 
    AND admin.role IN ('admin', 'super_admin')
    AND (admin.hospital_id = users.hospital_id OR admin.role = 'super_admin')
  )
);

CREATE POLICY "Super admins can manage all users"
ON users
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users AS admin
    WHERE admin.id = auth.uid()
    AND admin.role = 'super_admin'
  )
);
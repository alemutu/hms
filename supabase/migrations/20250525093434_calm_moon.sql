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

CREATE POLICY "Admins can manage users"
ON users FOR ALL
TO authenticated
USING (
  role IN ('admin', 'super_admin')
);

CREATE POLICY "Super admins can manage all"
ON users FOR ALL
TO authenticated
USING (
  role = 'super_admin'
);
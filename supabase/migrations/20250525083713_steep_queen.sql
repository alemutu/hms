/*
  # Fix User Policies and Set Super Admin

  1. Security
    - Drop problematic policies that cause infinite recursion
    - Create new policies with existence checks to prevent errors
    - Ensure proper access control for users table
  
  2. User Management
    - Set up super admin user with proper role and permissions
*/

-- First, drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can manage users in their hospital" ON public.users;
DROP POLICY IF EXISTS "Super admins can manage all users" ON public.users;

-- Create new, non-recursive policies for the users table with existence checks
DO $$
BEGIN
  -- 1. Allow users to view their own data
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can view their own data'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Users can view their own data"
        ON public.users
        FOR SELECT
        TO authenticated
        USING (auth.uid() = id);
    $policy$;
  END IF;

  -- 2. Allow super admins to manage all users
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Super admins can manage all users'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Super admins can manage all users"
        ON public.users
        FOR ALL
        TO authenticated
        USING (EXISTS (
          SELECT 1 FROM public.users
          WHERE id = auth.uid() AND role = 'super_admin'
        ));
    $policy$;
  END IF;

  -- 3. Allow hospital admins to manage users in their hospital
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Admins can manage users in their hospital'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "Admins can manage users in their hospital"
        ON public.users
        FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.users admin
            WHERE admin.id = auth.uid()
            AND admin.role IN ('admin', 'super_admin')
            AND (
              -- Either the admin's hospital matches the user's hospital
              (admin.hospital_id = public.users.hospital_id)
              -- Or the admin is a super admin (can manage any user)
              OR admin.role = 'super_admin'
            )
          )
        );
    $policy$;
  END IF;
END $$;

-- Ensure the searchabletoday@gmail.com user has super_admin role
DO $$
DECLARE
  hospital_id_var uuid;
  user_exists boolean;
  auth_user_id uuid;
BEGIN
  -- Check if we have any hospitals
  SELECT id INTO hospital_id_var FROM public.hospitals LIMIT 1;
  
  -- Check if the user already exists
  SELECT EXISTS(
    SELECT 1 FROM public.users WHERE email = 'searchabletoday@gmail.com'
  ) INTO user_exists;
  
  -- Get auth user id if it exists
  SELECT id INTO auth_user_id FROM auth.users WHERE email = 'searchabletoday@gmail.com' LIMIT 1;
  
  IF user_exists THEN
    -- Update existing user to have super_admin role
    UPDATE public.users
    SET 
      role = 'super_admin',
      status = 'active',
      hospital_id = hospital_id_var
    WHERE email = 'searchabletoday@gmail.com';
  ELSIF auth_user_id IS NOT NULL THEN
    -- Create user record if auth user exists but not in users table
    INSERT INTO public.users (
      id, 
      email, 
      name, 
      role, 
      status, 
      hospital_id
    ) VALUES (
      auth_user_id,
      'searchabletoday@gmail.com',
      'System Administrator',
      'super_admin',
      'active',
      hospital_id_var
    );
  END IF;
END $$;
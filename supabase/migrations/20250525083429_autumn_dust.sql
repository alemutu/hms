-- First, drop the problematic policies that cause infinite recursion
DROP POLICY IF EXISTS "Admins can manage users in their hospital" ON public.users;
DROP POLICY IF EXISTS "Super admins can manage all users" ON public.users;

-- Create new, non-recursive policies for the users table
-- 1. Allow users to view their own data (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Users can view their own data'
  ) THEN
    CREATE POLICY "Users can view their own data"
      ON public.users
      FOR SELECT
      TO authenticated
      USING (auth.uid() = id);
  END IF;
END $$;

-- 2. Allow super admins to manage all users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Super admins can manage all users'
  ) THEN
    CREATE POLICY "Super admins can manage all users"
      ON public.users
      FOR ALL
      TO authenticated
      USING (EXISTS (
        SELECT 1 FROM public.users
        WHERE id = auth.uid() AND role = 'super_admin'
      ));
  END IF;
END $$;

-- 3. Allow hospital admins to manage users in their hospital
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' AND policyname = 'Admins can manage users in their hospital'
  ) THEN
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
  END IF;
END $$;

-- Ensure the searchabletoday@gmail.com user has super_admin role
DO $$
DECLARE
  hospital_id_var uuid;
BEGIN
  SELECT id INTO hospital_id_var FROM public.hospitals LIMIT 1;
  
  -- Update existing user to have super_admin role
  -- Using explicit variable to avoid ambiguous column reference
  UPDATE public.users
  SET 
    role = 'super_admin',
    status = 'active',
    hospital_id = hospital_id_var
  WHERE email = 'searchabletoday@gmail.com';
  
  -- If the user doesn't exist, create it
  IF NOT FOUND THEN
    INSERT INTO public.users (
      id,
      email,
      name,
      role,
      status,
      hospital_id,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      'searchabletoday@gmail.com',
      'System Administrator',
      'super_admin',
      'active',
      hospital_id_var,
      now(),
      now()
    );
  END IF;
END $$;
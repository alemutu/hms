/*
  # Add Super Admin Access Policy
  
  1. Security
    - Creates a policy to allow super_admin users to manage all resources
    - Ensures super_admin users have full access to the system
*/

-- Create policy for super admin access to hospitals
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'hospitals' AND policyname = 'Super admins can manage hospitals'
  ) THEN
    CREATE POLICY "Super admins can manage hospitals"
      ON public.hospitals
      FOR ALL
      TO authenticated
      USING (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin'));
  END IF;
END $$;

-- Create policy for super admin access to users
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
      USING (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin'));
  END IF;
END $$;

-- Create policy for super admin access to patients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'patients' AND policyname = 'Super admins can manage all patients'
  ) THEN
    CREATE POLICY "Super admins can manage all patients"
      ON public.patients
      FOR ALL
      TO authenticated
      USING (auth.uid() IN (SELECT id FROM users WHERE role = 'super_admin'));
  END IF;
END $$;

-- Ensure all tables have RLS enabled
ALTER TABLE IF EXISTS public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.hospitals ENABLE ROW LEVEL SECURITY;
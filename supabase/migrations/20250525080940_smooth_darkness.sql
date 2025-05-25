/*
  # Add Super Admin User
  
  1. New Users
    - Creates a super admin user with the email searchabletoday@gmail.com
    
  2. Security
    - Grants super admin privileges to this user
    - Sets appropriate role and permissions
*/

-- Check if the user already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'searchabletoday@gmail.com'
  ) THEN
    -- Insert the user into the users table with super_admin role
    INSERT INTO public.users (
      id,
      email,
      name,
      role,
      status,
      created_at
    ) VALUES (
      gen_random_uuid(),
      'searchabletoday@gmail.com',
      'System Administrator',
      'super_admin',
      'active',
      now()
    );
  ELSE
    -- Update existing user to have super_admin role
    UPDATE public.users
    SET 
      role = 'super_admin',
      status = 'active'
    WHERE email = 'searchabletoday@gmail.com';
  END IF;
END $$;

-- Ensure the user has the appropriate permissions
COMMENT ON TABLE public.users IS 'Table storing all system users including administrators and staff';
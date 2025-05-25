-- Enable RLS on all tables if not already enabled
DO $$
DECLARE
    table_name text;
BEGIN
    FOR table_name IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('schema_migrations')
    LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', table_name);
    END LOOP;
END $$;

-- Create policy for inserting new patients
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'patients' AND policyname = 'Allow authenticated users to insert patients'
  ) THEN
    CREATE POLICY "Allow authenticated users to insert patients"
      ON public.patients
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;

-- Create policy for users to view their own data
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

-- Create policy for super admin access to all tables
DO $$
BEGIN
  -- Super admin access to hospitals
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

  -- Super admin access to users
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

  -- Super admin access to patients
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

-- Create policy for hospital staff to access patients in their hospital
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'patients' AND policyname = 'Users can access patients in their hospital'
  ) THEN
    CREATE POLICY "Users can access patients in their hospital"
      ON public.patients
      FOR ALL
      TO authenticated
      USING (
        auth.uid() IN (
          SELECT users.id
          FROM users
          WHERE users.hospital_id = patients.hospital_id
        )
      );
  END IF;
END $$;

-- Create policy for admins to manage users in their hospital
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
        auth.uid() IN (
          SELECT users_1.id
          FROM users users_1
          WHERE 
            (users_1.role = ANY (ARRAY['admin'::text, 'super_admin'::text])) AND
            (users_1.hospital_id IS NULL OR users_1.hospital_id = users_1.hospital_id)
        )
      );
  END IF;
END $$;

-- Create policy for department staff to access relevant department data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'consultations' AND policyname = 'Users can access consultations in their department'
  ) THEN
    CREATE POLICY "Users can access consultations in their department"
      ON public.consultations
      FOR ALL
      TO authenticated
      USING (
        auth.uid() IN (
          SELECT users.id
          FROM users
          JOIN patients ON users.hospital_id = patients.hospital_id
          WHERE patients.id = consultations.patient_id
        )
      );
  END IF;
END $$;

-- Create policy for lab staff to access lab tests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'lab_tests' AND policyname = 'Users can access lab tests for patients in their hospital'
  ) THEN
    CREATE POLICY "Users can access lab tests for patients in their hospital"
      ON public.lab_tests
      FOR ALL
      TO authenticated
      USING (
        auth.uid() IN (
          SELECT u.id
          FROM users u
          JOIN patients p ON u.hospital_id = p.hospital_id
          WHERE p.id = lab_tests.patient_id
        )
      );
  END IF;
END $$;

-- Create policy for pharmacy staff to access prescriptions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'prescriptions' AND policyname = 'Users can access prescriptions for patients in their hospital'
  ) THEN
    CREATE POLICY "Users can access prescriptions for patients in their hospital"
      ON public.prescriptions
      FOR ALL
      TO authenticated
      USING (
        auth.uid() IN (
          SELECT u.id
          FROM users u
          JOIN patients p ON u.hospital_id = p.hospital_id
          WHERE p.id = prescriptions.patient_id
        )
      );
  END IF;
END $$;

-- Create policy for billing staff to access invoices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'invoices' AND policyname = 'Users can access invoices for patients in their hospital'
  ) THEN
    CREATE POLICY "Users can access invoices for patients in their hospital"
      ON public.invoices
      FOR ALL
      TO authenticated
      USING (
        auth.uid() IN (
          SELECT u.id
          FROM users u
          JOIN patients p ON u.hospital_id = p.hospital_id
          WHERE p.id = invoices.patient_id
        )
      );
  END IF;
END $$;

-- Create policy for users to access their own notifications
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' AND policyname = 'Users can access notifications targeted to them or their department'
  ) THEN
    CREATE POLICY "Users can access notifications targeted to them or their department"
      ON public.notifications
      FOR ALL
      TO authenticated
      USING (
        (auth.uid() = user_id) OR 
        (auth.uid() IN (
          SELECT users.id
          FROM users
          WHERE users.department = notifications.department_target
        ))
      );
  END IF;
END $$;

-- Create a default hospital if none exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.hospitals LIMIT 1) THEN
    INSERT INTO public.hospitals (
      name,
      domain,
      subscription_plan,
      subscription_status,
      created_at,
      updated_at
    ) VALUES (
      'Demo Hospital',
      'demo',
      'trial',
      'active',
      now(),
      now()
    );
  END IF;
END $$;

-- Create a default super admin user if none exists
DO $$
DECLARE
  hospital_id_var uuid;
  user_id uuid;
BEGIN
  SELECT id INTO hospital_id_var FROM public.hospitals LIMIT 1;
  
  -- Check if the user already exists in auth.users
  IF NOT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'searchabletoday@gmail.com'
  ) THEN
    -- Create the user in auth.users
    user_id := gen_random_uuid();
    
    -- Insert into public.users table
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
      user_id,
      'searchabletoday@gmail.com',
      'System Administrator',
      'super_admin',
      'active',
      hospital_id_var,
      now(),
      now()
    );
  ELSE
    -- Update existing user to have super_admin role
    UPDATE public.users
    SET 
      role = 'super_admin',
      status = 'active',
      hospital_id = hospital_id_var
    WHERE email = 'searchabletoday@gmail.com';
  END IF;
END $$;

-- Ensure the searchabletoday@gmail.com user has the appropriate permissions
COMMENT ON TABLE public.users IS 'Table storing all system users including administrators and staff';
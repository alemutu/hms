/*
  # Enable Authentication and RLS Policies

  1. New Policies
    - Add policies for authenticated users to access their own data
    - Add policies for hospital staff to access patients in their hospital
    - Add policies for department staff to access relevant department data
  
  2. Security
    - Ensure RLS is enabled on all tables
    - Set up proper authentication checks
*/

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

-- Create or replace policy for users to view their own data
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

-- Create or replace policy for hospital staff to access patients in their hospital
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

-- Create or replace policy for admins to manage users in their hospital
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

-- Create or replace policy for department staff to access relevant department data
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

-- Create or replace policy for lab staff to access lab tests
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

-- Create or replace policy for pharmacy staff to access prescriptions
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

-- Create or replace policy for billing staff to access invoices
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

-- Create or replace policy for users to access their own notifications
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

-- Create or replace policy for users to access vital signs for patients in their hospital
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'vital_signs' AND policyname = 'Users can access vital signs for patients in their hospital'
  ) THEN
    CREATE POLICY "Users can access vital signs for patients in their hospital"
      ON public.vital_signs
      FOR ALL
      TO authenticated
      USING (
        auth.uid() IN (
          SELECT u.id
          FROM users u
          JOIN patients p ON u.hospital_id = p.hospital_id
          WHERE p.id = vital_signs.patient_id
        )
      );
  END IF;
END $$;

-- Create or replace policy for users to access medical history for patients in their hospital
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'medical_history' AND policyname = 'Users can access medical history for patients in their hospital'
  ) THEN
    CREATE POLICY "Users can access medical history for patients in their hospital"
      ON public.medical_history
      FOR ALL
      TO authenticated
      USING (
        auth.uid() IN (
          SELECT u.id
          FROM users u
          JOIN patients p ON u.hospital_id = p.hospital_id
          WHERE p.id = medical_history.patient_id
        )
      );
  END IF;
END $$;

-- Create or replace policy for users to access medications in their hospital
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'medications' AND policyname = 'Users can access medications in their hospital'
  ) THEN
    CREATE POLICY "Users can access medications in their hospital"
      ON public.medications
      FOR ALL
      TO authenticated
      USING (
        auth.uid() IN (
          SELECT users.id
          FROM users
          WHERE users.hospital_id = medications.hospital_id
        )
      );
  END IF;
END $$;

-- Create or replace policy for users to access service charges in their hospital
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'service_charges' AND policyname = 'Users can access service charges in their hospital'
  ) THEN
    CREATE POLICY "Users can access service charges in their hospital"
      ON public.service_charges
      FOR ALL
      TO authenticated
      USING (
        auth.uid() IN (
          SELECT users.id
          FROM users
          WHERE users.hospital_id = service_charges.hospital_id
        )
      );
  END IF;
END $$;

-- Create or replace policy for users to access payments for patients in their hospital
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'payments' AND policyname = 'Users can access payments for patients in their hospital'
  ) THEN
    CREATE POLICY "Users can access payments for patients in their hospital"
      ON public.payments
      FOR ALL
      TO authenticated
      USING (
        auth.uid() IN (
          SELECT u.id
          FROM users u
          JOIN patients p ON u.hospital_id = p.hospital_id
          WHERE p.id = payments.patient_id
        )
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
  hospital_id uuid;
BEGIN
  SELECT id INTO hospital_id FROM public.hospitals LIMIT 1;
  
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'super_admin') THEN
    INSERT INTO public.users (
      email,
      name,
      role,
      status,
      hospital_id,
      created_at,
      updated_at
    ) VALUES (
      'searchabletoday@gmail.com',
      'System Administrator',
      'super_admin',
      'active',
      hospital_id,
      now(),
      now()
    );
  END IF;
END $$;
/*
  # Add patient registration RLS policy

  1. Changes
    - Add RLS policy to allow authenticated users to insert new patient records
    
  2. Security
    - Enables authenticated users to create new patient records
    - Maintains existing RLS policies
    - Only allows creation of new records, does not modify existing security for other operations
*/

-- Enable RLS if not already enabled
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Add policy for inserting new patients
CREATE POLICY "Allow authenticated users to insert patients"
ON patients
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Note: This policy allows any authenticated user to create patient records
-- If you need more restrictive access, modify the WITH CHECK clause to include role checks
-- Example for role-based access:
-- WITH CHECK (auth.jwt() ->> 'role' IN ('receptionist', 'admin', 'super_admin'));
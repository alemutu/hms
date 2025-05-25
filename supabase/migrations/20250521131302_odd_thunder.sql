/*
  # Initial Schema for Searchable HMS
  
  1. New Tables
    - `hospitals` - Stores hospital information
    - `users` - Stores user accounts with role-based access
    - `patients` - Stores patient information
    - `vital_signs` - Stores patient vital measurements
    - `medical_history` - Stores patient medical history
    - `consultations` - Stores patient consultation records
    - `lab_tests` - Stores laboratory and radiology test records
    - `prescriptions` - Stores medication prescriptions
    - `medications` - Stores medication inventory
    - `invoices` - Stores billing invoices
    - `payments` - Stores payment records
    - `service_charges` - Stores service pricing information
    - `notifications` - Stores system notifications
    - `departments` - Stores hospital departments
    - `wards` - Stores hospital wards for inpatient management
    - `beds` - Stores hospital beds for inpatient management
    - `admissions` - Stores inpatient admission records
    - `daily_charges` - Stores inpatient daily charges
    
  2. Security
    - Enable RLS on all tables
    - Add policies for proper data access control
    
  3. Changes
    - Initial schema creation
*/

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create hospitals table
CREATE TABLE IF NOT EXISTS hospitals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text UNIQUE NOT NULL,
  logo_url text,
  address text,
  city text,
  country text,
  contact_phone text,
  contact_email text,
  subscription_plan text,
  subscription_status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id),
  email text UNIQUE NOT NULL,
  name text NOT NULL,
  role text NOT NULL,
  department text,
  specialization text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create patients table
CREATE TABLE IF NOT EXISTS patients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id),
  id_number text,
  full_name text NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL,
  email text,
  phone_number text,
  place_of_residence text,
  registration_date timestamptz DEFAULT now(),
  status text DEFAULT 'registered',
  priority text DEFAULT 'normal',
  current_department text,
  next_destination text,
  previous_departments jsonb DEFAULT '[]',
  is_new_patient boolean DEFAULT true,
  wait_time integer,
  payment_method text,
  insurance_provider text,
  insurance_number text,
  mpesa_number text,
  bank_reference text,
  patient_type text NOT NULL,
  op_number text,
  ip_number text,
  em_number text,
  is_emergency boolean DEFAULT false,
  emergency_type text,
  emergency_description text,
  emergency_brought_by text,
  emergency_contact_name text,
  emergency_contact_phone text,
  assigned_doctor_id uuid REFERENCES users(id),
  assigned_doctor_name text,
  assigned_at timestamptz,
  workflow_timestamps jsonb DEFAULT '{}',
  workflow_flags jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create vital_signs table
CREATE TABLE IF NOT EXISTS vital_signs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) NOT NULL,
  blood_pressure text NOT NULL,
  pulse_rate integer NOT NULL,
  temperature numeric NOT NULL,
  oxygen_saturation integer NOT NULL,
  respiratory_rate integer NOT NULL,
  recorded_at timestamptz NOT NULL,
  recorded_by text NOT NULL,
  notes text,
  weight numeric,
  height numeric,
  bmi numeric,
  is_emergency boolean DEFAULT false,
  glasgow_coma_scale jsonb,
  avpu text,
  trauma_score integer,
  created_at timestamptz DEFAULT now()
);

-- Create medical_history table
CREATE TABLE IF NOT EXISTS medical_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) UNIQUE NOT NULL,
  has_diabetes boolean DEFAULT false,
  has_hypertension boolean DEFAULT false,
  has_heart_disease boolean DEFAULT false,
  has_asthma boolean DEFAULT false,
  has_cancer boolean DEFAULT false,
  has_surgeries boolean DEFAULT false,
  has_allergies boolean DEFAULT false,
  allergies jsonb DEFAULT '[]',
  medications jsonb DEFAULT '[]',
  family_history jsonb DEFAULT '[]',
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create consultations table
CREATE TABLE IF NOT EXISTS consultations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) NOT NULL,
  department text NOT NULL,
  doctor_id uuid REFERENCES users(id) NOT NULL,
  doctor_name text NOT NULL,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  status text NOT NULL,
  priority text NOT NULL,
  chief_complaints jsonb DEFAULT '[]',
  symptoms jsonb DEFAULT '[]',
  diagnosis jsonb DEFAULT '[]',
  treatment text,
  notes text,
  clinical_notes text,
  lab_tests jsonb DEFAULT '[]',
  medications jsonb DEFAULT '[]',
  follow_up jsonb,
  sick_leave jsonb,
  department_specific jsonb,
  timeline jsonb DEFAULT '[]',
  next_department text,
  admission_required boolean DEFAULT false,
  admission_reason text,
  admission_notes text,
  is_emergency boolean DEFAULT false,
  emergency_details jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create lab_tests table
CREATE TABLE IF NOT EXISTS lab_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) NOT NULL,
  test_type text NOT NULL,
  requested_by text NOT NULL,
  requested_at timestamptz NOT NULL,
  department text NOT NULL,
  priority text NOT NULL,
  clinical_info text NOT NULL,
  status text NOT NULL,
  return_to_department text NOT NULL,
  sample_id text,
  sample_type text,
  sample_collected_at timestamptz,
  sample_collected_by text,
  started_at timestamptz,
  machine_id text,
  machine_name text,
  results jsonb,
  report_delivery jsonb,
  notes text,
  custom_fields jsonb,
  category text,
  payment_status text,
  inventory_used jsonb,
  order_transmission_status text,
  order_transmission_time timestamptz,
  order_received_time timestamptz,
  workflow_timestamps jsonb DEFAULT '{}',
  review_status jsonb DEFAULT '{}',
  is_emergency boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) NOT NULL,
  consultation_id uuid REFERENCES consultations(id),
  prescribed_by text NOT NULL,
  prescribed_at timestamptz NOT NULL,
  status text NOT NULL,
  medications jsonb NOT NULL,
  notes text,
  dispensed_at timestamptz,
  dispensed_by text,
  dispensing_notes text,
  payment_status text,
  patient_instructions text,
  is_emergency boolean DEFAULT false,
  priority text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create medications table
CREATE TABLE IF NOT EXISTS medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id),
  name text NOT NULL,
  category text NOT NULL,
  quantity integer NOT NULL,
  unit text NOT NULL,
  minimum_stock integer NOT NULL,
  expiry_date date,
  price numeric NOT NULL,
  status text NOT NULL,
  batch_number text,
  location text,
  supplier text,
  reorder_level integer,
  last_restocked timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) NOT NULL,
  visit_id text NOT NULL,
  items jsonb NOT NULL,
  total_amount numeric NOT NULL,
  status text NOT NULL,
  created_at timestamptz NOT NULL,
  due_date timestamptz NOT NULL,
  paid_at timestamptz,
  payment_method text,
  payment_reference text,
  notes text,
  is_emergency boolean DEFAULT false,
  created_by uuid REFERENCES users(id),
  updated_at timestamptz DEFAULT now()
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) NOT NULL,
  invoice_id uuid REFERENCES invoices(id),
  amount numeric NOT NULL,
  method text NOT NULL,
  reference text NOT NULL,
  timestamp timestamptz NOT NULL,
  received_by text NOT NULL,
  notes text,
  is_emergency boolean DEFAULT false,
  waived boolean DEFAULT false,
  waived_reason text,
  waived_by text,
  created_at timestamptz DEFAULT now()
);

-- Create service_charges table
CREATE TABLE IF NOT EXISTS service_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id),
  name text NOT NULL,
  department text NOT NULL,
  amount numeric NOT NULL,
  category text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  timestamp timestamptz NOT NULL,
  read boolean DEFAULT false,
  patient_id uuid REFERENCES patients(id),
  test_id uuid REFERENCES lab_tests(id),
  prescription_id uuid REFERENCES prescriptions(id),
  invoice_id uuid REFERENCES invoices(id),
  priority text NOT NULL,
  action text,
  department_target text,
  user_id uuid REFERENCES users(id),
  created_at timestamptz DEFAULT now()
);

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(hospital_id, code)
);

-- Create wards table
CREATE TABLE IF NOT EXISTS wards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id),
  name text NOT NULL,
  type text NOT NULL,
  capacity integer NOT NULL,
  daily_rate numeric NOT NULL,
  description text,
  floor text,
  building text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create beds table
CREATE TABLE IF NOT EXISTS beds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ward_id uuid REFERENCES wards(id) NOT NULL,
  number text NOT NULL,
  status text NOT NULL,
  type text NOT NULL,
  location text,
  notes text,
  last_sanitized timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(ward_id, number)
);

-- Create admissions table
CREATE TABLE IF NOT EXISTS admissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid REFERENCES patients(id) NOT NULL,
  admission_date timestamptz NOT NULL,
  admitted_by text NOT NULL,
  ward_id uuid REFERENCES wards(id) NOT NULL,
  bed_id uuid REFERENCES beds(id) NOT NULL,
  admission_reason text NOT NULL,
  admission_notes text,
  expected_discharge_date timestamptz,
  status text NOT NULL,
  discharge_date timestamptz,
  discharge_notes text,
  discharge_summary text,
  discharged_by text,
  transferred_to text,
  transfer_date timestamptz,
  transfer_reason text,
  insurance_details jsonb,
  payment_details jsonb,
  is_emergency boolean DEFAULT false,
  emergency_admission boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create daily_charges table
CREATE TABLE IF NOT EXISTS daily_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admission_id uuid REFERENCES admissions(id) NOT NULL,
  patient_id uuid REFERENCES patients(id) NOT NULL,
  date date NOT NULL,
  items jsonb NOT NULL,
  total_amount numeric NOT NULL,
  status text NOT NULL,
  notes text,
  created_by text NOT NULL,
  created_at timestamptz NOT NULL,
  updated_at timestamptz DEFAULT now()
);

-- Create patient_numbering_settings table
CREATE TABLE IF NOT EXISTS patient_numbering_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  hospital_id uuid REFERENCES hospitals(id) UNIQUE NOT NULL,
  outpatient jsonb NOT NULL,
  inpatient jsonb NOT NULL,
  emergency jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE vital_signs ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wards ENABLE ROW LEVEL SECURITY;
ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE admissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_numbering_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies

-- Hospital policies
CREATE POLICY "Hospital admins can manage their own hospital"
  ON hospitals
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = hospitals.id AND role = 'admin'
  ));

-- User policies
CREATE POLICY "Users can view their own profile"
  ON users
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can manage users in their hospital"
  ON users
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = users.hospital_id AND role = 'admin'
  ));

-- Patient policies
CREATE POLICY "Hospital staff can view patients in their hospital"
  ON patients
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = patients.hospital_id
  ));

CREATE POLICY "Hospital staff can manage patients in their hospital"
  ON patients
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = patients.hospital_id
  ));

-- Vital signs policies
CREATE POLICY "Hospital staff can view vital signs for patients in their hospital"
  ON vital_signs
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM patients WHERE id = vital_signs.patient_id
    )
  ));

CREATE POLICY "Hospital staff can manage vital signs for patients in their hospital"
  ON vital_signs
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM patients WHERE id = vital_signs.patient_id
    )
  ));

-- Medical history policies
CREATE POLICY "Hospital staff can view medical history for patients in their hospital"
  ON medical_history
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM patients WHERE id = medical_history.patient_id
    )
  ));

CREATE POLICY "Hospital staff can manage medical history for patients in their hospital"
  ON medical_history
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM patients WHERE id = medical_history.patient_id
    )
  ));

-- Consultation policies
CREATE POLICY "Hospital staff can view consultations for patients in their hospital"
  ON consultations
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM patients WHERE id = consultations.patient_id
    )
  ));

CREATE POLICY "Hospital staff can manage consultations for patients in their hospital"
  ON consultations
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM patients WHERE id = consultations.patient_id
    )
  ));

-- Lab tests policies
CREATE POLICY "Hospital staff can view lab tests for patients in their hospital"
  ON lab_tests
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM patients WHERE id = lab_tests.patient_id
    )
  ));

CREATE POLICY "Hospital staff can manage lab tests for patients in their hospital"
  ON lab_tests
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM patients WHERE id = lab_tests.patient_id
    )
  ));

-- Prescription policies
CREATE POLICY "Hospital staff can view prescriptions for patients in their hospital"
  ON prescriptions
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM patients WHERE id = prescriptions.patient_id
    )
  ));

CREATE POLICY "Hospital staff can manage prescriptions for patients in their hospital"
  ON prescriptions
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM patients WHERE id = prescriptions.patient_id
    )
  ));

-- Medication policies
CREATE POLICY "Hospital staff can view medications in their hospital"
  ON medications
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = medications.hospital_id
  ));

CREATE POLICY "Hospital staff can manage medications in their hospital"
  ON medications
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = medications.hospital_id
  ));

-- Invoice policies
CREATE POLICY "Hospital staff can view invoices for patients in their hospital"
  ON invoices
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM patients WHERE id = invoices.patient_id
    )
  ));

CREATE POLICY "Hospital staff can manage invoices for patients in their hospital"
  ON invoices
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM patients WHERE id = invoices.patient_id
    )
  ));

-- Payment policies
CREATE POLICY "Hospital staff can view payments for patients in their hospital"
  ON payments
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM patients WHERE id = payments.patient_id
    )
  ));

CREATE POLICY "Hospital staff can manage payments for patients in their hospital"
  ON payments
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM patients WHERE id = payments.patient_id
    )
  ));

-- Service charge policies
CREATE POLICY "Hospital staff can view service charges in their hospital"
  ON service_charges
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = service_charges.hospital_id
  ));

CREATE POLICY "Hospital staff can manage service charges in their hospital"
  ON service_charges
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = service_charges.hospital_id AND role = 'admin'
  ));

-- Notification policies
CREATE POLICY "Users can view their own notifications"
  ON notifications
  FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM users WHERE id = notifications.user_id
    ) AND department = notifications.department_target
  ));

CREATE POLICY "Users can manage their own notifications"
  ON notifications
  USING (auth.uid() = user_id);

-- Department policies
CREATE POLICY "Hospital staff can view departments in their hospital"
  ON departments
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = departments.hospital_id
  ));

CREATE POLICY "Hospital admins can manage departments in their hospital"
  ON departments
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = departments.hospital_id AND role = 'admin'
  ));

-- Ward policies
CREATE POLICY "Hospital staff can view wards in their hospital"
  ON wards
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = wards.hospital_id
  ));

CREATE POLICY "Hospital admins can manage wards in their hospital"
  ON wards
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = wards.hospital_id AND role = 'admin'
  ));

-- Bed policies
CREATE POLICY "Hospital staff can view beds in their hospital"
  ON beds
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM wards WHERE id = beds.ward_id
    )
  ));

CREATE POLICY "Hospital staff can manage beds in their hospital"
  ON beds
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM wards WHERE id = beds.ward_id
    )
  ));

-- Admission policies
CREATE POLICY "Hospital staff can view admissions for patients in their hospital"
  ON admissions
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM patients WHERE id = admissions.patient_id
    )
  ));

CREATE POLICY "Hospital staff can manage admissions for patients in their hospital"
  ON admissions
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM patients WHERE id = admissions.patient_id
    )
  ));

-- Daily charges policies
CREATE POLICY "Hospital staff can view daily charges for patients in their hospital"
  ON daily_charges
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM patients WHERE id = daily_charges.patient_id
    )
  ));

CREATE POLICY "Hospital staff can manage daily charges for patients in their hospital"
  ON daily_charges
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = (
      SELECT hospital_id FROM patients WHERE id = daily_charges.patient_id
    )
  ));

-- Patient numbering settings policies
CREATE POLICY "Hospital admins can view patient numbering settings for their hospital"
  ON patient_numbering_settings
  FOR SELECT
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = patient_numbering_settings.hospital_id AND role = 'admin'
  ));

CREATE POLICY "Hospital admins can manage patient numbering settings for their hospital"
  ON patient_numbering_settings
  USING (auth.uid() IN (
    SELECT id FROM users WHERE hospital_id = patient_numbering_settings.hospital_id AND role = 'admin'
  ));

-- Insert default data
INSERT INTO hospitals (id, name, domain, contact_email)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  'Demo Hospital',
  'demo',
  'admin@demo.searchable.online'
);

-- Insert default admin user
INSERT INTO users (id, hospital_id, email, name, role)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@demo.searchable.online',
  'Admin User',
  'admin'
);

-- Insert default departments
INSERT INTO departments (hospital_id, code, name)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'reception', 'Reception'),
  ('00000000-0000-0000-0000-000000000000', 'triage', 'Triage'),
  ('00000000-0000-0000-0000-000000000000', 'general-consultation', 'General Consultation'),
  ('00000000-0000-0000-0000-000000000000', 'cardiology', 'Cardiology'),
  ('00000000-0000-0000-0000-000000000000', 'pediatrics', 'Pediatrics'),
  ('00000000-0000-0000-0000-000000000000', 'gynecology', 'Gynecology & Obstetrics'),
  ('00000000-0000-0000-0000-000000000000', 'surgical', 'Surgical'),
  ('00000000-0000-0000-0000-000000000000', 'orthopedic', 'Orthopedic'),
  ('00000000-0000-0000-0000-000000000000', 'dental', 'Dental'),
  ('00000000-0000-0000-0000-000000000000', 'eye-clinic', 'Eye Clinic'),
  ('00000000-0000-0000-0000-000000000000', 'physiotherapy', 'Physiotherapy'),
  ('00000000-0000-0000-0000-000000000000', 'laboratory', 'Laboratory'),
  ('00000000-0000-0000-0000-000000000000', 'radiology', 'Radiology'),
  ('00000000-0000-0000-0000-000000000000', 'pharmacy', 'Pharmacy');

-- Insert default patient numbering settings
INSERT INTO patient_numbering_settings (hospital_id, outpatient, inpatient, emergency)
VALUES (
  '00000000-0000-0000-0000-000000000000',
  '{"enabled": true, "format": "OP-{year}-{sequence}", "startingSequence": 1, "resetInterval": "yearly", "currentSequence": 1}',
  '{"enabled": true, "format": "IP-{year}-{sequence}", "startingSequence": 1, "resetInterval": "yearly", "currentSequence": 1}',
  '{"enabled": true, "format": "EM-{year}-{sequence}", "startingSequence": 1, "resetInterval": "yearly", "currentSequence": 1}'
);

-- Insert default service charges
INSERT INTO service_charges (hospital_id, name, department, amount, category)
VALUES
  ('00000000-0000-0000-0000-000000000000', 'General Consultation', 'general-consultation', 1000, 'consultation'),
  ('00000000-0000-0000-0000-000000000000', 'Specialist Consultation', 'general-consultation', 2000, 'consultation'),
  ('00000000-0000-0000-0000-000000000000', 'Complete Blood Count', 'laboratory', 800, 'laboratory'),
  ('00000000-0000-0000-0000-000000000000', 'Liver Function Test', 'laboratory', 1500, 'laboratory'),
  ('00000000-0000-0000-0000-000000000000', 'X-Ray - Chest', 'radiology', 1500, 'radiology'),
  ('00000000-0000-0000-0000-000000000000', 'CT Scan - Brain', 'radiology', 8000, 'radiology'),
  ('00000000-0000-0000-0000-000000000000', 'Medication Dispensing Fee', 'pharmacy', 500, 'medication');
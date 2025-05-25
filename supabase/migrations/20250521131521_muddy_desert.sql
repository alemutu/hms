/*
  # Database Indexes for Searchable HMS
  
  1. New Indexes
    - Indexes on foreign keys for better join performance
    - Indexes on frequently queried columns
    - Indexes on timestamp columns for time-based queries
    - Indexes on status and type columns for filtering
    
  2. Changes
    - Initial index creation
*/

-- Indexes for patients table
CREATE INDEX IF NOT EXISTS idx_patients_hospital_id ON patients(hospital_id);
CREATE INDEX IF NOT EXISTS idx_patients_status ON patients(status);
CREATE INDEX IF NOT EXISTS idx_patients_current_department ON patients(current_department);
CREATE INDEX IF NOT EXISTS idx_patients_priority ON patients(priority);
CREATE INDEX IF NOT EXISTS idx_patients_registration_date ON patients(registration_date);
CREATE INDEX IF NOT EXISTS idx_patients_full_name ON patients(full_name);
CREATE INDEX IF NOT EXISTS idx_patients_id_number ON patients(id_number);
CREATE INDEX IF NOT EXISTS idx_patients_patient_type ON patients(patient_type);
CREATE INDEX IF NOT EXISTS idx_patients_assigned_doctor_id ON patients(assigned_doctor_id);

-- Indexes for vital_signs table
CREATE INDEX IF NOT EXISTS idx_vital_signs_patient_id ON vital_signs(patient_id);
CREATE INDEX IF NOT EXISTS idx_vital_signs_recorded_at ON vital_signs(recorded_at);

-- Indexes for medical_history table
CREATE INDEX IF NOT EXISTS idx_medical_history_patient_id ON medical_history(patient_id);

-- Indexes for consultations table
CREATE INDEX IF NOT EXISTS idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX IF NOT EXISTS idx_consultations_department ON consultations(department);
CREATE INDEX IF NOT EXISTS idx_consultations_status ON consultations(status);
CREATE INDEX IF NOT EXISTS idx_consultations_start_time ON consultations(start_time);

-- Indexes for lab_tests table
CREATE INDEX IF NOT EXISTS idx_lab_tests_patient_id ON lab_tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_status ON lab_tests(status);
CREATE INDEX IF NOT EXISTS idx_lab_tests_department ON lab_tests(department);
CREATE INDEX IF NOT EXISTS idx_lab_tests_priority ON lab_tests(priority);
CREATE INDEX IF NOT EXISTS idx_lab_tests_requested_at ON lab_tests(requested_at);

-- Indexes for prescriptions table
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_consultation_id ON prescriptions(consultation_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescribed_at ON prescriptions(prescribed_at);

-- Indexes for medications table
CREATE INDEX IF NOT EXISTS idx_medications_hospital_id ON medications(hospital_id);
CREATE INDEX IF NOT EXISTS idx_medications_name ON medications(name);
CREATE INDEX IF NOT EXISTS idx_medications_category ON medications(category);
CREATE INDEX IF NOT EXISTS idx_medications_status ON medications(status);

-- Indexes for invoices table
CREATE INDEX IF NOT EXISTS idx_invoices_patient_id ON invoices(patient_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Indexes for payments table
CREATE INDEX IF NOT EXISTS idx_payments_patient_id ON payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payments_timestamp ON payments(timestamp);

-- Indexes for service_charges table
CREATE INDEX IF NOT EXISTS idx_service_charges_hospital_id ON service_charges(hospital_id);
CREATE INDEX IF NOT EXISTS idx_service_charges_department ON service_charges(department);
CREATE INDEX IF NOT EXISTS idx_service_charges_category ON service_charges(category);

-- Indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_patient_id ON notifications(patient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp);
CREATE INDEX IF NOT EXISTS idx_notifications_department_target ON notifications(department_target);

-- Indexes for departments table
CREATE INDEX IF NOT EXISTS idx_departments_hospital_id ON departments(hospital_id);
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);

-- Indexes for wards table
CREATE INDEX IF NOT EXISTS idx_wards_hospital_id ON wards(hospital_id);
CREATE INDEX IF NOT EXISTS idx_wards_type ON wards(type);

-- Indexes for beds table
CREATE INDEX IF NOT EXISTS idx_beds_ward_id ON beds(ward_id);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);

-- Indexes for admissions table
CREATE INDEX IF NOT EXISTS idx_admissions_patient_id ON admissions(patient_id);
CREATE INDEX IF NOT EXISTS idx_admissions_ward_id ON admissions(ward_id);
CREATE INDEX IF NOT EXISTS idx_admissions_bed_id ON admissions(bed_id);
CREATE INDEX IF NOT EXISTS idx_admissions_status ON admissions(status);
CREATE INDEX IF NOT EXISTS idx_admissions_admission_date ON admissions(admission_date);

-- Indexes for daily_charges table
CREATE INDEX IF NOT EXISTS idx_daily_charges_admission_id ON daily_charges(admission_id);
CREATE INDEX IF NOT EXISTS idx_daily_charges_patient_id ON daily_charges(patient_id);
CREATE INDEX IF NOT EXISTS idx_daily_charges_date ON daily_charges(date);
CREATE INDEX IF NOT EXISTS idx_daily_charges_status ON daily_charges(status);

-- Indexes for patient_numbering_settings table
CREATE INDEX IF NOT EXISTS idx_patient_numbering_settings_hospital_id ON patient_numbering_settings(hospital_id);
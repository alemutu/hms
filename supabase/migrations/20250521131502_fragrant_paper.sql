/*
  # Database Triggers for Searchable HMS
  
  1. New Triggers
    - `update_timestamps` - Updates the updated_at column for various tables
    - `update_bed_status` - Updates bed status when admissions change
    - `update_patient_on_admission` - Updates patient status when admitted
    - `update_patient_on_discharge` - Updates patient status when discharged
    
  2. Security
    - Triggers run with the same permissions as the calling user
    
  3. Changes
    - Initial trigger creation
*/

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_hospitals_timestamp
BEFORE UPDATE ON hospitals
FOR EACH ROW
EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER update_patients_timestamp
BEFORE UPDATE ON patients
FOR EACH ROW
EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER update_medical_history_timestamp
BEFORE UPDATE ON medical_history
FOR EACH ROW
EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER update_consultations_timestamp
BEFORE UPDATE ON consultations
FOR EACH ROW
EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER update_lab_tests_timestamp
BEFORE UPDATE ON lab_tests
FOR EACH ROW
EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER update_prescriptions_timestamp
BEFORE UPDATE ON prescriptions
FOR EACH ROW
EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER update_medications_timestamp
BEFORE UPDATE ON medications
FOR EACH ROW
EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER update_invoices_timestamp
BEFORE UPDATE ON invoices
FOR EACH ROW
EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER update_service_charges_timestamp
BEFORE UPDATE ON service_charges
FOR EACH ROW
EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER update_departments_timestamp
BEFORE UPDATE ON departments
FOR EACH ROW
EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER update_wards_timestamp
BEFORE UPDATE ON wards
FOR EACH ROW
EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER update_beds_timestamp
BEFORE UPDATE ON beds
FOR EACH ROW
EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER update_admissions_timestamp
BEFORE UPDATE ON admissions
FOR EACH ROW
EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER update_daily_charges_timestamp
BEFORE UPDATE ON daily_charges
FOR EACH ROW
EXECUTE FUNCTION update_timestamps();

CREATE TRIGGER update_patient_numbering_settings_timestamp
BEFORE UPDATE ON patient_numbering_settings
FOR EACH ROW
EXECUTE FUNCTION update_timestamps();

-- Create function to update bed status when admissions change
CREATE OR REPLACE FUNCTION update_bed_status()
RETURNS TRIGGER AS $$
BEGIN
  -- If a new admission is created, mark the bed as occupied
  IF TG_OP = 'INSERT' THEN
    UPDATE beds
    SET status = 'occupied'
    WHERE id = NEW.bed_id;
  -- If an admission is updated to discharged or transferred, mark the bed as available
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status = 'discharged' OR NEW.status = 'transferred' THEN
      UPDATE beds
      SET status = 'available'
      WHERE id = OLD.bed_id;
    END IF;
  -- If an admission is deleted, mark the bed as available
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE beds
    SET status = 'available'
    WHERE id = OLD.bed_id;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for bed status updates
CREATE TRIGGER update_bed_status_on_admission
AFTER INSERT OR UPDATE OR DELETE ON admissions
FOR EACH ROW
EXECUTE FUNCTION update_bed_status();

-- Create function to update patient status when admitted
CREATE OR REPLACE FUNCTION update_patient_on_admission()
RETURNS TRIGGER AS $$
DECLARE
  v_workflow_timestamps jsonb;
BEGIN
  -- Get current workflow timestamps
  SELECT COALESCE(workflow_timestamps, '{}'::jsonb) INTO v_workflow_timestamps
  FROM patients
  WHERE id = NEW.patient_id;
  
  -- Update workflow timestamps with admission time
  v_workflow_timestamps := jsonb_set(v_workflow_timestamps, ARRAY['admittedTime'], to_jsonb(now()));
  
  -- Update patient status and related fields
  UPDATE patients
  SET 
    status = 'admitted',
    patient_type = 'inpatient',
    is_admitted = true,
    workflow_timestamps = v_workflow_timestamps,
    updated_at = now()
  WHERE id = NEW.patient_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for patient updates on admission
CREATE TRIGGER update_patient_on_admission
AFTER INSERT ON admissions
FOR EACH ROW
EXECUTE FUNCTION update_patient_on_admission();

-- Create function to update patient status when discharged
CREATE OR REPLACE FUNCTION update_patient_on_discharge()
RETURNS TRIGGER AS $$
DECLARE
  v_workflow_timestamps jsonb;
BEGIN
  -- Only proceed if status changed to discharged
  IF NEW.status = 'discharged' AND (OLD.status != 'discharged' OR OLD.status IS NULL) THEN
    -- Get current workflow timestamps
    SELECT COALESCE(workflow_timestamps, '{}'::jsonb) INTO v_workflow_timestamps
    FROM patients
    WHERE id = NEW.patient_id;
    
    -- Update workflow timestamps with discharge time
    v_workflow_timestamps := jsonb_set(v_workflow_timestamps, ARRAY['dischargedTime'], to_jsonb(now()));
    
    -- Update patient status and related fields
    UPDATE patients
    SET 
      status = 'discharged',
      is_admitted = false,
      workflow_timestamps = v_workflow_timestamps,
      is_completed = true,
      updated_at = now()
    WHERE id = NEW.patient_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for patient updates on discharge
CREATE TRIGGER update_patient_on_discharge
AFTER UPDATE ON admissions
FOR EACH ROW
EXECUTE FUNCTION update_patient_on_discharge();
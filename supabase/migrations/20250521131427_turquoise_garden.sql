/*
  # Database Functions for Searchable HMS
  
  1. New Functions
    - `get_service_status` - Returns the status of the Supabase service
    - `generate_patient_number` - Generates a unique patient number based on type and settings
    - `update_patient_status` - Updates a patient's status and related timestamps
    - `search_patients` - Searches for patients based on various criteria
    
  2. Security
    - Functions are accessible to authenticated users
    
  3. Changes
    - Initial function creation
*/

-- Function to get service status (for health checks)
CREATE OR REPLACE FUNCTION get_service_status()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN jsonb_build_object(
    'status', 'online',
    'version', current_setting('server_version'),
    'timestamp', now()
  );
END;
$$;

-- Function to generate a patient number based on type and settings
CREATE OR REPLACE FUNCTION generate_patient_number(
  p_hospital_id uuid,
  p_type text -- 'outpatient', 'inpatient', or 'emergency'
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_settings jsonb;
  v_format text;
  v_sequence integer;
  v_reset_interval text;
  v_last_reset timestamptz;
  v_should_reset boolean := false;
  v_result text;
  v_year text := to_char(now(), 'YYYY');
  v_month text := to_char(now(), 'MM');
  v_day text := to_char(now(), 'DD');
BEGIN
  -- Get the settings for the hospital
  SELECT 
    CASE 
      WHEN p_type = 'outpatient' THEN outpatient
      WHEN p_type = 'inpatient' THEN inpatient
      WHEN p_type = 'emergency' THEN emergency
      ELSE NULL
    END INTO v_settings
  FROM patient_numbering_settings
  WHERE hospital_id = p_hospital_id;
  
  -- If no settings found, use defaults
  IF v_settings IS NULL THEN
    CASE 
      WHEN p_type = 'outpatient' THEN
        v_settings := '{"enabled": true, "format": "OP-{year}-{sequence}", "startingSequence": 1, "resetInterval": "yearly", "currentSequence": 1}';
      WHEN p_type = 'inpatient' THEN
        v_settings := '{"enabled": true, "format": "IP-{year}-{sequence}", "startingSequence": 1, "resetInterval": "yearly", "currentSequence": 1}';
      WHEN p_type = 'emergency' THEN
        v_settings := '{"enabled": true, "format": "EM-{year}-{sequence}", "startingSequence": 1, "resetInterval": "yearly", "currentSequence": 1}';
      ELSE
        RAISE EXCEPTION 'Invalid patient type: %', p_type;
    END CASE;
  END IF;
  
  -- Extract values from settings
  v_format := v_settings->>'format';
  v_sequence := (v_settings->>'currentSequence')::integer;
  v_reset_interval := v_settings->>'resetInterval';
  v_last_reset := (v_settings->>'lastReset')::timestamptz;
  
  -- Check if we need to reset the sequence
  IF v_last_reset IS NULL THEN
    v_should_reset := true;
  ELSE
    CASE v_reset_interval
      WHEN 'daily' THEN
        v_should_reset := date_trunc('day', now()) > date_trunc('day', v_last_reset);
      WHEN 'monthly' THEN
        v_should_reset := date_trunc('month', now()) > date_trunc('month', v_last_reset);
      WHEN 'yearly' THEN
        v_should_reset := date_trunc('year', now()) > date_trunc('year', v_last_reset);
      WHEN 'per-admission' THEN
        v_should_reset := true;
      WHEN 'never' THEN
        v_should_reset := false;
      ELSE
        v_should_reset := false;
    END CASE;
  END IF;
  
  -- Reset sequence if needed
  IF v_should_reset THEN
    v_sequence := (v_settings->>'startingSequence')::integer;
  END IF;
  
  -- Format the sequence number with leading zeros
  v_sequence := v_sequence::integer;
  
  -- Generate the patient number
  v_result := v_format;
  v_result := replace(v_result, '{year}', v_year);
  v_result := replace(v_result, '{month}', v_month);
  v_result := replace(v_result, '{day}', v_day);
  v_result := replace(v_result, '{sequence}', lpad(v_sequence::text, 5, '0'));
  
  -- Update the settings with the new sequence and last reset date
  v_settings := jsonb_set(v_settings, '{currentSequence}', to_jsonb(v_sequence + 1));
  v_settings := jsonb_set(v_settings, '{lastReset}', to_jsonb(now()));
  
  -- Update the database
  UPDATE patient_numbering_settings
  SET 
    outpatient = CASE WHEN p_type = 'outpatient' THEN v_settings ELSE outpatient END,
    inpatient = CASE WHEN p_type = 'inpatient' THEN v_settings ELSE inpatient END,
    emergency = CASE WHEN p_type = 'emergency' THEN v_settings ELSE emergency END,
    updated_at = now()
  WHERE hospital_id = p_hospital_id;
  
  -- If no rows were updated, insert a new record
  IF NOT FOUND THEN
    INSERT INTO patient_numbering_settings (
      hospital_id, 
      outpatient, 
      inpatient, 
      emergency
    ) VALUES (
      p_hospital_id,
      CASE WHEN p_type = 'outpatient' THEN v_settings ELSE '{"enabled": true, "format": "OP-{year}-{sequence}", "startingSequence": 1, "resetInterval": "yearly", "currentSequence": 1}' END,
      CASE WHEN p_type = 'inpatient' THEN v_settings ELSE '{"enabled": true, "format": "IP-{year}-{sequence}", "startingSequence": 1, "resetInterval": "yearly", "currentSequence": 1}' END,
      CASE WHEN p_type = 'emergency' THEN v_settings ELSE '{"enabled": true, "format": "EM-{year}-{sequence}", "startingSequence": 1, "resetInterval": "yearly", "currentSequence": 1}' END
    );
  END IF;
  
  RETURN v_result;
END;
$$;

-- Function to update patient status and related timestamps
CREATE OR REPLACE FUNCTION update_patient_status(
  p_patient_id uuid,
  p_status text,
  p_priority text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_workflow_timestamps jsonb;
  v_timestamp_key text;
BEGIN
  -- Get current workflow timestamps
  SELECT COALESCE(workflow_timestamps, '{}'::jsonb) INTO v_workflow_timestamps
  FROM patients
  WHERE id = p_patient_id;
  
  -- Determine timestamp key based on status
  CASE p_status
    WHEN 'activated' THEN v_timestamp_key := 'activationTime';
    WHEN 'in-triage' THEN v_timestamp_key := 'inTriageTime';
    WHEN 'triage-complete' THEN v_timestamp_key := 'triageCompleteTime';
    WHEN 'in-consultation' THEN v_timestamp_key := 'inConsultationTime';
    WHEN 'consultation-complete' THEN v_timestamp_key := 'consultationCompleteTime';
    WHEN 'waiting-for-lab' THEN v_timestamp_key := 'waitingForLabTime';
    WHEN 'in-lab' THEN v_timestamp_key := 'inLabTime';
    WHEN 'lab-complete' THEN v_timestamp_key := 'labCompleteTime';
    WHEN 'waiting-for-lab-results' THEN v_timestamp_key := 'waitingForLabResultsTime';
    WHEN 'lab-results-received' THEN v_timestamp_key := 'labResultsReceivedTime';
    WHEN 'waiting-for-radiology' THEN v_timestamp_key := 'waitingForRadiologyTime';
    WHEN 'in-radiology' THEN v_timestamp_key := 'inRadiologyTime';
    WHEN 'radiology-complete' THEN v_timestamp_key := 'radiologyCompleteTime';
    WHEN 'under-treatment' THEN v_timestamp_key := 'underTreatmentTime';
    WHEN 'ready-for-discharge' THEN v_timestamp_key := 'readyForDischargeTime';
    WHEN 'in-pharmacy' THEN v_timestamp_key := 'inPharmacyTime';
    WHEN 'pharmacy-complete' THEN v_timestamp_key := 'pharmacyCompleteTime';
    WHEN 'medication-dispensed' THEN v_timestamp_key := 'medicationDispensedTime';
    WHEN 'awaiting-payment' THEN v_timestamp_key := 'awaitingPaymentTime';
    WHEN 'payment-complete' THEN v_timestamp_key := 'paymentCompleteTime';
    WHEN 'admitted' THEN v_timestamp_key := 'admittedTime';
    WHEN 'discharged' THEN v_timestamp_key := 'dischargedTime';
    WHEN 'emergency-registered' THEN v_timestamp_key := 'emergencyRegistrationTime';
    WHEN 'emergency-triage' THEN v_timestamp_key := 'emergencyTriageTime';
    WHEN 'emergency-treatment' THEN v_timestamp_key := 'emergencyTreatmentTime';
    WHEN 'emergency-stabilized' THEN v_timestamp_key := 'emergencyStabilizationTime';
    ELSE v_timestamp_key := NULL;
  END CASE;
  
  -- Update workflow timestamps if key is not null
  IF v_timestamp_key IS NOT NULL THEN
    v_workflow_timestamps := jsonb_set(v_workflow_timestamps, ARRAY[v_timestamp_key], to_jsonb(now()));
  END IF;
  
  -- Update patient status and timestamps
  UPDATE patients
  SET 
    status = p_status,
    priority = COALESCE(p_priority, priority),
    workflow_timestamps = v_workflow_timestamps,
    updated_at = now()
  WHERE id = p_patient_id;
END;
$$;

-- Function to search patients
CREATE OR REPLACE FUNCTION search_patients(
  p_query text,
  p_hospital_id uuid,
  p_limit integer DEFAULT 10
)
RETURNS SETOF patients
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM patients
  WHERE 
    hospital_id = p_hospital_id AND
    (
      full_name ILIKE '%' || p_query || '%' OR
      id_number ILIKE '%' || p_query || '%' OR
      phone_number ILIKE '%' || p_query || '%' OR
      email ILIKE '%' || p_query || '%' OR
      op_number ILIKE '%' || p_query || '%' OR
      ip_number ILIKE '%' || p_query || '%' OR
      em_number ILIKE '%' || p_query || '%'
    )
  ORDER BY 
    CASE 
      WHEN full_name ILIKE p_query || '%' THEN 1
      WHEN full_name ILIKE '%' || p_query || '%' THEN 2
      ELSE 3
    END,
    registration_date DESC
  LIMIT p_limit;
END;
$$;
// Patient Types
export interface Patient {
  id: string;
  idNumber: string;
  fullName: string;
  age: number;
  gender: 'male' | 'female' | 'other';
  email: string;
  phoneNumber: string;
  placeOfResidence: string;
  registrationDate: Date;
  status: PatientStatus;
  priority: 'normal' | 'urgent' | 'critical' | 'emergency';
  currentDepartment: Department;
  nextDestination: string | null;
  previousDepartments: string[];
  isNewPatient: boolean;
  waitTime?: number;
  testStatus?: 'pending' | 'in-progress' | 'completed';
  paymentMethod?: 'cash' | 'mpesa' | 'insurance' | 'bank';
  insuranceProvider?: string;
  insuranceNumber?: string;
  mpesaNumber?: string;
  bankReference?: string;
  originDepartment?: string; // Track where patient came from for tests
  returnToDepartment?: string | null; // Track where patient should return after tests
  registrationTime?: string; // Track when patient was registered
  activationTime?: string; // Track when patient was activated
  triageTime?: string; // Track when patient was triaged
  inTriageTime?: string; // Track when patient entered triage
  triageCompleteTime?: string; // Track when triage was completed
  underConsultationTime?: string; // Track when patient is under consultation
  inConsultationTime?: string; // Track when consultation started
  consultationCompleteTime?: string; // Track when consultation was completed
  awaitingPaymentLabTime?: string; // Track when patient started waiting for lab payment
  awaitingPaymentRadiologyTime?: string; // Track when patient started waiting for radiology payment
  sentToLabTime?: string; // Track when patient was sent to lab
  sentToRadiologyTime?: string; // Track when patient was sent to radiology
  waitingForLabTime?: string; // Track when patient started waiting for lab
  inLabTime?: string; // Track when patient entered lab
  labCompleteTime?: string; // Track when lab tests were completed
  waitingForLabResultsTime?: string; // Track when patient started waiting for lab results
  labResultsReceivedTime?: string; // Track when lab results were received
  waitingForRadiologyTime?: string; // Track when patient started waiting for radiology
  inRadiologyTime?: string; // Track when patient entered radiology
  radiologyCompleteTime?: string; // Track when radiology tests were completed
  underTreatmentTime?: string; // Track when patient is under treatment
  underConsultationReviewTime?: string; // Track when patient is under consultation review
  readyForDischargeTime?: string; // Track when patient is ready for discharge
  awaitingPaymentMedicationTime?: string; // Track when patient is awaiting payment for medication
  inPharmacyTime?: string; // Track when patient entered pharmacy
  pharmacyCompleteTime?: string; // Track when pharmacy was completed
  medicationDispensedTime?: string; // Track when medication was dispensed
  awaitingPaymentTime?: string; // Track when patient started waiting for payment
  paymentCompleteTime?: string; // Track when payment was completed
  dischargedTime?: string; // Track when patient was discharged
  category?: 'outpatient' | 'inpatient' | 'specialist' | 'emergency'; // Patient category
  
  // Doctor assignment
  assignedDoctorId?: string; // ID of the assigned doctor
  assignedDoctorName?: string; // Name of the assigned doctor
  assignedAt?: string; // When the patient was assigned
  
  // Parallel workflow tracking
  pendingLabTests?: boolean;
  pendingRadiologyTests?: boolean;
  pendingMedications?: boolean;
  pendingPayment?: boolean;
  
  // Workflow completion flags
  labTestsCompleted?: boolean;
  radiologyTestsCompleted?: boolean;
  medicationsDispensed?: boolean;
  paymentCompleted?: boolean;
  
  // Completion flag
  isCompleted?: boolean;

  // Patient numbering
  patientType: 'outpatient' | 'inpatient' | 'emergency';
  opNumber?: string; // Outpatient number (OP-YYYY-XXXXX)
  ipNumber?: string; // Inpatient number (IP-YYYY-XXXXX)
  emNumber?: string; // Emergency number (EM-YYYY-XXXXX)
  
  // Emergency specific fields
  isEmergency?: boolean;
  emergencyType?: 'trauma' | 'medical' | 'surgical' | 'obstetric' | 'pediatric' | 'other';
  emergencyDescription?: string;
  emergencyBroughtBy?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyRegistrationTime?: string;
  emergencyTriageTime?: string;
  emergencyDoctorAssignedTime?: string;
  emergencyStabilizationTime?: string;
  emergencyOutcome?: 'stabilized' | 'admitted' | 'transferred' | 'discharged' | 'deceased';
  emergencyOutcomeTime?: string;
  emergencyResponseDuration?: number; // in minutes
}

export type PatientStatus = 
  | 'registered'                // Initial status after registration
  | 'activated'                 // Existing patient activated
  | 'triaged'                   // Triage assessment completed
  | 'in-triage'                 // During triage assessment
  | 'triage-complete'           // Triage completed, ready for consultation
  | 'under-consultation'        // During doctor consultation
  | 'in-consultation'           // During doctor consultation (legacy)
  | 'consultation-complete'     // Consultation done, may need tests/meds
  | 'awaiting-payment-lab'      // Waiting for payment for lab tests
  | 'awaiting-payment-radiology' // Waiting for payment for radiology tests
  | 'sent-to-lab'               // Sent to laboratory after payment
  | 'sent-to-radiology'         // Sent to radiology after payment
  | 'waiting-for-lab'           // Waiting for laboratory tests
  | 'in-lab'                    // Currently undergoing lab tests
  | 'lab-complete'              // Lab tests completed
  | 'waiting-for-lab-results'   // Waiting for lab results
  | 'lab-results-received'      // Lab results received
  | 'waiting-for-radiology'     // Waiting for radiology tests
  | 'in-radiology'              // Currently undergoing radiology tests
  | 'radiology-complete'        // Radiology tests completed
  | 'under-treatment'           // Patient is under treatment
  | 'under-consultation-review' // Patient is under consultation review after tests
  | 'ready-for-discharge'       // Patient is ready to be discharged
  | 'awaiting-payment-medication' // Waiting for payment for medication
  | 'in-pharmacy'               // Getting medications
  | 'pharmacy-complete'         // Pharmacy process completed
  | 'medication-dispensed'      // Medications dispensed
  | 'awaiting-payment'          // Waiting for payment
  | 'payment-complete'          // Payment completed
  | 'discharged'                // Patient discharged
  | 'emergency-registered'      // Emergency patient registered
  | 'emergency-triage'          // Emergency patient in triage
  | 'emergency-treatment'       // Emergency patient under treatment
  | 'emergency-stabilized'      // Emergency patient stabilized
  | 'emergency-transferred'     // Emergency patient transferred
  | 'emergency-admitted';       // Emergency patient admitted

export interface LabTest {
  id: string;
  patientId: string;
  testType: string;
  requestedBy: string;
  requestedAt: string;
  department: 'laboratory' | 'radiology';
  priority: 'normal' | 'urgent' | 'critical' | 'emergency';
  clinicalInfo: string;
  status: 'pending' | 'sent' | 'received' | 'in-progress' | 'completed' | 'cancelled' | 'awaiting-payment' | 'paid' | 'draft';
  returnToDepartment: string;
  sampleId?: string;
  sampleType?: string;
  sampleCollectedAt?: string;
  sampleCollectedBy?: string;
  startedAt?: string;
  machineId?: string;
  machineName?: string;
  results?: {
    findings: string;
    interpretation?: string;
    performedBy: string;
    performedAt: string;
    imageUrl?: string;
    customFields?: Record<string, any>;
    criticalValues?: boolean;
    rawData?: Record<string, any>; // Raw test data
    enteredBy?: string; // Who entered the results
  };
  reportDelivery?: {
    method: 'email' | 'print' | 'portal';
    deliveredTo?: string;
    deliveredAt?: string;
    status: 'pending' | 'delivered';
  };
  notes?: string;
  customFields?: Record<string, string>;
  category?: string;
  paymentStatus?: 'pending' | 'paid' | 'waived';
  inventoryUsed?: Array<{
    itemId: string;
    itemName: string;
    quantity: number;
  }>;
  orderTransmissionStatus?: 'ordered' | 'sent' | 'received' | 'completed';
  orderTransmissionTime?: string;
  orderReceivedTime?: string;
  isEmergency?: boolean;
}

export interface VitalSigns {
  bloodPressure: string;
  pulseRate: number;
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate: number;
  recordedAt: Date;
  recordedBy: string;
  notes?: string;
  weight?: number;
  height?: number;
  bmi?: number;
  isEmergency?: boolean;
  glasgowComaScale?: {
    eyeOpening: number; // 1-4
    verbalResponse: number; // 1-5
    motorResponse: number; // 1-6
    total: number; // 3-15
  };
  avpu?: 'alert' | 'verbal' | 'pain' | 'unresponsive';
  traumaScore?: number;
}

export interface MedicalHistory {
  hasDiabetes: boolean;
  hasHypertension: boolean;
  hasHeartDisease: boolean;
  hasAsthma: boolean;
  hasCancer: boolean;
  hasSurgeries: boolean;
  hasAllergies: boolean;
  allergies: string[];
  medications: string[];
  familyHistory: string[];
  notes: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  department: string;
  doctorId: string;
  doctorName: string;
  startTime: Date;
  endTime?: Date;
  status: 'in-progress' | 'completed';
  priority: 'normal' | 'urgent' | 'critical' | 'emergency';
  chiefComplaints: string[];
  symptoms: string[];
  diagnosis: string[];
  treatment: string;
  notes: string;
  clinicalNotes?: string;
  labTests?: {
    id: string;
    type: string;
    status: 'pending' | 'in-progress' | 'completed';
  }[];
  medications?: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    route?: string;
    timing?: string;
    notes?: string;
  }[];
  followUp?: {
    required: boolean;
    date: Date;
    notes: string;
    department?: string;
    doctor?: string;
  };
  sickLeave?: {
    startDate: Date;
    endDate: Date;
    reason: string;
    recommendations: string;
    workRestrictions?: string;
    fullDuties?: boolean;
    partialDuties?: boolean;
    partialDutiesDetails?: string;
    diagnosisForCertificate?: string;
    issuedAt: Date;
  };
  departmentSpecific?: {
    eyeClinic?: {
      eyeglassPrescription?: string;
      lensType?: string;
      rightEye?: string;
      leftEye?: string;
      additionalNotes?: string;
    };
    dental?: {
      treatmentNotes?: string;
      oralHygieneInstructions?: string;
      followUpProcedure?: string;
    };
    radiology?: {
      requestedStudies?: string[];
      clinicalIndication?: string;
      contrastRequired?: boolean;
      patientPreparation?: string;
      priorityLevel?: 'routine' | 'urgent' | 'stat';
      previousImaging?: boolean;
      previousImagingDetails?: string;
    };
  };
  timeline?: {
    timestamp: Date;
    event: string;
    details?: string;
    actor?: string;
  }[];
  nextDepartment?: string;
  admissionRequired?: boolean;
  admissionReason?: string;
  admissionNotes?: string;
  isEmergency?: boolean;
  emergencyDetails?: {
    stabilizationMeasures?: string[];
    resuscitationRequired?: boolean;
    resuscitationNotes?: string;
    criticalInterventions?: string[];
    responseTeam?: string[];
  };
}

export interface ClinicalNote {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  attachments?: string[];
}

export interface Prescription {
  id: string;
  patientId: string;
  consultationId: string | null;
  prescribedBy: string;
  prescribedAt: string;
  status: 'pending' | 'stock-verified' | 'dispensed' | 'cancelled';
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    quantity: number;
    route?: string;
    timing?: string;
    notes?: string;
  }[];
  notes?: string;
  dispensedAt?: string;
  dispensedBy?: string;
  dispensingNotes?: string;
  paymentStatus?: 'pending' | 'completed' | 'waived';
  patientInstructions?: string;
  isEmergency?: boolean;
  priority?: 'normal' | 'urgent' | 'emergency';
}

export interface MedicationStock {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  minimumStock: number;
  expiryDate: string;
  price: number;
  status: 'in-stock' | 'low-stock' | 'out-of-stock';
  batchNumber?: string;
  location?: string;
  supplier?: string;
  reorderLevel?: number;
  lastRestocked?: string;
  notes?: string;
}

export interface Notification {
  id: string;
  type: 'lab-result' | 'radiology-result' | 'urgent' | 'info' | 'system' | 'prescription' | 'emergency';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  patientId?: string;
  testId?: string;
  prescriptionId?: string;
  invoiceId?: string;
  priority: 'normal' | 'high' | 'emergency';
  action?: 'view-results' | 'view-patient' | 'acknowledge' | 'view-prescription' | 'view-invoice' | 'emergency-response';
  departmentTarget?: string;
}

export interface Invoice {
  id: string;
  patientId: string;
  visitId: string;
  items: BillingItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'waived';
  createdAt: string;
  dueDate: string;
  paidAt?: string;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  isEmergency?: boolean;
}

export interface BillingItem {
  id: string;
  patientId: string;
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  department: string;
  category: string;
  status: 'pending' | 'paid' | 'cancelled' | 'waived';
  createdAt: string;
  notes?: string;
  testId?: string;
  prescriptionId?: string;
  medicationName?: string;
  isEmergency?: boolean;
}

export interface Payment {
  id: string;
  patientId: string;
  invoiceId?: string;
  amount: number;
  method: 'cash' | 'mpesa' | 'card' | 'insurance' | 'bank';
  reference: string;
  timestamp: string;
  receivedBy: string;
  notes?: string;
  isEmergency?: boolean;
  waived?: boolean;
  waivedReason?: string;
  waivedBy?: string;
}

export interface ServiceCharge {
  id: string;
  name: string;
  department: string;
  amount: number;
  category: string;
  description?: string;
}

// Patient Numbering Settings
export interface PatientNumberingSettings {
  outpatient: {
    enabled: boolean;
    format: string;
    startingSequence: number;
    resetInterval: 'daily' | 'monthly' | 'yearly' | 'never';
    lastReset?: string;
    currentSequence: number;
  };
  inpatient: {
    enabled: boolean;
    format: string;
    startingSequence: number;
    resetInterval: 'per-admission' | 'monthly' | 'yearly' | 'never';
    lastReset?: string;
    currentSequence: number;
  };
  emergency: {
    enabled: boolean;
    format: string;
    startingSequence: number;
    resetInterval: 'daily' | 'monthly' | 'yearly' | 'never';
    lastReset?: string;
    currentSequence: number;
  };
}
import { create } from 'zustand';
import { departments } from '../types/departments';
import { supabase, handleSupabaseError } from './supabase-client';
import type { 
  Patient, 
  VitalSigns, 
  MedicalHistory, 
  Consultation, 
  LabTest, 
  Prescription,
  Invoice,
  BillingItem,
  Payment,
  ServiceCharge,
  MedicationStock,
  Notification
} from '../types';

// Define the store state
interface PatientStoreState {
  // Patient data
  patientQueue: Patient[];
  currentPatient: Patient | null;
  currentSection: string;
  currentDepartment: string | null;
  
  // Medical data
  vitalSigns: Record<string, VitalSigns[]>;
  medicalHistory: Record<string, MedicalHistory>;
  consultations: Record<string, Consultation[]>;
  labTests: Record<string, LabTest[]>;
  prescriptions: Record<string, Prescription[]>;
  
  // Billing data
  invoices: Record<string, Invoice[]>;
  payments: Record<string, Payment[]>;
  serviceCharges: ServiceCharge[];
  medicationStock: MedicationStock[];
  
  // Notifications
  notifications: Notification[];
  unreadNotificationsCount: number;
  
  // Department stats
  departmentStats: Record<string, {
    waitingPatients: number;
    inProgressPatients: number;
    completedPatients: number;
    averageWaitTime: number;
  }>;
  
  // Loading states
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentSection: (section: string) => void;
  setCurrentDepartment: (department: string | null) => void;
  setCurrentPatient: (patient: Patient | null) => void;
  
  // Data fetching
  fetchPatients: () => Promise<void>;
  fetchVitalSigns: (patientId: string) => Promise<void>;
  fetchMedicalHistory: (patientId: string) => Promise<void>;
  fetchConsultations: (patientId: string) => Promise<void>;
  fetchLabTests: (patientId: string) => Promise<void>;
  fetchPrescriptions: (patientId: string) => Promise<void>;
  fetchInvoices: (patientId: string) => Promise<void>;
  fetchPayments: (patientId: string) => Promise<void>;
  fetchServiceCharges: () => Promise<void>;
  fetchMedicationStock: () => Promise<void>;
  fetchNotifications: () => Promise<void>;
  
  // Patient management
  addPatient: (patient: Omit<Patient, 'id'>) => Promise<string>;
  updatePatient: (patientId: string, updates: Partial<Patient>) => Promise<void>;
  removePatient: (patientId: string) => Promise<void>;
  updatePatientStatus: (patientId: string, status: Patient['status'], priority?: Patient['priority']) => Promise<void>;
  movePatientToNextDepartment: (patientId: string, nextDepartment: string) => Promise<void>;
  removeFromQueue: (patientId: string) => Promise<void>;
  
  // Vital signs
  updateVitalSigns: (patientId: string, vitals: Omit<VitalSigns, 'id'>) => Promise<void>;
  
  // Medical history
  updateMedicalHistory: (patientId: string, history: Omit<MedicalHistory, 'id'>) => Promise<void>;
  
  // Consultations
  createConsultation: (consultation: Omit<Consultation, 'id'>) => Promise<string>;
  updateConsultation: (consultationId: string, updates: Partial<Consultation>) => Promise<void>;
  getCurrentConsultation: (consultationId: string) => Consultation | null;
  
  // Lab tests
  createLabRequest: (labTest: Omit<LabTest, 'id'>) => Promise<string>;
  updateLabTest: (labTestId: string, updates: Partial<LabTest>) => Promise<void>;
  
  // Prescriptions
  createPrescription: (prescription: Omit<Prescription, 'id'>) => Promise<string>;
  updatePrescription: (prescriptionId: string, updates: Partial<Prescription>) => Promise<void>;
  
  // Billing
  createInvoice: (invoice: Omit<Invoice, 'id'>) => Promise<string>;
  updateInvoice: (invoiceId: string, updates: Partial<Invoice>) => Promise<void>;
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<string>;
  updateServiceCharge: (serviceId: string, updates: Partial<ServiceCharge>) => Promise<void>;
  addServiceCharge: (service: Omit<ServiceCharge, 'id'>) => Promise<string>;
  
  // Inventory
  updateMedicationStock: (medicationId: string, updates: Partial<MedicationStock>) => Promise<void>;
  addMedicationStock: (medication: Omit<MedicationStock, 'id'>) => Promise<string>;
  
  // Notifications
  addNotification: (notification: Omit<Notification, 'id'>) => Promise<string>;
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  
  // Department stats
  updateDepartmentStats: (department: string) => void;
  
  // Triage
  calculateTriagePriority: (vitals: VitalSigns) => 'normal' | 'urgent' | 'critical';
  suggestDepartment: (symptoms: string[]) => string;
  
  // Workflow management
  getDepartmentQueue: (department: string) => Patient[];
  updateParallelWorkflow: (patientId: string, updates: Partial<Patient>) => Promise<void>;
  assignPatientToDoctor: (patientId: string, doctorId: string) => Promise<void>;
  unassignPatientFromDoctor: (patientId: string) => Promise<void>;
  getAssignedPatients: (doctorId: string) => Patient[];
  
  // Payment verification
  checkPaymentStatus: (patientId: string, serviceType: string) => Promise<boolean>;
}

// Create the store
export const usePatientStore = create<PatientStoreState>((set, get) => ({
  // Initial state
  patientQueue: [],
  currentPatient: null,
  currentSection: 'dashboard',
  currentDepartment: null,
  vitalSigns: {},
  medicalHistory: {},
  consultations: {},
  labTests: {},
  prescriptions: {},
  invoices: {},
  payments: {},
  serviceCharges: [],
  medicationStock: [],
  notifications: [],
  unreadNotificationsCount: 0,
  departmentStats: {},
  isLoading: false,
  error: null,
  
  // Actions
  setCurrentSection: (section) => set({ currentSection: section }),
  setCurrentDepartment: (department) => set({ currentDepartment: department }),
  setCurrentPatient: (patient) => set({ currentPatient: patient }),
  
  // Data fetching
  fetchPatients: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .order('registration_date', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match our Patient type
      const patients: Patient[] = data.map(p => ({
        id: p.id,
        idNumber: p.id_number || '',
        fullName: p.full_name,
        age: p.age,
        gender: p.gender as 'male' | 'female' | 'other',
        email: p.email || '',
        phoneNumber: p.phone_number || '',
        placeOfResidence: p.place_of_residence || '',
        registrationDate: new Date(p.registration_date || new Date()),
        status: p.status as Patient['status'] || 'registered',
        priority: p.priority as 'normal' | 'urgent' | 'critical' || 'normal',
        currentDepartment: p.current_department || departments.RECEPTION,
        nextDestination: p.next_destination,
        previousDepartments: p.previous_departments as string[] || [],
        isNewPatient: p.is_new_patient || true,
        waitTime: p.wait_time,
        paymentMethod: p.payment_method as 'cash' | 'mpesa' | 'insurance' | 'bank' || 'cash',
        insuranceProvider: p.insurance_provider,
        insuranceNumber: p.insurance_number,
        mpesaNumber: p.mpesa_number,
        bankReference: p.bank_reference,
        patientType: p.patient_type as 'outpatient' | 'inpatient' | 'emergency',
        opNumber: p.op_number,
        ipNumber: p.ip_number,
        emNumber: p.em_number,
        isEmergency: p.is_emergency || false,
        emergencyType: p.emergency_type as 'trauma' | 'medical' | 'surgical' | 'obstetric' | 'pediatric' | 'other',
        emergencyDescription: p.emergency_description,
        emergencyBroughtBy: p.emergency_brought_by,
        emergencyContactName: p.emergency_contact_name,
        emergencyContactPhone: p.emergency_contact_phone,
        assignedDoctorId: p.assigned_doctor_id,
        assignedDoctorName: p.assigned_doctor_name,
        assignedAt: p.assigned_at,
        // Parse workflow timestamps
        ...(p.workflow_timestamps ? JSON.parse(p.workflow_timestamps as string) : {}),
        // Parse workflow flags
        ...(p.workflow_flags ? JSON.parse(p.workflow_flags as string) : {})
      }));
      
      set({ patientQueue: patients, isLoading: false });
    } catch (error) {
      console.error('Error fetching patients:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
    }
  },
  
  fetchVitalSigns: async (patientId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('vital_signs')
        .select('*')
        .eq('patient_id', patientId)
        .order('recorded_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match our VitalSigns type
      const vitalSigns: VitalSigns[] = data.map(v => ({
        id: v.id,
        bloodPressure: v.blood_pressure,
        pulseRate: v.pulse_rate,
        temperature: v.temperature,
        oxygenSaturation: v.oxygen_saturation,
        respiratoryRate: v.respiratory_rate,
        recordedAt: new Date(v.recorded_at),
        recordedBy: v.recorded_by,
        notes: v.notes || undefined,
        weight: v.weight || undefined,
        height: v.height || undefined,
        bmi: v.bmi || undefined,
        isEmergency: v.is_emergency || false,
        glasgowComaScale: v.glasgow_coma_scale as VitalSigns['glasgowComaScale'] || undefined,
        avpu: v.avpu as 'alert' | 'verbal' | 'pain' | 'unresponsive' || undefined,
        traumaScore: v.trauma_score || undefined
      }));
      
      set(state => ({
        vitalSigns: {
          ...state.vitalSigns,
          [patientId]: vitalSigns
        },
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching vital signs:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
    }
  },
  
  fetchMedicalHistory: async (patientId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('medical_history')
        .select('*')
        .eq('patient_id', patientId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned"
      
      if (data) {
        // Transform data to match our MedicalHistory type
        const medicalHistory: MedicalHistory = {
          id: data.id,
          hasDiabetes: data.has_diabetes || false,
          hasHypertension: data.has_hypertension || false,
          hasHeartDisease: data.has_heart_disease || false,
          hasAsthma: data.has_asthma || false,
          hasCancer: data.has_cancer || false,
          hasSurgeries: data.has_surgeries || false,
          hasAllergies: data.has_allergies || false,
          allergies: data.allergies as string[] || [],
          medications: data.medications as string[] || [],
          familyHistory: data.family_history as string[] || [],
          notes: data.notes || ''
        };
        
        set(state => ({
          medicalHistory: {
            ...state.medicalHistory,
            [patientId]: medicalHistory
          },
          isLoading: false
        }));
      } else {
        // No medical history found
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error fetching medical history:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
    }
  },
  
  fetchConsultations: async (patientId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('consultations')
        .select('*')
        .eq('patient_id', patientId)
        .order('start_time', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match our Consultation type
      const consultations: Consultation[] = data.map(c => ({
        id: c.id,
        patientId: c.patient_id,
        department: c.department,
        doctorId: c.doctor_id,
        doctorName: c.doctor_name,
        startTime: new Date(c.start_time),
        endTime: c.end_time ? new Date(c.end_time) : undefined,
        status: c.status as 'in-progress' | 'completed',
        priority: c.priority as 'normal' | 'urgent' | 'critical' | 'emergency',
        chiefComplaints: c.chief_complaints as string[] || [],
        symptoms: c.symptoms as string[] || [],
        diagnosis: c.diagnosis as string[] || [],
        treatment: c.treatment || '',
        notes: c.notes || '',
        clinicalNotes: c.clinical_notes || undefined,
        labTests: c.lab_tests as Consultation['labTests'] || undefined,
        medications: c.medications as Consultation['medications'] || undefined,
        followUp: c.follow_up as Consultation['followUp'] || undefined,
        sickLeave: c.sick_leave as Consultation['sickLeave'] || undefined,
        departmentSpecific: c.department_specific as Consultation['departmentSpecific'] || undefined,
        timeline: c.timeline as Consultation['timeline'] || undefined,
        nextDepartment: c.next_department || undefined,
        admissionRequired: c.admission_required || false,
        admissionReason: c.admission_reason || undefined,
        admissionNotes: c.admission_notes || undefined,
        isEmergency: c.is_emergency || false,
        emergencyDetails: c.emergency_details as Consultation['emergencyDetails'] || undefined
      }));
      
      set(state => ({
        consultations: {
          ...state.consultations,
          [patientId]: consultations
        },
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching consultations:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
    }
  },
  
  fetchLabTests: async (patientId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('lab_tests')
        .select('*')
        .eq('patient_id', patientId)
        .order('requested_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match our LabTest type
      const labTests: LabTest[] = data.map(t => ({
        id: t.id,
        patientId: t.patient_id,
        testType: t.test_type,
        requestedBy: t.requested_by,
        requestedAt: t.requested_at,
        department: t.department as 'laboratory' | 'radiology',
        priority: t.priority as 'normal' | 'urgent' | 'critical' | 'emergency',
        clinicalInfo: t.clinical_info,
        status: t.status as LabTest['status'],
        returnToDepartment: t.return_to_department,
        sampleId: t.sample_id || undefined,
        sampleType: t.sample_type || undefined,
        sampleCollectedAt: t.sample_collected_at || undefined,
        sampleCollectedBy: t.sample_collected_by || undefined,
        startedAt: t.started_at || undefined,
        machineId: t.machine_id || undefined,
        machineName: t.machine_name || undefined,
        results: t.results as LabTest['results'] || undefined,
        reportDelivery: t.report_delivery as LabTest['reportDelivery'] || undefined,
        notes: t.notes || undefined,
        customFields: t.custom_fields as Record<string, string> || undefined,
        category: t.category || undefined,
        paymentStatus: t.payment_status as 'pending' | 'paid' | 'waived' || undefined,
        inventoryUsed: t.inventory_used as LabTest['inventoryUsed'] || undefined,
        orderTransmissionStatus: t.order_transmission_status as 'ordered' | 'sent' | 'received' | 'completed' || undefined,
        orderTransmissionTime: t.order_transmission_time || undefined,
        orderReceivedTime: t.order_received_time || undefined,
        isEmergency: t.is_emergency || false
      }));
      
      set(state => ({
        labTests: {
          ...state.labTests,
          [patientId]: labTests
        },
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching lab tests:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
    }
  },
  
  fetchPrescriptions: async (patientId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('prescriptions')
        .select('*')
        .eq('patient_id', patientId)
        .order('prescribed_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match our Prescription type
      const prescriptions: Prescription[] = data.map(p => ({
        id: p.id,
        patientId: p.patient_id,
        consultationId: p.consultation_id || null,
        prescribedBy: p.prescribed_by,
        prescribedAt: p.prescribed_at,
        status: p.status as 'pending' | 'stock-verified' | 'dispensed' | 'cancelled',
        medications: p.medications as Prescription['medications'],
        notes: p.notes || undefined,
        dispensedAt: p.dispensed_at || undefined,
        dispensedBy: p.dispensed_by || undefined,
        dispensingNotes: p.dispensing_notes || undefined,
        paymentStatus: p.payment_status as 'pending' | 'completed' | 'waived' || undefined,
        patientInstructions: p.patient_instructions || undefined,
        isEmergency: p.is_emergency || false,
        priority: p.priority as 'normal' | 'urgent' | 'emergency' || 'normal'
      }));
      
      set(state => ({
        prescriptions: {
          ...state.prescriptions,
          [patientId]: prescriptions
        },
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching prescriptions:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
    }
  },
  
  fetchInvoices: async (patientId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match our Invoice type
      const invoices: Invoice[] = data.map(i => ({
        id: i.id,
        patientId: i.patient_id,
        visitId: i.visit_id,
        items: i.items as BillingItem[],
        totalAmount: i.total_amount,
        status: i.status as 'pending' | 'paid' | 'cancelled' | 'waived',
        createdAt: i.created_at,
        dueDate: i.due_date,
        paidAt: i.paid_at || undefined,
        paymentMethod: i.payment_method || undefined,
        paymentReference: i.payment_reference || undefined,
        notes: i.notes || undefined,
        isEmergency: i.is_emergency || false
      }));
      
      set(state => ({
        invoices: {
          ...state.invoices,
          [patientId]: invoices
        },
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching invoices:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
    }
  },
  
  fetchPayments: async (patientId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('patient_id', patientId)
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match our Payment type
      const payments: Payment[] = data.map(p => ({
        id: p.id,
        patientId: p.patient_id,
        invoiceId: p.invoice_id || undefined,
        amount: p.amount,
        method: p.method as 'cash' | 'mpesa' | 'card' | 'insurance' | 'bank',
        reference: p.reference,
        timestamp: p.timestamp,
        receivedBy: p.received_by,
        notes: p.notes || undefined,
        isEmergency: p.is_emergency || false,
        waived: p.waived || false,
        waivedReason: p.waived_reason || undefined,
        waivedBy: p.waived_by || undefined
      }));
      
      set(state => ({
        payments: {
          ...state.payments,
          [patientId]: payments
        },
        isLoading: false
      }));
    } catch (error) {
      console.error('Error fetching payments:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
    }
  },
  
  fetchServiceCharges: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('service_charges')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Transform data to match our ServiceCharge type
      const serviceCharges: ServiceCharge[] = data.map(s => ({
        id: s.id,
        name: s.name,
        department: s.department,
        amount: s.amount,
        category: s.category,
        description: s.description || undefined
      }));
      
      set({ serviceCharges, isLoading: false });
    } catch (error) {
      console.error('Error fetching service charges:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
    }
  },
  
  fetchMedicationStock: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .order('name');
      
      if (error) throw error;
      
      // Transform data to match our MedicationStock type
      const medicationStock: MedicationStock[] = data.map(m => ({
        id: m.id,
        name: m.name,
        category: m.category,
        quantity: m.quantity,
        unit: m.unit,
        minimumStock: m.minimum_stock,
        expiryDate: m.expiry_date || '',
        price: m.price,
        status: m.status as 'in-stock' | 'low-stock' | 'out-of-stock',
        batchNumber: m.batch_number || undefined,
        location: m.location || undefined,
        supplier: m.supplier || undefined,
        reorderLevel: m.reorder_level || undefined,
        lastRestocked: m.last_restocked || undefined,
        notes: m.notes || undefined
      }));
      
      set({ medicationStock, isLoading: false });
    } catch (error) {
      console.error('Error fetching medication stock:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
    }
  },
  
  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('timestamp', { ascending: false });
      
      if (error) throw error;
      
      // Transform data to match our Notification type
      const notifications: Notification[] = data.map(n => ({
        id: n.id,
        type: n.type as Notification['type'],
        title: n.title,
        message: n.message,
        timestamp: n.timestamp,
        read: n.read || false,
        patientId: n.patient_id || undefined,
        testId: n.test_id || undefined,
        prescriptionId: n.prescription_id || undefined,
        invoiceId: n.invoice_id || undefined,
        priority: n.priority as 'normal' | 'high' | 'emergency',
        action: n.action as Notification['action'] || undefined,
        departmentTarget: n.department_target || undefined
      }));
      
      const unreadCount = notifications.filter(n => !n.read).length;
      
      set({ 
        notifications, 
        unreadNotificationsCount: unreadCount,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
    }
  },
  
  // Patient management
  addPatient: async (patient) => {
    set({ isLoading: true, error: null });
    
    try {
      // Prepare workflow timestamps and flags
      const workflowTimestamps: Record<string, string> = {
        registrationTime: new Date().toISOString()
      };
      
      if (patient.isEmergency) {
        workflowTimestamps.emergencyRegistrationTime = new Date().toISOString();
      }
      
      const workflowFlags: Record<string, boolean> = {
        pendingLabTests: false,
        pendingRadiologyTests: false,
        pendingMedications: false,
        pendingPayment: false
      };
      
      // Insert patient into database
      const { data, error } = await supabase
        .from('patients')
        .insert({
          id_number: patient.idNumber,
          full_name: patient.fullName,
          age: patient.age,
          gender: patient.gender,
          email: patient.email,
          phone_number: patient.phoneNumber,
          place_of_residence: patient.placeOfResidence,
          registration_date: new Date().toISOString(),
          status: patient.status || 'registered',
          priority: patient.priority || 'normal',
          current_department: patient.currentDepartment || departments.RECEPTION,
          next_destination: patient.nextDestination,
          previous_departments: patient.previousDepartments || [],
          is_new_patient: patient.isNewPatient || true,
          wait_time: patient.waitTime,
          payment_method: patient.paymentMethod,
          insurance_provider: patient.insuranceProvider,
          insurance_number: patient.insuranceNumber,
          mpesa_number: patient.mpesaNumber,
          bank_reference: patient.bankReference,
          patient_type: patient.patientType,
          op_number: patient.opNumber,
          ip_number: patient.ipNumber,
          em_number: patient.emNumber,
          is_emergency: patient.isEmergency || false,
          emergency_type: patient.emergencyType,
          emergency_description: patient.emergencyDescription,
          emergency_brought_by: patient.emergencyBroughtBy,
          emergency_contact_name: patient.emergencyContactName,
          emergency_contact_phone: patient.emergencyContactPhone,
          workflow_timestamps: workflowTimestamps,
          workflow_flags: workflowFlags
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Fetch updated patient list
      await get().fetchPatients();
      
      set({ isLoading: false });
      
      return data.id;
    } catch (error) {
      console.error('Error adding patient:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  updatePatient: async (patientId, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      // Prepare updates for database
      const dbUpdates: any = {};
      
      // Map fields to database columns
      if (updates.idNumber !== undefined) dbUpdates.id_number = updates.idNumber;
      if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
      if (updates.age !== undefined) dbUpdates.age = updates.age;
      if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
      if (updates.email !== undefined) dbUpdates.email = updates.email;
      if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;
      if (updates.placeOfResidence !== undefined) dbUpdates.place_of_residence = updates.placeOfResidence;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.currentDepartment !== undefined) dbUpdates.current_department = updates.currentDepartment;
      if (updates.nextDestination !== undefined) dbUpdates.next_destination = updates.nextDestination;
      if (updates.previousDepartments !== undefined) dbUpdates.previous_departments = updates.previousDepartments;
      if (updates.isNewPatient !== undefined) dbUpdates.is_new_patient = updates.isNewPatient;
      if (updates.waitTime !== undefined) dbUpdates.wait_time = updates.waitTime;
      if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
      if (updates.insuranceProvider !== undefined) dbUpdates.insurance_provider = updates.insuranceProvider;
      if (updates.insuranceNumber !== undefined) dbUpdates.insurance_number = updates.insuranceNumber;
      if (updates.mpesaNumber !== undefined) dbUpdates.mpesa_number = updates.mpesaNumber;
      if (updates.bankReference !== undefined) dbUpdates.bank_reference = updates.bankReference;
      if (updates.patientType !== undefined) dbUpdates.patient_type = updates.patientType;
      if (updates.opNumber !== undefined) dbUpdates.op_number = updates.opNumber;
      if (updates.ipNumber !== undefined) dbUpdates.ip_number = updates.ipNumber;
      if (updates.emNumber !== undefined) dbUpdates.em_number = updates.emNumber;
      if (updates.isEmergency !== undefined) dbUpdates.is_emergency = updates.isEmergency;
      if (updates.emergencyType !== undefined) dbUpdates.emergency_type = updates.emergencyType;
      if (updates.emergencyDescription !== undefined) dbUpdates.emergency_description = updates.emergencyDescription;
      if (updates.emergencyBroughtBy !== undefined) dbUpdates.emergency_brought_by = updates.emergencyBroughtBy;
      if (updates.emergencyContactName !== undefined) dbUpdates.emergency_contact_name = updates.emergencyContactName;
      if (updates.emergencyContactPhone !== undefined) dbUpdates.emergency_contact_phone = updates.emergencyContactPhone;
      if (updates.assignedDoctorId !== undefined) dbUpdates.assigned_doctor_id = updates.assignedDoctorId;
      if (updates.assignedDoctorName !== undefined) dbUpdates.assigned_doctor_name = updates.assignedDoctorName;
      if (updates.assignedAt !== undefined) dbUpdates.assigned_at = updates.assignedAt;
      
      // Get current patient to update workflow timestamps and flags
      const { data: currentPatient, error: fetchError } = await supabase
        .from('patients')
        .select('workflow_timestamps, workflow_flags')
        .eq('id', patientId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update workflow timestamps
      const workflowTimestamps = currentPatient.workflow_timestamps || {};
      const timestampUpdates: Record<string, string> = {};
      
      // Check for timestamp updates
      const timestampFields = [
        'registrationTime', 'activationTime', 'triageTime', 'inTriageTime', 'triageCompleteTime',
        'underConsultationTime', 'inConsultationTime', 'consultationCompleteTime',
        'awaitingPaymentLabTime', 'awaitingPaymentRadiologyTime', 'sentToLabTime', 'sentToRadiologyTime',
        'waitingForLabTime', 'inLabTime', 'labCompleteTime', 'waitingForLabResultsTime', 'labResultsReceivedTime',
        'waitingForRadiologyTime', 'inRadiologyTime', 'radiologyCompleteTime', 'underTreatmentTime',
        'underConsultationReviewTime', 'readyForDischargeTime', 'awaitingPaymentMedicationTime',
        'inPharmacyTime', 'pharmacyCompleteTime', 'medicationDispensedTime', 'awaitingPaymentTime',
        'paymentCompleteTime', 'dischargedTime', 'emergencyRegistrationTime', 'emergencyTriageTime',
        'emergencyDoctorAssignedTime', 'emergencyStabilizationTime', 'emergencyOutcomeTime'
      ];
      
      timestampFields.forEach(field => {
        if (updates[field as keyof typeof updates] !== undefined) {
          timestampUpdates[field] = updates[field as keyof typeof updates] as string;
        }
      });
      
      if (Object.keys(timestampUpdates).length > 0) {
        dbUpdates.workflow_timestamps = {
          ...workflowTimestamps,
          ...timestampUpdates
        };
      }
      
      // Update workflow flags
      const workflowFlags = currentPatient.workflow_flags || {};
      const flagUpdates: Record<string, boolean> = {};
      
      // Check for flag updates
      const flagFields = [
        'pendingLabTests', 'pendingRadiologyTests', 'pendingMedications', 'pendingPayment',
        'labTestsCompleted', 'radiologyTestsCompleted', 'medicationsDispensed', 'paymentCompleted',
        'isCompleted'
      ];
      
      flagFields.forEach(field => {
        if (updates[field as keyof typeof updates] !== undefined) {
          flagUpdates[field] = updates[field as keyof typeof updates] as boolean;
        }
      });
      
      if (Object.keys(flagUpdates).length > 0) {
        dbUpdates.workflow_flags = {
          ...workflowFlags,
          ...flagUpdates
        };
      }
      
      // Update patient in database
      const { error: updateError } = await supabase
        .from('patients')
        .update(dbUpdates)
        .eq('id', patientId);
      
      if (updateError) throw updateError;
      
      // Update local state
      set(state => {
        const updatedQueue = state.patientQueue.map(p => 
          p.id === patientId ? { ...p, ...updates } : p
        );
        
        return {
          patientQueue: updatedQueue,
          currentPatient: state.currentPatient?.id === patientId 
            ? { ...state.currentPatient, ...updates } 
            : state.currentPatient,
          isLoading: false
        };
      });
    } catch (error) {
      console.error('Error updating patient:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  removePatient: async (patientId) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', patientId);
      
      if (error) throw error;
      
      // Update local state
      set(state => ({
        patientQueue: state.patientQueue.filter(p => p.id !== patientId),
        currentPatient: state.currentPatient?.id === patientId ? null : state.currentPatient,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error removing patient:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  updatePatientStatus: async (patientId, status, priority) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get current patient to update workflow timestamps
      const { data: currentPatient, error: fetchError } = await supabase
        .from('patients')
        .select('workflow_timestamps, workflow_flags')
        .eq('id', patientId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update status-specific timestamps
      const workflowTimestamps = currentPatient.workflow_timestamps || {};
      
      switch (status) {
        case 'activated':
          workflowTimestamps.activationTime = new Date().toISOString();
          break;
        case 'in-triage':
          workflowTimestamps.inTriageTime = new Date().toISOString();
          break;
        case 'triage-complete':
          workflowTimestamps.triageCompleteTime = new Date().toISOString();
          break;
        case 'in-consultation':
          workflowTimestamps.inConsultationTime = new Date().toISOString();
          break;
        case 'consultation-complete':
          workflowTimestamps.consultationCompleteTime = new Date().toISOString();
          break;
        case 'waiting-for-lab':
          workflowTimestamps.waitingForLabTime = new Date().toISOString();
          break;
        case 'in-lab':
          workflowTimestamps.inLabTime = new Date().toISOString();
          break;
        case 'lab-complete':
          workflowTimestamps.labCompleteTime = new Date().toISOString();
          break;
        case 'waiting-for-lab-results':
          workflowTimestamps.waitingForLabResultsTime = new Date().toISOString();
          break;
        case 'lab-results-received':
          workflowTimestamps.labResultsReceivedTime = new Date().toISOString();
          break;
        case 'waiting-for-radiology':
          workflowTimestamps.waitingForRadiologyTime = new Date().toISOString();
          break;
        case 'in-radiology':
          workflowTimestamps.inRadiologyTime = new Date().toISOString();
          break;
        case 'radiology-complete':
          workflowTimestamps.radiologyCompleteTime = new Date().toISOString();
          break;
        case 'under-treatment':
          workflowTimestamps.underTreatmentTime = new Date().toISOString();
          break;
        case 'ready-for-discharge':
          workflowTimestamps.readyForDischargeTime = new Date().toISOString();
          break;
        case 'in-pharmacy':
          workflowTimestamps.inPharmacyTime = new Date().toISOString();
          break;
        case 'pharmacy-complete':
          workflowTimestamps.pharmacyCompleteTime = new Date().toISOString();
          break;
        case 'medication-dispensed':
          workflowTimestamps.medicationDispensedTime = new Date().toISOString();
          break;
        case 'awaiting-payment':
          workflowTimestamps.awaitingPaymentTime = new Date().toISOString();
          break;
        case 'payment-complete':
          workflowTimestamps.paymentCompleteTime = new Date().toISOString();
          break;
        case 'discharged':
          workflowTimestamps.dischargedTime = new Date().toISOString();
          // Update workflow flags for completion
          currentPatient.workflow_flags = {
            ...currentPatient.workflow_flags,
            isCompleted: true
          };
          break;
      }
      
      // Update patient in database
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          status,
          ...(priority ? { priority } : {}),
          workflow_timestamps: workflowTimestamps,
          workflow_flags: currentPatient.workflow_flags
        })
        .eq('id', patientId);
      
      if (updateError) throw updateError;
      
      // Update local state
      set(state => {
        const updatedQueue = state.patientQueue.map(p => 
          p.id === patientId 
            ? { 
                ...p, 
                status, 
                ...(priority ? { priority } : {}),
                ...Object.fromEntries(
                  Object.entries(workflowTimestamps).filter(([key]) => 
                    !Object.keys(p).includes(key) || p[key as keyof Patient] !== workflowTimestamps[key]
                  )
                ),
                ...(status === 'discharged' ? { isCompleted: true } : {})
              } 
            : p
        );
        
        return {
          patientQueue: updatedQueue,
          currentPatient: state.currentPatient?.id === patientId 
            ? { 
                ...state.currentPatient, 
                status, 
                ...(priority ? { priority } : {}),
                ...Object.fromEntries(
                  Object.entries(workflowTimestamps).filter(([key]) => 
                    !Object.keys(state.currentPatient!).includes(key) || 
                    state.currentPatient![key as keyof Patient] !== workflowTimestamps[key]
                  )
                ),
                ...(status === 'discharged' ? { isCompleted: true } : {})
              } 
            : state.currentPatient,
          isLoading: false
        };
      });
    } catch (error) {
      console.error('Error updating patient status:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  movePatientToNextDepartment: async (patientId, nextDepartment) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get current patient
      const { data: currentPatient, error: fetchError } = await supabase
        .from('patients')
        .select('current_department, previous_departments')
        .eq('id', patientId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Update previous departments
      const previousDepartments = currentPatient.previous_departments || [];
      if (currentPatient.current_department && !previousDepartments.includes(currentPatient.current_department)) {
        previousDepartments.push(currentPatient.current_department);
      }
      
      // Update patient in database
      const { error: updateError } = await supabase
        .from('patients')
        .update({
          current_department: nextDepartment,
          previous_departments: previousDepartments,
          next_destination: null
        })
        .eq('id', patientId);
      
      if (updateError) throw updateError;
      
      // Update local state
      set(state => {
        const updatedQueue = state.patientQueue.map(p => 
          p.id === patientId 
            ? { 
                ...p, 
                currentDepartment: nextDepartment,
                previousDepartments: [
                  ...(p.previousDepartments || []),
                  ...(p.currentDepartment && !p.previousDepartments?.includes(p.currentDepartment) 
                    ? [p.currentDepartment] 
                    : [])
                ],
                nextDestination: null
              } 
            : p
        );
        
        return {
          patientQueue: updatedQueue,
          currentPatient: state.currentPatient?.id === patientId 
            ? { 
                ...state.currentPatient, 
                currentDepartment: nextDepartment,
                previousDepartments: [
                  ...(state.currentPatient.previousDepartments || []),
                  ...(state.currentPatient.currentDepartment && 
                    !state.currentPatient.previousDepartments?.includes(state.currentPatient.currentDepartment) 
                    ? [state.currentPatient.currentDepartment] 
                    : [])
                ],
                nextDestination: null
              } 
            : state.currentPatient,
          isLoading: false
        };
      });
    } catch (error) {
      console.error('Error moving patient to next department:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  removeFromQueue: async (patientId) => {
    // This is just a UI operation, not a database operation
    set(state => ({
      patientQueue: state.patientQueue.filter(p => p.id !== patientId)
    }));
  },
  
  // Vital signs
  updateVitalSigns: async (patientId, vitals) => {
    set({ isLoading: true, error: null });
    
    try {
      // Insert vital signs into database
      const { data, error } = await supabase
        .from('vital_signs')
        .insert({
          patient_id: patientId,
          blood_pressure: vitals.bloodPressure,
          pulse_rate: vitals.pulseRate,
          temperature: vitals.temperature,
          oxygen_saturation: vitals.oxygenSaturation,
          respiratory_rate: vitals.respiratoryRate,
          recorded_at: vitals.recordedAt.toISOString(),
          recorded_by: vitals.recordedBy,
          notes: vitals.notes,
          weight: vitals.weight,
          height: vitals.height,
          bmi: vitals.bmi,
          is_emergency: vitals.isEmergency,
          glasgow_coma_scale: vitals.glasgowComaScale,
          avpu: vitals.avpu,
          trauma_score: vitals.traumaScore
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Fetch updated vital signs
      await get().fetchVitalSigns(patientId);
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Error updating vital signs:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  // Medical history
  updateMedicalHistory: async (patientId, history) => {
    set({ isLoading: true, error: null });
    
    try {
      // Check if medical history already exists
      const { data: existingHistory, error: fetchError } = await supabase
        .from('medical_history')
        .select('id')
        .eq('patient_id', patientId)
        .maybeSingle();
      
      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;
      
      let result;
      
      if (existingHistory) {
        // Update existing medical history
        result = await supabase
          .from('medical_history')
          .update({
            has_diabetes: history.hasDiabetes,
            has_hypertension: history.hasHypertension,
            has_heart_disease: history.hasHeartDisease,
            has_asthma: history.hasAsthma,
            has_cancer: history.hasCancer,
            has_surgeries: history.hasSurgeries,
            has_allergies: history.hasAllergies,
            allergies: history.allergies,
            medications: history.medications,
            family_history: history.familyHistory,
            notes: history.notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingHistory.id)
          .select('id')
          .single();
      } else {
        // Insert new medical history
        result = await supabase
          .from('medical_history')
          .insert({
            patient_id: patientId,
            has_diabetes: history.hasDiabetes,
            has_hypertension: history.hasHypertension,
            has_heart_disease: history.hasHeartDisease,
            has_asthma: history.hasAsthma,
            has_cancer: history.hasCancer,
            has_surgeries: history.hasSurgeries,
            has_allergies: history.hasAllergies,
            allergies: history.allergies,
            medications: history.medications,
            family_history: history.familyHistory,
            notes: history.notes
          })
          .select('id')
          .single();
      }
      
      if (result.error) throw result.error;
      
      // Fetch updated medical history
      await get().fetchMedicalHistory(patientId);
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Error updating medical history:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  // Consultations
  createConsultation: async (consultation) => {
    set({ isLoading: true, error: null });
    
    try {
      // Insert consultation into database
      const { data, error } = await supabase
        .from('consultations')
        .insert({
          patient_id: consultation.patientId,
          department: consultation.department,
          doctor_id: consultation.doctorId,
          doctor_name: consultation.doctorName,
          start_time: consultation.startTime.toISOString(),
          end_time: consultation.endTime?.toISOString(),
          status: consultation.status,
          priority: consultation.priority,
          chief_complaints: consultation.chiefComplaints,
          symptoms: consultation.symptoms,
          diagnosis: consultation.diagnosis,
          treatment: consultation.treatment,
          notes: consultation.notes,
          clinical_notes: consultation.clinicalNotes,
          lab_tests: consultation.labTests,
          medications: consultation.medications,
          follow_up: consultation.followUp,
          sick_leave: consultation.sickLeave,
          department_specific: consultation.departmentSpecific,
          timeline: consultation.timeline,
          next_department: consultation.nextDepartment,
          admission_required: consultation.admissionRequired,
          admission_reason: consultation.admissionReason,
          admission_notes: consultation.admissionNotes,
          is_emergency: consultation.isEmergency,
          emergency_details: consultation.emergencyDetails
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Fetch updated consultations
      await get().fetchConsultations(consultation.patientId);
      
      set({ isLoading: false });
      
      return data.id;
    } catch (error) {
      console.error('Error creating consultation:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  updateConsultation: async (consultationId, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get current consultation to find patient ID
      const { data: currentConsultation, error: fetchError } = await supabase
        .from('consultations')
        .select('patient_id')
        .eq('id', consultationId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Prepare updates for database
      const dbUpdates: any = {};
      
      // Map fields to database columns
      if (updates.department !== undefined) dbUpdates.department = updates.department;
      if (updates.doctorId !== undefined) dbUpdates.doctor_id = updates.doctorId;
      if (updates.doctorName !== undefined) dbUpdates.doctor_name = updates.doctorName;
      if (updates.startTime !== undefined) dbUpdates.start_time = updates.startTime.toISOString();
      if (updates.endTime !== undefined) dbUpdates.end_time = updates.endTime.toISOString();
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.chiefComplaints !== undefined) dbUpdates.chief_complaints = updates.chiefComplaints;
      if (updates.symptoms !== undefined) dbUpdates.symptoms = updates.symptoms;
      if (updates.diagnosis !== undefined) dbUpdates.diagnosis = updates.diagnosis;
      if (updates.treatment !== undefined) dbUpdates.treatment = updates.treatment;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.clinicalNotes !== undefined) dbUpdates.clinical_notes = updates.clinicalNotes;
      if (updates.labTests !== undefined) dbUpdates.lab_tests = updates.labTests;
      if (updates.medications !== undefined) dbUpdates.medications = updates.medications;
      if (updates.followUp !== undefined) dbUpdates.follow_up = updates.followUp;
      if (updates.sickLeave !== undefined) dbUpdates.sick_leave = updates.sickLeave;
      if (updates.departmentSpecific !== undefined) dbUpdates.department_specific = updates.departmentSpecific;
      if (updates.timeline !== undefined) dbUpdates.timeline = updates.timeline;
      if (updates.nextDepartment !== undefined) dbUpdates.next_department = updates.nextDepartment;
      if (updates.admissionRequired !== undefined) dbUpdates.admission_required = updates.admissionRequired;
      if (updates.admissionReason !== undefined) dbUpdates.admission_reason = updates.admissionReason;
      if (updates.admissionNotes !== undefined) dbUpdates.admission_notes = updates.admissionNotes;
      if (updates.isEmergency !== undefined) dbUpdates.is_emergency = updates.isEmergency;
      if (updates.emergencyDetails !== undefined) dbUpdates.emergency_details = updates.emergencyDetails;
      
      // Update consultation in database
      const { error: updateError } = await supabase
        .from('consultations')
        .update(dbUpdates)
        .eq('id', consultationId);
      
      if (updateError) throw updateError;
      
      // Fetch updated consultations
      await get().fetchConsultations(currentConsultation.patient_id);
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Error updating consultation:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  getCurrentConsultation: (consultationId) => {
    const state = get();
    
    // Search through all consultations to find the one with matching ID
    for (const patientId in state.consultations) {
      const consultation = state.consultations[patientId].find(c => c.id === consultationId);
      if (consultation) return consultation;
    }
    
    return null;
  },
  
  // Lab tests
  createLabRequest: async (labTest) => {
    set({ isLoading: true, error: null });
    
    try {
      // Insert lab test into database
      const { data, error } = await supabase
        .from('lab_tests')
        .insert({
          patient_id: labTest.patientId,
          test_type: labTest.testType,
          requested_by: labTest.requestedBy,
          requested_at: labTest.requestedAt,
          department: labTest.department,
          priority: labTest.priority,
          clinical_info: labTest.clinicalInfo,
          status: labTest.status,
          return_to_department: labTest.returnToDepartment,
          sample_id: labTest.sampleId,
          sample_type: labTest.sampleType,
          sample_collected_at: labTest.sampleCollectedAt,
          sample_collected_by: labTest.sampleCollectedBy,
          started_at: labTest.startedAt,
          machine_id: labTest.machineId,
          machine_name: labTest.machineName,
          results: labTest.results,
          report_delivery: labTest.reportDelivery,
          notes: labTest.notes,
          custom_fields: labTest.customFields,
          category: labTest.category,
          payment_status: labTest.paymentStatus,
          inventory_used: labTest.inventoryUsed,
          order_transmission_status: labTest.orderTransmissionStatus,
          order_transmission_time: labTest.orderTransmissionTime,
          order_received_time: labTest.orderReceivedTime,
          is_emergency: labTest.isEmergency
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Fetch updated lab tests
      await get().fetchLabTests(labTest.patientId);
      
      set({ isLoading: false });
      
      return data.id;
    } catch (error) {
      console.error('Error creating lab request:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  updateLabTest: async (labTestId, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get current lab test to find patient ID
      const { data: currentTest, error: fetchError } = await supabase
        .from('lab_tests')
        .select('patient_id')
        .eq('id', labTestId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Prepare updates for database
      const dbUpdates: any = {};
      
      // Map fields to database columns
      if (updates.testType !== undefined) dbUpdates.test_type = updates.testType;
      if (updates.requestedBy !== undefined) dbUpdates.requested_by = updates.requestedBy;
      if (updates.requestedAt !== undefined) dbUpdates.requested_at = updates.requestedAt;
      if (updates.department !== undefined) dbUpdates.department = updates.department;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      if (updates.clinicalInfo !== undefined) dbUpdates.clinical_info = updates.clinicalInfo;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.returnToDepartment !== undefined) dbUpdates.return_to_department = updates.returnToDepartment;
      if (updates.sampleId !== undefined) dbUpdates.sample_id = updates.sampleId;
      if (updates.sampleType !== undefined) dbUpdates.sample_type = updates.sampleType;
      if (updates.sampleCollectedAt !== undefined) dbUpdates.sample_collected_at = updates.sampleCollectedAt;
      if (updates.sampleCollectedBy !== undefined) dbUpdates.sample_collected_by = updates.sampleCollectedBy;
      if (updates.startedAt !== undefined) dbUpdates.started_at = updates.startedAt;
      if (updates.machineId !== undefined) dbUpdates.machine_id = updates.machineId;
      if (updates.machineName !== undefined) dbUpdates.machine_name = updates.machineName;
      if (updates.results !== undefined) dbUpdates.results = updates.results;
      if (updates.reportDelivery !== undefined) dbUpdates.report_delivery = updates.reportDelivery;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.customFields !== undefined) dbUpdates.custom_fields = updates.customFields;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
      if (updates.inventoryUsed !== undefined) dbUpdates.inventory_used = updates.inventoryUsed;
      if (updates.orderTransmissionStatus !== undefined) dbUpdates.order_transmission_status = updates.orderTransmissionStatus;
      if (updates.orderTransmissionTime !== undefined) dbUpdates.order_transmission_time = updates.orderTransmissionTime;
      if (updates.orderReceivedTime !== undefined) dbUpdates.order_received_time = updates.orderReceivedTime;
      if (updates.isEmergency !== undefined) dbUpdates.is_emergency = updates.isEmergency;
      
      // Update lab test in database
      const { error: updateError } = await supabase
        .from('lab_tests')
        .update(dbUpdates)
        .eq('id', labTestId);
      
      if (updateError) throw updateError;
      
      // Fetch updated lab tests
      await get().fetchLabTests(currentTest.patient_id);
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Error updating lab test:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  // Prescriptions
  createPrescription: async (prescription) => {
    set({ isLoading: true, error: null });
    
    try {
      // Insert prescription into database
      const { data, error } = await supabase
        .from('prescriptions')
        .insert({
          patient_id: prescription.patientId,
          consultation_id: prescription.consultationId,
          prescribed_by: prescription.prescribedBy,
          prescribed_at: prescription.prescribedAt,
          status: prescription.status,
          medications: prescription.medications,
          notes: prescription.notes,
          dispensed_at: prescription.dispensedAt,
          dispensed_by: prescription.dispensedBy,
          dispensing_notes: prescription.dispensingNotes,
          payment_status: prescription.paymentStatus,
          patient_instructions: prescription.patientInstructions,
          is_emergency: prescription.isEmergency,
          priority: prescription.priority
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Fetch updated prescriptions
      await get().fetchPrescriptions(prescription.patientId);
      
      set({ isLoading: false });
      
      return data.id;
    } catch (error) {
      console.error('Error creating prescription:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  updatePrescription: async (prescriptionId, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get current prescription to find patient ID
      const { data: currentPrescription, error: fetchError } = await supabase
        .from('prescriptions')
        .select('patient_id')
        .eq('id', prescriptionId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Prepare updates for database
      const dbUpdates: any = {};
      
      // Map fields to database columns
      if (updates.consultationId !== undefined) dbUpdates.consultation_id = updates.consultationId;
      if (updates.prescribedBy !== undefined) dbUpdates.prescribed_by = updates.prescribedBy;
      if (updates.prescribedAt !== undefined) dbUpdates.prescribed_at = updates.prescribedAt;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.medications !== undefined) dbUpdates.medications = updates.medications;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.dispensedAt !== undefined) dbUpdates.dispensed_at = updates.dispensedAt;
      if (updates.dispensedBy !== undefined) dbUpdates.dispensed_by = updates.dispensedBy;
      if (updates.dispensingNotes !== undefined) dbUpdates.dispensing_notes = updates.dispensingNotes;
      if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
      if (updates.patientInstructions !== undefined) dbUpdates.patient_instructions = updates.patientInstructions;
      if (updates.isEmergency !== undefined) dbUpdates.is_emergency = updates.isEmergency;
      if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
      
      // Update prescription in database
      const { error: updateError } = await supabase
        .from('prescriptions')
        .update(dbUpdates)
        .eq('id', prescriptionId);
      
      if (updateError) throw updateError;
      
      // Fetch updated prescriptions
      await get().fetchPrescriptions(currentPrescription.patient_id);
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Error updating prescription:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  // Billing
  createInvoice: async (invoice) => {
    set({ isLoading: true, error: null });
    
    try {
      // Insert invoice into database
      const { data, error } = await supabase
        .from('invoices')
        .insert({
          patient_id: invoice.patientId,
          visit_id: invoice.visitId,
          items: invoice.items,
          total_amount: invoice.totalAmount,
          status: invoice.status,
          created_at: invoice.createdAt,
          due_date: invoice.dueDate,
          paid_at: invoice.paidAt,
          payment_method: invoice.paymentMethod,
          payment_reference: invoice.paymentReference,
          notes: invoice.notes,
          is_emergency: invoice.isEmergency
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Fetch updated invoices
      await get().fetchInvoices(invoice.patientId);
      
      set({ isLoading: false });
      
      return data.id;
    } catch (error) {
      console.error('Error creating invoice:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  updateInvoice: async (invoiceId, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get current invoice to find patient ID
      const { data: currentInvoice, error: fetchError } = await supabase
        .from('invoices')
        .select('patient_id')
        .eq('id', invoiceId)
        .single();
      
      if (fetchError) throw fetchError;
      
      // Prepare updates for database
      const dbUpdates: any = {};
      
      // Map fields to database columns
      if (updates.visitId !== undefined) dbUpdates.visit_id = updates.visitId;
      if (updates.items !== undefined) dbUpdates.items = updates.items;
      if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.dueDate !== undefined) dbUpdates.due_date = updates.dueDate;
      if (updates.paidAt !== undefined) dbUpdates.paid_at = updates.paidAt;
      if (updates.paymentMethod !== undefined) dbUpdates.payment_method = updates.paymentMethod;
      if (updates.paymentReference !== undefined) dbUpdates.payment_reference = updates.paymentReference;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      if (updates.isEmergency !== undefined) dbUpdates.is_emergency = updates.isEmergency;
      
      // Update invoice in database
      const { error: updateError } = await supabase
        .from('invoices')
        .update(dbUpdates)
        .eq('id', invoiceId);
      
      if (updateError) throw updateError;
      
      // Fetch updated invoices
      await get().fetchInvoices(currentInvoice.patient_id);
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Error updating invoice:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  addPayment: async (payment) => {
    set({ isLoading: true, error: null });
    
    try {
      // Insert payment into database
      const { data, error } = await supabase
        .from('payments')
        .insert({
          patient_id: payment.patientId,
          invoice_id: payment.invoiceId,
          amount: payment.amount,
          method: payment.method,
          reference: payment.reference,
          timestamp: payment.timestamp,
          received_by: payment.receivedBy,
          notes: payment.notes,
          is_emergency: payment.isEmergency,
          waived: payment.waived,
          waived_reason: payment.waivedReason,
          waived_by: payment.waivedBy
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // If this payment is for an invoice, update the invoice status
      if (payment.invoiceId) {
        const { error: updateError } = await supabase
          .from('invoices')
          .update({
            status: 'paid',
            paid_at: new Date().toISOString(),
            payment_method: payment.method,
            payment_reference: payment.reference
          })
          .eq('id', payment.invoiceId);
        
        if (updateError) throw updateError;
      }
      
      // Fetch updated payments and invoices
      await get().fetchPayments(payment.patientId);
      if (payment.invoiceId) {
        await get().fetchInvoices(payment.patientId);
      }
      
      set({ isLoading: false });
      
      return data.id;
    } catch (error) {
      console.error('Error adding payment:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  updateServiceCharge: async (serviceId, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      // Prepare updates for database
      const dbUpdates: any = {};
      
      // Map fields to database columns
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.department !== undefined) dbUpdates.department = updates.department;
      if (updates.amount !== undefined) dbUpdates.amount = updates.amount;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.description !== undefined) dbUpdates.description = updates.description;
      
      // Update service charge in database
      const { error } = await supabase
        .from('service_charges')
        .update(dbUpdates)
        .eq('id', serviceId);
      
      if (error) throw error;
      
      // Fetch updated service charges
      await get().fetchServiceCharges();
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Error updating service charge:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  addServiceCharge: async (service) => {
    set({ isLoading: true, error: null });
    
    try {
      // Insert service charge into database
      const { data, error } = await supabase
        .from('service_charges')
        .insert({
          name: service.name,
          department: service.department,
          amount: service.amount,
          category: service.category,
          description: service.description
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Fetch updated service charges
      await get().fetchServiceCharges();
      
      set({ isLoading: false });
      
      return data.id;
    } catch (error) {
      console.error('Error adding service charge:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  // Inventory
  updateMedicationStock: async (medicationId, updates) => {
    set({ isLoading: true, error: null });
    
    try {
      // Prepare updates for database
      const dbUpdates: any = {};
      
      // Map fields to database columns
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.quantity !== undefined) dbUpdates.quantity = updates.quantity;
      if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
      if (updates.minimumStock !== undefined) dbUpdates.minimum_stock = updates.minimumStock;
      if (updates.expiryDate !== undefined) dbUpdates.expiry_date = updates.expiryDate;
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.status !== undefined) dbUpdates.status = updates.status;
      if (updates.batchNumber !== undefined) dbUpdates.batch_number = updates.batchNumber;
      if (updates.location !== undefined) dbUpdates.location = updates.location;
      if (updates.supplier !== undefined) dbUpdates.supplier = updates.supplier;
      if (updates.reorderLevel !== undefined) dbUpdates.reorder_level = updates.reorderLevel;
      if (updates.lastRestocked !== undefined) dbUpdates.last_restocked = updates.lastRestocked;
      if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
      
      // Update medication stock in database
      const { error } = await supabase
        .from('medications')
        .update(dbUpdates)
        .eq('id', medicationId);
      
      if (error) throw error;
      
      // Fetch updated medication stock
      await get().fetchMedicationStock();
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Error updating medication stock:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  addMedicationStock: async (medication) => {
    set({ isLoading: true, error: null });
    
    try {
      // Insert medication stock into database
      const { data, error } = await supabase
        .from('medications')
        .insert({
          name: medication.name,
          category: medication.category,
          quantity: medication.quantity,
          unit: medication.unit,
          minimum_stock: medication.minimumStock,
          expiry_date: medication.expiryDate,
          price: medication.price,
          status: medication.status,
          batch_number: medication.batchNumber,
          location: medication.location,
          supplier: medication.supplier,
          reorder_level: medication.reorderLevel,
          last_restocked: medication.lastRestocked,
          notes: medication.notes
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Fetch updated medication stock
      await get().fetchMedicationStock();
      
      set({ isLoading: false });
      
      return data.id;
    } catch (error) {
      console.error('Error adding medication stock:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  // Notifications
  addNotification: async (notification) => {
    set({ isLoading: true, error: null });
    
    try {
      // Insert notification into database
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          type: notification.type,
          title: notification.title,
          message: notification.message,
          timestamp: notification.timestamp,
          read: notification.read,
          patient_id: notification.patientId,
          test_id: notification.testId,
          prescription_id: notification.prescriptionId,
          invoice_id: notification.invoiceId,
          priority: notification.priority,
          action: notification.action,
          department_target: notification.departmentTarget
        })
        .select('id')
        .single();
      
      if (error) throw error;
      
      // Fetch updated notifications
      await get().fetchNotifications();
      
      set({ isLoading: false });
      
      return data.id;
    } catch (error) {
      console.error('Error adding notification:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  markNotificationAsRead: async (notificationId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Update notification in database
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);
      
      if (error) throw error;
      
      // Update local state
      set(state => {
        const wasUnread = state.notifications.find(n => n.id === notificationId && !n.read);
        
        return {
          notifications: state.notifications.map(n => 
            n.id === notificationId ? { ...n, read: true } : n
          ),
          unreadNotificationsCount: wasUnread 
            ? Math.max(0, state.unreadNotificationsCount - 1) 
            : state.unreadNotificationsCount,
          isLoading: false
        };
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  markAllNotificationsAsRead: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Update all notifications in database
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('read', false);
      
      if (error) throw error;
      
      // Update local state
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadNotificationsCount: 0,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  clearAllNotifications: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Delete all notifications in database
      const { error } = await supabase
        .from('notifications')
        .delete()
        .neq('id', '0'); // Delete all notifications
      
      if (error) throw error;
      
      // Update local state
      set({ 
        notifications: [], 
        unreadNotificationsCount: 0,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error clearing all notifications:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  // Department stats
  updateDepartmentStats: (department) => {
    set((state) => {
      const departmentPatients = state.patientQueue.filter(p => p.currentDepartment === department);
      
      const waitingPatients = departmentPatients.filter(p => 
        p.status === 'registered' || 
        p.status === 'activated' || 
        p.status === 'triage-complete' ||
        p.status === 'waiting-for-lab' ||
        p.status === 'waiting-for-radiology'
      ).length;
      
      const inProgressPatients = departmentPatients.filter(p => 
        p.status === 'in-triage' || 
        p.status === 'in-consultation' || 
        p.status === 'in-lab' || 
        p.status === 'in-radiology' ||
        p.status === 'in-pharmacy'
      ).length;
      
      const completedPatients = departmentPatients.filter(p => 
        p.status === 'triage-complete' || 
        p.status === 'consultation-complete' || 
        p.status === 'lab-complete' || 
        p.status === 'radiology-complete' ||
        p.status === 'pharmacy-complete' ||
        p.status === 'discharged'
      ).length;
      
      // Calculate average wait time (mock data for now)
      const averageWaitTime = Math.floor(Math.random() * 30) + 5; // 5-35 minutes
      
      return {
        departmentStats: {
          ...state.departmentStats,
          [department]: {
            waitingPatients,
            inProgressPatients,
            completedPatients,
            averageWaitTime
          }
        }
      };
    });
  },
  
  // Triage
  calculateTriagePriority: (vitals) => {
    // Simple triage algorithm based on vital signs
    const { bloodPressure, pulseRate, temperature, oxygenSaturation, respiratoryRate } = vitals;
    
    // Parse blood pressure
    const bpParts = bloodPressure.split('/');
    const systolic = parseInt(bpParts[0], 10);
    const diastolic = parseInt(bpParts[1], 10);
    
    // Check for critical conditions
    if (
      systolic > 180 || systolic < 90 ||
      diastolic > 120 || diastolic < 60 ||
      temperature > 39.5 ||
      oxygenSaturation < 90 ||
      pulseRate > 120 || pulseRate < 50 ||
      respiratoryRate > 30 || respiratoryRate < 10
    ) {
      return 'critical';
    }
    
    // Check for urgent conditions
    if (
      (systolic > 160 || systolic < 100) ||
      (diastolic > 100 || diastolic < 65) ||
      temperature > 38.5 ||
      oxygenSaturation < 94 ||
      pulseRate > 100 || pulseRate < 55 ||
      respiratoryRate > 24 || respiratoryRate < 12
    ) {
      return 'urgent';
    }
    
    // Otherwise normal
    return 'normal';
  },
  
  suggestDepartment: (symptoms) => {
    // Simple department suggestion based on symptoms
    const symptomDepartmentMap: Record<string, string> = {
      'chest pain': departments.CARDIOLOGY,
      'heart': departments.CARDIOLOGY,
      'palpitations': departments.CARDIOLOGY,
      
      'child': departments.PEDIATRICS,
      'baby': departments.PEDIATRICS,
      'infant': departments.PEDIATRICS,
      
      'pregnancy': departments.GYNECOLOGY,
      'menstrual': departments.GYNECOLOGY,
      'gynecological': departments.GYNECOLOGY,
      
      'fracture': departments.ORTHOPEDIC,
      'bone': departments.ORTHOPEDIC,
      'joint': departments.ORTHOPEDIC,
      
      'tooth': departments.DENTAL,
      'teeth': departments.DENTAL,
      'gum': departments.DENTAL,
      
      'eye': departments.EYE,
      'vision': departments.EYE,
      'seeing': departments.EYE,
      
      'muscle': departments.PHYSIOTHERAPY,
      'physical therapy': departments.PHYSIOTHERAPY,
      'rehabilitation': departments.PHYSIOTHERAPY
    };
    
    // Check each symptom against the map
    for (const symptom of symptoms) {
      for (const [key, dept] of Object.entries(symptomDepartmentMap)) {
        if (symptom.toLowerCase().includes(key)) {
          return dept;
        }
      }
    }
    
    // Default to general consultation
    return departments.GENERAL;
  },
  
  // Workflow management
  getDepartmentQueue: (department) => {
    const state = get();
    return state.patientQueue.filter(p => p.currentDepartment === department);
  },
  
  updateParallelWorkflow: async (patientId, updates) => {
    // This is a wrapper around updatePatient that focuses on workflow flags
    await get().updatePatient(patientId, updates);
  },
  
  assignPatientToDoctor: async (patientId, doctorId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Get doctor name from users table
      const { data: doctor, error: doctorError } = await supabase
        .from('users')
        .select('name')
        .eq('id', doctorId)
        .single();
      
      if (doctorError) throw doctorError;
      
      const doctorName = doctor?.name || 'Unknown Doctor';
      const assignedAt = new Date().toISOString();
      
      // Update patient in database
      const { error } = await supabase
        .from('patients')
        .update({
          assigned_doctor_id: doctorId,
          assigned_doctor_name: doctorName,
          assigned_at: assignedAt
        })
        .eq('id', patientId);
      
      if (error) throw error;
      
      // Update local state
      set(state => ({
        patientQueue: state.patientQueue.map(p => 
          p.id === patientId 
            ? { 
                ...p, 
                assignedDoctorId: doctorId,
                assignedDoctorName: doctorName,
                assignedAt
              } 
            : p
        ),
        currentPatient: state.currentPatient?.id === patientId 
          ? { 
              ...state.currentPatient, 
              assignedDoctorId: doctorId,
              assignedDoctorName: doctorName,
              assignedAt
            } 
          : state.currentPatient,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error assigning patient to doctor:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  unassignPatientFromDoctor: async (patientId) => {
    set({ isLoading: true, error: null });
    
    try {
      // Update patient in database
      const { error } = await supabase
        .from('patients')
        .update({
          assigned_doctor_id: null,
          assigned_doctor_name: null,
          assigned_at: null
        })
        .eq('id', patientId);
      
      if (error) throw error;
      
      // Update local state
      set(state => ({
        patientQueue: state.patientQueue.map(p => 
          p.id === patientId 
            ? { 
                ...p, 
                assignedDoctorId: undefined,
                assignedDoctorName: undefined,
                assignedAt: undefined
              } 
            : p
        ),
        currentPatient: state.currentPatient?.id === patientId 
          ? { 
              ...state.currentPatient, 
              assignedDoctorId: undefined,
              assignedDoctorName: undefined,
              assignedAt: undefined
            } 
          : state.currentPatient,
        isLoading: false
      }));
    } catch (error) {
      console.error('Error unassigning patient from doctor:', error);
      set({ error: handleSupabaseError(error), isLoading: false });
      throw error;
    }
  },
  
  getAssignedPatients: (doctorId) => {
    const state = get();
    return state.patientQueue.filter(p => p.assignedDoctorId === doctorId);
  },
  
  // Payment verification
  checkPaymentStatus: async (patientId, serviceType) => {
    try {
      // Get patient's invoices
      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('id, status, items')
        .eq('patient_id', patientId);
      
      if (error) throw error;
      
      // Check if there are any paid invoices for this service type
      const hasPaidInvoice = invoices.some(invoice => {
        // Check if invoice is paid
        if (invoice.status !== 'paid') return false;
        
        // Check if invoice contains items for this service type
        return invoice.items.some((item: any) => {
          switch (serviceType.toLowerCase()) {
            case 'laboratory':
            case 'lab':
              return item.department === 'laboratory';
            case 'radiology':
              return item.department === 'radiology';
            case 'medication':
            case 'pharmacy':
              return item.department === 'pharmacy' || item.category === 'medication';
            default:
              return item.department === serviceType || item.category === serviceType;
          }
        });
      });
      
      return hasPaidInvoice;
    } catch (error) {
      console.error('Error checking payment status:', error);
      return false;
    }
  }
}));
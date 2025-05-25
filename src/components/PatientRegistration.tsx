import * as React from 'react';
import { useState, useEffect } from 'react';
import { usePatientStore } from '../lib/store';
import { generateOutpatientNumber, generateInpatientNumber, generateEmergencyNumber } from '../lib/patientNumbering';
import { PatientSearch } from './PatientSearch';
import {
  User,
  Mail,
  Phone,
  Home,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  ArrowLeft,
  Save,
  RefreshCw,
  UserPlus,
  UserCheck,
  CreditCard,
  Building2,
  Siren,
  Ambulance,
  Bed,
  ChevronRight,
  ArrowRight,
  Check
} from 'lucide-react';
import { format } from 'date-fns';
import type { Patient } from '../types';

export const PatientRegistration = () => {
  // Define steps array at the top of the component
  const steps = [
    { label: 'Patient Type', description: 'Select patient type' },
    { label: 'Basic Info', description: 'Enter basic information' },
    { label: 'Contact Details', description: 'Enter contact details' },
    { label: 'Priority', description: 'Set priority level' },
    { label: 'Payment', description: 'Enter payment information' },
    { label: 'Summary', description: 'Review and submit' },
  ];

  const { addPatient, patientQueue, setCurrentSection } = usePatientStore();
  const [isNewPatient, setIsNewPatient] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [opNumber, setOpNumber] = useState('');
  const [ipNumber, setIpNumber] = useState('');
  const [emNumber, setEmNumber] = useState('');
  const [currentStep, setCurrentStep] = useState(1);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [redirectCountdown, setRedirectCountdown] = useState(5); // Countdown for redirect

  const [formData, setFormData] = useState({
    fullName: '',
    gender: '',
    age: '',
    email: '',
    phoneNumber: '',
    placeOfResidence: '',
    idNumber: '',
    insuranceProvider: '',
    insuranceNumber: '',
    paymentMethod: 'cash',
    mpesaNumber: '',
    bankReference: '',
    notes: '',
    patientType: 'outpatient',
    isEmergency: false,
    emergencyType: 'medical',
    emergencyDescription: '',
    emergencyBroughtBy: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    priority: 'normal'
  });

  // Generate OP number on component mount
  useEffect(() => {
    const generatedOpNumber = generateOutpatientNumber();
    setOpNumber(generatedOpNumber);
    
    const generatedIpNumber = generateInpatientNumber();
    setIpNumber(generatedIpNumber);
    
    const generatedEmNumber = generateEmergencyNumber();
    setEmNumber(generatedEmNumber);
  }, []);

  // Update form when existing patient is selected
  useEffect(() => {
    if (selectedPatient && !isNewPatient) {
      setFormData({
        fullName: selectedPatient.fullName,
        gender: selectedPatient.gender,
        age: selectedPatient.age.toString(),
        email: selectedPatient.email || '',
        phoneNumber: selectedPatient.phoneNumber || '',
        placeOfResidence: selectedPatient.placeOfResidence || '',
        idNumber: selectedPatient.idNumber || '',
        insuranceProvider: selectedPatient.insuranceProvider || '',
        insuranceNumber: selectedPatient.insuranceNumber || '',
        paymentMethod: selectedPatient.paymentMethod || 'cash',
        mpesaNumber: selectedPatient.mpesaNumber || '',
        bankReference: selectedPatient.bankReference || '',
        notes: '',
        patientType: 'outpatient',
        isEmergency: false,
        emergencyType: 'medical',
        emergencyDescription: '',
        emergencyBroughtBy: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        priority: 'normal'
      });
    }
  }, [selectedPatient, isNewPatient]);

  // Countdown timer for redirect
  useEffect(() => {
    if (success && redirectCountdown > 0) {
      const timer = setTimeout(() => {
        setRedirectCountdown(prev => prev - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (success && redirectCountdown === 0) {
      // Redirect to reception (not triage)
      setCurrentSection('reception');
    }
  }, [success, redirectCountdown, setCurrentSection]);

  const validateStep = (step: number) => {
    const errors: Record<string, string> = {};
    
    if (step === 1) {
      // No validation needed for step 1 - just patient type selection
      return true;
    }
    
    if (step === 2) {
      // For emergency cases, only fullName is required
      if (formData.isEmergency) {
        if (!formData.fullName) errors.fullName = 'Full name is required';
      } else {
        // For non-emergency cases, validate all fields
        if (!formData.fullName) errors.fullName = 'Full name is required';
        if (!formData.idNumber) errors.idNumber = 'ID number is required';
        if (!formData.age) errors.age = 'Age is required';
        if (!formData.gender) errors.gender = 'Gender is required';
      }
    }
    
    if (step === 3) {
      // For emergency cases, no contact details are required
      if (!formData.isEmergency) {
        if (!formData.phoneNumber) errors.phoneNumber = 'Phone number is required';
        if (!formData.placeOfResidence) errors.placeOfResidence = 'Place of residence is required';
      }
    }
    
    if (step === 4) {
      // Priority selection - no validation needed
      return true;
    }
    
    if (step === 5) {
      // For emergency cases, payment method is not required
      if (!formData.isEmergency) {
        if (formData.paymentMethod === 'insurance') {
          if (!formData.insuranceProvider) errors.insuranceProvider = 'Insurance provider is required';
          if (!formData.insuranceNumber) errors.insuranceNumber = 'Insurance number is required';
        } else if (formData.paymentMethod === 'mpesa') {
          if (!formData.mpesaNumber) errors.mpesaNumber = 'M-Pesa number is required';
        } else if (formData.paymentMethod === 'bank') {
          if (!formData.bankReference) errors.bankReference = 'Bank reference is required';
        }
      }
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    setError(null);

    try {
      if (isNewPatient) {
        // Create new patient
        const newPatient = {
          idNumber: formData.isEmergency ? (formData.idNumber || 'EMERGENCY') : formData.idNumber,
          fullName: formData.fullName,
          age: parseInt(formData.age) || 0, // Default to 0 for emergency if not provided
          gender: formData.isEmergency ? (formData.gender as 'male' | 'female' | 'other' || 'unknown') : (formData.gender as 'male' | 'female' | 'other'),
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          placeOfResidence: formData.placeOfResidence || 'Unknown', // Default for emergency
          status: formData.isEmergency ? 'emergency-registered' : 'registered',
          priority: formData.priority as 'normal' | 'urgent' | 'critical',
          currentDepartment: 'triage', // Set current department to triage directly
          nextDestination: null,
          previousDepartments: [],
          isNewPatient: true,
          patientType: formData.isEmergency ? 'emergency' : (formData.patientType as 'outpatient' | 'inpatient' | 'emergency'),
          opNumber: formData.patientType === 'outpatient' ? opNumber : undefined,
          ipNumber: formData.patientType === 'inpatient' ? ipNumber : undefined,
          emNumber: formData.isEmergency ? emNumber : undefined,
          paymentMethod: formData.isEmergency ? 'cash' : (formData.paymentMethod as 'cash' | 'mpesa' | 'insurance' | 'bank'),
          insuranceProvider: formData.insuranceProvider,
          insuranceNumber: formData.insuranceNumber,
          mpesaNumber: formData.mpesaNumber,
          bankReference: formData.bankReference,
          isEmergency: formData.isEmergency,
          emergencyType: formData.isEmergency ? formData.emergencyType as 'trauma' | 'medical' | 'surgical' | 'obstetric' | 'pediatric' | 'other' : undefined,
          emergencyDescription: formData.isEmergency ? formData.emergencyDescription : undefined,
          emergencyBroughtBy: formData.isEmergency ? formData.emergencyBroughtBy : undefined,
          emergencyContactName: formData.isEmergency ? formData.emergencyContactName : undefined,
          emergencyContactPhone: formData.isEmergency ? formData.emergencyContactPhone : undefined
        };

        await addPatient(newPatient);
      } else if (selectedPatient) {
        // Update existing patient (in a real app, this would call an update API)
        console.log('Updating existing patient:', selectedPatient.id);
        // This is a placeholder for updating patient info
      } else {
        throw new Error('No patient selected for update');
      }

      setSuccess(true);
      
      // Redirect countdown starts automatically due to the useEffect
    } catch (error) {
      console.error('Error registering patient:', error);
      setError(error instanceof Error ? error.message : 'Failed to register patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  isNewPatient && !formData.isEmergency
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500/20'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  setIsNewPatient(true);
                  setSelectedPatient(null);
                  setFormData(prev => ({
                    ...prev,
                    patientType: 'outpatient',
                    isEmergency: false
                  }));
                }}
              >
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <UserPlus className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <h4 className="text-sm font-medium text-center mb-2">New Patient</h4>
                <p className="text-xs text-gray-500 text-center">Register a new patient</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  !isNewPatient
                    ? 'border-green-500 bg-green-50 ring-1 ring-green-500/20'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setIsNewPatient(false)}
              >
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <UserCheck className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <h4 className="text-sm font-medium text-center mb-2">Existing Patient</h4>
                <p className="text-xs text-gray-500 text-center">Find patient records</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  formData.isEmergency
                    ? 'border-red-500 bg-red-50 ring-1 ring-red-500/20'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => {
                  setIsNewPatient(true);
                  setSelectedPatient(null);
                  setFormData(prev => ({
                    ...prev,
                    isEmergency: true,
                    priority: 'urgent' // Set priority to urgent for emergency cases
                  }));
                }}
              >
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <Ambulance className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                <h4 className="text-sm font-medium text-center mb-2">Emergency</h4>
                <p className="text-xs text-gray-500 text-center">Fast-track emergency case</p>
              </div>
            </div>
            
            {!isNewPatient && (
              <div className="mt-4 bg-white rounded-lg p-4 border">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <UserCheck className="w-4 h-4 text-green-600" />
                  </div>
                  <h2 className="text-sm font-medium text-gray-900">Find Existing Patient</h2>
                </div>

                <PatientSearch 
                  onPatientSelect={setSelectedPatient}
                />
              </div>
            )}
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className={`w-full pl-9 pr-3 py-2 border ${validationErrors.fullName ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                    placeholder="Enter full name"
                    disabled={!isNewPatient && !!selectedPatient}
                  />
                </div>
                {validationErrors.fullName && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {validationErrors.fullName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  ID Number {!formData.isEmergency && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={formData.idNumber}
                  onChange={(e) => setFormData({ ...formData, idNumber: e.target.value })}
                  className={`w-full px-3 py-2 border ${validationErrors.idNumber ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                  placeholder={formData.isEmergency ? "Enter ID number (optional)" : "Enter ID number"}
                  disabled={!isNewPatient && !!selectedPatient}
                  required={!formData.isEmergency}
                />
                {validationErrors.idNumber && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {validationErrors.idNumber}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Age {!formData.isEmergency && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className={`w-full px-3 py-2 border ${validationErrors.age ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                  placeholder={formData.isEmergency ? "Enter age (optional)" : "Enter age"}
                  min="0"
                  max="120"
                  required={!formData.isEmergency}
                />
                {validationErrors.age && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {validationErrors.age}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Gender {!formData.isEmergency && <span className="text-red-500">*</span>}
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className={`w-full px-3 py-2 border ${validationErrors.gender ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                  required={!formData.isEmergency}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
                {validationErrors.gender && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {validationErrors.gender}
                  </p>
                )}
              </div>
            </div>
            
            {/* OP/IP/EM Number (for new patients) */}
            {isNewPatient && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <h4 className="text-xs font-medium text-blue-800 mb-2">
                  {formData.isEmergency ? 'Emergency Number (Auto-generated)' : 
                  formData.patientType === 'inpatient' ? 'IP Number (Auto-generated)' : 
                  'OP Number (Auto-generated)'}
                </h4>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={formData.isEmergency ? emNumber : formData.patientType === 'inpatient' ? ipNumber : opNumber}
                    className="w-full px-3 py-2 bg-white border border-blue-200 rounded-md shadow-sm text-blue-700 font-medium cursor-not-allowed text-xs"
                    disabled
                  />
                </div>
                <p className="mt-1 text-xs text-blue-600">
                  This {formData.isEmergency ? 'emergency' : formData.patientType === 'inpatient' ? 'IP' : 'OP'} number will be assigned to the patient upon registration
                </p>
              </div>
            )}
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Phone Number {!formData.isEmergency && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className={`w-full pl-9 pr-3 py-2 border ${validationErrors.phoneNumber ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                    placeholder={formData.isEmergency ? "Enter phone number (optional)" : "Enter phone number"}
                    required={!formData.isEmergency}
                  />
                </div>
                {validationErrors.phoneNumber && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {validationErrors.phoneNumber}
                  </p>
                )}
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Place of Residence {!formData.isEmergency && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <Home className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={formData.placeOfResidence}
                    onChange={(e) => setFormData({ ...formData, placeOfResidence: e.target.value })}
                    className={`w-full pl-9 pr-3 py-2 border ${validationErrors.placeOfResidence ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                    placeholder={formData.isEmergency ? "Enter place of residence (optional)" : "Enter place of residence"}
                    required={!formData.isEmergency}
                  />
                </div>
                {validationErrors.placeOfResidence && (
                  <p className="mt-1 text-xs text-red-600 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {validationErrors.placeOfResidence}
                  </p>
                )}
              </div>
            </div>
            
            {/* Emergency-specific fields */}
            {formData.isEmergency && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="text-sm font-medium text-red-800 mb-3 flex items-center gap-2">
                  <Siren className="w-4 h-4" />
                  <span>Emergency Information</span>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Emergency Type
                    </label>
                    <select
                      value={formData.emergencyType}
                      onChange={(e) => setFormData({ ...formData, emergencyType: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-xs"
                    >
                      <option value="trauma">Trauma</option>
                      <option value="medical">Medical</option>
                      <option value="surgical">Surgical</option>
                      <option value="obstetric">Obstetric</option>
                      <option value="pediatric">Pediatric</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Brought By
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyBroughtBy}
                      onChange={(e) => setFormData({ ...formData, emergencyBroughtBy: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-xs"
                      placeholder="Ambulance, Family member, etc."
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Brief Description
                    </label>
                    <textarea
                      value={formData.emergencyDescription}
                      onChange={(e) => setFormData({ ...formData, emergencyDescription: e.target.value })}
                      rows={2}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-xs"
                      placeholder="Brief description of the emergency"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Emergency Contact Name
                    </label>
                    <input
                      type="text"
                      value={formData.emergencyContactName}
                      onChange={(e) => setFormData({ ...formData, emergencyContactName: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-xs"
                      placeholder="Contact person name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.emergencyContactPhone}
                      onChange={(e) => setFormData({ ...formData, emergencyContactPhone: e.target.value })}
                      className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 text-xs"
                      placeholder="Contact person phone"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      
      case 4:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  formData.priority === 'normal'
                    ? 'border-green-500 bg-green-50 ring-1 ring-green-500/20'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setFormData({ ...formData, priority: 'normal', isEmergency: false })}
              >
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <h4 className="text-sm font-medium text-center mb-1">Normal</h4>
                <p className="text-xs text-gray-500 text-center">Regular checkup or non-urgent care</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  formData.priority === 'urgent'
                    ? 'border-amber-500 bg-amber-50 ring-1 ring-amber-500/20'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setFormData({ ...formData, priority: 'urgent' })}
              >
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2 bg-amber-100 rounded-full">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                </div>
                <h4 className="text-sm font-medium text-center mb-1">Urgent</h4>
                <p className="text-xs text-gray-500 text-center">Needs prompt medical attention</p>
              </div>
              
              <div 
                className={`border rounded-lg p-4 cursor-pointer transition-all ${
                  formData.priority === 'critical'
                    ? 'border-red-500 bg-red-50 ring-1 ring-red-500/20'
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => setFormData({ ...formData, priority: 'critical', isEmergency: true })}
              >
                <div className="flex items-center justify-center mb-3">
                  <div className="p-2 bg-red-100 rounded-full">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
                <h4 className="text-sm font-medium text-center mb-1">Critical</h4>
                <p className="text-xs text-gray-500 text-center">Requires immediate emergency care</p>
              </div>
            </div>
          </div>
        );
      
      case 5: 
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'cash', label: 'Cash', icon: CreditCard },
                    { value: 'mpesa', label: 'M-Pesa', icon: Phone },
                    { value: 'insurance', label: 'Insurance', icon: Building2 },
                    { value: 'bank', label: 'Bank Transfer', icon: Building2 }
                  ].map(({ value, label, icon: Icon }) => (
                    <div
                      key={value}
                      onClick={() => setFormData({ ...formData, paymentMethod: value })}
                      className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-all ${
                        formData.paymentMethod === value
                          ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500/20'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className={`p-2 ${formData.paymentMethod === value ? 'bg-blue-100' : 'bg-gray-100'} rounded-lg`}>
                        <Icon className={`w-4 h-4 ${formData.paymentMethod === value ? 'text-blue-600' : 'text-gray-500'}`} />
                      </div>
                      <span className="text-sm font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {formData.paymentMethod === 'insurance' && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Insurance Provider
                    </label>
                    <input
                      type="text"
                      value={formData.insuranceProvider}
                      onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                      className={`w-full px-3 py-2 border ${validationErrors.insuranceProvider ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                      placeholder="Enter insurance provider"
                    />
                    {validationErrors.insuranceProvider && (
                      <p className="mt-1 text-xs text-red-600 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {validationErrors.insuranceProvider}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Insurance Number
                    </label>
                    <input
                      type="text"
                      value={formData.insuranceNumber}
                      onChange={(e) => setFormData({ ...formData, insuranceNumber: e.target.value })}
                      className={`w-full px-3 py-2 border ${validationErrors.insuranceNumber ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                      placeholder="Enter insurance number"
                    />
                    {validationErrors.insuranceNumber && (
                      <p className="mt-1 text-xs text-red-600 flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        {validationErrors.insuranceNumber}
                      </p>
                    )}
                  </div>
                </>
              )}

              {formData.paymentMethod === 'mpesa' && (
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    M-Pesa Number
                  </label>
                  <input
                    type="text"
                    value={formData.mpesaNumber}
                    onChange={(e) => setFormData({ ...formData, mpesaNumber: e.target.value })}
                    className={`w-full px-3 py-2 border ${validationErrors.mpesaNumber ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                    placeholder="Enter M-Pesa number"
                  />
                  {validationErrors.mpesaNumber && (
                    <p className="mt-1 text-xs text-red-600 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {validationErrors.mpesaNumber}
                    </p>
                  )}
                </div>
              )}

              {formData.paymentMethod === 'bank' && (
                <div className="col-span-2">
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Bank Reference
                  </label>
                  <input
                    type="text"
                    value={formData.bankReference}
                    onChange={(e) => setFormData({ ...formData, bankReference: e.target.value })}
                    className={`w-full px-3 py-2 border ${validationErrors.bankReference ? 'border-red-500' : 'border-gray-300'} rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm`}
                    placeholder="Enter bank reference"
                  />
                  {validationErrors.bankReference && (
                    <p className="mt-1 text-xs text-red-600 flex items-center">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      {validationErrors.bankReference}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      
      case 6:
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h4 className="text-sm font-medium text-blue-800 mb-3">Registration Summary</h4>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-gray-500">Patient Type</p>
                  <p className="text-sm font-medium">
                    {formData.isEmergency 
                      ? 'Emergency' 
                      : formData.patientType.charAt(0).toUpperCase() + formData.patientType.slice(1)}
                  </p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Priority</p>
                  <p className="text-sm font-medium capitalize">{formData.priority}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Full Name</p>
                  <p className="text-sm font-medium">{formData.fullName}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">ID Number</p>
                  <p className="text-sm font-medium">{formData.idNumber || (formData.isEmergency ? 'Not provided (Emergency)' : 'N/A')}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Age</p>
                  <p className="text-sm font-medium">{formData.age ? `${formData.age} years` : (formData.isEmergency ? 'Not provided (Emergency)' : 'N/A')}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Gender</p>
                  <p className="text-sm font-medium capitalize">{formData.gender || (formData.isEmergency ? 'Not provided (Emergency)' : 'N/A')}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Phone Number</p>
                  <p className="text-sm font-medium">{formData.phoneNumber || (formData.isEmergency ? 'Not provided (Emergency)' : 'N/A')}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-sm font-medium">{formData.email || 'N/A'}</p>
                </div>
                
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Place of Residence</p>
                  <p className="text-sm font-medium">{formData.placeOfResidence || (formData.isEmergency ? 'Not provided (Emergency)' : 'N/A')}</p>
                </div>
                
                <div>
                  <p className="text-xs text-gray-500">Payment Method</p>
                  <p className="text-sm font-medium capitalize">{formData.isEmergency ? 'Cash (Emergency)' : formData.paymentMethod}</p>
                </div>
                
                {formData.paymentMethod === 'insurance' && !formData.isEmergency && (
                  <>
                    <div>
                      <p className="text-xs text-gray-500">Insurance Provider</p>
                      <p className="text-sm font-medium">{formData.insuranceProvider}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Insurance Number</p>
                      <p className="text-sm font-medium">{formData.insuranceNumber}</p>
                    </div>
                  </>
                )}
                
                {formData.isEmergency && (
                  <>
                    <div>
                      <p className="text-xs text-gray-500">Emergency Type</p>
                      <p className="text-sm font-medium capitalize">{formData.emergencyType}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Emergency Description</p>
                      <p className="text-sm font-medium">{formData.emergencyDescription || 'Not provided'}</p>
                    </div>
                  </>
                )}
              </div>
              
              <div className="mt-3 pt-3 border-t border-blue-200">
                <p className="text-xs text-blue-700">
                  <span className="font-medium">Registration Number:</span>{' '}
                  {formData.isEmergency 
                    ? emNumber 
                    : formData.patientType === 'inpatient' 
                    ? ipNumber 
                    : opNumber}
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-xs"
                placeholder="Enter any additional notes..."
              />
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div>
      {/* Header - Blue background */}
      <div className="max-w-3xl mx-auto bg-blue-600">
        <div className="px-6 py-6">
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={() => setCurrentSection('reception')}
              className="p-1.5 hover:bg-blue-500 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
            </button>
            <h1 className="text-xl font-bold text-white">Patient Registration</h1>
          </div>
          <p className="text-blue-100">Register new or manage existing patients</p>
        </div>
      </div>
      
      {/* Main Content - White background */}
      <div className="max-w-3xl mx-auto bg-white shadow-sm border">
        <div className="p-5">
          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800 text-sm">
                  {isNewPatient ? 'Patient registered successfully!' : 'Patient information updated successfully!'}
                </p>
                <p className="text-xs text-green-600">
                  Redirecting to reception in {redirectCountdown} seconds...
                </p>
                <p className="text-xs text-green-700 font-medium mt-1">
                  Please direct the patient to the triage area immediately.
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step Indicator */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const stepNumber = index + 1;
                const isActive = currentStep === stepNumber;
                const isCompleted = currentStep > stepNumber;
                
                return (
                  <div key={stepNumber} className="flex flex-col items-center relative">
                    {/* Connector line */}
                    {index < steps.length - 1 && (
                      <div className={`absolute top-4 left-[50%] w-full h-0.5 ${
                        isCompleted ? 'bg-blue-500' : 'bg-gray-200'
                      }`} style={{ transform: 'translateX(50%)' }}></div>
                    )}
                    
                    {/* Step circle */}
                    <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                      isActive 
                        ? 'bg-blue-600 text-white border-2 border-blue-200 shadow-sm' 
                        : isCompleted
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-500 border border-gray-300'
                    }`}>
                      {isCompleted ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <span className="text-xs font-medium">{stepNumber}</span>
                      )}
                    </div>
                    
                    {/* Step label */}
                    <div className="mt-2 text-center">
                      <p className={`text-xs font-medium ${
                        isActive || isCompleted ? 'text-blue-600' : 'text-gray-500'
                      }`}>
                        {step.label}
                      </p>
                      <p className="text-[10px] text-gray-500 hidden sm:block">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Step Content */}
          <div className="mb-6">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <div>
              <button
                type="button"
                onClick={currentStep === 1 ? () => setCurrentSection('reception') : prevStep}
                className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{currentStep === 1 ? 'Cancel' : 'Back'}</span>
              </button>
            </div>
            
            {currentStep < 6 ? (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center gap-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm shadow-sm"
              >
                <span>Continue</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || success}
                className={`flex items-center gap-1 px-4 py-2 rounded-lg text-sm shadow-sm ${
                  isSubmitting || success
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : formData.isEmergency
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{formData.isEmergency ? 'Register Emergency' : (isNewPatient ? 'Register Patient' : 'Update Patient')}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
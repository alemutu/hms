import * as React from 'react';
import { useState, useEffect } from 'react';
import { usePatientStore } from '../lib/store';
import {
  X, Stethoscope, Activity, TestTube, Radio, Pill, FileText, ArrowRight, CheckCircle2, AlertCircle, RefreshCw, Plus, Clock, Calendar, User, Building2, Heart, ThermometerSun, Gauge, Settings as Lungs, Eye, Clipboard, Send, ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { departments, departmentNames } from '../types/departments';
import { MedicationManager } from './MedicationManager';
import { LabTestManager } from './lab/LabTestManager';
import { ConsultationTimeline } from './consultation/ConsultationTimeline';

interface ConsultationFormProps {
  patientId: string;
  onClose: () => void;
  onComplete: (patientId: string, nextDepartment: string) => void;
}

export const ConsultationForm: React.FC<ConsultationFormProps> = ({
  patientId,
  onClose,
  onComplete
}) => {
  const { 
    patientQueue, 
    vitalSigns, 
    medicalHistory, 
    consultations, 
    labTests, 
    createConsultation, 
    updateConsultation 
  } = usePatientStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'history' | 'examination' | 'diagnosis' | 'medications' | 'plan'>('history');
  const [showLabTestManager, setShowLabTestManager] = useState(false);
  const [showRadiologyManager, setShowRadiologyManager] = useState(false);
  const [showMedicationManager, setShowMedicationManager] = useState(false);
  const [consultationId, setConsultationId] = useState<string | null>(null);
  
  // Get patient data
  const patient = patientQueue.find(p => p.id === patientId);
  if (!patient) return null;
  
  // Get patient's vital signs
  const patientVitals = vitalSigns[patientId] || [];
  
  // Get patient's medical history
  const patientHistory = medicalHistory[patientId];
  
  // Get patient's consultations
  const patientConsultations = consultations[patientId] || [];
  
  // Get patient's lab tests
  const patientLabTests = labTests[patientId] || [];
  
  // Form state
  const [formData, setFormData] = useState({
    chiefComplaints: [] as string[],
    symptoms: [] as string[],
    diagnosis: [] as string[],
    treatment: '',
    notes: '',
    nextDepartment: departments.PHARMACY,
    historyOfPresentingIllness: '',
    gynecologicalHistory: '',
    pastMedicalHistory: '',
    familySocialHistory: '',
    generalExamination: '',
    cardiovascularSystem: '',
    centralNervousSystem: '',
    respiratorySystem: '',
    gastrointestinalSystem: '',
    genitourinarySystem: '',
    musculoskeletal: '',
    breast: '',
    otherSystems: '',
    // Follow-up appointment fields
    followUpRequired: false,
    followUpDate: '',
    followUpTime: '',
    followUpType: 'consultation',
    followUpNotes: '',
    // Medical certificate fields
    certificateRequired: false,
    certificateStartDate: '',
    certificateEndDate: '',
    certificateReason: '',
    certificateRecommendations: '',
    certificateWorkRestrictions: false,
    certificateWorkRestrictionDetails: ''
  });
  
  // New symptom/complaint/diagnosis input
  const [newSymptom, setNewSymptom] = useState('');
  const [newComplaint, setNewComplaint] = useState('');
  const [newDiagnosis, setNewDiagnosis] = useState('');
  
  // Check if this is a continuation of an existing consultation
  useEffect(() => {
    const existingConsultation = patientConsultations.find(c => 
      c.status === 'in-progress' && 
      c.department === patient.currentDepartment
    );
    
    if (existingConsultation) {
      setConsultationId(existingConsultation.id);
      setFormData({
        chiefComplaints: existingConsultation.chiefComplaints || [],
        symptoms: existingConsultation.symptoms || [],
        diagnosis: existingConsultation.diagnosis || [],
        treatment: existingConsultation.treatment || '',
        notes: existingConsultation.notes || '',
        nextDepartment: existingConsultation.nextDepartment || departments.PHARMACY,
        historyOfPresentingIllness: existingConsultation.historyOfPresentingIllness || '',
        gynecologicalHistory: existingConsultation.gynecologicalHistory || '',
        pastMedicalHistory: existingConsultation.pastMedicalHistory || '',
        familySocialHistory: existingConsultation.familySocialHistory || '',
        generalExamination: existingConsultation.generalExamination || '',
        cardiovascularSystem: existingConsultation.cardiovascularSystem || '',
        centralNervousSystem: existingConsultation.centralNervousSystem || '',
        respiratorySystem: existingConsultation.respiratorySystem || '',
        gastrointestinalSystem: existingConsultation.gastrointestinalSystem || '',
        genitourinarySystem: existingConsultation.genitourinarySystem || '',
        musculoskeletal: existingConsultation.musculoskeletal || '',
        breast: existingConsultation.breast || '',
        otherSystems: existingConsultation.otherSystems || '',
        // Follow-up appointment fields
        followUpRequired: existingConsultation.followUp?.required || false,
        followUpDate: existingConsultation.followUp?.date ? format(new Date(existingConsultation.followUp.date), 'yyyy-MM-dd') : '',
        followUpTime: existingConsultation.followUp?.date ? format(new Date(existingConsultation.followUp.date), 'HH:mm') : '',
        followUpType: existingConsultation.followUp?.department ? 'department' : 'consultation',
        followUpNotes: existingConsultation.followUp?.notes || '',
        // Medical certificate fields
        certificateRequired: existingConsultation.sickLeave ? true : false,
        certificateStartDate: existingConsultation.sickLeave?.startDate ? format(new Date(existingConsultation.sickLeave.startDate), 'yyyy-MM-dd') : '',
        certificateEndDate: existingConsultation.sickLeave?.endDate ? format(new Date(existingConsultation.sickLeave.endDate), 'yyyy-MM-dd') : '',
        certificateReason: existingConsultation.sickLeave?.reason || '',
        certificateRecommendations: existingConsultation.sickLeave?.recommendations || '',
        certificateWorkRestrictions: existingConsultation.sickLeave?.partialDuties || false,
        certificateWorkRestrictionDetails: existingConsultation.sickLeave?.partialDutiesDetails || ''
      });
    } else {
      // Create a new consultation
      createNewConsultation();
    }
  }, [patientConsultations, patient.currentDepartment]);
  
  const createNewConsultation = async () => {
    try {
      const newConsultation = {
        id: crypto.randomUUID(),
        patientId,
        department: patient.currentDepartment,
        doctorId: 'current-doctor-id', // This would come from auth context in a real app
        doctorName: 'Dr. Sarah Chen', // This would come from auth context in a real app
        startTime: new Date().toISOString(),
        status: 'in-progress',
        priority: patient.priority,
        chiefComplaints: [],
        symptoms: [],
        diagnosis: [],
        treatment: '',
        notes: '',
        timeline: [{
          timestamp: new Date().toISOString(),
          event: 'Consultation Started',
          actor: 'Dr. Sarah Chen'
        }]
      };
      
      await createConsultation(newConsultation);
      setConsultationId(newConsultation.id);
    } catch (error) {
      console.error('Error creating consultation:', error);
      setErrors({ submit: 'Failed to create consultation' });
    }
  };
  
  const handleAddSymptom = () => {
    if (!newSymptom.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      symptoms: [...prev.symptoms, newSymptom.trim()]
    }));
    setNewSymptom('');
  };
  
  const handleAddComplaint = () => {
    if (!newComplaint.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      chiefComplaints: [...prev.chiefComplaints, newComplaint.trim()]
    }));
    setNewComplaint('');
  };
  
  const handleAddDiagnosis = () => {
    if (!newDiagnosis.trim()) return;
    
    setFormData(prev => ({
      ...prev,
      diagnosis: [...prev.diagnosis, newDiagnosis.trim()]
    }));
    setNewDiagnosis('');
  };
  
  const handleRemoveSymptom = (index: number) => {
    setFormData(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index)
    }));
  };
  
  const handleRemoveComplaint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      chiefComplaints: prev.chiefComplaints.filter((_, i) => i !== index)
    }));
  };
  
  const handleRemoveDiagnosis = (index: number) => {
    setFormData(prev => ({
      ...prev,
      diagnosis: prev.diagnosis.filter((_, i) => i !== index)
    }));
  };
  
  const handleLabTestsChange = async (tests: any[]) => {
    if (!consultationId) return;
    
    try {
      // Update consultation with lab test references
      await updateConsultation(consultationId, {
        labTests: [
          ...(patientConsultations.find(c => c.id === consultationId)?.labTests || []),
          ...tests.map(test => ({
            id: test.id,
            type: test.testType,
            status: 'pending'
          }))
        ],
        timeline: [
          ...(patientConsultations.find(c => c.id === consultationId)?.timeline || []),
          {
            timestamp: new Date().toISOString(),
            event: 'Lab Tests Requested',
            details: tests.map((t: any) => t.testType).join(', '),
            actor: 'Dr. Sarah Chen'
          }
        ]
      });
      
      setShowLabTestManager(false);
    } catch (error) {
      console.error('Error updating consultation with lab tests:', error);
      setErrors({ submit: 'Failed to update consultation with lab tests' });
    }
  };

  const handleRadiologyTestsChange = async (tests: any[]) => {
    if (!consultationId) return;
    
    try {
      // Update consultation with radiology test references
      await updateConsultation(consultationId, {
        labTests: [
          ...(patientConsultations.find(c => c.id === consultationId)?.labTests || []),
          ...tests.map(test => ({
            id: test.id,
            type: test.testType,
            status: 'pending'
          }))
        ],
        timeline: [
          ...(patientConsultations.find(c => c.id === consultationId)?.timeline || []),
          {
            timestamp: new Date().toISOString(),
            event: 'Radiology Tests Requested',
            details: tests.map((t: any) => t.testType).join(', '),
            actor: 'Dr. Sarah Chen'
          }
        ]
      });
      
      setShowRadiologyManager(false);
    } catch (error) {
      console.error('Error updating consultation with radiology tests:', error);
      setErrors({ submit: 'Failed to update consultation with radiology tests' });
    }
  };
  
  const handleMedicationsChange = async (medications: any[]) => {
    if (!consultationId) return;
    
    try {
      // Update consultation with medications
      await updateConsultation(consultationId, {
        medications,
        timeline: [
          ...(patientConsultations.find(c => c.id === consultationId)?.timeline || []),
          {
            timestamp: new Date().toISOString(),
            event: 'Medications Prescribed',
            details: medications.map((m: any) => m.name).join(', '),
            actor: 'Dr. Sarah Chen'
          }
        ]
      });
      
      setShowMedicationManager(false);
    } catch (error) {
      console.error('Error updating consultation with medications:', error);
      setErrors({ submit: 'Failed to update consultation with medications' });
    }
  };
  
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (formData.diagnosis.length === 0) {
      errors.diagnosis = 'At least one diagnosis is required';
    }
    
    if (!formData.nextDepartment) {
      errors.nextDepartment = 'Next department is required';
    }
    
    // Validate follow-up appointment if required
    if (formData.followUpRequired) {
      if (!formData.followUpDate) {
        errors.followUpDate = 'Follow-up date is required';
      }
      if (!formData.followUpTime) {
        errors.followUpTime = 'Follow-up time is required';
      }
    }
    
    // Validate medical certificate if required
    if (formData.certificateRequired) {
      if (!formData.certificateStartDate) {
        errors.certificateStartDate = 'Start date is required';
      }
      if (!formData.certificateEndDate) {
        errors.certificateEndDate = 'End date is required';
      }
      if (!formData.certificateReason) {
        errors.certificateReason = 'Reason is required';
      }
    }
    
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !consultationId) return;
    
    setIsSubmitting(true);
    
    try {
      // Prepare follow-up data if required
      const followUp = formData.followUpRequired ? {
        required: true,
        date: new Date(`${formData.followUpDate}T${formData.followUpTime}`),
        notes: formData.followUpNotes,
        department: formData.followUpType === 'department' ? formData.nextDepartment : undefined,
      } : undefined;
      
      // Prepare sick leave data if required
      const sickLeave = formData.certificateRequired ? {
        startDate: new Date(formData.certificateStartDate),
        endDate: new Date(formData.certificateEndDate),
        reason: formData.certificateReason,
        recommendations: formData.certificateRecommendations,
        workRestrictions: formData.certificateWorkRestrictions,
        partialDuties: formData.certificateWorkRestrictions,
        partialDutiesDetails: formData.certificateWorkRestrictionDetails,
        diagnosisForCertificate: formData.diagnosis[0],
        issuedAt: new Date(),
      } : undefined;
      
      // Update the consultation
      await updateConsultation(consultationId, {
        ...formData,
        status: 'completed',
        endTime: new Date().toISOString(),
        followUp,
        sickLeave,
        timeline: [
          ...(patientConsultations.find(c => c.id === consultationId)?.timeline || []),
          {
            timestamp: new Date().toISOString(),
            event: 'Consultation Completed',
            actor: 'Dr. Sarah Chen'
          }
        ]
      });
      
      // Complete the consultation
      onComplete(patientId, formData.nextDepartment);
    } catch (error) {
      console.error('Error completing consultation:', error);
      setErrors({ submit: 'Failed to complete consultation' });
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-6xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Stethoscope className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{patient.fullName}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-sm text-gray-500">
                  {patient.age} years, {patient.gender}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  patient.priority === 'urgent'
                    ? 'bg-red-100 text-red-700'
                    : patient.priority === 'critical'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {patient.priority}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Sidebar - Patient Info */}
          <div className="w-80 border-r p-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Latest Vitals */}
              {patientVitals.length > 0 && (
                <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <h3 className="font-medium text-blue-700">Latest Vitals</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-red-600" />
                        <span className="text-xs text-gray-600">BP</span>
                      </div>
                      <span className="text-sm font-medium">{patientVitals[0].bloodPressure}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-purple-600" />
                        <span className="text-xs text-gray-600">Pulse</span>
                      </div>
                      <span className="text-sm font-medium">{patientVitals[0].pulseRate} bpm</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ThermometerSun className="w-3.5 h-3.5 text-amber-600" />
                        <span className="text-xs text-gray-600">Temp</span>
                      </div>
                      <span className="text-sm font-medium">{patientVitals[0].temperature}°C</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Gauge className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-xs text-gray-600">SpO2</span>
                      </div>
                      <span className="text-sm font-medium">{patientVitals[0].oxygenSaturation}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Lungs className="w-3.5 h-3.5 text-green-600" />
                        <span className="text-xs text-gray-600">Resp</span>
                      </div>
                      <span className="text-sm font-medium">{patientVitals[0].respiratoryRate}/min</span>
                    </div>
                  </div>
                  <div className="mt-2 pt-2 border-t border-blue-200 text-xs text-blue-600">
                    Recorded: {format(new Date(patientVitals[0].recordedAt), 'MMM d, h:mm a')}
                  </div>
                </div>
              )}

              {/* Medical History */}
              {patientHistory && (
                <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                  <div className="flex items-center gap-2 mb-3">
                    <Clipboard className="w-4 h-4 text-indigo-600" />
                    <h3 className="font-medium text-indigo-700">Medical History</h3>
                  </div>
                  <div className="space-y-2">
                    {patientHistory.hasDiabetes && (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        <span className="text-sm">Diabetes</span>
                      </div>
                    )}
                    {patientHistory.hasHypertension && (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        <span className="text-sm">Hypertension</span>
                      </div>
                    )}
                    {patientHistory.hasHeartDisease && (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        <span className="text-sm">Heart Disease</span>
                      </div>
                    )}
                    {patientHistory.hasAsthma && (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        <span className="text-sm">Asthma</span>
                      </div>
                    )}
                    {patientHistory.hasCancer && (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        <span className="text-sm">Cancer</span>
                      </div>
                    )}
                    {patientHistory.hasSurgeries && (
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                        <span className="text-sm">Previous Surgeries</span>
                      </div>
                    )}
                  </div>
                  
                  {patientHistory.hasAllergies && patientHistory.allergies.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-indigo-200">
                      <h4 className="text-xs font-medium text-indigo-700 mb-2">Allergies</h4>
                      <div className="flex flex-wrap gap-1">
                        {patientHistory.allergies.map((allergy, index) => (
                          <span key={index} className="px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-xs">
                            {allergy}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {patientHistory.medications.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-indigo-200">
                      <h4 className="text-xs font-medium text-indigo-700 mb-2">Current Medications</h4>
                      <div className="space-y-1">
                        {patientHistory.medications.map((medication, index) => (
                          <div key={index} className="text-sm">
                            {medication}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Patient Timeline */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Timeline</h3>
                <ConsultationTimeline 
                  consultation={patientConsultations.find(c => c.id === consultationId) || patientConsultations[0] || { timeline: [] }}
                  labTests={patientLabTests}
                />
              </div>
            </div>
          </div>

          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Tabs */}
            <div className="flex border-b">
              {[
                { id: 'history', label: 'History', icon: Clipboard },
                { id: 'examination', label: 'Examination', icon: Eye },
                { id: 'diagnosis', label: 'Diagnosis', icon: Stethoscope },
                { id: 'medications', label: 'Medications', icon: Pill },
                { id: 'plan', label: 'Plan', icon: FileText }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as typeof activeTab)}
                  className={`flex items-center gap-2 px-4 py-3 border-b-2 ${
                    activeTab === id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* History Tab */}
                {activeTab === 'history' && (
                  <div className="space-y-6">
                    {/* Patient History Section */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Patient History</h3>
                      
                      <div className="space-y-4">
                        {/* Chief Complaints */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Chief Complaints
                          </label>
                          <div className="flex gap-2 mb-2">
                            <input
                              type="text"
                              value={newComplaint}
                              onChange={(e) => setNewComplaint(e.target.value)}
                              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Add chief complaint..."
                            />
                            <button
                              type="button"
                              onClick={handleAddComplaint}
                              className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                              <Plus className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {formData.chiefComplaints.map((complaint, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg"
                              >
                                <span>{complaint}</span>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveComplaint(index)}
                                  className="p-0.5 hover:bg-blue-100 rounded-full"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* History of Presenting Illness */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            History of Presenting Illness
                          </label>
                          <textarea
                            value={formData.historyOfPresentingIllness}
                            onChange={(e) => setFormData({ ...formData, historyOfPresentingIllness: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter history of presenting illness..."
                          />
                        </div>

                        {/* Gynecological/Obstetric History (only for female patients) */}
                        {patient.gender === 'female' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Gynecological/Obstetric History
                            </label>
                            <textarea
                              value={formData.gynecologicalHistory}
                              onChange={(e) => setFormData({ ...formData, gynecologicalHistory: e.target.value })}
                              rows={3}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter gynecological/obstetric history..."
                            />
                          </div>
                        )}

                        {/* Past Medical and Surgical History */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Past Medical and Surgical History
                          </label>
                          <textarea
                            value={formData.pastMedicalHistory}
                            onChange={(e) => setFormData({ ...formData, pastMedicalHistory: e.target.value })}
                            rows={3}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter past medical and surgical history..."
                          />
                        </div>
                      </div>
                    </div>

                    {/* Family and Socioeconomic History */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Family and Socioeconomic History
                      </label>
                      <textarea
                        value={formData.familySocialHistory}
                        onChange={(e) => setFormData({ ...formData, familySocialHistory: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter family and socioeconomic history..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Symptoms
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newSymptom}
                          onChange={(e) => setNewSymptom(e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Add symptom..."
                        />
                        <button
                          type="button"
                          onClick={handleAddSymptom}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.symptoms.map((symptom, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg"
                          >
                            <span>{symptom}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveSymptom(index)}
                              className="p-0.5 hover:bg-blue-100 rounded-full"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Examination Tab */}
                {activeTab === 'examination' && (
                  <div className="space-y-6">
                    {/* General Examination */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">General Examination</h3>
                      <textarea
                        value={formData.generalExamination}
                        onChange={(e) => setFormData({ ...formData, generalExamination: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter general examination findings..."
                      />
                    </div>

                    {/* Systemic Examination */}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Systemic Examination</h3>
                      
                      <div className="space-y-4">
                        {/* Cardiovascular System */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Cardiovascular System
                          </label>
                          <textarea
                            value={formData.cardiovascularSystem}
                            onChange={(e) => setFormData({ ...formData, cardiovascularSystem: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter cardiovascular system findings..."
                          />
                        </div>

                        {/* Central Nervous System */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Central Nervous System
                          </label>
                          <textarea
                            value={formData.centralNervousSystem}
                            onChange={(e) => setFormData({ ...formData, centralNervousSystem: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter central nervous system findings..."
                          />
                        </div>

                        {/* Respiratory System */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Respiratory System
                          </label>
                          <textarea
                            value={formData.respiratorySystem}
                            onChange={(e) => setFormData({ ...formData, respiratorySystem: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter respiratory system findings..."
                          />
                        </div>

                        {/* Gastrointestinal System */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Gastrointestinal System
                          </label>
                          <textarea
                            value={formData.gastrointestinalSystem}
                            onChange={(e) => setFormData({ ...formData, gastrointestinalSystem: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter gastrointestinal system findings..."
                          />
                        </div>

                        {/* Genitourinary System */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Genitourinary System
                          </label>
                          <textarea
                            value={formData.genitourinarySystem}
                            onChange={(e) => setFormData({ ...formData, genitourinarySystem: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter genitourinary system findings..."
                          />
                        </div>

                        {/* Musculoskeletal */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Musculoskeletal
                          </label>
                          <textarea
                            value={formData.musculoskeletal}
                            onChange={(e) => setFormData({ ...formData, musculoskeletal: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter musculoskeletal findings..."
                          />
                        </div>

                        {/* Breast */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Breast
                          </label>
                          <textarea
                            value={formData.breast}
                            onChange={(e) => setFormData({ ...formData, breast: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter breast examination findings..."
                          />
                        </div>

                        {/* Other Systems/Examination */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Other Systems/Examination
                          </label>
                          <textarea
                            value={formData.otherSystems}
                            onChange={(e) => setFormData({ ...formData, otherSystems: e.target.value })}
                            rows={2}
                            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter findings for other systems or examinations..."
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Diagnosis Tab */}
                {activeTab === 'diagnosis' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Diagnosis
                      </label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={newDiagnosis}
                          onChange={(e) => setNewDiagnosis(e.target.value)}
                          className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Add diagnosis..."
                        />
                        <button
                          type="button"
                          onClick={handleAddDiagnosis}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {formData.diagnosis.map((diagnosis, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-lg"
                          >
                            <span>{diagnosis}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveDiagnosis(index)}
                              className="p-0.5 hover:bg-blue-100 rounded-full"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      {errors.diagnosis && (
                        <p className="mt-1 text-sm text-red-600">{errors.diagnosis}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">Lab Tests</h3>
                      <button
                        type="button"
                        onClick={() => setShowLabTestManager(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                      >
                        <TestTube className="w-4 h-4" />
                        <span>Order Lab Tests</span>
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">Radiology</h3>
                      <button
                        type="button"
                        onClick={() => setShowRadiologyManager(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Radio className="w-4 h-4" />
                        <span>Order Radiology</span>
                      </button>
                    </div>

                    {/* Lab Test Results */}
                    {patientLabTests.length > 0 && (
                      <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
                        <div className="flex items-center gap-2 mb-3">
                          <TestTube className="w-4 h-4 text-purple-600" />
                          <h3 className="font-medium text-purple-700">Lab Test Results</h3>
                        </div>
                        <div className="space-y-3">
                          {patientLabTests.map((test, index) => (
                            <div key={index} className="bg-white p-3 rounded-lg border border-purple-100">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {test.department === 'laboratory' ? (
                                    <TestTube className="w-4 h-4 text-purple-600" />
                                  ) : (
                                    <Radio className="w-4 h-4 text-blue-600" />
                                  )}
                                  <span className="font-medium">{test.testType}</span>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                  test.status === 'completed' 
                                    ? 'bg-green-100 text-green-700' 
                                    : test.status === 'in-progress'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {test.status}
                                </span>
                              </div>
                              {test.results && (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                  <p className="text-sm">{test.results.findings}</p>
                                  {test.results.interpretation && (
                                    <p className="text-xs text-gray-500 mt-1 italic">{test.results.interpretation}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Medications Tab */}
                {activeTab === 'medications' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Medications</h3>
                      <button
                        type="button"
                        onClick={() => setShowMedicationManager(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <Pill className="w-4 h-4" />
                        <span>Prescribe Medications</span>
                      </button>
                    </div>

                    {/* Show current medications if any */}
                    {patientConsultations.find(c => c.id === consultationId)?.medications?.length > 0 && (
                      <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                        <div className="flex items-center gap-2 mb-3">
                          <Pill className="w-4 h-4 text-green-600" />
                          <h3 className="font-medium text-green-700">Prescribed Medications</h3>
                        </div>
                        <div className="space-y-3">
                          {patientConsultations.find(c => c.id === consultationId)?.medications?.map((medication, index) => (
                            <div key={index} className="bg-white p-3 rounded-lg border border-green-100">
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Pill className="w-4 h-4 text-green-600" />
                                  <span className="font-medium">{medication.name}</span>
                                </div>
                                <span className="text-xs text-gray-500">{medication.dosage}</span>
                              </div>
                              <div className="grid grid-cols-3 gap-2 text-sm">
                                <div>
                                  <p className="text-xs text-gray-500">Frequency</p>
                                  <p>{medication.frequency}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Duration</p>
                                  <p>{medication.duration}</p>
                                </div>
                                <div>
                                  <p className="text-xs text-gray-500">Quantity</p>
                                  <p>{medication.quantity}</p>
                                </div>
                              </div>
                              {medication.notes && (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                  <p className="text-xs text-gray-500">Notes</p>
                                  <p className="text-sm">{medication.notes}</p>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Plan Tab */}
                {activeTab === 'plan' && (
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Treatment Plan
                      </label>
                      <textarea
                        value={formData.treatment}
                        onChange={(e) => setFormData({ ...formData, treatment: e.target.value })}
                        rows={4}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter treatment plan..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Next Department
                      </label>
                      <select
                        value={formData.nextDepartment}
                        onChange={(e) => setFormData({ ...formData, nextDepartment: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option value={departments.PHARMACY}>Pharmacy</option>
                        <option value={departments.LABORATORY}>Laboratory</option>
                        <option value={departments.RADIOLOGY}>Radiology</option>
                        <option value={departments.RECEPTION}>Reception (Discharge)</option>
                      </select>
                      {errors.nextDepartment && (
                        <p className="mt-1 text-sm text-red-600">{errors.nextDepartment}</p>
                      )}
                    </div>

                    {/* Follow-up Appointment Scheduler */}
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-blue-600" />
                          <h3 className="font-medium text-blue-700">Follow-up Appointment</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="followUpRequired"
                            checked={formData.followUpRequired}
                            onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <label htmlFor="followUpRequired" className="text-sm text-blue-700">
                            Schedule follow-up
                          </label>
                        </div>
                      </div>

                      {formData.followUpRequired && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Date
                              </label>
                              <input
                                type="date"
                                value={formData.followUpDate}
                                onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                                min={format(new Date(Date.now() + 24 * 60 * 60 * 1000), 'yyyy-MM-dd')} // Tomorrow
                              />
                              {errors.followUpDate && (
                                <p className="mt-1 text-xs text-red-600">{errors.followUpDate}</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Time
                              </label>
                              <input
                                type="time"
                                value={formData.followUpTime}
                                onChange={(e) => setFormData({ ...formData, followUpTime: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              />
                              {errors.followUpTime && (
                                <p className="mt-1 text-xs text-red-600">{errors.followUpTime}</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Appointment Type
                            </label>
                            <select
                              value={formData.followUpType}
                              onChange={(e) => setFormData({ ...formData, followUpType: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="consultation">General Follow-up</option>
                              <option value="department">Specialist Referral</option>
                            </select>
                          </div>

                          {formData.followUpType === 'department' && (
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Department
                              </label>
                              <select
                                value={formData.nextDepartment}
                                onChange={(e) => setFormData({ ...formData, nextDepartment: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              >
                                <option value={departments.GENERAL}>General Consultation</option>
                                <option value={departments.CARDIOLOGY}>Cardiology</option>
                                <option value={departments.ORTHOPEDIC}>Orthopedic</option>
                                <option value={departments.GYNECOLOGY}>Gynecology</option>
                                <option value={departments.PEDIATRICS}>Pediatrics</option>
                                <option value={departments.DENTAL}>Dental</option>
                                <option value={departments.EYE}>Eye Clinic</option>
                                <option value={departments.PHYSIOTHERAPY}>Physiotherapy</option>
                              </select>
                            </div>
                          )}

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Notes
                            </label>
                            <textarea
                              value={formData.followUpNotes}
                              onChange={(e) => setFormData({ ...formData, followUpNotes: e.target.value })}
                              rows={2}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter any notes for the follow-up appointment..."
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Medical Certificate */}
                    <div className="bg-green-50 rounded-xl p-4 border border-green-100">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-green-600" />
                          <h3 className="font-medium text-green-700">Medical Certificate</h3>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="certificateRequired"
                            checked={formData.certificateRequired}
                            onChange={(e) => setFormData({ ...formData, certificateRequired: e.target.checked })}
                            className="rounded text-green-600 focus:ring-green-500"
                          />
                          <label htmlFor="certificateRequired" className="text-sm text-green-700">
                            Issue certificate
                          </label>
                        </div>
                      </div>

                      {formData.certificateRequired && (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                Start Date
                              </label>
                              <input
                                type="date"
                                value={formData.certificateStartDate}
                                onChange={(e) => setFormData({ ...formData, certificateStartDate: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                              />
                              {errors.certificateStartDate && (
                                <p className="mt-1 text-xs text-red-600">{errors.certificateStartDate}</p>
                              )}
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-700 mb-1">
                                End Date
                              </label>
                              <input
                                type="date"
                                value={formData.certificateEndDate}
                                onChange={(e) => setFormData({ ...formData, certificateEndDate: e.target.value })}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                min={formData.certificateStartDate}
                              />
                              {errors.certificateEndDate && (
                                <p className="mt-1 text-xs text-red-600">{errors.certificateEndDate}</p>
                              )}
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Reason
                            </label>
                            <input
                              type="text"
                              value={formData.certificateReason}
                              onChange={(e) => setFormData({ ...formData, certificateReason: e.target.value })}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                              placeholder="Enter reason for medical certificate..."
                            />
                            {errors.certificateReason && (
                              <p className="mt-1 text-xs text-red-600">{errors.certificateReason}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Recommendations
                            </label>
                            <textarea
                              value={formData.certificateRecommendations}
                              onChange={(e) => setFormData({ ...formData, certificateRecommendations: e.target.value })}
                              rows={2}
                              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                              placeholder="Enter recommendations..."
                            />
                          </div>

                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <input
                                type="checkbox"
                                id="workRestrictions"
                                checked={formData.certificateWorkRestrictions}
                                onChange={(e) => setFormData({ ...formData, certificateWorkRestrictions: e.target.checked })}
                                className="rounded text-green-600 focus:ring-green-500"
                              />
                              <label htmlFor="workRestrictions" className="text-sm text-gray-700">
                                Work restrictions required
                              </label>
                            </div>
                            
                            {formData.certificateWorkRestrictions && (
                              <textarea
                                value={formData.certificateWorkRestrictionDetails}
                                onChange={(e) => setFormData({ ...formData, certificateWorkRestrictionDetails: e.target.value })}
                                rows={2}
                                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                                placeholder="Describe work restrictions..."
                              />
                            )}
                          </div>

                          <div className="mt-2 p-3 bg-white rounded-lg border border-green-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Certificate Preview</h4>
                            <div className="space-y-2 text-sm">
                              <p><strong>Patient:</strong> {patient.fullName}</p>
                              <p><strong>ID Number:</strong> {patient.idNumber}</p>
                              <p><strong>Period:</strong> {formData.certificateStartDate} to {formData.certificateEndDate}</p>
                              <p><strong>Reason:</strong> {formData.certificateReason || 'Medical reasons'}</p>
                              {formData.certificateWorkRestrictions && (
                                <p><strong>Work Restrictions:</strong> {formData.certificateWorkRestrictionDetails}</p>
                              )}
                              <p><strong>Issued By:</strong> Dr. Sarah Chen</p>
                              <p><strong>Date Issued:</strong> {format(new Date(), 'yyyy-MM-dd')}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 border-t">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 float-right"
                      >
                        {isSubmitting ? (
                          <>
                            <RefreshCw className="w-5 h-5 animate-spin" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5" />
                            <span>Complete Consultation</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Lab Test Manager Modal */}
      {showLabTestManager && (
        <LabTestManager
          patientId={patientId}
          onTestsChange={handleLabTestsChange}
          onClose={() => setShowLabTestManager(false)}
          department="laboratory"
        />
      )}

      {/* Radiology Test Manager Modal */}
      {showRadiologyManager && (
        <LabTestManager
          patientId={patientId}
          onTestsChange={handleRadiologyTestsChange}
          onClose={() => setShowRadiologyManager(false)}
          department="radiology"
        />
      )}

      {/* Medication Manager Modal */}
      {showMedicationManager && (
        <MedicationManager
          patientId={patientId}
          onMedicationsChange={handleMedicationsChange}
          onClose={() => setShowMedicationManager(false)}
          onComplete={() => setShowMedicationManager(false)}
        />
      )}
    </div>
  );
};
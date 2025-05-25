import * as React from 'react';
import { useState, useEffect } from 'react';
import { usePatientStore } from '../../lib/store';
import {
  Activity,
  Users,
  Clock,
  Heart,
  ThermometerSun,
  Gauge,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  ArrowLeft,
  Plus,
  FileText,
  Stethoscope,
  XCircle,
  LayoutGrid,
  ListFilter,
  Layers,
  Bell,
  Hourglass,
  ChevronDown,
  CalendarDays,
  Building2,
  User,
  ClipboardList,
  BadgeCheck,
  Info,
  Phone,
  Mail,
  Home,
  CreditCard,
  Milestone,
  ArrowLeft as ArrowLeftIcon,
  Settings as Lungs,
  X,
  AlertCircle,
  ArrowUpRight,
  RefreshCw,
  Pill,
  Baby
} from 'lucide-react';
import { format } from 'date-fns';
import { departments, departmentNames } from '../../types/departments';
import type { Patient, VitalSigns, MedicalHistory } from '../../types';

interface TriageFormProps {
  patientId: string;
  onClose: () => void;
  onComplete: (patientId: string, priority: Patient['priority'], nextDepartment: string) => void;
}

export const TriageForm: React.FC<TriageFormProps> = ({
  patientId,
  onClose,
  onComplete
}) => {
  const { 
    patientQueue, 
    updateVitalSigns, 
    updateMedicalHistory, 
    calculateTriagePriority, 
    suggestDepartment,
    vitalSigns: allVitalSigns
  } = usePatientStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'vitals' | 'history' | 'assessment'>('vitals');
  const [suggestedPriority, setSuggestedPriority] = useState<'normal' | 'urgent' | 'critical'>('normal');
  const [suggestedDepartment, setSuggestedDepartment] = useState(departments.GENERAL);
  const [isResuming, setIsResuming] = useState(false);

  const patient = patientQueue.find(p => p.id === patientId);
  if (!patient) return null;

  // Get existing vital signs for this patient
  const existingVitals = allVitalSigns[patientId]?.[0];

  const [vitalsForm, setVitalsForm] = useState<VitalSigns>({
    bloodPressure: existingVitals?.bloodPressure || '',
    pulseRate: existingVitals?.pulseRate || 0,
    temperature: existingVitals?.temperature || 0,
    oxygenSaturation: existingVitals?.oxygenSaturation || 0,
    respiratoryRate: existingVitals?.respiratoryRate || 0,
    recordedAt: new Date(),
    recordedBy: 'Nurse'
  });

  const [historyForm, setHistoryForm] = useState<MedicalHistory>({
    hasDiabetes: false,
    hasHypertension: false,
    hasHeartDisease: false,
    hasAsthma: false,
    hasCancer: false,
    hasSurgeries: false,
    hasAllergies: false,
    allergies: [],
    medications: [],
    familyHistory: [],
    notes: ''
  });

  const [assessment, setAssessment] = useState({
    priority: patient.priority,
    nextDepartment: departments.GENERAL,
    notes: '',
    parity: '',
    lastMenstrualPeriod: '',
    chronicIllnesses: '',
    symptoms: [] as string[]
  });

  const [newAllergy, setNewAllergy] = useState('');
  const [newMedication, setNewMedication] = useState('');
  const [newFamilyHistory, setNewFamilyHistory] = useState('');
  const [newSymptom, setNewSymptom] = useState('');

  // Check if we're resuming a previously started triage
  useEffect(() => {
    if (patient.inTriageTime && !patient.triageCompleteTime) {
      setIsResuming(true);
      
      // Load existing vital signs if available
      if (existingVitals) {
        setVitalsForm({
          bloodPressure: existingVitals.bloodPressure,
          pulseRate: existingVitals.pulseRate,
          temperature: existingVitals.temperature,
          oxygenSaturation: existingVitals.oxygenSaturation,
          respiratoryRate: existingVitals.respiratoryRate,
          recordedAt: new Date(),
          recordedBy: 'Nurse'
        });
      }
    }
  }, [patient, existingVitals]);

  // Calculate suggested priority when vitals change
  useEffect(() => {
    if (vitalsForm.bloodPressure && vitalsForm.pulseRate && vitalsForm.temperature && vitalsForm.oxygenSaturation) {
      const calculatedPriority = calculateTriagePriority(vitalsForm);
      setSuggestedPriority(calculatedPriority);
      
      // Auto-update assessment priority if calculated priority is more urgent
      const priorityOrder = { normal: 0, urgent: 1, critical: 2 };
      if (priorityOrder[calculatedPriority] > priorityOrder[assessment.priority]) {
        setAssessment(prev => ({ ...prev, priority: calculatedPriority }));
      }
    }
  }, [vitalsForm, calculateTriagePriority, assessment.priority]);

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (activeTab === 'vitals') {
      if (!vitalsForm.bloodPressure) {
        errors.bloodPressure = 'Blood pressure is required';
      }
      if (!vitalsForm.pulseRate) {
        errors.pulseRate = 'Pulse rate is required';
      }
      if (!vitalsForm.temperature) {
        errors.temperature = 'Temperature is required';
      }
      if (!vitalsForm.oxygenSaturation) {
        errors.oxygenSaturation = 'Oxygen saturation is required';
      }
      if (!vitalsForm.respiratoryRate) {
        errors.respiratoryRate = 'Respiratory rate is required';
      }
    } else if (activeTab === 'assessment') {
      if (!assessment.nextDepartment) {
        errors.nextDepartment = 'Next department is required';
      }
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddAllergy = () => {
    if (newAllergy.trim()) {
      setHistoryForm(prev => ({
        ...prev,
        allergies: [...prev.allergies, newAllergy.trim()],
        hasAllergies: true
      }));
      setNewAllergy('');
    }
  };

  const handleAddMedication = () => {
    if (newMedication.trim()) {
      setHistoryForm(prev => ({
        ...prev,
        medications: [...prev.medications, newMedication.trim()]
      }));
      setNewMedication('');
    }
  };

  const handleAddFamilyHistory = () => {
    if (newFamilyHistory.trim()) {
      setHistoryForm(prev => ({
        ...prev,
        familyHistory: [...prev.familyHistory, newFamilyHistory.trim()]
      }));
      setNewFamilyHistory('');
    }
  };

  const handleAddSymptom = () => {
    if (newSymptom.trim()) {
      setAssessment(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, newSymptom.trim()]
      }));
      setNewSymptom('');
    }
  };

  const handleRemoveAllergy = (index: number) => {
    setHistoryForm(prev => ({
      ...prev,
      allergies: prev.allergies.filter((_, i) => i !== index),
      hasAllergies: prev.allergies.length > 1
    }));
  };

  const handleRemoveMedication = (index: number) => {
    setHistoryForm(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveFamilyHistory = (index: number) => {
    setHistoryForm(prev => ({
      ...prev,
      familyHistory: prev.familyHistory.filter((_, i) => i !== index)
    }));
  };

  const handleRemoveSymptom = (index: number) => {
    setAssessment(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== index)
    }));
  };

  const handleNextTab = () => {
    if (validateForm()) {
      if (activeTab === 'vitals') {
        setActiveTab('history');
      } else if (activeTab === 'history') {
        setActiveTab('assessment');
      }
    }
  };

  const handlePreviousTab = () => {
    if (activeTab === 'history') {
      setActiveTab('vitals');
    } else if (activeTab === 'assessment') {
      setActiveTab('history');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsProcessing(true);
    try {
      // Update vital signs
      await updateVitalSigns(patientId, {
        ...vitalsForm,
        recordedAt: new Date()
      });

      // Update medical history
      await updateMedicalHistory(patientId, historyForm);

      // Complete triage
      await onComplete(
        patientId,
        assessment.priority as Patient['priority'],
        assessment.nextDepartment
      );
    } catch (error) {
      console.error('Error completing triage:', error);
      setErrors({ submit: 'Failed to complete triage' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">{patient.fullName}</h2>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-blue-100">
                    {patient.age} years old, {patient.gender}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    patient.priority === 'urgent'
                      ? 'bg-red-500/20 text-red-100'
                      : patient.priority === 'critical'
                      ? 'bg-purple-500/20 text-purple-100'
                      : 'bg-green-500/20 text-green-100'
                  }`}>
                    {patient.priority}
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 mt-5">
            {[
              { id: 'vitals', label: 'Vital Signs', icon: Activity },
              { id: 'history', label: 'Medical History', icon: ClipboardList },
              { id: 'assessment', label: 'Assessment', icon: Stethoscope }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => validateForm() && setActiveTab(id as typeof activeTab)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs ${
                  activeTab === id
                    ? 'bg-white text-blue-600'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
          
          {isResuming && (
            <div className="mt-3 px-3 py-2 bg-white/10 rounded-lg">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-white" />
                <p className="text-xs text-white">Resuming previously started triage session</p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto max-h-[calc(90vh-9rem)]">
          {/* Vital Signs Tab */}
          {activeTab === 'vitals' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Vital Signs</h3>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Blood Pressure */}
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-red-100 rounded-lg">
                      <Heart className="w-4 h-4 text-red-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Blood Pressure</h4>
                      <p className="text-xs text-gray-500">Systolic/Diastolic</p>
                    </div>
                  </div>
                  <input
                    type="text"
                    value={vitalsForm.bloodPressure}
                    onChange={(e) => setVitalsForm(prev => ({ ...prev, bloodPressure: e.target.value }))}
                    placeholder="e.g., 120/80 mmHg"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  {errors.bloodPressure && (
                    <p className="mt-1 text-xs text-red-600">{errors.bloodPressure}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Normal range: 90-120/60-80 mmHg</p>
                </div>

                {/* Temperature */}
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-amber-100 rounded-lg">
                      <ThermometerSun className="w-4 h-4 text-amber-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Temperature</h4>
                      <p className="text-xs text-gray-500">Degrees Celsius</p>
                    </div>
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalsForm.temperature || ''}
                    onChange={(e) => setVitalsForm(prev => ({ ...prev, temperature: Number(e.target.value) }))}
                    placeholder="°C"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  {errors.temperature && (
                    <p className="mt-1 text-xs text-red-600">{errors.temperature}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Normal range: 36.5-37.5°C</p>
                </div>

                {/* Pulse Rate */}
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                      <Activity className="w-4 h-4 text-purple-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Pulse Rate</h4>
                      <p className="text-xs text-gray-500">Beats per minute</p>
                    </div>
                  </div>
                  <input
                    type="number"
                    value={vitalsForm.pulseRate || ''}
                    onChange={(e) => setVitalsForm(prev => ({ ...prev, pulseRate: Number(e.target.value) }))}
                    placeholder="BPM"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  {errors.pulseRate && (
                    <p className="mt-1 text-xs text-red-600">{errors.pulseRate}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Normal range: 60-100 BPM</p>
                </div>

                {/* Oxygen Saturation */}
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-blue-100 rounded-lg">
                      <Gauge className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Oxygen Saturation</h4>
                      <p className="text-xs text-gray-500">SpO2 Percentage</p>
                    </div>
                  </div>
                  <input
                    type="number"
                    value={vitalsForm.oxygenSaturation || ''}
                    onChange={(e) => setVitalsForm(prev => ({ ...prev, oxygenSaturation: Number(e.target.value) }))}
                    placeholder="%"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  {errors.oxygenSaturation && (
                    <p className="mt-1 text-xs text-red-600">{errors.oxygenSaturation}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Normal range: 95-100%</p>
                </div>

                {/* Respiratory Rate */}
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-green-100 rounded-lg">
                      <Lungs className="w-4 h-4 text-green-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Respiratory Rate</h4>
                      <p className="text-xs text-gray-500">Breaths per minute</p>
                    </div>
                  </div>
                  <input
                    type="number"
                    value={vitalsForm.respiratoryRate || ''}
                    onChange={(e) => setVitalsForm(prev => ({ ...prev, respiratoryRate: Number(e.target.value) }))}
                    placeholder="Breaths/min"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  {errors.respiratoryRate && (
                    <p className="mt-1 text-xs text-red-600">{errors.respiratoryRate}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Normal range: 12-20 breaths/min</p>
                </div>

                {/* Additional Vitals */}
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-indigo-100 rounded-lg">
                      <Plus className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Additional Vitals</h4>
                      <p className="text-xs text-gray-500">Optional measurements</p>
                    </div>
                  </div>
                  <textarea
                    value={vitalsForm.notes || ''}
                    onChange={(e) => setVitalsForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Enter any additional vital signs or observations..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                    rows={3}
                  />
                </div>
              </div>

              {/* Priority Suggestion */}
              <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-blue-700">Triage Assessment</h4>
                </div>
                <p className="text-sm text-blue-600 mb-2">
                  Based on the vital signs entered, the suggested priority is:
                </p>
                <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-200">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    suggestedPriority === 'critical' 
                      ? 'bg-red-100 text-red-700' 
                      : suggestedPriority === 'urgent'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-green-100 text-green-700'
                  }`}>
                    {suggestedPriority.toUpperCase()}
                  </span>
                  <span className="text-sm text-gray-600">
                    {suggestedPriority === 'critical' 
                      ? 'Requires immediate medical attention' 
                      : suggestedPriority === 'urgent'
                      ? 'Requires prompt attention'
                      : 'Can be seen in regular order'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Medical History Tab */}
          {activeTab === 'history' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <ClipboardList className="w-4 h-4 text-indigo-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Medical History</h3>
              </div>

              <div className="grid grid-cols-2 gap-5">
                {/* Chronic Conditions */}
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">Chronic Conditions</h4>
                  <div className="space-y-2.5">
                    {[
                      { id: 'hasDiabetes', label: 'Diabetes Mellitus', icon: Activity },
                      { id: 'hasHypertension', label: 'Hypertension', icon: Heart },
                      { id: 'hasHeartDisease', label: 'Heart Disease', icon: Activity },
                      { id: 'hasAsthma', label: 'Asthma', icon: Lungs },
                      { id: 'hasCancer', label: 'Cancer', icon: Milestone },
                      { id: 'hasSurgeries', label: 'Previous Surgeries', icon: Stethoscope }
                    ].map(({ id, label, icon: Icon }) => (
                      <div key={id} className="flex items-center gap-2.5">
                        <input
                          type="checkbox"
                          id={id}
                          checked={historyForm[id as keyof typeof historyForm] as boolean}
                          onChange={(e) => setHistoryForm(prev => ({ ...prev, [id]: e.target.checked }))}
                          className="h-3.5 w-3.5 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-1.5">
                          <Icon className="w-3.5 h-3.5 text-gray-500" />
                          <label htmlFor={id} className="text-xs text-gray-700">
                            {label}
                          </label>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">
                      Other Chronic Illnesses
                    </label>
                    <textarea
                      value={assessment.chronicIllnesses}
                      onChange={(e) => setAssessment(prev => ({ ...prev, chronicIllnesses: e.target.value }))}
                      placeholder="Enter any other chronic illnesses..."
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
                      rows={2}
                    />
                  </div>
                </div>

                {/* Allergies */}
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="p-1.5 bg-red-100 rounded-lg">
                      <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900">Allergies</h4>
                  </div>

                  <div className="flex items-center gap-2.5 mb-2.5">
                    <input
                      type="checkbox"
                      id="hasAllergies"
                      checked={historyForm.hasAllergies}
                      onChange={(e) => setHistoryForm(prev => ({ ...prev, hasAllergies: e.target.checked }))}
                      className="h-3.5 w-3.5 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="hasAllergies" className="text-xs text-gray-700">
                      Patient has allergies
                    </label>
                  </div>

                  {historyForm.hasAllergies && (
                    <div className="space-y-2.5">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newAllergy}
                          onChange={(e) => setNewAllergy(e.target.value)}
                          placeholder="Enter allergy..."
                          className="flex-1 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
                        />
                        <button
                          type="button"
                          onClick={handleAddAllergy}
                          className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {historyForm.allergies.map((allergy, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-1 px-2.5 py-0.5 bg-red-50 text-red-700 rounded-full"
                          >
                            <span className="text-xs">{allergy}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveAllergy(index)}
                              className="p-0.5 hover:bg-red-100 rounded-full"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Current Medications */}
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="p-1.5 bg-emerald-100 rounded-lg">
                      <Pill className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900">Current Medications</h4>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newMedication}
                        onChange={(e) => setNewMedication(e.target.value)}
                        placeholder="Enter medication..."
                        className="flex-1 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddMedication}
                        className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {historyForm.medications.map((medication, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full"
                        >
                          <span className="text-xs">{medication}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMedication(index)}
                            className="p-0.5 hover:bg-emerald-100 rounded-full"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Family History */}
                <div className="bg-white rounded-xl p-4 border shadow-sm">
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="p-1.5 bg-purple-100 rounded-lg">
                      <Users className="w-3.5 h-3.5 text-purple-600" />
                    </div>
                    <h4 className="text-sm font-medium text-gray-900">Family History</h4>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newFamilyHistory}
                        onChange={(e) => setNewFamilyHistory(e.target.value)}
                        placeholder="Enter family history..."
                        className="flex-1 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
                      />
                      <button
                        type="button"
                        onClick={handleAddFamilyHistory}
                        className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {historyForm.familyHistory.map((history, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 px-2.5 py-0.5 bg-purple-50 text-purple-700 rounded-full"
                        >
                          <span className="text-xs">{history}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveFamilyHistory(index)}
                            className="p-0.5 hover:bg-purple-100 rounded-full"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Obstetric History (for female patients) */}
                {patient.gender === 'female' && (
                  <div className="bg-white rounded-xl p-4 border shadow-sm">
                    <div className="flex items-center gap-2.5 mb-3">
                      <div className="p-1.5 bg-pink-100 rounded-lg">
                        <Baby className="w-3.5 h-3.5 text-pink-600" />
                      </div>
                      <h4 className="text-sm font-medium text-gray-900">Obstetric History</h4>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Parity (P)
                        </label>
                        <input
                          type="text"
                          value={assessment.parity}
                          onChange={(e) => setAssessment(prev => ({ ...prev, parity: e.target.value }))}
                          placeholder="e.g., G2P1"
                          className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
                        />
                        <p className="mt-1 text-xs text-gray-500">Format: G (gravida) P (para)</p>
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Last Menstrual Period (LMP)
                        </label>
                        <input
                          type="date"
                          value={assessment.lastMenstrualPeriod}
                          onChange={(e) => setAssessment(prev => ({ ...prev, lastMenstrualPeriod: e.target.value }))}
                          className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assessment Tab */}
          {activeTab === 'assessment' && (
            <div className="space-y-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <Stethoscope className="w-4 h-4 text-green-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900">Assessment</h3>
              </div>

              {/* Symptoms */}
              <div className="bg-white rounded-xl p-4 border shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900">Symptoms</h4>
                </div>
                
                <div className="space-y-2.5">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSymptom}
                      onChange={(e) => setNewSymptom(e.target.value)}
                      placeholder="Enter symptom..."
                      className="flex-1 px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddSymptom}
                      className="px-2.5 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {assessment.symptoms.map((symptom, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-1 px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full"
                      >
                        <span className="text-xs">{symptom}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSymptom(index)}
                          className="p-0.5 hover:bg-blue-100 rounded-full"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Priority Selection */}
              <div className="bg-white rounded-xl p-4 border shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <AlertCircle className="w-3.5 h-3.5 text-purple-600" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900">Priority Level</h4>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'normal', label: 'Normal', icon: ArrowRight, color: 'emerald' },
                    { value: 'urgent', label: 'Urgent', icon: ArrowUpRight, color: 'amber' },
                    { value: 'critical', label: 'Critical', icon: AlertCircle, color: 'red' }
                  ].map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setAssessment(prev => ({ ...prev, priority: value }))}
                      className={`p-3 rounded-lg border text-left transition-colors ${
                        assessment.priority === value
                          ? `border-${color}-500 bg-${color}-50 ring-1 ring-${color}-500/20`
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 bg-${color}-100 rounded-lg`}>
                          <Icon className={`w-3.5 h-3.5 text-${color}-600`} />
                        </div>
                        <span className="text-sm font-medium">{label}</span>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="mt-2 p-2 bg-blue-50 rounded-lg text-xs text-blue-700">
                  <Info className="w-3.5 h-3.5 inline mr-1" />
                  <strong>Note:</strong> "Critical" priority indicates a serious condition requiring prompt attention.
                </div>
              </div>

              {/* Department Selection */}
              <div className="bg-white rounded-xl p-4 border shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900">Refer to Department</h4>
                </div>
                <select
                  value={assessment.nextDepartment}
                  onChange={(e) => setAssessment(prev => ({ ...prev, nextDepartment: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                >
                  <option value={departments.GENERAL}>General Consultation</option>
                  <option value={departments.PEDIATRICS}>Pediatrics</option>
                  <option value={departments.GYNECOLOGY}>Gynecology</option>
                  <option value={departments.SURGICAL}>Surgical</option>
                  <option value={departments.ORTHOPEDIC}>Orthopedic</option>
                  <option value={departments.DENTAL}>Dental</option>
                  <option value={departments.EYE}>Eye Clinic</option>
                  <option value={departments.PHYSIOTHERAPY}>Physiotherapy</option>
                </select>
                {errors.nextDepartment && (
                  <p className="mt-1 text-xs text-red-600">{errors.nextDepartment}</p>
                )}
              </div>

              {/* Additional Notes */}
              <div className="bg-white rounded-xl p-4 border shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 bg-gray-100 rounded-lg">
                    <FileText className="w-3.5 h-3.5 text-gray-600" />
                  </div>
                  <h4 className="text-sm font-medium text-gray-900">Additional Notes</h4>
                </div>
                <textarea
                  value={assessment.notes}
                  onChange={(e) => setAssessment(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Enter any additional notes or observations..."
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  rows={3}
                />
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-between mt-6">
            <div>
              {activeTab !== 'vitals' && (
                <button
                  type="button"
                  onClick={handlePreviousTab}
                  className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                >
                  <ArrowLeftIcon className="w-4 h-4" />
                  <span>Previous</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 text-sm"
                disabled={isProcessing}
              >
                Cancel
              </button>
              
              {activeTab !== 'assessment' ? (
                <button
                  type="button"
                  onClick={handleNextTab}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <span>Next</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isProcessing}
                  className={`flex items-center gap-2 px-5 py-2 rounded-lg text-white text-sm ${
                    isProcessing
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Complete Triage</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {errors.submit && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{errors.submit}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
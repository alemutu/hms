import React, { useState, useEffect } from 'react';
import { usePatientStore } from '../../lib/store';
import {
  X,
  Activity,
  Heart,
  ThermometerSun,
  Gauge,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  Ambulance,
  Siren,
  Brain,
  Eye,
  Settings as Lungs,
  Info,
  Skull,
  Heartbeat
} from 'lucide-react';
import { format } from 'date-fns';
import type { Patient, VitalSigns } from '../../types';

interface EmergencyTriageFormProps {
  patientId: string;
  onClose: () => void;
  onComplete: (patientId: string) => void;
}

export const EmergencyTriageForm: React.FC<EmergencyTriageFormProps> = ({
  patientId,
  onClose,
  onComplete
}) => {
  const { patientQueue, updateVitalSigns, updateParallelWorkflow } = usePatientStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const patient = patientQueue.find(p => p.id === patientId);
  if (!patient) return null;
  
  const [vitalsForm, setVitalsForm] = useState<VitalSigns>({
    bloodPressure: '',
    pulseRate: 0,
    temperature: 0,
    oxygenSaturation: 0,
    respiratoryRate: 0,
    recordedAt: new Date(),
    recordedBy: 'Emergency Nurse',
    isEmergency: true,
    glasgowComaScale: {
      eyeOpening: 4, // 1-4
      verbalResponse: 5, // 1-5
      motorResponse: 6, // 1-6
      total: 15 // 3-15
    },
    avpu: 'alert'
  });
  
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [interventions, setInterventions] = useState<string[]>([]);
  
  // Calculate Glasgow Coma Scale total
  useEffect(() => {
    if (vitalsForm.glasgowComaScale) {
      const { eyeOpening, verbalResponse, motorResponse } = vitalsForm.glasgowComaScale;
      const total = eyeOpening + verbalResponse + motorResponse;
      
      setVitalsForm(prev => ({
        ...prev,
        glasgowComaScale: {
          ...prev.glasgowComaScale!,
          total
        }
      }));
    }
  }, [vitalsForm.glasgowComaScale?.eyeOpening, vitalsForm.glasgowComaScale?.verbalResponse, vitalsForm.glasgowComaScale?.motorResponse]);
  
  const handleGCSChange = (field: 'eyeOpening' | 'verbalResponse' | 'motorResponse', value: number) => {
    setVitalsForm(prev => ({
      ...prev,
      glasgowComaScale: {
        ...prev.glasgowComaScale!,
        [field]: value
      }
    }));
  };
  
  const handleInterventionToggle = (intervention: string) => {
    setInterventions(prev => 
      prev.includes(intervention)
        ? prev.filter(i => i !== intervention)
        : [...prev, intervention]
    );
  };
  
  const validateForm = () => {
    const errors: string[] = [];
    
    if (!vitalsForm.bloodPressure) errors.push('Blood pressure is required');
    if (!vitalsForm.pulseRate) errors.push('Pulse rate is required');
    if (!vitalsForm.temperature) errors.push('Temperature is required');
    if (!vitalsForm.oxygenSaturation) errors.push('Oxygen saturation is required');
    if (!vitalsForm.respiratoryRate) errors.push('Respiratory rate is required');
    if (!chiefComplaint) errors.push('Chief complaint is required');
    
    if (errors.length > 0) {
      setError(errors.join('. '));
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Record vital signs
      await updateVitalSigns(patientId, {
        ...vitalsForm,
        recordedAt: new Date()
      });
      
      // Update emergency details
      await updateParallelWorkflow(patientId, {
        emergencyTriageTime: new Date().toISOString(),
        emergencyDescription: chiefComplaint || patient.emergencyDescription
      });
      
      setSuccess(true);
      
      // Complete triage after a short delay
      setTimeout(() => {
        onComplete(patientId);
      }, 1500);
    } catch (error) {
      console.error('Error completing emergency triage:', error);
      setError(error instanceof Error ? error.message : 'Failed to complete emergency triage');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-red-600 to-red-700 sticky top-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                <Ambulance className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Emergency Triage</h2>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-red-100">
                    {patient.fullName} • {patient.age} years, {patient.gender}
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-white/20 text-white">
                    {patient.emergencyType || 'Emergency'}
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
          
          <div className="flex items-center gap-2 mt-4 bg-white/10 p-2 rounded-lg">
            <div className="p-1.5 bg-white/10 rounded-lg">
              <Siren className="w-4 h-4 text-white" />
            </div>
            <p className="text-xs text-white">
              <strong>Emergency Triage:</strong> Record vital signs and initial assessment quickly. Patient will be moved to emergency treatment after triage.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Emergency Triage Completed</p>
                <p className="text-sm text-green-600">Moving patient to emergency treatment...</p>
              </div>
            </div>
          )}

          {/* Chief Complaint */}
          <div className="bg-red-50 rounded-xl p-4 border border-red-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-1.5 bg-red-100 rounded-lg">
                <Siren className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="font-medium text-red-900">Chief Complaint</h3>
            </div>
            <textarea
              value={chiefComplaint}
              onChange={(e) => setChiefComplaint(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              placeholder="Enter chief complaint or emergency description..."
              required
            />
          </div>

          {/* Vital Signs */}
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
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                  required
                />
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
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Normal range: 36.5-37.5°C</p>
              </div>

              {/* Pulse Rate */}
              <div className="bg-white rounded-xl p-4 border shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 bg-purple-100 rounded-lg">
                    <Heartbeat className="w-4 h-4 text-purple-600" />
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
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                  required
                />
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
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                  required
                />
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
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">Normal range: 12-20 breaths/min</p>
              </div>

              {/* AVPU Scale */}
              <div className="bg-white rounded-xl p-4 border shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <Brain className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">AVPU Scale</h4>
                    <p className="text-xs text-gray-500">Level of consciousness</p>
                  </div>
                </div>
                <select
                  value={vitalsForm.avpu}
                  onChange={(e) => setVitalsForm(prev => ({ ...prev, avpu: e.target.value as 'alert' | 'verbal' | 'pain' | 'unresponsive' }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 text-sm"
                >
                  <option value="alert">Alert</option>
                  <option value="verbal">Verbal (Responds to voice)</option>
                  <option value="pain">Pain (Responds to pain)</option>
                  <option value="unresponsive">Unresponsive</option>
                </select>
              </div>
            </div>

            {/* Glasgow Coma Scale */}
            <div className="bg-white rounded-xl p-4 border shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-1.5 bg-purple-100 rounded-lg">
                  <Brain className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900">Glasgow Coma Scale</h4>
                  <p className="text-xs text-gray-500">
                    Total Score: <span className="font-medium">{vitalsForm.glasgowComaScale?.total || 15}</span>/15
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Eye Opening */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Eye Opening
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { value: 1, label: 'None' },
                      { value: 2, label: 'To Pain' },
                      { value: 3, label: 'To Voice' },
                      { value: 4, label: 'Spontaneous' }
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleGCSChange('eyeOpening', value)}
                        className={`p-2 border rounded-lg text-center text-sm ${
                          vitalsForm.glasgowComaScale?.eyeOpening === value
                            ? 'bg-purple-50 border-purple-300 text-purple-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-bold">{value}</div>
                        <div className="text-xs">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Verbal Response */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Verbal Response
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { value: 1, label: 'None' },
                      { value: 2, label: 'Incomprehensible' },
                      { value: 3, label: 'Inappropriate' },
                      { value: 4, label: 'Confused' },
                      { value: 5, label: 'Oriented' }
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleGCSChange('verbalResponse', value)}
                        className={`p-2 border rounded-lg text-center text-sm ${
                          vitalsForm.glasgowComaScale?.verbalResponse === value
                            ? 'bg-purple-50 border-purple-300 text-purple-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-bold">{value}</div>
                        <div className="text-xs">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>
                
                {/* Motor Response */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Motor Response
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {[
                      { value: 1, label: 'None' },
                      { value: 2, label: 'Extension' },
                      { value: 3, label: 'Abnormal Flexion' },
                      { value: 4, label: 'Withdrawal' },
                      { value: 5, label: 'Localizes Pain' },
                      { value: 6, label: 'Obeys Commands' }
                    ].map(({ value, label }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleGCSChange('motorResponse', value)}
                        className={`p-2 border rounded-lg text-center text-sm ${
                          vitalsForm.glasgowComaScale?.motorResponse === value
                            ? 'bg-purple-50 border-purple-300 text-purple-700'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-bold">{value}</div>
                        <div className="text-xs">{label}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-purple-600" />
                  <p className="text-sm text-purple-700">
                    <strong>GCS Interpretation:</strong> {' '}
                    {vitalsForm.glasgowComaScale?.total === 15 ? 'Normal' : 
                     vitalsForm.glasgowComaScale?.total! >= 13 ? 'Minor injury' :
                     vitalsForm.glasgowComaScale?.total! >= 9 ? 'Moderate injury' :
                     'Severe injury'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Initial Interventions */}
          <div className="bg-white rounded-xl p-4 border shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-1.5 bg-green-100 rounded-lg">
                <Activity className="w-4 h-4 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900">Initial Interventions</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              {[
                'IV Access',
                'Oxygen Therapy',
                'Cardiac Monitoring',
                'Fluid Resuscitation',
                'Bleeding Control',
                'Airway Management',
                'Cervical Collar',
                'Splinting',
                'Pain Management',
                'Wound Care'
              ].map(intervention => (
                <label key={intervention} className="flex items-center gap-2 p-2 border rounded-lg hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={interventions.includes(intervention)}
                    onChange={() => handleInterventionToggle(intervention)}
                    className="rounded text-red-600 focus:ring-red-500"
                  />
                  <span className="text-sm">{intervention}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-between pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Cancel</span>
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  <span>Complete Triage</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
import React, { useState, useEffect } from 'react';
import { usePatientStore } from '../../lib/store';
import { generateInpatientNumber } from '../../lib/patientNumbering';
import {
  X,
  Bed,
  Calendar,
  Clock,
  User,
  Building2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Plus,
  CreditCard,
  DollarSign
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import type { Admission, Patient, Ward } from '../../types';

interface AdmissionFormProps {
  patientId?: string | null;
  wards: Ward[];
  onClose: () => void;
  onSubmit: (admission: Admission) => Promise<void>;
}

export const AdmissionForm: React.FC<AdmissionFormProps> = ({
  patientId,
  wards,
  onClose,
  onSubmit
}) => {
  const { patientQueue, updatePatient } = usePatientStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [ipNumber, setIpNumber] = useState('');
  
  const [formData, setFormData] = useState<Omit<Admission, 'id'>>({
    patientId: '',
    admissionDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    admittedBy: 'Dr. Sarah Chen',
    wardId: '',
    bedId: '',
    admissionReason: '',
    status: 'active',
    expectedDischargeDate: format(addDays(new Date(), 5), "yyyy-MM-dd'T'HH:mm")
  });

  // Available beds for selected ward
  const [availableBeds, setAvailableBeds] = useState<Array<{ id: string; number: string }>>([]);

  // Set selected patient if patientId is provided
  useEffect(() => {
    if (patientId) {
      const patient = patientQueue.find(p => p.id === patientId);
      if (patient) {
        setSelectedPatient(patient);
        setFormData(prev => ({ ...prev, patientId: patient.id }));
        
        // Generate IP number
        const generatedIpNumber = generateInpatientNumber();
        setIpNumber(generatedIpNumber);
      }
    }
  }, [patientId, patientQueue]);

  // Filter patients based on search query
  const filteredPatients = patientQueue.filter(patient =>
    patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.idNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Update available beds when ward changes
  useEffect(() => {
    if (formData.wardId) {
      // In a real app, this would be an API call to get available beds for the ward
      // For now, we'll generate some sample beds
      const sampleBeds = Array.from({ length: 10 }, (_, i) => ({
        id: `bed-${formData.wardId}-${i + 1}`,
        number: `${i + 1}`
      }));
      setAvailableBeds(sampleBeds);
      
      // Reset selected bed
      setFormData(prev => ({ ...prev, bedId: '' }));
    } else {
      setAvailableBeds([]);
    }
  }, [formData.wardId]);

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.patientId) errors.push('Patient is required');
    if (!formData.wardId) errors.push('Ward is required');
    if (!formData.bedId) errors.push('Bed is required');
    if (!formData.admissionReason) errors.push('Admission reason is required');
    if (!formData.admissionDate) errors.push('Admission date is required');
    
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
      const admission: Admission = {
        id: `adm-${Date.now().toString(36)}`,
        ...formData
      };
      
      // Update patient type to inpatient and add IP number
      if (selectedPatient) {
        await updatePatient(selectedPatient.id, {
          patientType: 'inpatient',
          ipNumber: ipNumber,
          isAdmitted: true,
          admittedTime: new Date().toISOString()
        });
      }
      
      await onSubmit(admission);
      setSuccess(true);
      
      // Close after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error creating admission:', error);
      setError(error instanceof Error ? error.message : 'Failed to create admission');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Bed className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">New Inpatient Admission</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800">Admission Created Successfully</p>
                <p className="text-sm text-green-600">The patient has been admitted and assigned to a bed.</p>
              </div>
            </div>
          )}

          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Patient <span className="text-red-500">*</span>
            </label>
            {selectedPatient ? (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 font-medium">
                      {selectedPatient.fullName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium">{selectedPatient.fullName}</h4>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-sm text-gray-500">ID: {selectedPatient.idNumber}</p>
                      <p className="text-sm text-gray-500">{selectedPatient.age} years, {selectedPatient.gender}</p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatient(null);
                    setFormData(prev => ({ ...prev, patientId: '' }));
                  }}
                  className="p-1.5 hover:bg-blue-100 rounded-lg"
                >
                  <X className="w-4 h-4 text-blue-600" />
                </button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search patients by name or ID..."
                    className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {searchQuery && (
                  <div className="mt-2 border rounded-lg divide-y max-h-48 overflow-y-auto">
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((patient) => (
                        <div
                          key={patient.id}
                          onClick={() => {
                            setSelectedPatient(patient);
                            setSearchQuery('');
                            setFormData(prev => ({ ...prev, patientId: patient.id }));
                            
                            // Generate IP number when selecting a patient
                            const generatedIpNumber = generateInpatientNumber();
                            setIpNumber(generatedIpNumber);
                          }}
                          className="p-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {patient.fullName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{patient.fullName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-gray-500">ID: {patient.idNumber}</p>
                                <p className="text-xs text-gray-500">{patient.age} years, {patient.gender}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500">
                        No patients found matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* IP Number (read-only) */}
          {selectedPatient && ipNumber && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                IP Number (Auto-generated)
              </label>
              <input
                type="text"
                value={ipNumber}
                className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm text-gray-700 cursor-not-allowed"
                disabled
              />
              <p className="mt-1 text-xs text-gray-500">
                This IP number will be assigned to the patient upon admission
              </p>
            </div>
          )}

          {/* Admission Details */}
          {selectedPatient && (
            <>
              <div className="grid grid-cols-2 gap-6">
                {/* Admission Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admission Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.admissionDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, admissionDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Expected Discharge Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expected Discharge Date
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.expectedDischargeDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, expectedDischargeDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Ward Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ward <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.wardId}
                    onChange={(e) => setFormData(prev => ({ ...prev, wardId: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Ward</option>
                    {wards.map(ward => (
                      <option key={ward.id} value={ward.id}>
                        {ward.name} - {formatCurrency(ward.dailyRate)}/day
                      </option>
                    ))}
                  </select>
                </div>

                {/* Bed Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bed <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.bedId}
                    onChange={(e) => setFormData(prev => ({ ...prev, bedId: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={!formData.wardId}
                  >
                    <option value="">Select Bed</option>
                    {availableBeds.map(bed => (
                      <option key={bed.id} value={bed.id}>
                        Bed {bed.number}
                      </option>
                    ))}
                  </select>
                  {!formData.wardId && (
                    <p className="mt-1 text-xs text-gray-500">
                      Please select a ward first
                    </p>
                  )}
                </div>
              </div>

              {/* Admission Reason */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admission Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.admissionReason}
                  onChange={(e) => setFormData(prev => ({ ...prev, admissionReason: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter reason for admission..."
                  required
                />
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={formData.admissionNotes}
                  onChange={(e) => setFormData(prev => ({ ...prev, admissionNotes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter any additional notes..."
                />
              </div>

              {/* Billing Preview */}
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                <div className="flex items-center gap-2 mb-3">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <h4 className="font-medium text-gray-900">Billing Preview</h4>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Daily Ward Charge:</span>
                    <span className="text-sm font-medium">
                      {formData.wardId 
                        ? formatCurrency(wards.find(w => w.id === formData.wardId)?.dailyRate || 0)
                        : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Admission Fee:</span>
                    <span className="text-sm font-medium">{formatCurrency(2000)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Initial Assessment:</span>
                    <span className="text-sm font-medium">{formatCurrency(1500)}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t border-blue-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Initial Payment Required:</span>
                      <span className="text-sm font-bold text-gray-900">
                        {formData.wardId 
                          ? formatCurrency((wards.find(w => w.id === formData.wardId)?.dailyRate || 0) + 3500)
                          : formatCurrency(3500)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || !selectedPatient}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg ${
                isSubmitting || !selectedPatient
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Create Admission</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
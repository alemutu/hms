import React, { useState, useEffect } from 'react';
import { usePatientStore } from '../../lib/store';
import {
  Pill,
  Plus,
  X,
  Save,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  Search,
  Filter,
  Package,
  Calendar,
  Clock as ClockIcon,
  Info,
  ChevronRight,
  ArrowRight
} from 'lucide-react';

interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  route?: string;
  timing?: string;
  withFood?: boolean;
  specialInstructions?: string;
  notes?: string;
}

interface MedicationManagerProps {
  patientId: string;
  onMedicationsChange: (medications: Medication[]) => void;
  initialMedications?: Medication[];
  onClose?: () => void;
  onComplete?: () => void;
}

const commonMedications = [
  { name: 'Paracetamol', dosage: '500mg', category: 'Pain Relief' },
  { name: 'Ibuprofen', dosage: '400mg', category: 'Anti-inflammatory' },
  { name: 'Amoxicillin', dosage: '500mg', category: 'Antibiotics' },
  { name: 'Omeprazole', dosage: '20mg', category: 'Gastric' },
  { name: 'Cetirizine', dosage: '10mg', category: 'Antihistamine' },
  { name: 'Metformin', dosage: '500mg', category: 'Diabetes' },
  { name: 'Amlodipine', dosage: '5mg', category: 'Blood Pressure' },
  { name: 'Salbutamol', dosage: '100mcg', category: 'Respiratory' }
];

const frequencies = [
  'Once daily',
  'Twice daily',
  'Three times daily',
  'Four times daily',
  'Every 4 hours',
  'Every 6 hours',
  'Every 8 hours',
  'As needed'
];

const routes = [
  'Oral',
  'Sublingual',
  'Topical',
  'Subcutaneous',
  'Intramuscular',
  'Intravenous',
  'Inhalation',
  'Rectal'
];

const timings = [
  'Before meals',
  'After meals',
  'With meals',
  'Before bedtime',
  'Morning',
  'Evening',
  'Empty stomach'
];

export const MedicationManager: React.FC<MedicationManagerProps> = ({
  patientId,
  onMedicationsChange,
  initialMedications = [],
  onClose,
  onComplete
}) => {
  const { createPrescription } = usePatientStore();
  const [medications, setMedications] = useState<Medication[]>(initialMedications);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [newMedication, setNewMedication] = useState<Medication>({
    name: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: 1,
    route: 'Oral',
    timing: 'After meals',
    withFood: true,
    specialInstructions: '',
    notes: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const filteredMedications = commonMedications.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    med.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const validateMedication = (med: Medication) => {
    const newErrors: Record<string, string> = {};

    if (!med.name) newErrors.name = 'Medication name is required';
    if (!med.dosage) newErrors.dosage = 'Dosage is required';
    if (!med.frequency) newErrors.frequency = 'Frequency is required';
    if (!med.duration) newErrors.duration = 'Duration is required';
    if (!med.quantity || med.quantity < 1) newErrors.quantity = 'Valid quantity is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSelectMedication = (med: typeof commonMedications[0]) => {
    setNewMedication(prev => ({
      ...prev,
      name: med.name,
      dosage: med.dosage
    }));
    setShowAddForm(true);
  };

  const handleAddMedication = () => {
    if (!validateMedication(newMedication)) return;

    setMedications(prev => [...prev, newMedication]);
    onMedicationsChange([...medications, newMedication]);
    setNewMedication({
      name: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: 1,
      route: 'Oral',
      timing: 'After meals',
      withFood: true,
      specialInstructions: '',
      notes: ''
    });
    setShowAddForm(false);
    
    // Set success state
    setSuccess(true);
  };

  const handleRemoveMedication = (index: number) => {
    const updatedMedications = medications.filter((_, i) => i !== index);
    setMedications(updatedMedications);
    onMedicationsChange(updatedMedications);
  };

  const handleCompleteWithoutAdding = () => {
    if (onClose) {
      onClose();
    }
  };

  const handleCompletePrescription = async () => {
    if (medications.length === 0) {
      return;
    }

    setIsSubmitting(true);
    try {
      // Create a prescription
      const prescription = {
        id: crypto.randomUUID(),
        patientId,
        consultationId: null,
        prescribedBy: 'Dr. Sarah Chen',
        prescribedAt: new Date().toISOString(),
        status: 'pending',
        medications,
        notes: ''
      };

      // Save the prescription to the store
      await createPrescription(prescription);

      // Show success message
      setSuccess(true);

      // Call onComplete after a short delay
      setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 1500);
    } catch (error) {
      console.error('Error creating prescription:', error);
      setErrors({ submit: 'Failed to create prescription' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Auto-complete when medications are added
  useEffect(() => {
    if (medications.length > 0 && success) {
      // Short delay to show success message
      const timer = setTimeout(() => {
        if (onComplete) {
          onComplete();
        }
      }, 1500);
      
      return () => clearTimeout(timer);
    }
  }, [medications, success, onComplete]);

  if (showAddForm) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAddForm(false)}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
            <h3 className="font-medium text-gray-900">Add Medication</h3>
          </div>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Medication Name
              </label>
              <input
                type="text"
                value={newMedication.name}
                onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : ''
                }`}
                placeholder="Enter medication name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dosage
              </label>
              <input
                type="text"
                value={newMedication.dosage}
                onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.dosage ? 'border-red-500' : ''
                }`}
                placeholder="e.g., 500mg"
              />
              {errors.dosage && (
                <p className="mt-1 text-sm text-red-600">{errors.dosage}</p>
              )}
            </div>
          </div>

          {/* Frequency and Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Frequency
              </label>
              <select
                value={newMedication.frequency}
                onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.frequency ? 'border-red-500' : ''
                }`}
              >
                <option value="">Select frequency</option>
                {frequencies.map(freq => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
              {errors.frequency && (
                <p className="mt-1 text-sm text-red-600">{errors.frequency}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Duration
              </label>
              <input
                type="text"
                value={newMedication.duration}
                onChange={(e) => setNewMedication(prev => ({ ...prev, duration: e.target.value }))}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.duration ? 'border-red-500' : ''
                }`}
                placeholder="e.g., 7 days"
              />
              {errors.duration && (
                <p className="mt-1 text-sm text-red-600">{errors.duration}</p>
              )}
            </div>
          </div>

          {/* Route and Timing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Route of Administration
              </label>
              <select
                value={newMedication.route}
                onChange={(e) => setNewMedication(prev => ({ ...prev, route: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {routes.map(route => (
                  <option key={route} value={route}>{route}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Timing
              </label>
              <select
                value={newMedication.timing}
                onChange={(e) => setNewMedication(prev => ({ ...prev, timing: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {timings.map(timing => (
                  <option key={timing} value={timing}>{timing}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity
            </label>
            <input
              type="number"
              value={newMedication.quantity}
              onChange={(e) => setNewMedication(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
              min="1"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.quantity ? 'border-red-500' : ''
              }`}
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
            )}
          </div>

          {/* Special Instructions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Special Instructions
            </label>
            <textarea
              value={newMedication.specialInstructions}
              onChange={(e) => setNewMedication(prev => ({ ...prev, specialInstructions: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter any special instructions..."
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Additional Notes
            </label>
            <textarea
              value={newMedication.notes}
              onChange={(e) => setNewMedication(prev => ({ ...prev, notes: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter any additional notes..."
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={handleAddMedication}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <span>Add Medication</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Add */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search medications..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Custom</span>
        </button>
      </div>

      {/* Common Medications */}
      {searchQuery && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Common Medications</h4>
          <div className="grid grid-cols-2 gap-2">
            {filteredMedications.map((med) => (
              <button
                key={med.name}
                onClick={() => handleSelectMedication(med)}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50"
              >
                <div>
                  <p className="font-medium text-sm">{med.name}</p>
                  <p className="text-xs text-gray-500">{med.category}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Current Medications */}
      {medications.length > 0 ? (
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-700">Prescribed Medications</h4>
          <div className="space-y-3">
            {medications.map((med, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Pill className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium">{med.name}</h4>
                      <p className="text-sm text-gray-500">{med.dosage}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMedication(index)}
                    className="p-1 hover:bg-gray-200 rounded-lg"
                  >
                    <X className="w-4 h-4 text-gray-500" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500">Frequency</p>
                    <p className="font-medium">{med.frequency}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Duration</p>
                    <p className="font-medium">{med.duration}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Quantity</p>
                    <p className="font-medium">{med.quantity}</p>
                  </div>
                </div>

                {(med.specialInstructions || med.notes) && (
                  <div className="mt-3 pt-3 border-t">
                    {med.specialInstructions && (
                      <div className="mb-2">
                        <p className="text-xs text-gray-500">Special Instructions</p>
                        <p className="text-sm">{med.specialInstructions}</p>
                      </div>
                    )}
                    {med.notes && (
                      <div>
                        <p className="text-xs text-gray-500">Notes</p>
                        <p className="text-sm">{med.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Complete button */}
          <div className="flex justify-end mt-4">
            <button
              onClick={handleCompletePrescription}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Complete Prescription</span>
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <Pill className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No medications prescribed yet</p>
          <p className="text-xs text-gray-400 mt-1">Search above or click Add Custom to prescribe medications</p>
          
          {/* Skip button */}
          <button
            onClick={handleCompleteWithoutAdding}
            className="mt-4 px-4 py-2 text-gray-600 hover:text-gray-900"
          >
            Skip prescribing medications
          </button>
        </div>
      )}
      
      {/* Success message */}
      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2 mt-4">
          <CheckCircle2 className="w-5 h-5" />
          <span>Prescription created successfully! Patient has been sent to pharmacy.</span>
        </div>
      )}
    </div>
  );
};
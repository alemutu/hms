import React, { useState } from 'react';
import { format } from 'date-fns';
import { AlertCircle, CheckCircle2, RefreshCw, X, Goal as Vial, TestTube, Beaker, Microscope, FlaskConical, Copy } from 'lucide-react';
import type { LabTest, Patient } from '../../types';
import { generateSampleId } from './SampleIdGenerator';

interface SampleCollectionFormProps {
  test: LabTest;
  patient: Patient;
  onClose: () => void;
  onSubmit: (sampleData: {
    sampleId: string;
    sampleType: string;
    collectedBy: string;
    collectedAt: string;
    notes?: string;
  }) => Promise<void>;
}

export const SampleCollectionForm: React.FC<SampleCollectionFormProps> = ({
  test,
  patient,
  onClose,
  onSubmit
}) => {
  // Generate initial sample ID based on test type and category
  const initialSampleId = generateSampleId(test.testType, test.category || 'LAB');
  
  // Determine sample type based on test type
  const getSampleType = (testType: string): string => {
    const sampleTypes: Record<string, string> = {
      'Complete Blood Count (CBC)': 'Whole Blood',
      'Liver Function Test': 'Serum',
      'Lipid Profile': 'Serum',
      'Blood Culture': 'Blood',
      'Urinalysis': 'Urine',
      'Coagulation Profile': 'Plasma',
      'Blood Glucose': 'Whole Blood',
      'Thyroid Function': 'Serum',
      'Electrolytes': 'Serum',
      'Kidney Function': 'Serum'
    };
    return sampleTypes[testType] || 'Blood';
  };

  const [formData, setFormData] = useState<Omit<LabTest, 'id'>>({
    sampleId: initialSampleId,
    sampleType: getSampleType(test.testType),
    collectedBy: 'Lab Technician',
    collectedAt: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({
        ...formData,
        // Ensure we use the auto-generated values
        sampleId: initialSampleId,
        sampleType: getSampleType(test.testType)
      });
      onClose();
    } catch (error) {
      setError('Failed to save sample collection data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopySampleId = () => {
    navigator.clipboard.writeText(initialSampleId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getTestIcon = () => {
    switch (test.category?.toLowerCase()) {
      case 'hematology':
        return TestTube;
      case 'biochemistry':
        return Beaker;
      case 'microbiology':
        return Microscope;
      default:
        return FlaskConical;
    }
  };

  const TestIcon = getTestIcon();

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex-none p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TestIcon className="w-5 h-5 text-purple-600" />
              </div>
              <h3 className="font-medium text-gray-900">Sample Collection</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sample ID - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sample ID
              </label>
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 bg-gray-100 border rounded-lg text-sm text-gray-800 font-mono">
                  {initialSampleId}
                </div>
                <button
                  type="button"
                  onClick={handleCopySampleId}
                  className={`px-3 py-2 rounded-lg transition-colors ${
                    copied 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Auto-generated unique identifier for this sample
              </p>
            </div>

            {/* Sample Type - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sample Type
              </label>
              <div className="px-3 py-2 bg-gray-100 border rounded-lg text-sm text-gray-800">
                {getSampleType(test.testType)}
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Automatically determined based on test type
              </p>
            </div>

            {/* Collection Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Collection Time
              </label>
              <input
                type="datetime-local"
                value={formData.collectedAt}
                onChange={(e) => setFormData(prev => ({ ...prev, collectedAt: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
                rows={2}
                placeholder="Add any collection notes..."
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </form>
        </div>

        {/* Form Actions */}
        <div className="flex-none p-4 border-t bg-gray-50">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Save Collection</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
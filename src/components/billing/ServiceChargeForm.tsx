import React, { useState } from 'react';
import {
  X,
  FileText,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  Save,
  Building2
} from 'lucide-react';
import type { ServiceCharge } from '../../types';
import { departments, departmentNames } from '../../types/departments';

interface ServiceChargeFormProps {
  service?: ServiceCharge;
  onClose: () => void;
  onSubmit: (serviceId: string, service: Partial<ServiceCharge> | ServiceCharge) => Promise<void>;
}

export const ServiceChargeForm: React.FC<ServiceChargeFormProps> = ({
  service,
  onClose,
  onSubmit
}) => {
  const [formData, setFormData] = useState<Omit<ServiceCharge, 'id'>>({
    name: service?.name || '',
    department: service?.department || 'general-consultation',
    amount: service?.amount || 0,
    category: service?.category || 'consultation'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateForm = () => {
    if (!formData.name) {
      setError('Service name is required');
      return false;
    }

    if (!formData.department) {
      setError('Department is required');
      return false;
    }

    if (!formData.category) {
      setError('Category is required');
      return false;
    }

    if (formData.amount <= 0) {
      setError('Amount must be greater than zero');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (service) {
        // Update existing service
        await onSubmit(service.id, formData);
      } else {
        // Create new service
        const newService: ServiceCharge = {
          id: crypto.randomUUID(),
          ...formData
        };
        await onSubmit(newService.id, newService);
      }
    } catch (error) {
      console.error('Error saving service charge:', error);
      setError(error instanceof Error ? error.message : 'Failed to save service charge');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">
                {service ? 'Edit Service Charge' : 'Add Service Charge'}
              </h3>
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

        <div className="p-6 space-y-6">
          {/* Service Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter service name"
            />
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(departmentNames).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="consultation">Consultation</option>
              <option value="laboratory">Laboratory</option>
              <option value="radiology">Radiology</option>
              <option value="procedure">Procedure</option>
              <option value="medication">Medication</option>
              <option value="inpatient">Inpatient</option>
              <option value="other">Other</option>
            </select>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Amount (Ksh)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Ksh</span>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t">
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
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>{service ? 'Update Service' : 'Save Service'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
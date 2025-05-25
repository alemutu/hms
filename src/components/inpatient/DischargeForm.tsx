import React, { useState, useEffect } from 'react';
import { usePatientStore } from '../../lib/store';
import {
  X,
  CheckCircle2,
  Calendar,
  Clock,
  User,
  Building2,
  Bed,
  AlertTriangle,
  RefreshCw,
  FileText,
  DollarSign,
  CreditCard,
  Receipt,
  Printer,
  Download
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import type { Admission, DailyCharge, Patient, Ward } from '../../types';

interface DischargeFormProps {
  admission: Admission;
  wards: Ward[];
  onClose: () => void;
  onSubmit: (admission: Admission, dischargeData: any) => Promise<void>;
}

export const DischargeForm: React.FC<DischargeFormProps> = ({
  admission,
  wards,
  onClose,
  onSubmit
}) => {
  const { patientQueue } = usePatientStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    dischargeDate: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    notes: '',
    summary: '',
    followUpRequired: false,
    followUpDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    followUpDepartment: '',
    paymentStatus: 'pending' as 'pending' | 'partial' | 'complete',
    paymentAmount: 0,
    paymentMethod: 'cash' as 'cash' | 'mpesa' | 'card' | 'insurance' | 'bank'
  });

  // Get patient data
  const patient = patientQueue.find(p => p.id === admission.patientId);
  
  // Get ward data
  const ward = wards.find(w => w.id === admission.wardId);
  
  // Calculate stay duration and estimated bill
  const stayDuration = differenceInDays(new Date(), new Date(admission.admissionDate)) || 1;
  const estimatedBill = ward ? ward.dailyRate * stayDuration : 0;
  
  // Sample charges
  const [charges, setCharges] = useState([
    {
      description: `${ward?.name || 'Ward'} Bed Charges (${stayDuration} days)`,
      amount: ward ? ward.dailyRate * stayDuration : 0
    },
    {
      description: 'Nursing Care',
      amount: 1500 * stayDuration
    },
    {
      description: 'Medication',
      amount: 3500
    },
    {
      description: 'Laboratory Tests',
      amount: 2500
    },
    {
      description: 'Doctor Visits',
      amount: 3000
    }
  ]);
  
  const totalBill = charges.reduce((sum, charge) => sum + charge.amount, 0);

  useEffect(() => {
    // Set initial payment amount to total bill
    setFormData(prev => ({ ...prev, paymentAmount: totalBill }));
  }, [totalBill]);

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!formData.dischargeDate) errors.push('Discharge date is required');
    if (!formData.summary) errors.push('Discharge summary is required');
    if (formData.followUpRequired && !formData.followUpDate) errors.push('Follow-up date is required');
    if (formData.followUpRequired && !formData.followUpDepartment) errors.push('Follow-up department is required');
    
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
      await onSubmit(admission, formData);
      setSuccess(true);
      
      // Close after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error discharging patient:', error);
      setError(error instanceof Error ? error.message : 'Failed to discharge patient');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  if (!patient || !ward) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6 max-w-md">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-500" />
            <h3 className="text-lg font-semibold">Error</h3>
          </div>
          <p className="text-gray-600 mb-6">
            Could not find patient or ward information for this admission.
          </p>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <h3 className="font-medium text-gray-900">Discharge Patient</h3>
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
                <p className="font-medium text-green-800">Patient Discharged Successfully</p>
                <p className="text-sm text-green-600">The patient has been discharged and the bed is now available.</p>
              </div>
            </div>
          )}

          {/* Patient & Admission Info */}
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-700 font-semibold text-lg">
                  {patient.fullName.charAt(0)}
                </span>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{patient.fullName}</h4>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-sm text-gray-500">ID: {patient.idNumber}</p>
                  <p className="text-sm text-gray-500">{patient.age} years, {patient.gender}</p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-gray-500">Admission Date</p>
                <p className="text-sm font-medium">{format(new Date(admission.admissionDate), 'PP')}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Ward/Bed</p>
                <p className="text-sm font-medium">{ward.name}, Bed {admission.bedId.split('-')[1]}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Stay Duration</p>
                <p className="text-sm font-medium">{stayDuration} days</p>
              </div>
            </div>
          </div>

          {/* Discharge Details */}
          <div>
            <h4 className="text-base font-medium text-gray-900 mb-4">Discharge Details</h4>
            
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Discharge Date & Time <span className="text-red-500">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={formData.dischargeDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, dischargeDate: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <div className="flex items-center gap-3 mt-7">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.followUpRequired}
                    onChange={(e) => setFormData(prev => ({ ...prev, followUpRequired: e.target.checked }))}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm">Follow-up Required</span>
                </label>
              </div>
            </div>
            
            {formData.followUpRequired && (
              <div className="grid grid-cols-2 gap-6 mb-4 p-4 bg-gray-50 rounded-lg border">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Follow-up Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.followUpDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, followUpDate: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required={formData.followUpRequired}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Follow-up Department <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.followUpDepartment}
                    onChange={(e) => setFormData(prev => ({ ...prev, followUpDepartment: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    required={formData.followUpRequired}
                  >
                    <option value="">Select Department</option>
                    <option value="general-consultation">General Consultation</option>
                    <option value="surgical">Surgical</option>
                    <option value="orthopedic">Orthopedic</option>
                    <option value="cardiology">Cardiology</option>
                    <option value="neurology">Neurology</option>
                  </select>
                </div>
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Discharge Summary <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.summary}
                onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter discharge summary including diagnosis, treatment provided, and recommendations..."
                required
              />
            </div>
            
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter any additional notes..."
              />
            </div>
          </div>

          {/* Billing Summary */}
          <div>
            <h4 className="text-base font-medium text-gray-900 mb-4">Billing Summary</h4>
            
            <div className="border rounded-lg overflow-hidden mb-4">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {charges.map((charge, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{charge.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(charge.amount)}</td>
                    </tr>
                  ))}
                  <tr className="bg-gray-50 font-medium">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(totalBill)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg border">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Status
                </label>
                <select
                  value={formData.paymentStatus}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentStatus: e.target.value as any }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="partial">Partial Payment</option>
                  <option value="complete">Complete Payment</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value as any }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="cash">Cash</option>
                  <option value="mpesa">M-Pesa</option>
                  <option value="card">Card</option>
                  <option value="insurance">Insurance</option>
                  <option value="bank">Bank Transfer</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Amount
                </label>
                <input
                  type="number"
                  value={formData.paymentAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, paymentAmount: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max={totalBill}
                />
              </div>
              
              <div className="flex items-end">
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-700">Balance:</span>
                  <span className="font-medium text-gray-900">
                    {formatCurrency(Math.max(0, totalBill - formData.paymentAmount))}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-between">
            <div>
              <button
                type="button"
                onClick={() => {}}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Printer className="w-4 h-4" />
                <span>Print Summary</span>
              </button>
            </div>
            
            <div className="flex items-center gap-3">
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
                disabled={isSubmitting}
                className={`flex items-center gap-2 px-6 py-2 rounded-lg ${
                  isSubmitting
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
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
                    <span>Complete Discharge</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
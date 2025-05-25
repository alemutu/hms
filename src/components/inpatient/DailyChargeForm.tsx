import React, { useState, useEffect } from 'react';
import { usePatientStore } from '../../lib/store';
import {
  X,
  Receipt,
  Calendar,
  Clock,
  User,
  Building2,
  Bed,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Plus,
  Trash2,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';
import type { Admission, DailyCharge, Patient, Ward } from '../../types';

interface DailyChargeFormProps {
  admissionId?: string | null;
  admissions: Admission[];
  wards: Ward[];
  onClose: () => void;
  onSubmit: (charge: DailyCharge) => Promise<void>;
}

export const DailyChargeForm: React.FC<DailyChargeFormProps> = ({
  admissionId,
  admissions,
  wards,
  onClose,
  onSubmit
}) => {
  const { patientQueue } = usePatientStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAdmission, setSelectedAdmission] = useState<Admission | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [chargeItems, setChargeItems] = useState<Array<{
    category: 'bed' | 'nursing' | 'medication' | 'procedure' | 'lab' | 'radiology' | 'food' | 'other';
    description: string;
    quantity: number;
    unitPrice: number;
    totalAmount: number;
    notes?: string;
  }>>([]);
  
  const [newItem, setNewItem] = useState({
    category: 'bed' as const,
    description: '',
    quantity: 1,
    unitPrice: 0,
    notes: ''
  });
  
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    notes: ''
  });

  // Set selected admission if admissionId is provided
  useEffect(() => {
    if (admissionId) {
      const admission = admissions.find(a => a.id === admissionId);
      if (admission) {
        setSelectedAdmission(admission);
        
        // Add default bed charge
        const ward = wards.find(w => w.id === admission.wardId);
        if (ward) {
          setChargeItems([
            {
              category: 'bed',
              description: `${ward.name} Bed`,
              quantity: 1,
              unitPrice: ward.dailyRate,
              totalAmount: ward.dailyRate
            },
            {
              category: 'nursing',
              description: 'Nursing Care',
              quantity: 1,
              unitPrice: 1500,
              totalAmount: 1500
            }
          ]);
        }
      }
    }
  }, [admissionId, admissions, wards]);

  // Filter admissions based on search query
  const filteredAdmissions = admissions.filter(admission => {
    const patient = patientQueue.find(p => p.id === admission.patientId);
    if (!patient) return false;
    
    return patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admission.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleAddItem = () => {
    if (!newItem.description || newItem.quantity <= 0 || newItem.unitPrice <= 0) {
      setError('Please fill in all item details');
      return;
    }
    
    const totalAmount = newItem.quantity * newItem.unitPrice;
    
    setChargeItems([
      ...chargeItems,
      {
        ...newItem,
        totalAmount
      }
    ]);
    
    // Reset new item form
    setNewItem({
      category: 'bed',
      description: '',
      quantity: 1,
      unitPrice: 0,
      notes: ''
    });
    
    setError(null);
  };

  const handleRemoveItem = (index: number) => {
    setChargeItems(chargeItems.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return chargeItems.reduce((sum, item) => sum + item.totalAmount, 0);
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!selectedAdmission) errors.push('Admission is required');
    if (chargeItems.length === 0) errors.push('At least one charge item is required');
    if (!formData.date) errors.push('Date is required');
    
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
      const dailyCharge: DailyCharge = {
        id: `charge-${Date.now().toString(36)}`,
        admissionId: selectedAdmission!.id,
        patientId: selectedAdmission!.patientId,
        date: formData.date,
        items: chargeItems,
        totalAmount: calculateTotal(),
        status: 'pending',
        notes: formData.notes,
        createdBy: 'Nurse Johnson',
        createdAt: new Date().toISOString()
      };
      
      await onSubmit(dailyCharge);
      setSuccess(true);
      
      // Close after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error creating daily charge:', error);
      setError(error instanceof Error ? error.message : 'Failed to create daily charge');
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
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">Add Daily Charges</h3>
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
                <p className="font-medium text-green-800">Daily Charges Created Successfully</p>
                <p className="text-sm text-green-600">The charges have been added to the patient's bill.</p>
              </div>
            </div>
          )}

          {/* Admission Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Admission <span className="text-red-500">*</span>
            </label>
            {selectedAdmission ? (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Bed className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    {(() => {
                      const patient = patientQueue.find(p => p.id === selectedAdmission.patientId);
                      const ward = wards.find(w => w.id === selectedAdmission.wardId);
                      
                      return (
                        <>
                          <h4 className="font-medium">{patient?.fullName || 'Unknown Patient'}</h4>
                          <div className="flex items-center gap-3 mt-0.5">
                            <p className="text-sm text-gray-500">
                              {ward?.name || 'Unknown Ward'}, Bed {selectedAdmission.bedId.split('-')[1]}
                            </p>
                            <p className="text-sm text-gray-500">
                              Admitted: {format(new Date(selectedAdmission.admissionDate), 'PP')}
                            </p>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAdmission(null);
                    setChargeItems([]);
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
                    placeholder="Search admissions..."
                    className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {searchQuery && (
                  <div className="mt-2 border rounded-lg divide-y max-h-48 overflow-y-auto">
                    {filteredAdmissions.length > 0 ? (
                      filteredAdmissions.map((admission) => {
                        const patient = patientQueue.find(p => p.id === admission.patientId);
                        const ward = wards.find(w => w.id === admission.wardId);
                        
                        if (!patient) return null;
                        
                        return (
                          <div
                            key={admission.id}
                            onClick={() => {
                              setSelectedAdmission(admission);
                              setSearchQuery('');
                              
                              // Add default bed charge
                              if (ward) {
                                setChargeItems([
                                  {
                                    category: 'bed',
                                    description: `${ward.name} Bed`,
                                    quantity: 1,
                                    unitPrice: ward.dailyRate,
                                    totalAmount: ward.dailyRate
                                  },
                                  {
                                    category: 'nursing',
                                    description: 'Nursing Care',
                                    quantity: 1,
                                    unitPrice: 1500,
                                    totalAmount: 1500
                                  }
                                ]);
                              }
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
                                  <p className="text-xs text-gray-500">
                                    {ward?.name || 'Unknown Ward'}, Bed {admission.bedId.split('-')[1]}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Admitted: {format(new Date(admission.admissionDate), 'PP')}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-3 text-center text-gray-500">
                        No admissions found matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Charge Details */}
          {selectedAdmission && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Charge Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Charge Items <span className="text-red-500">*</span>
                  </label>
                  <span className="text-sm text-gray-500">
                    Total: <span className="font-medium">{formatCurrency(calculateTotal())}</span>
                  </span>
                </div>

                {/* Existing Items */}
                {chargeItems.length > 0 && (
                  <div className="mb-4 border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Unit Price</th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {chargeItems.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{item.description}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">{item.category}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">{item.quantity}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(item.totalAmount)}</td>
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td colSpan={4} className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">Total:</td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{formatCurrency(calculateTotal())}</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Add New Item */}
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Add New Item</h4>
                  <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={newItem.category}
                        onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="bed">Bed</option>
                        <option value="nursing">Nursing</option>
                        <option value="medication">Medication</option>
                        <option value="procedure">Procedure</option>
                        <option value="lab">Laboratory</option>
                        <option value="radiology">Radiology</option>
                        <option value="food">Food</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <input
                        type="text"
                        value={newItem.description}
                        onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                        placeholder="Enter description"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        value={newItem.quantity}
                        onChange={(e) => setNewItem(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                        min="1"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Unit Price (KES)
                      </label>
                      <input
                        type="number"
                        value={newItem.unitPrice}
                        onChange={(e) => setNewItem(prev => ({ ...prev, unitPrice: parseInt(e.target.value) || 0 }))}
                        min="0"
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={newItem.notes}
                      onChange={(e) => setNewItem(prev => ({ ...prev, notes: e.target.value }))}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="Enter any notes for this item"
                    />
                  </div>
                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Item</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter any additional notes..."
                />
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
              disabled={isSubmitting || !selectedAdmission || chargeItems.length === 0}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg ${
                isSubmitting || !selectedAdmission || chargeItems.length === 0
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
                  <span>Save Charges</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
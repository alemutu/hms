import React, { useState } from 'react';
import { X, Package, Plus, Minus, Calendar, DollarSign, Truck, Building, AlertTriangle, CheckCircle2, RefreshCw, Pill, Cable as Capsule, Tablet, Goal as Vial, Syringe, Beaker, Leaf, ArrowUp, ArrowDown, Info } from 'lucide-react';
import { format } from 'date-fns';
import type { MedicationStock } from '../../types';

interface StockAdjustmentFormProps {
  medication: MedicationStock;
  onClose: () => void;
  onAdjust: (medicationId: string, adjustment: number, reason: string) => Promise<void>;
}

export const StockAdjustmentForm: React.FC<StockAdjustmentFormProps> = ({
  medication,
  onClose,
  onAdjust
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('add');
  const [adjustmentQuantity, setAdjustmentQuantity] = useState(1);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  
  const getMedicationIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'antibiotics':
        return Capsule;
      case 'analgesics':
        return Pill;
      case 'antivirals':
        return Vial;
      case 'vaccines':
        return Syringe;
      case 'supplements':
        return Leaf;
      case 'liquids':
        return Beaker;
      default:
        return Tablet;
    }
  };
  
  const Icon = getMedicationIcon(medication.category);
  
  const validateForm = () => {
    if (adjustmentQuantity <= 0) {
      setError('Adjustment quantity must be greater than 0');
      return false;
    }
    
    if (!adjustmentReason) {
      setError('Reason for adjustment is required');
      return false;
    }
    
    if (adjustmentType === 'remove' && adjustmentQuantity > medication.quantity) {
      setError(`Cannot remove more than current stock (${medication.quantity} ${medication.unit})`);
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
      const adjustmentValue = adjustmentType === 'add' ? adjustmentQuantity : -adjustmentQuantity;
      
      await onAdjust(medication.id, adjustmentValue, adjustmentReason);
      
      setSuccess(true);
      
      // Close after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      console.error('Error adjusting stock:', error);
      setError(error instanceof Error ? error.message : 'Failed to adjust stock');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-md">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">Adjust Stock</h3>
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
          {/* Medication Info */}
          <div className="bg-gray-50 rounded-xl p-4 border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">{medication.name}</h4>
                <p className="text-sm text-gray-500">{medication.category}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Current Stock</p>
                <p className="font-medium">{medication.quantity} {medication.unit}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-medium capitalize">{medication.status.replace(/-/g, ' ')}</p>
              </div>
              {medication.expiryDate && (
                <div>
                  <p className="text-gray-500">Expiry Date</p>
                  <p className="font-medium">{format(new Date(medication.expiryDate), 'MMM d, yyyy')}</p>
                </div>
              )}
              <div>
                <p className="text-gray-500">Price</p>
                <p className="font-medium">${medication.price.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Adjustment Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adjustment Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setAdjustmentType('add')}
                className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                  adjustmentType === 'add'
                    ? 'border-green-500 bg-green-50 ring-1 ring-green-500/20'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="p-1.5 bg-green-100 rounded-lg">
                  <ArrowUp className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Add Stock</p>
                  <p className="text-xs text-gray-500">Increase inventory</p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => setAdjustmentType('remove')}
                className={`flex items-center gap-2 p-3 rounded-lg border text-left transition-colors ${
                  adjustmentType === 'remove'
                    ? 'border-red-500 bg-red-50 ring-1 ring-red-500/20'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="p-1.5 bg-red-100 rounded-lg">
                  <ArrowDown className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">Remove Stock</p>
                  <p className="text-xs text-gray-500">Decrease inventory</p>
                </div>
              </button>
            </div>
          </div>

          {/* Adjustment Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity to {adjustmentType === 'add' ? 'Add' : 'Remove'}
            </label>
            <div className="flex items-center">
              <button
                type="button"
                onClick={() => setAdjustmentQuantity(prev => Math.max(1, prev - 1))}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-l-lg"
              >
                <Minus className="w-4 h-4" />
              </button>
              <input
                type="number"
                value={adjustmentQuantity}
                onChange={(e) => setAdjustmentQuantity(Math.max(1, parseInt(e.target.value) || 0))}
                className="w-full px-3 py-2 border-y text-center"
                min="1"
                max={adjustmentType === 'remove' ? medication.quantity : undefined}
              />
              <button
                type="button"
                onClick={() => setAdjustmentQuantity(prev => prev + 1)}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-r-lg"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {adjustmentType === 'remove' && (
              <p className="mt-1 text-xs text-gray-500">
                New stock level will be: {Math.max(0, medication.quantity - adjustmentQuantity)} {medication.unit}
              </p>
            )}
            
            {adjustmentType === 'add' && (
              <p className="mt-1 text-xs text-gray-500">
                New stock level will be: {medication.quantity + adjustmentQuantity} {medication.unit}
              </p>
            )}
          </div>

          {/* Adjustment Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Adjustment <span className="text-red-500">*</span>
            </label>
            <textarea
              value={adjustmentReason}
              onChange={(e) => setAdjustmentReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={`Explain why you're ${adjustmentType === 'add' ? 'adding to' : 'removing from'} inventory...`}
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Stock adjusted successfully!</span>
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
              disabled={isSubmitting}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg ${
                isSubmitting
                  ? 'bg-gray-400 cursor-not-allowed'
                  : adjustmentType === 'add'
                  ? 'bg-green-600 text-white hover:bg-green-700'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  {adjustmentType === 'add' ? (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Add Stock</span>
                    </>
                  ) : (
                    <>
                      <Minus className="w-5 h-5" />
                      <span>Remove Stock</span>
                    </>
                  )}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
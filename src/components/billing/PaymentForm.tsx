import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAutosave } from '../../lib/useAutosave';
import { AutosaveIndicator } from '../AutosaveIndicator';
import { 
  X, 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  ArrowRight, 
  BanknoteIcon, 
  Smartphone, 
  Shield, 
  Landmark, 
  Receipt, 
  AlertTriangle 
} from 'lucide-react';
import type { Invoice, Payment } from '../../types';
import { usePatientStore } from '../../lib/store';

interface PaymentFormProps {
  invoice: Invoice & { patient: { fullName: string; idNumber: string } };
  onClose: () => void;
  onSubmit: (payment: Payment) => Promise<void>;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  invoice,
  onClose,
  onSubmit
}) => {
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'card' | 'insurance' | 'bank'>('cash');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState(invoice.totalAmount);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [formData, setFormData] = useState({
    paymentMethod: 'cash' as 'cash' | 'mpesa' | 'card' | 'insurance' | 'bank',
    reference: '',
    amount: invoice.totalAmount,
    notes: ''
  });

  // Set up autosave
  const { status: saveStatus, lastSaved, error: saveError, save } = useAutosave({
    data: formData,
    onSave: async (data) => {
      // This would typically save to a database
      console.log('Autosaving payment form data:', data);
      // In a real implementation, you would save this to persistent storage
    },
    interval: 30000, // Save every 30 seconds
    saveOnBlur: true,
    saveOnUnmount: true,
    enabled: true
  });

  // Update formData when form fields change
  useEffect(() => {
    setFormData({
      paymentMethod,
      reference,
      amount,
      notes
    });
  }, [paymentMethod, reference, amount, notes]);

  const formatCurrency = (amount: number) => {
    return `Ksh ${amount.toLocaleString()}`;
  };

  const validateForm = () => {
    if (amount <= 0) {
      setError('Payment amount must be greater than zero');
      return false;
    }

    if (paymentMethod !== 'cash' && !reference) {
      setError(`${paymentMethod.toUpperCase()} reference number is required`);
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
      const payment: Payment = {
        id: crypto.randomUUID(),
        patientId: invoice.patientId,
        invoiceId: invoice.id,
        amount,
        method: paymentMethod,
        reference: reference || `CASH-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        receivedBy: 'Cashier',
        notes
      };

      await onSubmit(payment);
      setSuccess(true);
      
      // Close after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error processing payment:', error);
      setError(error instanceof Error ? error.message : 'Failed to process payment');
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Process Payment</h3>
                <p className="text-sm text-gray-500">Invoice #{invoice.id.slice(0, 8)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AutosaveIndicator 
                status={saveStatus} 
                lastSaved={lastSaved} 
                error={saveError} 
                onManualSave={save} 
              />
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-grow">
          {/* Success Message */}
          {success && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Payment Successful!</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                The payment of {formatCurrency(amount)} has been successfully processed.
                A receipt has been generated for this transaction.
              </p>
            </div>
          )}

          {!success && (
            <>
              {/* Invoice Summary */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 max-h-[200px] overflow-y-auto">
                <div className="flex items-center gap-3 mb-3 sticky top-0 bg-blue-50 pb-2 border-b border-blue-100">
                  <div className="p-2 bg-blue-100 rounded-lg shadow-sm">
                    <Receipt className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-gray-900">Invoice Summary</h4>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Patient</p>
                    <p className="font-medium">{invoice.patient.fullName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Invoice Date</p>
                    <p className="font-medium">{format(new Date(invoice.createdAt), 'MMM d, yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Visit ID</p>
                    <p className="font-medium">{invoice.visitId}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Items</p>
                    <p className="font-medium">{invoice.items.length}</p>
                  </div>
                </div>
                
                {/* Items Summary */}
                {invoice.items.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-blue-100">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">Items</h5>
                    <div className="space-y-2 max-h-[100px] overflow-y-auto pr-1">
                      {invoice.items.map((item) => (
                        <div key={item.id} className="flex justify-between items-center text-sm bg-white p-2 rounded-lg border border-blue-100">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{item.serviceName}</p>
                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                          </div>
                          <p className="font-medium whitespace-nowrap">{formatCurrency(item.totalAmount)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className="mt-3 pt-3 border-t border-blue-100 sticky bottom-0 bg-blue-50">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-900">Total Amount:</span>
                    <span className="text-lg font-bold text-gray-900">{formatCurrency(invoice.totalAmount)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'cash', label: 'Cash', icon: BanknoteIcon },
                    { id: 'mpesa', label: 'M-Pesa', icon: Smartphone },
                    { id: 'card', label: 'Card', icon: CreditCard },
                    { id: 'insurance', label: 'Insurance', icon: Shield },
                    { id: 'bank', label: 'Bank', icon: Landmark }
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPaymentMethod(id as typeof paymentMethod)}
                      className={`flex flex-col items-center gap-2 p-3 rounded-lg border text-center transition-colors ${
                        paymentMethod === id
                          ? 'border-green-500 bg-green-50 ring-1 ring-green-500/20'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${
                        paymentMethod === id ? 'text-green-600' : 'text-gray-500'
                      }`} />
                      <span className="text-sm font-medium">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Reference Number */}
              {paymentMethod !== 'cash' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {paymentMethod === 'mpesa' ? 'M-Pesa Transaction Code' :
                    paymentMethod === 'card' ? 'Card Reference' :
                    paymentMethod === 'insurance' ? 'Insurance Approval Code' :
                    'Bank Reference'}
                  </label>
                  <input
                    type="text"
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    placeholder={`Enter ${paymentMethod} reference...`}
                  />
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">Ksh</span>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Add any payment notes..."
                />
              </div>

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}
            </>
          )}
        </form>

        {!success && (
          <div className="p-6 bg-gray-50 border-t flex-shrink-0">
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
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Complete Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
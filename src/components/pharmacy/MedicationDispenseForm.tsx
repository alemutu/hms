import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useAutosave } from '../../lib/useAutosave';
import { AutosaveIndicator } from '../AutosaveIndicator';
import { 
  X, 
  Pill, 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  ArrowRight, 
  Printer, 
  Download, 
  Send, 
  CheckCircle2, 
  Package,
  RefreshCw,
  CreditCard,
  AlertCircle,
  DollarSign,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import type { Prescription, Patient, MedicationStock, Invoice } from '../../types';
import { usePatientStore } from '../../lib/store';

interface MedicationDispenseFormProps {
  prescription: Prescription & { patient: Patient };
  medications: MedicationStock[];
  invoices: Invoice[];
  onClose: () => void;
  onDispense: (prescriptionId: string, dispensingDetails: any) => Promise<void>;
}

export const MedicationDispenseForm: React.FC<MedicationDispenseFormProps> = ({
  prescription,
  medications,
  invoices,
  onClose,
  onDispense
}) => {
  const { checkPaymentStatus, updatePatientStatus, movePatientToNextDepartment, updateParallelWorkflow } = usePatientStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [showPaymentWarning, setShowPaymentWarning] = useState(false);
  const [showPatientInfo, setShowPatientInfo] = useState(false);
  
  // Form state
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'mpesa' | 'card' | 'insurance' | 'bank'>('cash');
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState(0);
  const [notes, setNotes] = useState('');
  const [dispensingNotes, setDispensingNotes] = useState('');
  const [patientInstructions, setPatientInstructions] = useState('');
  const [sendSMS, setSendSMS] = useState(false);
  const [sendEmail, setSendEmail] = useState(false);
  const [formData, setFormData] = useState({
    dispensingNotes: '',
    patientInstructions: '',
    sendSMS: false,
    sendEmail: false
  });

  // Set up autosave
  const { status: saveStatus, lastSaved, error: saveError, save } = useAutosave({
    data: formData,
    onSave: async (data) => {
      // This would typically save to a database
      console.log('Autosaving medication dispense form data:', data);
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
      dispensingNotes,
      patientInstructions,
      sendSMS,
      sendEmail
    });
  }, [dispensingNotes, patientInstructions, sendSMS, sendEmail]);
  
  // Check medication availability and payment status
  useEffect(() => {
    const checkStatus = async () => {
      // Check payment status
      const isPaid = await checkPaymentStatus(prescription.patient.id, 'medication');
      setPaymentStatus(isPaid ? 'paid' : 'pending');
    };
    
    checkStatus();
    
    // Calculate total amount based on actual medication prices from inventory
    const totalAmount = prescription.medications.reduce((sum, med) => {
      const stock = medications.find(m => m.name.toLowerCase() === med.name.toLowerCase());
      return sum + (stock ? stock.price * med.quantity : 0);
    }, 0);
    
    setAmount(totalAmount);
  }, [prescription.patient.id, checkPaymentStatus, prescription.medications, medications]);
  
  // Check if all medications are in stock
  const medicationStatus = prescription.medications.map(med => {
    const stock = medications.find(m => m.name.toLowerCase() === med.name.toLowerCase());
    if (!stock) return { name: med.name, status: 'missing', available: 0, required: med.quantity };
    if (stock.quantity < med.quantity) return { name: med.name, status: 'insufficient', available: stock.quantity, required: med.quantity };
    return { name: med.name, status: 'available', available: stock.quantity, required: med.quantity, price: stock.price };
  });
  
  const hasStockIssues = medicationStatus.some(status => status.status !== 'available');
  
  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check payment status
    if (paymentStatus === 'pending') {
      setShowPaymentWarning(true);
      return;
    }
    
    // Check if all medications are in stock
    if (hasStockIssues) {
      setError('Cannot dispense due to stock issues');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onDispense(prescription.id, {
        dispensedBy: 'Pharmacist',
        dispensingNotes: dispensingNotes,
        patientInstructions: patientInstructions,
        notificationMethods: {
          sms: sendSMS,
          email: sendEmail
        }
      });
      
      // Automatically update patient status to discharged
      await updatePatientStatus(prescription.patient.id, 'discharged');
      
      setSuccess(true);
      
      // Close after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error dispensing medication:', error);
      setError(error instanceof Error ? error.message : 'Failed to dispense medication');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Calculate total medication cost
  const totalMedicationCost = prescription.medications.reduce((total, med) => {
    const stock = medications.find(m => m.name.toLowerCase() === med.name.toLowerCase());
    return total + (stock ? stock.price * med.quantity : 0);
  }, 0);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Pill className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Dispense Medication</h3>
                <p className="text-sm text-gray-500">{prescription.patient.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AutosaveIndicator 
                status={saveStatus} 
                lastSaved={lastSaved} 
                error={saveError} 
                onManualSave={save} 
              />
              {paymentStatus === 'pending' && (
                <div className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4" />
                  <span>Payment Required</span>
                </div>
              )}
              {paymentStatus === 'paid' && (
                <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Payment Verified</span>
                </div>
              )}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Success Message */}
          {success && (
            <div className="text-center py-8">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Medication Dispensed!</h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                The medications have been successfully dispensed to the patient.
                A record has been generated for this transaction.
                <span className="block mt-2 text-green-600 font-medium">Patient will be discharged.</span>
              </p>
            </div>
          )}

          {!success && (
            <>
              {/* Payment Status Alert */}
              {paymentStatus === 'pending' && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-700">Payment Required</p>
                    <p className="text-sm mt-1">
                      Payment must be completed before medications can be dispensed. Please direct the patient to billing.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      usePatientStore.getState().setCurrentSection('billing');
                      onClose();
                    }}
                    className="px-3 py-1.5 rounded-lg text-sm bg-amber-100 text-amber-700"
                  >
                    <CreditCard className="w-4 h-4 mr-1 inline-block" />
                    Go to Billing
                  </button>
                </div>
              )}

              {/* Stock Issues Alert */}
              {hasStockIssues && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  <div className="flex-1">
                    <p className="font-medium text-red-700">Stock Issues Detected</p>
                    <p className="text-sm mt-1">
                      Some medications are not available in sufficient quantity:
                    </p>
                    <ul className="list-disc list-inside text-sm mt-1">
                      {medicationStatus.filter(m => m.status !== 'available').map((med, idx) => (
                        <li key={idx} className="text-red-700">
                          {med.name} - {med.status === 'missing' ? 'Not in stock' : `Only ${med.available} available (need ${med.required})`}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Patient Info - Collapsible */}
              <div className="bg-gray-50 rounded-xl p-4 border">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowPatientInfo(!showPatientInfo)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-700 font-medium">
                        {prescription.patient.fullName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-medium">{prescription.patient.fullName}</h4>
                      <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
                        <span>Show More Info</span>
                        {showPatientInfo ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>
                
                {showPatientInfo && (
                  <div className="flex items-center gap-3 mt-3 pt-3 border-t">
                    <p className="text-sm text-gray-500">ID: #{prescription.patient.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-500">{prescription.patient.age} years, {prescription.patient.gender}</p>
                  </div>
                )}
              </div>

              {/* Cost Summary */}
              <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                  </div>
                  <h4 className="font-medium text-gray-900">Cost Summary</h4>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Medications:</span>
                    <span className="text-sm font-medium">KES {totalMedicationCost.toLocaleString()}</span>
                  </div>
                  <div className="pt-2 mt-2 border-t flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Total:</span>
                    <span className="text-sm font-bold text-gray-900">KES {totalMedicationCost.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Medications */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-gray-900">Medications to Dispense</h4>
                  <span className="text-sm text-gray-500">{prescription.medications.length} items</span>
                </div>
                
                <div className="space-y-3">
                  {prescription.medications.map((medication, index) => {
                    const stock = medications.find(m => m.name.toLowerCase() === medication.name.toLowerCase());
                    const stockStatus = !stock 
                      ? 'missing' 
                      : stock.quantity < medication.quantity 
                      ? 'insufficient' 
                      : 'available';
                    
                    return (
                      <div key={index} className="bg-white rounded-lg border p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                              <Pill className="w-4 h-4 text-blue-600" />
                            </div>
                            <div>
                              <h5 className="font-medium">{medication.name}</h5>
                              <p className="text-sm text-gray-500">{medication.dosage}</p>
                            </div>
                          </div>
                          
                          {stockStatus !== 'available' && (
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${
                              stockStatus === 'missing'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}>
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>
                                {stockStatus === 'missing' 
                                  ? 'Not in stock' 
                                  : `Only ${stock?.quantity} available`}
                              </span>
                            </div>
                          )}
                          
                          {stockStatus === 'available' && (
                            <div className="flex items-center gap-1.5 px-2 py-1 bg-green-50 text-green-700 rounded-lg text-xs">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>In stock</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Frequency</p>
                            <p className="font-medium">{medication.frequency}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Duration</p>
                            <p className="font-medium">{medication.duration}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Quantity</p>
                            <p className="font-medium">{medication.quantity}</p>
                          </div>
                        </div>
                        
                        {stock && (
                          <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                            <div className="flex items-center gap-1.5">
                              <Package className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-500">Current Stock:</span>
                              <span className="font-medium">{stock.quantity} {stock.unit}</span>
                            </div>
                            
                            <div className="flex items-center gap-1.5">
                              <DollarSign className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-500">Price:</span>
                              <span className="font-medium">KES {stock.price.toLocaleString()}</span>
                            </div>
                            
                            {stock.expiryDate && (
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4 text-gray-500" />
                                <span className="text-gray-500">Expires:</span>
                                <span className="font-medium">{format(new Date(stock.expiryDate), 'MMM d, yyyy')}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Dispensing Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dispensing Notes (Internal)
                </label>
                <textarea
                  value={dispensingNotes}
                  onChange={(e) => setDispensingNotes(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add any internal notes about this dispensation..."
                />
              </div>

              {/* Patient Instructions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient Instructions
                </label>
                <textarea
                  value={patientInstructions}
                  onChange={(e) => setPatientInstructions(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Add instructions for the patient..."
                />
              </div>

              {/* Notification Options */}
              <div className="bg-gray-50 rounded-xl p-4 border">
                <h4 className="font-medium text-gray-900 mb-3">Notification Options</h4>
                
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sendSMS}
                      onChange={(e) => setSendSMS(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Send SMS reminder to patient</span>
                  </label>
                  
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm">Send email with medication instructions</span>
                  </label>
                </div>
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
            <div className="flex justify-between">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {}}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Label</span>
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
                  onClick={handleSubmit}
                  disabled={isSubmitting || hasStockIssues || (paymentStatus === 'pending')}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : hasStockIssues
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : paymentStatus === 'pending'
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : success ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Dispensed</span>
                    </>
                  ) : (
                    <>
                      <span>Dispense Medication</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Payment Warning Modal */}
        {showPaymentWarning && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold">Payment Required</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Payment is required before medications can be dispensed. Would you like to:
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    usePatientStore.getState().setCurrentSection('billing');
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Go to Billing First</span>
                </button>
                
                <button
                  onClick={() => setShowPaymentWarning(false)}
                  className="w-full px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
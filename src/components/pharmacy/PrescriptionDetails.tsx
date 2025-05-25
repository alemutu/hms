import React from 'react';
import { format } from 'date-fns';
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
  CreditCard,
  AlertCircle,
  DollarSign
} from 'lucide-react';
import type { Prescription, Patient, MedicationStock, Invoice } from '../../types';
import { usePatientStore } from '../../lib/store';

interface PrescriptionDetailsProps {
  prescription: Prescription;
  patient: Patient;
  medications: MedicationStock[];
  invoices: Invoice[];
  onClose: () => void;
  onDispense: () => void;
  onGoToBilling: () => void;
  onConfirm?: () => void;
}

export const PrescriptionDetails: React.FC<PrescriptionDetailsProps> = ({
  prescription,
  patient,
  medications,
  invoices,
  onClose,
  onDispense,
  onGoToBilling,
  onConfirm
}) => {
  // Early return if required props are missing
  if (!prescription || !patient) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-600">Missing required prescription or patient data</p>
          </div>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Check if all medications are in stock
  const medicationStatus = prescription.medications.map(med => {
    const stock = medications.find(m => m.name.toLowerCase() === med.name.toLowerCase());
    if (!stock) return { name: med.name, status: 'missing', available: 0, required: med.quantity };
    if (stock.quantity < med.quantity) return { name: med.name, status: 'insufficient', available: stock.quantity, required: med.quantity };
    return { name: med.name, status: 'available', available: stock.quantity, required: med.quantity, price: stock.price };
  });
  
  const hasStockIssues = medicationStatus.some(status => status.status !== 'available');
  
  // Check if payment has been made
  const prescriptionInvoices = invoices.filter(invoice => 
    invoice.items.some(item => 
      item.category === 'medication' && 
      item.prescriptionId === prescription.id
    )
  );
  
  const isPaid = prescriptionInvoices.some(invoice => invoice.status === 'paid');
  const hasPendingInvoice = prescriptionInvoices.some(invoice => invoice.status === 'pending');
  
  // Check if prescription needs confirmation
  const needsConfirmation = prescription.status === 'pending';
  const canDispense = prescription.status === 'stock-verified' && isPaid && !hasStockIssues;
  
  // Calculate total medication cost
  const totalMedicationCost = prescription.medications.reduce((total, med) => {
    const stock = medications.find(m => m.name.toLowerCase() === med.name.toLowerCase());
    return total + (stock ? stock.price * med.quantity : 0);
  }, 0);
  
  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Prescription Details</h3>
                <p className="text-sm text-gray-500">ID: #{prescription?.id?.slice(0, 8) ?? 'N/A'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Payment Status Alert */}
          {!isPaid && (
            <div className={`p-4 ${hasPendingInvoice ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'} rounded-lg flex items-center gap-3`}>
              <AlertCircle className={`w-5 h-5 ${hasPendingInvoice ? 'text-amber-600' : 'text-red-600'}`} />
              <div className="flex-1">
                <p className={`font-medium ${hasPendingInvoice ? 'text-amber-700' : 'text-red-700'}`}>
                  {hasPendingInvoice ? 'Payment Required' : 'No Invoice Found'}
                </p>
                <p className="text-sm mt-1">
                  {hasPendingInvoice 
                    ? 'Payment must be completed before medication can be dispensed.'
                    : 'No invoice found for this prescription. Please create an invoice in the billing section.'}
                </p>
              </div>
              <button
                onClick={onGoToBilling}
                className={`px-3 py-1.5 rounded-lg text-sm ${hasPendingInvoice ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}
              >
                <CreditCard className="w-4 h-4 mr-1 inline-block" />
                Go to Billing
              </button>
            </div>
          )}

          {/* Confirmation Alert */}
          {needsConfirmation && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-blue-700">Prescription Needs Confirmation</p>
                <p className="text-sm mt-1">
                  Please verify medication availability and confirm this prescription before proceeding.
                </p>
              </div>
              {onConfirm && (
                <button
                  onClick={onConfirm}
                  disabled={hasStockIssues}
                  className={`px-3 py-1.5 rounded-lg text-sm ${
                    hasStockIssues 
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed' 
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 mr-1 inline-block" />
                  Confirm Prescription
                </button>
              )}
            </div>
          )}

          {/* Patient Info */}
          <div className="bg-gray-50 rounded-xl p-4 border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-700 font-medium">
                  {patient?.fullName.charAt(0)}
                </span>
              </div>
              <div>
                <h4 className="font-medium">{patient?.fullName ?? 'N/A'}</h4>
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-sm text-gray-500">ID: #{patient?.idNumber ?? 'N/A'}</p>
                  <p className="text-sm text-gray-500">{patient?.age ?? 'N/A'} years, {patient?.gender ?? 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Prescription Info */}
          <div className="bg-gray-50 rounded-xl p-4 border">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900">Prescription Information</h4>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Prescribed By</p>
                <p className="font-medium">{prescription?.prescribedBy ?? 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Prescribed Date</p>
                <p className="font-medium">
                  {prescription?.prescribedAt 
                    ? format(new Date(prescription.prescribedAt), 'PPP')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Prescribed Time</p>
                <p className="font-medium">
                  {prescription?.prescribedAt 
                    ? format(new Date(prescription.prescribedAt), 'p')
                    : 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <p className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  prescription?.status === 'dispensed'
                    ? 'bg-green-100 text-green-700'
                    : prescription?.status === 'stock-verified'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {prescription?.status === 'stock-verified' 
                    ? 'Confirmed' 
                    : prescription?.status?.charAt(0).toUpperCase() + prescription?.status?.slice(1) ?? 'N/A'}
                </p>
              </div>
            </div>
            
            {prescription?.status === 'dispensed' && prescription?.dispensedAt && (
              <div className="mt-4 pt-4 border-t">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Dispensed By</p>
                    <p className="font-medium">{prescription?.dispensedBy ?? 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Dispensed At</p>
                    <p className="font-medium">
                      {prescription?.dispensedAt 
                        ? format(new Date(prescription.dispensedAt), 'PPP p')
                        : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {prescription?.dispensingNotes && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-500">Dispensing Notes</p>
                    <p className="text-sm mt-1">{prescription.dispensingNotes}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Medications */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-900">Medications</h4>
              <span className="text-sm text-gray-500">{prescription?.medications?.length ?? 0} items</span>
            </div>
            
            <div className="space-y-3">
              {prescription?.medications?.map((medication, index) => {
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
                          <h5 className="font-medium">{medication?.name ?? 'N/A'}</h5>
                          <p className="text-sm text-gray-500">{medication?.dosage ?? 'N/A'}</p>
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
                        <p className="font-medium">{medication?.frequency ?? 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Duration</p>
                        <p className="font-medium">{medication?.duration ?? 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Quantity</p>
                        <p className="font-medium">{medication?.quantity ?? 'N/A'}</p>
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

          {/* Notes */}
          {prescription?.notes && (
            <div className="bg-gray-50 rounded-xl p-4 border">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-4 h-4 text-blue-600" />
                </div>
                <h4 className="font-medium text-gray-900">Additional Notes</h4>
              </div>
              
              <p className="text-sm">{prescription.notes}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {}}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Printer className="w-4 h-4" />
                <span>Print</span>
              </button>
              
              <button
                onClick={() => {}}
                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                <Download className="w-4 h-4" />
                <span>Download</span>
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              {needsConfirmation && onConfirm && (
                <button
                  onClick={onConfirm}
                  disabled={hasStockIssues}
                  className={`flex items-center gap-2 px-6 py-2 rounded-lg ${
                    hasStockIssues
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Prescription</span>
                </button>
              )}
              
              {prescription?.status === 'pending' && !needsConfirmation && (
                <>
                  {!isPaid && hasPendingInvoice && (
                     <button
                      onClick={onGoToBilling}
                      className="flex items-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Process Payment</span>
                    </button>
                  )}
                </>
              )}
              
              {canDispense && (
                <button
                  onClick={onDispense}
                  className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <span>Dispense Medication</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
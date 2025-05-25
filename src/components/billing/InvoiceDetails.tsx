import React from 'react';
import { format } from 'date-fns';
import {
  X,
  Receipt,
  Calendar,
  Clock,
  FileText,
  ArrowRight,
  Printer,
  Download,
  CheckCircle2,
  CreditCard,
  User,
  Building2,
  Package,
  BanknoteIcon
} from 'lucide-react';
import type { Invoice } from '../../types';
import { departmentNames } from '../../types/departments';

interface InvoiceDetailsProps {
  invoice: Invoice & { patient: { fullName: string; idNumber: string } };
  onClose: () => void;
  onProcessPayment: () => void;
}

export const InvoiceDetails: React.FC<InvoiceDetailsProps> = ({
  invoice,
  onClose,
  onProcessPayment
}) => {
  const formatCurrency = (amount: number) => {
    return `Ksh ${amount.toLocaleString()}`;
  };

  // Group items by department
  const itemsByDepartment = invoice.items.reduce((acc, item) => {
    const dept = item.department || 'other';
    if (!acc[dept]) {
      acc[dept] = [];
    }
    acc[dept].push(item);
    return acc;
  }, {} as Record<string, typeof invoice.items>);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Invoice Details</h3>
                <p className="text-sm text-gray-500">#{invoice.id.slice(0, 8)}</p>
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

        <div className="p-6 overflow-y-auto flex-grow">
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">INVOICE</h2>
              <p className="text-gray-500">Visit ID: {invoice.visitId}</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 mb-1">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">Date: {format(new Date(invoice.createdAt), 'MMMM d, yyyy')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-gray-700">Due: {format(new Date(invoice.dueDate), 'MMMM d, yyyy')}</span>
              </div>
              <div className="mt-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  invoice.status === 'paid'
                    ? 'bg-green-100 text-green-800'
                    : 'bg-amber-100 text-amber-800'
                }`}>
                  {invoice.status === 'paid' ? 'Paid' : 'Pending Payment'}
                </span>
              </div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="bg-gray-50 rounded-xl p-4 border mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <h4 className="font-medium text-gray-900">Patient Information</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{invoice.patient.fullName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">ID Number</p>
                <p className="font-medium">{invoice.patient.idNumber}</p>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-6 overflow-y-auto max-h-[40vh]">
            <h4 className="font-medium text-gray-900 mb-3 sticky top-0 bg-white pb-2">Invoice Items</h4>
            
            {/* Items by Department */}
            <div className="space-y-4">
              {Object.entries(itemsByDepartment).map(([dept, items]) => (
                <div key={dept} className="border rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-2 border-b flex items-center gap-2 sticky top-0">
                    <Building2 className="w-4 h-4 text-gray-500" />
                    <h5 className="font-medium text-gray-700">
                      {departmentNames[dept as keyof typeof departmentNames] || dept}
                    </h5>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Service</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Quantity</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Unit Price</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {items.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">{item.serviceName}</td>
                            <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="px-4 py-3 text-sm font-medium text-right">{formatCurrency(item.totalAmount)}</td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-medium">
                          <td colSpan={3} className="px-4 py-2 text-right text-sm">Subtotal:</td>
                          <td className="px-4 py-2 text-right text-sm">
                            {formatCurrency(items.reduce((sum, item) => sum + item.totalAmount, 0))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Total */}
            <div className="mt-4 bg-blue-50 rounded-lg p-4 border border-blue-100 sticky bottom-0">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-gray-900">Total Amount:</span>
                <span className="text-xl font-bold text-gray-900">{formatCurrency(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Information (if paid) */}
          {invoice.status === 'paid' && invoice.paidAt && (
            <div className="bg-green-50 rounded-xl p-4 border border-green-100 mb-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <h4 className="font-medium text-gray-900">Payment Information</h4>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Payment Date</p>
                  <p className="font-medium">{format(new Date(invoice.paidAt), 'MMMM d, yyyy')}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Payment Method</p>
                  <p className="font-medium capitalize">{invoice.paymentMethod || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Reference</p>
                  <p className="font-medium">{invoice.paymentReference || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-gray-50 rounded-xl p-4 border mb-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-gray-100 rounded-lg">
                <FileText className="w-4 h-4 text-gray-600" />
              </div>
              <h4 className="font-medium text-gray-900">Notes</h4>
            </div>
            <p className="text-sm text-gray-600">
              {invoice.notes || 'No additional notes for this invoice.'}
            </p>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t">
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
            
            {invoice.status === 'pending' && (
              <button
                onClick={onProcessPayment}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <CreditCard className="w-4 h-4" />
                <span>Process Payment</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
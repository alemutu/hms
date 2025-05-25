import React, { useState, useEffect } from 'react';
import { usePatientStore } from '../../lib/store';
import {
  Bed,
  Calendar,
  Clock,
  Search,
  Plus,
  Filter,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  User,
  Building2,
  RefreshCw,
  Edit,
  Trash2,
  DollarSign,
  CreditCard,
  Receipt,
  ChevronRight,
  ChevronLeft,
  MoreVertical,
  Save,
  Printer
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import type { Admission, DailyCharge, Patient, Ward } from '../../types';
import { DailyChargeForm } from './DailyChargeForm';

export const DailyChargesPage: React.FC = () => {
  const { setCurrentSection, patientQueue } = usePatientStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedAdmission, setSelectedAdmission] = useState<string | null>(null);
  const [showChargeForm, setShowChargeForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Sample data for admissions
  const [admissions, setAdmissions] = useState<Admission[]>([
    {
      id: 'adm-001',
      patientId: 'patient-1',
      admissionDate: '2025-04-15T10:30:00Z',
      admittedBy: 'Dr. Sarah Chen',
      wardId: 'ward-1',
      bedId: 'bed-101',
      admissionReason: 'Severe pneumonia requiring IV antibiotics',
      status: 'active',
      expectedDischargeDate: '2025-04-20T10:30:00Z'
    },
    {
      id: 'adm-002',
      patientId: 'patient-2',
      admissionDate: '2025-04-14T15:45:00Z',
      admittedBy: 'Dr. Michael Brown',
      wardId: 'ward-2',
      bedId: 'bed-205',
      admissionReason: 'Post-surgical recovery after appendectomy',
      status: 'active',
      expectedDischargeDate: '2025-04-18T15:45:00Z'
    }
  ]);

  // Sample data for daily charges
  const [dailyCharges, setDailyCharges] = useState<DailyCharge[]>([
    {
      id: 'charge-001',
      admissionId: 'adm-001',
      patientId: 'patient-1',
      date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
      items: [
        {
          category: 'bed',
          description: 'General Ward Bed',
          quantity: 1,
          unitPrice: 2500,
          totalAmount: 2500
        },
        {
          category: 'nursing',
          description: 'Nursing Care',
          quantity: 1,
          unitPrice: 1500,
          totalAmount: 1500
        },
        {
          category: 'medication',
          description: 'IV Antibiotics',
          quantity: 3,
          unitPrice: 800,
          totalAmount: 2400
        }
      ],
      totalAmount: 6400,
      status: 'pending',
      createdBy: 'Nurse Johnson',
      createdAt: format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss"),
    },
    {
      id: 'charge-002',
      admissionId: 'adm-002',
      patientId: 'patient-2',
      date: format(subDays(new Date(), 1), 'yyyy-MM-dd'),
      items: [
        {
          category: 'bed',
          description: 'Private Ward Bed',
          quantity: 1,
          unitPrice: 5000,
          totalAmount: 5000
        },
        {
          category: 'nursing',
          description: 'Nursing Care',
          quantity: 1,
          unitPrice: 2000,
          totalAmount: 2000
        },
        {
          category: 'medication',
          description: 'Pain Medication',
          quantity: 2,
          unitPrice: 500,
          totalAmount: 1000
        }
      ],
      totalAmount: 8000,
      status: 'pending',
      createdBy: 'Nurse Williams',
      createdAt: format(subDays(new Date(), 1), "yyyy-MM-dd'T'HH:mm:ss"),
    }
  ]);

  // Sample data for wards
  const [wards, setWards] = useState<Ward[]>([
    {
      id: 'ward-1',
      name: 'General Ward',
      type: 'general',
      capacity: 20,
      dailyRate: 2500,
      floor: '1st Floor',
      building: 'Main Building'
    },
    {
      id: 'ward-2',
      name: 'Private Ward',
      type: 'private',
      capacity: 10,
      dailyRate: 5000,
      floor: '2nd Floor',
      building: 'Main Building'
    },
    {
      id: 'ward-3',
      name: 'ICU',
      type: 'icu',
      capacity: 8,
      dailyRate: 15000,
      floor: '3rd Floor',
      building: 'Main Building'
    }
  ]);

  // Filter daily charges based on search query and selected date
  const filteredCharges = dailyCharges.filter(charge => {
    const patient = patientQueue.find(p => p.id === charge.patientId);
    if (!patient) return false;

    const matchesSearch = searchQuery === '' || 
      patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      charge.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDate = format(new Date(charge.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
    
    return matchesSearch && matchesDate;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCharges.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCharges.slice(indexOfFirstItem, indexOfLastItem);

  // Stats
  const stats = {
    totalCharges: dailyCharges.length,
    pendingCharges: dailyCharges.filter(c => c.status === 'pending').length,
    billedCharges: dailyCharges.filter(c => c.status === 'billed').length,
    paidCharges: dailyCharges.filter(c => c.status === 'paid').length,
    totalAmount: dailyCharges.reduce((sum, charge) => sum + charge.totalAmount, 0)
  };

  const handleCreateDailyCharge = async (charge: DailyCharge) => {
    setIsProcessing(true);
    setErrorMessage(null);
    
    try {
      // In a real app, this would be an API call
      setDailyCharges([...dailyCharges, charge]);
      
      setSuccessMessage('Daily charges created successfully');
      setShowChargeForm(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error creating daily charges:', error);
      setErrorMessage('Failed to create daily charges. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBillCharge = async (chargeId: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    
    try {
      // In a real app, this would be an API call
      setDailyCharges(dailyCharges.map(c => 
        c.id === chargeId 
          ? { ...c, status: 'billed' } 
          : c
      ));
      
      setSuccessMessage('Charge has been billed successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error billing charge:', error);
      setErrorMessage('Failed to bill charge. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getWardName = (wardId: string) => {
    const ward = wards.find(w => w.id === wardId);
    return ward ? ward.name : 'Unknown Ward';
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentSection('dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Daily Charges</h1>
            <p className="text-gray-500 mt-1">Manage inpatient daily billing</p>
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedAdmission(null);
            setShowChargeForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>Add Daily Charges</span>
        </button>
      </div>

      {/* Error/Success Messages */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{errorMessage}</p>
          <button 
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700">{successMessage}</p>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Stats Overview */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        {[
          { 
            label: 'Total Charges', 
            value: stats.totalCharges,
            icon: Receipt,
            color: 'blue'
          },
          { 
            label: 'Pending Charges', 
            value: stats.pendingCharges,
            icon: Clock,
            color: 'amber'
          },
          { 
            label: 'Billed Charges', 
            value: stats.billedCharges,
            icon: FileText,
            color: 'indigo'
          },
          { 
            label: 'Paid Charges', 
            value: stats.paidCharges,
            icon: CheckCircle2,
            color: 'green'
          },
          { 
            label: 'Total Amount', 
            value: formatCurrency(stats.totalAmount),
            icon: DollarSign,
            color: 'purple'
          }
        ].map(({ label, value, icon: Icon, color }) => (
          <div 
            key={label}
            className={`bg-${color}-50 rounded-xl p-4 border border-${color}-100`}
          >
            <div className="flex items-center gap-2">
              <div className={`p-1.5 bg-${color}-100 rounded-lg`}>
                <Icon className={`w-4 h-4 text-${color}-600`} />
              </div>
              <div>
                <p className="text-xs text-gray-600">{label}</p>
                <p className="text-lg font-bold text-gray-900 mt-0.5">{value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search charges..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Date:</label>
            <input
              type="date"
              value={format(selectedDate, 'yyyy-MM-dd')}
              onChange={(e) => setSelectedDate(new Date(e.target.value))}
              className="px-3 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Daily Charges List */}
      <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Daily Charges</h2>
                <p className="text-sm text-gray-500">
                  {filteredCharges.length} charges for {format(selectedDate, 'MMMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ward/Bed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentItems.map((charge) => {
                const patient = patientQueue.find(p => p.id === charge.patientId);
                const admission = admissions.find(a => a.id === charge.admissionId);
                
                if (!patient || !admission) return null;

                return (
                  <tr key={charge.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {patient.fullName.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{patient.fullName}</div>
                          <div className="text-sm text-gray-500">ID: {patient.idNumber}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getWardName(admission.wardId)}</div>
                      <div className="text-sm text-gray-500">Bed: {admission.bedId.split('-')[1]}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(charge.date), 'PP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{charge.items.length} items</div>
                      <div className="text-xs text-gray-500">
                        {charge.items.slice(0, 2).map((item, i) => (
                          <span key={i} className="mr-1">
                            {item.description}{i < Math.min(charge.items.length, 2) - 1 ? ',' : ''}
                          </span>
                        ))}
                        {charge.items.length > 2 && <span>...</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      {formatCurrency(charge.totalAmount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        charge.status === 'paid'
                          ? 'bg-green-100 text-green-800'
                          : charge.status === 'billed'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {charge.status.charAt(0).toUpperCase() + charge.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {}}
                          className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600"
                          title="View Details"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        
                        {charge.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleBillCharge(charge.id)}
                              className="p-1.5 hover:bg-green-100 rounded-lg text-green-600"
                              title="Bill Charge"
                            >
                              <CreditCard className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => {}}
                              className="p-1.5 hover:bg-purple-100 rounded-lg text-purple-600"
                              title="Edit Charge"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        
                        {charge.status === 'billed' && (
                          <button
                            onClick={() => {}}
                            className="p-1.5 hover:bg-green-100 rounded-lg text-green-600"
                            title="Print Invoice"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredCharges.length === 0 && (
            <div className="py-12">
              <div className="text-center">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Receipt className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No charges found
                </h3>
                <p className="text-gray-500">
                  {searchQuery 
                    ? `No results for "${searchQuery}"`
                    : `No charges found for ${format(selectedDate, 'MMMM d, yyyy')}`
                  }
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
              <span className="font-medium">{Math.min(indexOfLastItem, filteredCharges.length)}</span> of{' '}
              <span className="font-medium">{filteredCharges.length}</span> charges
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-md ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Daily Charge Form Modal */}
      {showChargeForm && (
        <DailyChargeForm
          admissionId={selectedAdmission}
          admissions={admissions}
          wards={wards}
          onClose={() => setShowChargeForm(false)}
          onSubmit={handleCreateDailyCharge}
        />
      )}
    </div>
  );
};
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
  Printer,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import type { Admission, DailyCharge, Patient, Ward } from '../../types';
import { DischargeForm } from './DischargeForm';

export const DischargePage: React.FC = () => {
  const { setCurrentSection, patientQueue } = usePatientStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showDischargeForm, setShowDischargeForm] = useState(false);
  const [selectedAdmission, setSelectedAdmission] = useState<string | null>(null);
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
    // This would be populated from the API in a real application
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

  // Filter admissions based on search query and filter
  const filteredAdmissions = admissions.filter(admission => {
    const patient = patientQueue.find(p => p.id === admission.patientId);
    if (!patient) return false;

    const matchesSearch = searchQuery === '' || 
      patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      admission.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = selectedFilter === 'all' || 
      (selectedFilter === 'ready' && new Date(admission.expectedDischargeDate!) <= new Date()) ||
      (selectedFilter === 'extended' && new Date(admission.expectedDischargeDate!) < new Date());
    
    return matchesSearch && matchesFilter && admission.status === 'active';
  });

  // Pagination
  const totalPages = Math.ceil(filteredAdmissions.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredAdmissions.slice(indexOfFirstItem, indexOfLastItem);

  // Stats
  const stats = {
    totalAdmissions: admissions.length,
    activeAdmissions: admissions.filter(a => a.status === 'active').length,
    readyForDischarge: admissions.filter(a => 
      a.status === 'active' && new Date(a.expectedDischargeDate!) <= new Date()
    ).length,
    extendedStays: admissions.filter(a => 
      a.status === 'active' && new Date(a.expectedDischargeDate!) < new Date()
    ).length
  };

  const handleDischargePatient = async (admission: Admission, dischargeData: any) => {
    setIsProcessing(true);
    setErrorMessage(null);
    
    try {
      // In a real app, this would be an API call
      setAdmissions(admissions.map(a => 
        a.id === admission.id 
          ? { 
              ...a, 
              status: 'discharged', 
              dischargeDate: new Date().toISOString(),
              dischargeNotes: dischargeData.notes,
              dischargeSummary: dischargeData.summary,
              dischargedBy: 'Dr. Sarah Chen'
            } 
          : a
      ));
      
      // Update patient status to discharged
      // await updatePatientStatus(admission.patientId, 'discharged');
      
      setSuccessMessage('Patient discharged successfully');
      setShowDischargeForm(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error discharging patient:', error);
      setErrorMessage('Failed to discharge patient. Please try again.');
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

  const calculateStayDuration = (admissionDate: string) => {
    const start = new Date(admissionDate);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
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
            <h1 className="text-2xl font-bold text-gray-900">Discharge & Billing</h1>
            <p className="text-gray-500 mt-1">Process patient discharges and final billing</p>
          </div>
        </div>
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
      <div className="grid grid-cols-4 gap-6 mb-6">
        {[
          { 
            label: 'Active Admissions', 
            value: stats.activeAdmissions,
            icon: Bed,
            color: 'blue'
          },
          { 
            label: 'Ready for Discharge', 
            value: stats.readyForDischarge,
            icon: CheckCircle2,
            color: 'green'
          },
          { 
            label: 'Extended Stays', 
            value: stats.extendedStays,
            icon: Calendar,
            color: 'amber'
          },
          { 
            label: 'Pending Payments', 
            value: dailyCharges.filter(c => c.status === 'pending').length,
            icon: CreditCard,
            color: 'purple'
          }
        ].map(({ label, value, icon: Icon, color }) => (
          <div 
            key={label}
            className={`bg-${color}-50 rounded-xl p-6 border border-${color}-100`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 bg-${color}-100 rounded-lg`}>
                <Icon className={`w-5 h-5 text-${color}-600`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
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
              placeholder="Search patients..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Admissions</option>
            <option value="ready">Ready for Discharge</option>
            <option value="extended">Extended Stays</option>
          </select>
        </div>
      </div>

      {/* Admissions List */}
      <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Bed className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Active Admissions</h2>
                <p className="text-sm text-gray-500">
                  {filteredAdmissions.length} patients currently admitted
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Discharge</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stay Duration</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Est. Total</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentItems.map((admission) => {
                const patient = patientQueue.find(p => p.id === admission.patientId);
                const ward = wards.find(w => w.id === admission.wardId);
                
                if (!patient || !ward) return null;
                
                const stayDuration = calculateStayDuration(admission.admissionDate);
                const estimatedTotal = ward.dailyRate * stayDuration;
                const isOverdue = new Date(admission.expectedDischargeDate!) < new Date();

                return (
                  <tr key={admission.id} className="hover:bg-gray-50">
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
                      <div className="text-sm text-gray-900">{ward.name}</div>
                      <div className="text-sm text-gray-500">Bed: {admission.bedId.split('-')[1]}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(admission.admissionDate), 'PP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm text-gray-900">
                          {format(new Date(admission.expectedDischargeDate!), 'PP')}
                        </span>
                        {isOverdue && (
                          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-800 rounded-full text-xs">
                            Overdue
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stayDuration} days
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium">
                      {formatCurrency(estimatedTotal)}
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
                        
                        <button
                          onClick={() => {}}
                          className="p-1.5 hover:bg-purple-100 rounded-lg text-purple-600"
                          title="View Bill"
                        >
                          <Receipt className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => {
                            setSelectedAdmission(admission.id);
                            setShowDischargeForm(true);
                          }}
                          className="p-1.5 hover:bg-green-100 rounded-lg text-green-600"
                          title="Discharge Patient"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredAdmissions.length === 0 && (
            <div className="py-12">
              <div className="text-center">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Bed className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No admissions found
                </h3>
                <p className="text-gray-500">
                  {searchQuery 
                    ? `No results for "${searchQuery}"`
                    : selectedFilter === 'ready'
                    ? 'No patients ready for discharge'
                    : selectedFilter === 'extended'
                    ? 'No patients with extended stays'
                    : 'No active admissions found'
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
              <span className="font-medium">{Math.min(indexOfLastItem, filteredAdmissions.length)}</span> of{' '}
              <span className="font-medium">{filteredAdmissions.length}</span> admissions
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

      {/* Discharge Form Modal */}
      {showDischargeForm && selectedAdmission && (
        <DischargeForm
          admission={admissions.find(a => a.id === selectedAdmission)!}
          wards={wards}
          onClose={() => {
            setShowDischargeForm(false);
            setSelectedAdmission(null);
          }}
          onSubmit={handleDischargePatient}
        />
      )}
    </div>
  );
};
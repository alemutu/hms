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
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  User,
  Building2,
  Stethoscope,
  ClipboardList,
  CalendarDays,
  RefreshCw,
  MoreVertical,
  Edit,
  Trash2,
  ChevronRight,
  ChevronLeft,
  CreditCard,
  DollarSign,
  Shield,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import type { Admission, Patient, Ward } from '../../types';
import { AdmissionForm } from './AdmissionForm';

export const AdmissionsPage: React.FC = () => {
  const { setCurrentSection, patientQueue } = usePatientStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showAdmissionForm, setShowAdmissionForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedAdmission, setSelectedAdmission] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState<'active' | 'discharged' | 'all'>('active');

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
    },
    {
      id: 'adm-003',
      patientId: 'patient-3',
      admissionDate: '2025-04-10T09:15:00Z',
      admittedBy: 'Dr. Emily White',
      wardId: 'ward-3',
      bedId: 'bed-302',
      admissionReason: 'Diabetic ketoacidosis',
      status: 'discharged',
      dischargeDate: '2025-04-15T11:30:00Z',
      dischargeNotes: 'Patient stable, blood sugar levels normalized',
      dischargedBy: 'Dr. Emily White'
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
    },
    {
      id: 'ward-4',
      name: 'Maternity Ward',
      type: 'maternity',
      capacity: 15,
      dailyRate: 3500,
      floor: '2nd Floor',
      building: 'East Wing'
    },
    {
      id: 'ward-5',
      name: 'Pediatric Ward',
      type: 'pediatric',
      capacity: 12,
      dailyRate: 3000,
      floor: '1st Floor',
      building: 'East Wing'
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
      (selectedFilter === 'emergency' && admission.isEmergency) ||
      (selectedFilter === 'insurance' && admission.insuranceDetails);
    
    const matchesTab = activeTab === 'all' || 
      (activeTab === 'active' && admission.status === 'active') ||
      (activeTab === 'discharged' && admission.status === 'discharged');
    
    return matchesSearch && matchesFilter && matchesTab;
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
    dischargedThisWeek: admissions.filter(a => a.status === 'discharged').length,
    occupancyRate: Math.round((admissions.filter(a => a.status === 'active').length / 
      wards.reduce((sum, ward) => sum + ward.capacity, 0)) * 100)
  };

  const handleCreateAdmission = async (admission: Admission) => {
    setIsProcessing(true);
    setErrorMessage(null);
    
    try {
      // In a real app, this would be an API call
      setAdmissions([...admissions, admission]);
      
      // Update patient status to admitted
      // await updatePatientStatus(admission.patientId, 'admitted');
      
      setSuccessMessage('Admission created successfully');
      setShowAdmissionForm(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error creating admission:', error);
      setErrorMessage('Failed to create admission. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDischargePatient = async (admissionId: string) => {
    setIsProcessing(true);
    setErrorMessage(null);
    
    try {
      // In a real app, this would be an API call
      setAdmissions(admissions.map(a => 
        a.id === admissionId 
          ? { 
              ...a, 
              status: 'discharged', 
              dischargeDate: new Date().toISOString(),
              dischargedBy: 'Dr. Sarah Chen'
            } 
          : a
      ));
      
      // Update patient status to discharged
      const admission = admissions.find(a => a.id === admissionId);
      if (admission) {
        // await updatePatientStatus(admission.patientId, 'discharged');
      }
      
      setSuccessMessage('Patient discharged successfully');
      
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
            <h1 className="text-2xl font-bold text-gray-900">Inpatient Admissions</h1>
            <p className="text-gray-500 mt-1">Manage patient admissions and bed allocations</p>
          </div>
        </div>
        <button
          onClick={() => {
            setSelectedPatient(null);
            setShowAdmissionForm(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4" />
          <span>New Admission</span>
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
      <div className="grid grid-cols-4 gap-6 mb-6">
        {[
          { 
            label: 'Total Admissions', 
            value: stats.totalAdmissions,
            icon: ClipboardList,
            color: 'blue'
          },
          { 
            label: 'Active Admissions', 
            value: stats.activeAdmissions,
            icon: Bed,
            color: 'green'
          },
          { 
            label: 'Discharged (This Week)', 
            value: stats.dischargedThisWeek,
            icon: CheckCircle2,
            color: 'purple'
          },
          { 
            label: 'Occupancy Rate', 
            value: `${stats.occupancyRate}%`,
            icon: Users,
            color: 'amber'
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

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-4">
          {[
            { id: 'active', label: 'Active Admissions', icon: Bed, count: stats.activeAdmissions },
            { id: 'discharged', label: 'Discharged', icon: CheckCircle2, count: stats.dischargedThisWeek },
            { id: 'all', label: 'All Admissions', icon: ClipboardList, count: stats.totalAdmissions }
          ].map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === id
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{label}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                activeTab === id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>
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
              placeholder="Search admissions..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedFilter}
            onChange={(e) => setSelectedFilter(e.target.value)}
            className="px-4 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Admissions</option>
            <option value="emergency">Emergency</option>
            <option value="insurance">Insurance</option>
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
                <h2 className="text-lg font-semibold text-gray-900">
                  {activeTab === 'active' ? 'Active Admissions' : 
                   activeTab === 'discharged' ? 'Discharged Patients' : 
                   'All Admissions'}
                </h2>
                <p className="text-sm text-gray-500">
                  {filteredAdmissions.length} {activeTab === 'active' ? 'active admissions' : 
                                              activeTab === 'discharged' ? 'discharged patients' : 
                                              'total admissions'}
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admission Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ward/Bed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expected Discharge</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentItems.map((admission) => {
                const patient = patientQueue.find(p => p.id === admission.patientId);
                if (!patient) return null;

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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(new Date(admission.admissionDate), 'PP')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{getWardName(admission.wardId)}</div>
                      <div className="text-sm text-gray-500">Bed: {admission.bedId.split('-')[1]}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{admission.admissionReason}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        admission.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {admission.status === 'active' ? 'Active' : 'Discharged'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {admission.expectedDischargeDate 
                        ? format(new Date(admission.expectedDischargeDate), 'PP')
                        : 'Not set'}
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
                        
                        {admission.status === 'active' && (
                          <>
                            <button
                              onClick={() => {}}
                              className="p-1.5 hover:bg-green-100 rounded-lg text-green-600"
                              title="Add Daily Charges"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDischargePatient(admission.id)}
                              className="p-1.5 hover:bg-purple-100 rounded-lg text-purple-600"
                              title="Discharge Patient"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
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
                    : activeTab === 'active'
                    ? 'No active admissions at the moment'
                    : activeTab === 'discharged'
                    ? 'No discharged patients in the selected period'
                    : 'No admissions found'
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

      {/* Admission Form Modal */}
      {showAdmissionForm && (
        <AdmissionForm
          patientId={selectedPatient}
          wards={wards}
          onClose={() => setShowAdmissionForm(false)}
          onSubmit={handleCreateAdmission}
        />
      )}
    </div>
  );
};
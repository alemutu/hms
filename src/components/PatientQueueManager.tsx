import React, { useState, useEffect } from 'react';
import { usePatientStore } from '../lib/store';
import { useAuth } from '../hooks/useAuth';
import {
  Users,
  Clock,
  Search,
  Filter,
  ArrowRight,
  UserPlus,
  UserMinus,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  CheckCircle2,
  X,
  FileText,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  ListFilter,
  LayoutGrid
} from 'lucide-react';
import { format } from 'date-fns';
import { departments, departmentNames } from '../types/departments';
import type { Patient } from '../types';

interface PatientQueueManagerProps {
  departmentId?: string;
  onPatientSelect?: (patientId: string) => void;
  showAssignmentControls?: boolean;
  className?: string;
}

export const PatientQueueManager: React.FC<PatientQueueManagerProps> = ({
  departmentId,
  onPatientSelect,
  showAssignmentControls = true,
  className = ''
}) => {
  const { 
    patientQueue, 
    getDepartmentQueue, 
    assignPatientToDoctor, 
    unassignPatientFromDoctor,
    getAssignedPatients
  } = usePatientStore();
  
  const { user } = useAuth();
  const doctorId = user?.id || 'current-doctor';

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [activeTab, setActiveTab] = useState<'all' | 'assigned' | 'waiting'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [expandedPatients, setExpandedPatients] = useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Get department patients
  const departmentPatients = departmentId 
    ? getDepartmentQueue(departmentId) 
    : patientQueue;
  
  // Get patients assigned to the current doctor
  const assignedPatients = getAssignedPatients(doctorId);
  
  // Get patients waiting for assignment
  const waitingPatients = departmentPatients.filter(p => !p.assignedDoctorId);

  // Filter patients based on active tab, search query, and filter
  const filteredPatients = React.useMemo(() => {
    let patients: Patient[] = [];
    
    switch (activeTab) {
      case 'assigned':
        patients = assignedPatients;
        break;
      case 'waiting':
        patients = waitingPatients;
        break;
      case 'all':
      default:
        patients = departmentPatients;
        break;
    }
    
    // Apply search filter
    if (searchQuery) {
      patients = patients.filter(patient =>
        patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.idNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply priority filter
    if (selectedFilter === 'urgent') {
      patients = patients.filter(p => p.priority === 'urgent' || p.priority === 'critical');
    } else if (selectedFilter === 'normal') {
      patients = patients.filter(p => p.priority === 'normal');
    }
    
    return patients;
  }, [activeTab, departmentPatients, assignedPatients, waitingPatients, searchQuery, selectedFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);

  // Stats
  const stats = {
    total: departmentPatients.length,
    assigned: assignedPatients.length,
    waiting: waitingPatients.length,
    urgent: departmentPatients.filter(p => p.priority === 'urgent' || p.priority === 'critical').length
  };

  const togglePatientDetails = (patientId: string) => {
    setExpandedPatients(prev => ({
      ...prev,
      [patientId]: !prev[patientId]
    }));
  };
  
  const handleAssignPatient = async (patientId: string) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      await assignPatientToDoctor(patientId, doctorId);
      
      setSuccessMessage('Patient assigned successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error assigning patient:', error);
      setErrorMessage('Failed to assign patient. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleUnassignPatient = async (patientId: string) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      await unassignPatientFromDoctor(patientId);
      
      setSuccessMessage('Patient unassigned successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error unassigning patient:', error);
      setErrorMessage('Failed to unassign patient. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderPatientCard = (patient: Patient) => {
    const isExpanded = expandedPatients[patient.id] || false;
    const isAssigned = patient.assignedDoctorId === doctorId;
    const isAssignedToOther = patient.assignedDoctorId && patient.assignedDoctorId !== doctorId;
    
    if (viewMode === 'grid') {
      return (
        <div key={patient.id} className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-700 font-medium">{patient.fullName.charAt(0)}</span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">{patient.fullName}</h3>
                <p className="text-xs text-gray-500">ID: {patient.idNumber}</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              patient.priority === 'urgent' ? 'bg-red-100 text-red-700' : 
              patient.priority === 'critical' ? 'bg-purple-100 text-purple-700' : 
              'bg-green-100 text-green-700'
            }`}>
              {patient.priority}
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <span>{patient.waitTime ? `${patient.waitTime}min wait` : 'Just arrived'}</span>
            <span>{format(new Date(patient.registrationDate), 'h:mm a')}</span>
          </div>
          
          {isAssigned && (
            <div className="mb-3 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>Assigned to you</span>
            </div>
          )}
          
          {isAssignedToOther && (
            <div className="mb-3 px-2 py-1 bg-gray-50 text-gray-700 rounded-lg text-xs flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>Assigned to: {patient.assignedDoctorName || 'Another doctor'}</span>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <button
              onClick={() => togglePatientDetails(patient.id)}
              className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <span>Details</span>
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            
            <div className="flex items-center gap-2">
              {showAssignmentControls && (
                <>
                  {!isAssigned && !isAssignedToOther && (
                    <button
                      onClick={() => handleAssignPatient(patient.id)}
                      disabled={isProcessing}
                      className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <span>Assign</span>
                      )}
                    </button>
                  )}
                  
                  {isAssigned && (
                    <button
                      onClick={() => handleUnassignPatient(patient.id)}
                      disabled={isProcessing}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200"
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-3 h-3 animate-spin" />
                      ) : (
                        <span>Unassign</span>
                      )}
                    </button>
                  )}
                </>
              )}
              
              <button
                onClick={() => onPatientSelect && onPatientSelect(patient.id)}
                className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
              >
                <span>Select</span>
              </button>
            </div>
          </div>
          
          {isExpanded && (
            <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-gray-500">Age</p>
                <p className="font-medium">{patient.age} years</p>
              </div>
              <div>
                <p className="text-gray-500">Gender</p>
                <p className="font-medium">{patient.gender}</p>
              </div>
              <div>
                <p className="text-gray-500">Department</p>
                <p className="font-medium">{departmentNames[patient.currentDepartment]}</p>
              </div>
              <div>
                <p className="text-gray-500">Status</p>
                <p className="font-medium capitalize">{patient.status.replace(/-/g, ' ')}</p>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div key={patient.id} className="p-4 hover:bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-700 font-medium">{patient.fullName.charAt(0)}</span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{patient.fullName}</h3>
              <div className="flex items-center gap-3 mt-0.5">
                <p className="text-xs text-gray-500">ID: {patient.idNumber}</p>
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>{patient.waitTime ? `${patient.waitTime}min wait` : 'Just arrived'}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  patient.priority === 'urgent' ? 'bg-red-100 text-red-700' : 
                  patient.priority === 'critical' ? 'bg-purple-100 text-purple-700' : 
                  'bg-green-100 text-green-700'
                }`}>
                  {patient.priority}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isAssigned && (
              <div className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Assigned to you</span>
              </div>
            )}
            
            {isAssignedToOther && (
              <div className="px-2 py-1 bg-gray-50 text-gray-700 rounded-lg text-xs flex items-center gap-1">
                <Users className="w-3 h-3" />
                <span>Assigned to: {patient.assignedDoctorName || 'Another doctor'}</span>
              </div>
            )}
            
            <button
              onClick={() => togglePatientDetails(patient.id)}
              className="p-1 hover:bg-gray-100 rounded-lg"
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
            
            <div className="flex items-center gap-1">
              {showAssignmentControls && (
                <>
                  {!isAssigned && !isAssignedToOther && (
                    <button
                      onClick={() => handleAssignPatient(patient.id)}
                      disabled={isProcessing}
                      className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600"
                      title="Assign to me"
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                    </button>
                  )}
                  
                  {isAssigned && (
                    <button
                      onClick={() => handleUnassignPatient(patient.id)}
                      disabled={isProcessing}
                      className="p-1.5 hover:bg-red-100 rounded-lg text-red-600"
                      title="Unassign"
                    >
                      {isProcessing ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserMinus className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </>
              )}
              
              <button
                onClick={() => onPatientSelect && onPatientSelect(patient.id)}
                className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600"
                title="Select patient"
              >
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {isExpanded && (
          <div className="mt-3 grid grid-cols-4 gap-4 bg-gray-50 rounded-lg p-3">
            <div>
              <p className="text-xs text-gray-500">Age</p>
              <p className="text-sm font-medium">{patient.age} years</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Gender</p>
              <p className="text-sm font-medium">{patient.gender}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Department</p>
              <p className="text-sm font-medium">{departmentNames[patient.currentDepartment]}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Status</p>
              <p className="text-sm font-medium capitalize">{patient.status.replace(/-/g, ' ')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Phone</p>
              <p className="text-sm font-medium">{patient.phoneNumber}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="text-sm font-medium">{patient.email}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Registration</p>
              <p className="text-sm font-medium">{format(new Date(patient.registrationDate), 'PP')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Residence</p>
              <p className="text-sm font-medium">{patient.placeOfResidence}</p>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Patient Queue</h2>
              <p className="text-sm text-gray-500">
                {departmentId ? departmentNames[departmentId] : 'All Departments'} • {filteredPatients.length} patients
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
              >
                <ListFilter className="w-3.5 h-3.5 text-gray-600" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
              >
                <LayoutGrid className="w-3.5 h-3.5 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Tabs */}
        {showAssignmentControls && (
          <div className="flex items-center gap-2 mt-3">
            {[
              { id: 'all', label: 'All Patients', count: stats.total },
              { id: 'assigned', label: 'My Patients', count: stats.assigned },
              { id: 'waiting', label: 'Waiting Assignment', count: stats.waiting }
            ].map(({ id, label, count }) => (
              <button
                key={id}
                onClick={() => {
                  setActiveTab(id as typeof activeTab);
                  setCurrentPage(1); // Reset to first page when changing tabs
                }}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  activeTab === id
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {label} <span className="text-xs ml-1 opacity-70">({count})</span>
              </button>
            ))}
          </div>
        )}
        
        {/* Search and Filters */}
        <div className="flex items-center gap-3 mt-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              placeholder="Search patients..."
              className="w-full pl-8 pr-3 py-1.5 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select
            value={selectedFilter}
            onChange={(e) => {
              setSelectedFilter(e.target.value);
              setCurrentPage(1); // Reset to first page when filtering
            }}
            className="px-3 py-1.5 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="all">All Priority</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
          </select>
        </div>
      </div>
      
      {/* Error/Success Messages */}
      {errorMessage && (
        <div className="mx-4 my-2 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <p className="text-sm text-red-700">{errorMessage}</p>
          <button 
            onClick={() => setErrorMessage(null)}
            className="ml-auto p-1 hover:bg-red-100 rounded-full"
          >
            <X className="w-3.5 h-3.5 text-red-600" />
          </button>
        </div>
      )}
      
      {successMessage && (
        <div className="mx-4 my-2 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">{successMessage}</p>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="ml-auto p-1 hover:bg-green-100 rounded-full"
          >
            <X className="w-3.5 h-3.5 text-green-600" />
          </button>
        </div>
      )}

      {/* Patient List */}
      <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
        {viewMode === 'grid' ? (
          <div className="p-4 grid grid-cols-2 gap-4">
            {currentItems.map(renderPatientCard)}
            
            {filteredPatients.length === 0 && (
              <div className="col-span-2 py-8 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No patients found</h3>
                <p className="text-gray-500">
                  {searchQuery 
                    ? `No results for "${searchQuery}"`
                    : activeTab === 'assigned'
                    ? 'No patients assigned to you'
                    : activeTab === 'waiting'
                    ? 'No patients waiting for assignment'
                    : 'No patients in the queue'
                  }
                </p>
              </div>
            )}
          </div>
        ) : (
          <div>
            {currentItems.map(renderPatientCard)}
            
            {filteredPatients.length === 0 && (
              <div className="py-8 text-center">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No patients found</h3>
                <p className="text-gray-500">
                  {searchQuery 
                    ? `No results for "${searchQuery}"`
                    : activeTab === 'assigned'
                    ? 'No patients assigned to you'
                    : activeTab === 'waiting'
                    ? 'No patients waiting for assignment'
                    : 'No patients in the queue'
                  }
                </p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-3 bg-gray-50 border-t flex items-center justify-between">
          <div className="text-xs text-gray-500">
            Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredPatients.length)} of {filteredPatients.length}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              // Show pages around current page
              let pageNum = i + 1;
              if (totalPages > 5) {
                if (currentPage > 3) {
                  pageNum = currentPage - 3 + i;
                }
                if (currentPage > totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                }
              }
              
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-6 h-6 flex items-center justify-center rounded text-xs ${
                    currentPage === pageNum
                      ? 'bg-blue-600 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 border rounded hover:bg-gray-50 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
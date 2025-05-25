import React, { useState } from 'react';
import { usePatientStore } from '../lib/store';
import {
  Activity,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  FileText,
  ArrowRight,
  FileBarChart,
  X,
  Plus,
  ArrowLeft,
  Building2,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Stethoscope,
  CalendarDays,
  User,
  ClipboardList,
  TestTube,
  LayoutDashboard,
  Layers,
  Hourglass,
  Clipboard,
  Radio,
  Loader2,
  Pill,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import { ConsultationForm } from './ConsultationForm';
import type { Patient } from '../types';
import { departments, departmentNames } from '../types/departments';

export const PatientManagement = () => {
  const { 
    patientQueue,
    currentDepartment,
    setCurrentSection,
    updatePatientStatus,
    movePatientToNextDepartment,
    getDepartmentQueue,
    labTests = {}
  } = usePatientStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'waiting' | 'completed'>('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [expandedPatients, setExpandedPatients] = useState<Record<string, boolean>>({});

  // Get all patients for the current department
  const departmentPatients = React.useMemo(() => {
    if (!currentDepartment) return [];
    return getDepartmentQueue(currentDepartment);
  }, [currentDepartment, getDepartmentQueue]);

  // Get patients waiting for lab/radiology results but can be treated
  const waitingPatients = React.useMemo(() => {
    return patientQueue.filter(patient => {
      // Include patients who have pending lab/radiology tests but belong to this department
      return (
        (patient.pendingLabTests || patient.pendingRadiologyTests) &&
        (patient.currentDepartment === currentDepartment || 
         patient.returnToDepartment === currentDepartment)
      );
    });
  }, [patientQueue, currentDepartment]);

  // Get completed patients
  const completedPatients = patientQueue.filter(patient => 
    patient.status === 'consultation-complete' || 
    patient.status === 'discharged'
  );

  // Filter patients based on active tab and search query
  const filteredPatients = React.useMemo(() => {
    let patients: Patient[] = [];
    
    switch (activeTab) {
      case 'active':
        patients = departmentPatients;
        break;
      case 'waiting':
        patients = waitingPatients;
        break;
      case 'completed':
        patients = completedPatients;
        break;
    }
    
    if (searchQuery) {
      return patients.filter(patient =>
        patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedFilter === 'urgent') {
      return patients.filter(p => p.priority === 'urgent');
    } else if (selectedFilter === 'normal') {
      return patients.filter(p => p.priority === 'normal');
    }
    
    return patients;
  }, [activeTab, departmentPatients, waitingPatients, completedPatients, searchQuery, selectedFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);

  const stats = {
    active: departmentPatients.length,
    waiting: waitingPatients.length,
    completed: completedPatients.length,
    urgent: [...departmentPatients, ...waitingPatients].filter(p => p.priority === 'urgent').length
  };

  const handleStartConsultation = async (patientId: string) => {
    try {
      setErrorMessage(null);

      const patient = patientQueue.find(p => p.id === patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // For patients in active queue
      if (activeTab === 'active') {
        // Only allow starting consultation for patients with 'triage-complete' status
        if (patient.status !== 'triage-complete') {
          throw new Error('Patient must complete triage before consultation');
        }

        await updatePatientStatus(patientId, 'in-consultation');
      }

      setSelectedPatient(patientId);
      setShowConsultationForm(true);
    } catch (error) {
      console.error('Error starting consultation:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to start consultation');
    }
  };

  const handleConsultationComplete = async (patientId: string, nextDepartment: string) => {
    try {
      setErrorMessage(null);
      
      const patient = patientQueue.find(p => p.id === patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // For patients in active queue
      if (activeTab === 'active') {
        // Only allow completing consultation for patients with 'in-consultation' status
        if (patient.status !== 'in-consultation') {
          throw new Error('Cannot complete consultation. Patient must be in consultation.');
        }

        // Update status to consultation-complete
        await updatePatientStatus(patientId, 'consultation-complete');
        
        // Move to next department
        await movePatientToNextDepartment(patientId, nextDepartment);
      }
      
      // For patients waiting for results, we don't change their status
      // We just close the consultation form
      setShowConsultationForm(false);
      setSelectedPatient(null);
    } catch (error) {
      console.error('Error completing consultation:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to complete consultation');
    }
  };

  const getPatientStatusInfo = (patient: Patient) => {
    // Check for pending lab tests
    if (patient.pendingLabTests) {
      return {
        icon: TestTube,
        text: 'Pending lab tests',
        color: 'purple',
        progress: patient.labTestsCompleted ? 'completed' : 'in progress'
      };
    }
    
    // Check for pending radiology tests
    if (patient.pendingRadiologyTests) {
      return {
        icon: Radio,
        text: 'Pending radiology tests',
        color: 'blue',
        progress: patient.radiologyTestsCompleted ? 'completed' : 'in progress'
      };
    }
    
    // Check for pending medications
    if (patient.pendingMedications) {
      return {
        icon: Pill,
        text: 'Pending medications',
        color: 'green',
        progress: patient.medicationsDispensed ? 'completed' : 'in progress'
      };
    }
    
    return {
      icon: Clock,
      text: patient.status.replace(/-/g, ' '),
      color: 'gray',
      progress: 'waiting'
    };
  };

  const togglePatientDetails = (patientId: string) => {
    setExpandedPatients(prev => ({
      ...prev,
      [patientId]: !prev[patientId]
    }));
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentSection('reception')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {currentDepartment ? departmentNames[currentDepartment] : 'Patient Management'}
            </h1>
            <p className="text-gray-500 mt-1">Manage patients across different stages</p>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
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

      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { 
            label: 'Active Patients', 
            value: stats.active,
            icon: Users,
            color: 'blue'
          },
          { 
            label: 'Waiting for Results', 
            value: stats.waiting,
            icon: Hourglass,
            color: 'yellow'
          },
          { 
            label: 'Completed', 
            value: stats.completed,
            icon: CheckCircle2,
            color: 'green'
          },
          { 
            label: 'Urgent Cases', 
            value: stats.urgent,
            icon: AlertTriangle,
            color: 'red'
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

      {/* Tab Navigation */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center gap-4">
          {[
            { id: 'active', label: 'Active Patients', icon: Stethoscope, count: stats.active },
            { id: 'waiting', label: 'Waiting for Results', icon: Hourglass, count: stats.waiting },
            { id: 'completed', label: 'Completed', icon: CheckCircle2, count: stats.completed }
          ].map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => {
                setActiveTab(id as typeof activeTab);
                setCurrentPage(1); // Reset to first page when changing tabs
              }}
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
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1); // Reset to first page when searching
              }}
              placeholder="Search patients..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedFilter}
            onChange={(e) => {
              setSelectedFilter(e.target.value);
              setCurrentPage(1); // Reset to first page when filtering
            }}
            className="px-4 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Patients</option>
            <option value="urgent">Urgent</option>
            <option value="normal">Normal</option>
          </select>
        </div>
      </div>

      {/* Patient List */}
      <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Layers className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {activeTab === 'active' ? 'Active Patients' : 
                   activeTab === 'waiting' ? 'Patients Waiting for Results' : 
                   'Completed Patients'}
                </h2>
                <p className="text-sm text-gray-500">
                  {filteredPatients.length} patients
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y">
          {currentItems.map((patient) => {
            const statusInfo = getPatientStatusInfo(patient);
            const isExpanded = expandedPatients[patient.id] || false;
            
            return (
              <div key={patient.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl flex items-center justify-center">
                      <span className="text-blue-700 font-semibold text-lg">
                        {patient.fullName.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {patient.fullName}
                      </h3>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm">
                            {patient.waitTime ? `${patient.waitTime}min wait` : 'Just arrived'}
                          </span>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          patient.priority === 'urgent'
                            ? 'bg-red-100 text-red-700'
                            : patient.priority === 'critical'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-green-100 text-green-700'
                        }`}>
                          {patient.priority}
                        </span>
                        <button 
                          onClick={() => togglePatientDetails(patient.id)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                        >
                          <span>Show More Info</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 bg-${statusInfo.color}-50 text-${statusInfo.color}-700 rounded-lg`}>
                      <statusInfo.icon className="w-4 h-4" />
                      <span className="text-sm">{statusInfo.text}</span>
                    </div>
                    
                    <button className="p-2 text-gray-400 hover:text-gray-600">
                      <FileText className="w-5 h-5" />
                    </button>
                    
                    <button
                      onClick={() => handleStartConsultation(patient.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {activeTab === 'waiting' ? (
                        <>
                          <span>Continue Treatment</span>
                          <Stethoscope className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <span>Start Consultation</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Additional Patient Details - Collapsible */}
                {isExpanded && (
                  <div className="mt-4 grid grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4">
                    <div>
                      <p className="text-sm text-gray-500">Age</p>
                      <p className="font-medium">{patient.age} years</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Gender</p>
                      <p className="font-medium">{patient.gender}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Department</p>
                      <p className="font-medium">{departmentNames[patient.currentDepartment]}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Registration</p>
                      <p className="font-medium">{format(new Date(patient.registrationDate), 'PP')}</p>
                    </div>
                  </div>
                )}
                
                {/* Pending Services */}
                {activeTab === 'waiting' && (
                  <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Clipboard className="w-4 h-4 text-blue-600" />
                      <h4 className="text-sm font-medium text-blue-700">Pending Services</h4>
                    </div>
                    <div className="space-y-2">
                      {(labTests[patient.id] || [])
                        .filter(test => test.status !== 'completed')
                        .map((test, index) => (
                          <div key={index} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {test.department === 'laboratory' ? (
                                <TestTube className="w-4 h-4 text-purple-600" />
                              ) : (
                                <Radio className="w-4 h-4 text-blue-600" />
                              )}
                              <span>{test.testType}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs ${
                              test.status === 'pending' ? 'bg-gray-100 text-gray-700' : 
                              test.status === 'sent' ? 'bg-yellow-100 text-yellow-700' :
                              test.status === 'received' ? 'bg-purple-100 text-purple-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {test.status}
                            </span>
                          </div>
                        ))}
                      
                      {/* Show completed tests */}
                      {(labTests[patient.id] || [])
                        .filter(test => test.status === 'completed')
                        .map((test, index) => (
                          <div key={`completed-${index}`} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              {test.department === 'laboratory' ? (
                                <TestTube className="w-4 h-4 text-green-600" />
                              ) : (
                                <Radio className="w-4 h-4 text-green-600" />
                              )}
                              <span>{test.testType}</span>
                            </div>
                            <span className="px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-700">
                              completed
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {filteredPatients.length === 0 && (
            <div className="py-12">
              <div className="text-center">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  {activeTab === 'active' ? (
                    <Stethoscope className="w-8 h-8 text-gray-400" />
                  ) : activeTab === 'waiting' ? (
                    <Hourglass className="w-8 h-8 text-gray-400" />
                  ) : (
                    <CheckCircle2 className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  {activeTab === 'active' 
                    ? 'No active patients' 
                    : activeTab === 'waiting'
                    ? 'No patients waiting for results'
                    : 'No completed patients'}
                </h3>
                <p className="text-gray-500">
                  {activeTab === 'active'
                    ? 'New patients will appear here after triage'
                    : activeTab === 'waiting'
                    ? 'Patients waiting for lab results will appear here'
                    : 'Completed consultations will appear here'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
              <span className="font-medium">{Math.min(indexOfLastItem, filteredPatients.length)}</span> of{' '}
              <span className="font-medium">{filteredPatients.length}</span> patients
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

      {/* Consultation Form Modal */}
      {showConsultationForm && selectedPatient && (
        <ConsultationForm
          patientId={selectedPatient}
          onClose={() => {
            setShowConsultationForm(false);
            setSelectedPatient(null);
          }}
          onComplete={handleConsultationComplete}
        />
      )}
    </div>
  );
};
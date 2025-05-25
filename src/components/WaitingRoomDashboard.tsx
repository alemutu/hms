import React, { useState, useMemo } from 'react';
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
  Gauge,
  Pill
} from 'lucide-react';
import { format } from 'date-fns';
import { ConsultationForm } from './ConsultationForm';
import type { Patient } from '../types';
import { departments, departmentNames } from '../types/departments';

export const WaitingRoomDashboard = () => {
  const { 
    patientQueue,
    setCurrentSection,
    updatePatientStatus,
    movePatientToNextDepartment,
    labTests
  } = usePatientStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showConsultationForm, setShowConsultationForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'lab' | 'radiology' | 'all'>('all');

  // Get patients with pending diagnostic tests
  const waitingPatients = useMemo(() => {
    return patientQueue.filter(patient => {
      // Get patient's lab tests
      const patientTests = labTests[patient.id] || [];
      
      // Check if patient has pending or completed lab/radiology tests
      const hasPendingLabTests = patientTests.some(test => 
        test.department === 'laboratory' && 
        test.status !== 'completed'
      );
      
      const hasPendingRadiologyTests = patientTests.some(test => 
        test.department === 'radiology' && 
        test.status !== 'completed'
      );
      
      const hasCompletedLabTests = patientTests.some(test => 
        test.department === 'laboratory' && 
        test.status === 'completed'
      );
      
      const hasCompletedRadiologyTests = patientTests.some(test => 
        test.department === 'radiology' && 
        test.status === 'completed'
      );
      
      return (
        patient.pendingLabTests || 
        patient.pendingRadiologyTests || 
        patient.status === 'waiting-for-lab' || 
        patient.status === 'waiting-for-radiology' ||
        patient.status === 'waiting-for-lab-results' || 
        patient.status === 'lab-results-received' ||
        patient.status === 'under-treatment' ||
        hasPendingLabTests ||
        hasPendingRadiologyTests ||
        hasCompletedLabTests ||
        hasCompletedRadiologyTests
      );
    });
  }, [patientQueue, labTests]);

  // Filter patients based on active tab and search query
  const filteredPatients = useMemo(() => {
    let patients = waitingPatients;
    
    // Filter by tab
    if (activeTab === 'lab') {
      patients = patients.filter(p => {
        const patientTests = labTests[p.id] || [];
        return p.pendingLabTests || 
               p.status === 'waiting-for-lab' || 
               p.status === 'waiting-for-lab-results' || 
               p.status === 'lab-results-received' ||
               patientTests.some(test => test.department === 'laboratory');
      });
    } else if (activeTab === 'radiology') {
      patients = patients.filter(p => {
        const patientTests = labTests[p.id] || [];
        return p.pendingRadiologyTests ||
               p.status === 'waiting-for-radiology' ||
               patientTests.some(test => test.department === 'radiology');
      });
    }
    
    // Filter by search query
    if (searchQuery) {
      return patients.filter(patient =>
        patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    return patients;
  }, [activeTab, waitingPatients, searchQuery, labTests]);

  const stats = {
    lab: waitingPatients.filter(p => {
      const patientTests = labTests[p.id] || [];
      return p.pendingLabTests || 
             p.status === 'waiting-for-lab' || 
             p.status === 'waiting-for-lab-results' || 
             p.status === 'lab-results-received' ||
             patientTests.some(test => test.department === 'laboratory');
    }).length,
    radiology: waitingPatients.filter(p => {
      const patientTests = labTests[p.id] || [];
      return p.pendingRadiologyTests ||
             p.status === 'waiting-for-radiology' ||
             patientTests.some(test => test.department === 'radiology');
    }).length,
    total: waitingPatients.length,
    resultsReceived: waitingPatients.filter(p => {
      const patientTests = labTests[p.id] || [];
      return p.status === 'lab-results-received' || 
             p.status === 'under-treatment' ||
             patientTests.some(test => test.status === 'completed');
    }).length
  };

  const handleStartConsultation = async (patientId: string) => {
    try {
      setErrorMessage(null);
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
    // Get patient's lab tests
    const patientTests = labTests[patient.id] || [];
    
    // Check for completed lab tests
    const hasCompletedLabTests = patientTests.some(test => 
      test.department === 'laboratory' && 
      test.status === 'completed'
    );
    
    // Check for completed radiology tests
    const hasCompletedRadiologyTests = patientTests.some(test => 
      test.department === 'radiology' && 
      test.status === 'completed'
    );
    
    // Check for pending lab tests
    if (patient.pendingLabTests || patientTests.some(test => 
      test.department === 'laboratory' && 
      test.status !== 'completed'
    ) || patient.status === 'waiting-for-lab') {
      return {
        icon: TestTube,
        text: 'Pending lab tests',
        color: 'purple',
        progress: hasCompletedLabTests ? 'completed' : 'in progress'
      };
    }
    
    // Check for pending radiology tests
    if (patient.pendingRadiologyTests || patientTests.some(test => 
      test.department === 'radiology' && 
      test.status !== 'completed'
    ) || patient.status === 'waiting-for-radiology') {
      return {
        icon: Radio,
        text: 'Pending radiology tests',
        color: 'blue',
        progress: hasCompletedRadiologyTests ? 'completed' : 'in progress'
      };
    }
    
    // Check for lab results received
    if (patient.status === 'lab-results-received' || patient.status === 'under-treatment' || hasCompletedLabTests || hasCompletedRadiologyTests) {
      return {
        icon: CheckCircle2,
        text: 'Results received',
        color: 'green',
        progress: 'completed'
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
      color: 'slate',
      progress: 'waiting'
    };
  };

  const getEstimatedWaitTime = (patient: Patient) => {
    // Get patient's pending tests
    const patientTests = labTests[patient.id] || [];
    const pendingTests = patientTests.filter(t => t.status !== 'completed');
    
    if (pendingTests.length === 0) return '5-10 min';
    
    const labTestsCount = pendingTests.filter(t => t.department === 'laboratory').length;
    const radioTests = pendingTests.filter(t => t.department === 'radiology').length;
    
    // Rough estimates
    const labTime = labTestsCount * 15; // 15 min per lab test
    const radioTime = radioTests * 30; // 30 min per radiology test
    
    const totalTime = labTime + radioTime;
    
    if (totalTime <= 15) return '10-15 min';
    if (totalTime <= 30) return '15-30 min';
    if (totalTime <= 60) return '30-60 min';
    return '60+ min';
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
            <h1 className="text-2xl font-bold text-gray-900">Waiting Room</h1>
            <p className="text-gray-500 mt-1">Manage patients waiting for results or services</p>
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
            label: 'Total Waiting', 
            value: stats.total,
            icon: Hourglass,
            color: 'gray'
          },
          { 
            label: 'Laboratory', 
            value: stats.lab,
            icon: TestTube,
            color: 'purple'
          },
          { 
            label: 'Radiology', 
            value: stats.radiology,
            icon: Radio,
            color: 'blue'
          },
          {
            label: 'Results Received',
            value: stats.resultsReceived,
            icon: CheckCircle2,
            color: 'green'
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
            { id: 'all', label: 'All Waiting', icon: Hourglass, count: stats.total },
            { id: 'lab', label: 'Laboratory', icon: TestTube, count: stats.lab },
            { id: 'radiology', label: 'Radiology', icon: Radio, count: stats.radiology }
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
      <div className="bg-white rounded-xl shadow-sm border p-4">
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
            <option value="all">All Priority</option>
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
                <Hourglass className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {activeTab === 'all' ? 'All Waiting Patients' : 
                   activeTab === 'lab' ? 'Patients Waiting for Lab Results' : 
                   'Patients Waiting for Radiology'}
                </h2>
                <p className="text-sm text-gray-500">
                  {filteredPatients.length} patients
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="divide-y">
          {filteredPatients.map((patient) => {
            const statusInfo = getPatientStatusInfo(patient);
            const estimatedWaitTime = getEstimatedWaitTime(patient);
            
            // Get patient's lab tests
            const patientTests = labTests[patient.id] || [];
            
            // Check if patient has completed tests
            const hasCompletedTests = patientTests.some(test => test.status === 'completed');
            
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
                      {hasCompletedTests || patient.status === 'lab-results-received' || patient.status === 'under-treatment' ? (
                        <>
                          <span>Continue Treatment</span>
                          <Stethoscope className="w-4 h-4" />
                        </>
                      ) : (
                        <>
                          <span>View Status</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Waiting Details */}
                <div className="mt-4 grid grid-cols-4 gap-4 bg-gray-50 rounded-lg p-4">
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-medium">{departmentNames[patient.currentDepartment]}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className={`w-2 h-2 rounded-full ${
                        statusInfo.progress === 'in progress' 
                          ? 'bg-yellow-500 animate-pulse' 
                          : statusInfo.progress === 'completed'
                          ? 'bg-green-500'
                          : 'bg-gray-400'
                      }`}></span>
                      <p className="font-medium capitalize">{statusInfo.progress}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Est. Wait Time</p>
                    <p className="font-medium">{estimatedWaitTime}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Return To</p>
                    <p className="font-medium">
                      {patient.returnToDepartment 
                        ? departmentNames[patient.returnToDepartment] 
                        : departmentNames[patient.currentDepartment]}
                    </p>
                  </div>
                </div>
                
                {/* Test Details */}
                <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Clipboard className="w-4 h-4 text-blue-600" />
                    <h4 className="text-sm font-medium text-blue-700">Pending Services</h4>
                  </div>
                  <div className="space-y-2">
                    {patientTests
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
                    {patientTests
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
                      
                    {patientTests.length === 0 && (
                      <div className="text-center py-2">
                        <p className="text-sm text-gray-500">No pending services</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredPatients.length === 0 && (
            <div className="py-12">
              <div className="text-center">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Hourglass className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-1">
                  No patients waiting
                </h3>
                <p className="text-gray-500">
                  Patients waiting for lab results or radiology will appear here
                </p>
              </div>
            </div>
          )}
        </div>
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
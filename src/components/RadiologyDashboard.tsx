import React, { useState, useEffect, useMemo } from 'react';
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
  BarChart3,
  LineChart,
  PieChart,
  Bell,
  ShieldAlert,
  Server,
  Cpu,
  Zap,
  Calendar,
  UserCog,
  Heart,
  ThermometerSun,
  Laptop,
  Wifi,
  CheckCheck,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle as CircleAlert,
  CheckCircle as CircleCheck,
  Siren,
  Ambulance,
  Bed,
  Milestone,
  Settings,
  Info,
  ChevronDown,
  ListFilter,
  LayoutGrid,
  Eye,
  Pill,
  Upload,
  Send
} from 'lucide-react';
import { format } from 'date-fns';
import { departments, departmentNames } from '../types/departments';
import { ResultForm } from './lab/ResultForm';
import { LabTest, Patient } from '../types';
import { PatientWorkflowManager } from './PatientWorkflowManager';

export const RadiologyDashboard = () => {
  const { 
    patientQueue, 
    setCurrentSection,
    updatePatientStatus,
    movePatientToNextDepartment,
    labTests = {},
    updateLabTest,
    checkPaymentStatus
  } = usePatientStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showResultForm, setShowResultForm] = useState(false);
  const [selectedTest, setSelectedTest] = useState<LabTest | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [activeTab, setActiveTab] = useState<'pending' | 'in-progress' | 'completed'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Get all radiology tests
  const allRadiologyTests = useMemo(() => {
    const tests: Array<{ patient: Patient, test: LabTest }> = [];
    
    // Iterate through all patients and their tests
    Object.entries(labTests).forEach(([patientId, patientTests]) => {
      const patient = patientQueue.find(p => p.id === patientId);
      if (!patient) return;
      
      // Filter for radiology tests
      const radiologyTests = patientTests.filter(test => test.department === 'radiology');
      
      // Add each test with its patient
      radiologyTests.forEach(test => {
        tests.push({ patient, test });
      });
    });
    
    return tests;
  }, [labTests, patientQueue]);

  // Get radiology patients
  const radiologyPatients = useMemo(() => {
    return patientQueue.filter(patient => {
      // Get patient's tests
      const patientTests = labTests[patient.id] || [];
      const hasRadiologyTests = patientTests.some(test => test.department === 'radiology');
      
      return (
        patient.currentDepartment === 'radiology' || 
        patient.status === 'waiting-for-radiology' || 
        patient.status === 'sent-to-radiology' || 
        patient.status === 'in-radiology' || 
        patient.status === 'awaiting-payment-radiology' ||
        hasRadiologyTests
      );
    });
  }, [patientQueue, labTests]);

  // Filter tests based on active tab
  const filteredTests = useMemo(() => {
    let tests = allRadiologyTests;
    
    if (activeTab === 'pending') {
      tests = tests.filter(({ test }) => test.status === 'pending' || test.status === 'sent');
    } else if (activeTab === 'in-progress') {
      tests = tests.filter(({ test }) => test.status === 'received' || test.status === 'in-progress');
    } else if (activeTab === 'completed') {
      tests = tests.filter(({ test }) => test.status === 'completed');
    }
    
    if (searchQuery) {
      return tests.filter(({ patient, test }) =>
        patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        test.testType.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedFilter === 'urgent') {
      return tests.filter(({ test }) => test.priority === 'urgent');
    }
    
    return tests;
  }, [allRadiologyTests, activeTab, searchQuery, selectedFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredTests.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredTests.slice(indexOfFirstItem, indexOfLastItem);

  const stats = {
    pending: allRadiologyTests.filter(({ test }) => test.status === 'pending' || test.status === 'sent').length,
    inProgress: allRadiologyTests.filter(({ test }) => test.status === 'received' || test.status === 'in-progress').length,
    completed: allRadiologyTests.filter(({ test }) => test.status === 'completed').length,
    urgent: allRadiologyTests.filter(({ test }) => test.priority === 'urgent').length
  };

  const handleReceiveTest = async (test: LabTest, patient: Patient) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      // Check payment status
      const isPaid = await checkPaymentStatus(patient.id, 'radiology');
      
      if (!isPaid) {
        setErrorMessage('Payment is required before processing this test');
        return;
      }
      
      // Update test status to received
      await updateLabTest(test.id, { 
        status: 'received',
        orderReceivedTime: new Date().toISOString()
      });
      
      // Update patient status
      await updatePatientStatus(patient.id, 'in-radiology');
      
      setSuccessMessage('Test received successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error receiving test:', error);
      setErrorMessage('Failed to receive test. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartScan = async (test: LabTest, patient: Patient) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      // Check if test is already in progress
      if (test.status === 'in-progress') {
        setErrorMessage('This scan is already in progress');
        return;
      }
      
      // Check payment status
      const isPaid = await checkPaymentStatus(patient.id, 'radiology');
      
      if (!isPaid) {
        // Check if this is an emergency case
        const isEmergency = patient.priority === 'urgent' || patient.priority === 'critical';
        
        if (!isEmergency) {
          setErrorMessage('Payment is required before processing this scan');
          return;
        }
      }
      
      // Update test status to in-progress
      await updateLabTest(test.id, { 
        status: 'in-progress',
        startedAt: new Date().toISOString()
      });
      
      setSuccessMessage('Scan started successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error starting scan:', error);
      setErrorMessage('Failed to start scan. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCompleteTest = async (test: LabTest, patient: Patient) => {
    try {
      // Set selected test and patient for the result form
      setSelectedTest(test);
      setSelectedPatient(patient);
      setShowResultForm(true);
    } catch (error) {
      console.error('Error completing test:', error);
      setErrorMessage('Failed to complete test. Please try again.');
    }
  };

  const handleSubmitResults = async (results: LabTest['results'], delivery?: LabTest['reportDelivery']) => {
    if (!selectedTest) return;
    
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      // Update test with results
      await updateLabTest(selectedTest.id, { 
        status: 'completed',
        results,
        reportDelivery: delivery
      });
      
      // Close the form
      setShowResultForm(false);
      setSelectedTest(null);
      setSelectedPatient(null);
      
      setSuccessMessage('Results submitted successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error submitting results:', error);
      setErrorMessage('Failed to submit results. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      case 'sent':
        return 'bg-blue-100 text-blue-700';
      case 'received':
        return 'bg-purple-100 text-purple-700';
      case 'in-progress':
        return 'bg-amber-100 text-amber-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'normal':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const handlePatientSelect = (patientId: string) => {
    // Find the patient
    const patient = patientQueue.find(p => p.id === patientId);
    if (!patient) return;
    
    // Find the patient's pending radiology test
    const patientTests = labTests[patientId] || [];
    const pendingTest = patientTests.find(t => 
      t.department === 'radiology' && 
      (t.status === 'pending' || t.status === 'sent')
    );
    
    if (pendingTest) {
      handleReceiveTest(pendingTest, patient);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentSection('dashboard')}
                className="p-1.5 hover:bg-white/80 rounded-lg text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Radiology Department</h1>
                <p className="text-xs text-gray-500">Manage radiology tests and scans</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                >
                  <ListFilter className="w-3.5 h-3.5 text-slate-600" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                >
                  <LayoutGrid className="w-3.5 h-3.5 text-slate-600" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-8 py-3">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-3 animate-fade">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <p className="text-sm text-rose-700">{errorMessage}</p>
            <button 
              onClick={() => setErrorMessage(null)}
              className="ml-auto p-1 hover:bg-rose-100 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5 text-rose-600" />
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="max-w-7xl mx-auto px-8 py-3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3 animate-fade">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">{successMessage}</p>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="ml-auto p-1 hover:bg-green-100 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5 text-green-600" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex gap-4">
          {/* Left Section (Test Queue) */}
          <div className="flex-1 w-2/3">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden h-[calc(100vh-180px)] flex flex-col">
              <div className="border-b">
                <div className="flex items-center p-1 gap-1">
                  {[
                    { id: 'pending', label: 'Pending', icon: Clock, count: stats.pending },
                    { id: 'in-progress', label: 'In Progress', icon: Activity, count: stats.inProgress },
                    { id: 'completed', label: 'Completed', icon: CheckCircle2, count: stats.completed }
                  ].map(({ id, label, icon: Icon, count }) => (
                    <button
                      key={id}
                      onClick={() => {
                        setActiveTab(id as typeof activeTab);
                        setCurrentPage(1); // Reset to first page when changing tabs
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all ${
                        activeTab === id
                          ? 'bg-blue-50 text-blue-700 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="font-medium text-sm">{label}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${
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

              <div className="p-3 bg-gray-50 border-b">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1); // Reset to first page when searching
                      }}
                      placeholder={`Search ${activeTab} tests...`}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                    />
                  </div>
                  <select
                    value={selectedFilter}
                    onChange={(e) => {
                      setSelectedFilter(e.target.value);
                      setCurrentPage(1); // Reset to first page when filtering
                    }}
                    className="px-3 py-1.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                  >
                    <option value="all">All Priority</option>
                    <option value="urgent">Urgent</option>
                    <option value="normal">Normal</option>
                  </select>
                </div>
              </div>

              <div className="overflow-y-auto flex-grow">
                {viewMode === 'grid' ? (
                  <div className="p-4 grid grid-cols-2 gap-4">
                    {currentItems.map(({ patient, test }, index) => (
                      <div key={index} className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-700 font-medium">
                                {patient.fullName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900 text-sm">{patient.fullName}</h3>
                              <p className="text-xs text-gray-500">ID: {patient.idNumber}</p>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(test.priority)}`}>
                            {test.priority}
                          </span>
                        </div>
                        
                        <div className="mb-3">
                          <div className="flex items-center gap-1.5 mb-1">
                            <Radio className="w-3.5 h-3.5 text-blue-600" />
                            <h4 className="font-medium text-gray-900 text-sm">{test.testType}</h4>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(test.status)}`}>
                              {test.status}
                            </span>
                            <span className="text-xs text-gray-500">
                              {format(new Date(test.requestedAt), 'MMM d, h:mm a')}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex justify-end gap-2">
                          {test.status === 'pending' && (
                            <button
                              onClick={() => handleReceiveTest(test, patient)}
                              disabled={isProcessing}
                              className="px-2 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
                            >
                              Receive
                            </button>
                          )}
                          
                          {(test.status === 'received' || test.status === 'sent') && (
                            <button
                              onClick={() => handleStartScan(test, patient)}
                              disabled={isProcessing}
                              className="px-2 py-1 bg-amber-600 text-white rounded-lg text-xs hover:bg-amber-700"
                            >
                              Start Scan
                            </button>
                          )}
                          
                          {test.status === 'in-progress' && (
                            <button
                              onClick={() => handleCompleteTest(test, patient)}
                              disabled={isProcessing}
                              className="px-2 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700"
                            >
                              Complete Scan
                            </button>
                          )}
                          
                          {test.status === 'completed' && (
                            <button
                              onClick={() => handleCompleteTest(test, patient)}
                              className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200"
                            >
                              View
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {filteredTests.length === 0 && (
                      <div className="col-span-2 py-8">
                        <div className="text-center">
                          <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                            <Radio className="w-6 h-6 text-slate-400" />
                          </div>
                          <h3 className="text-base font-medium text-slate-900 mb-1">
                            No {activeTab} tests
                          </h3>
                          <p className="text-sm text-slate-500">
                            {activeTab === 'pending'
                              ? 'No pending radiology tests'
                              : activeTab === 'in-progress'
                              ? 'No tests currently in progress'
                              : 'No completed tests yet'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patient</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requested</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {currentItems.map(({ patient, test }, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-medium">
                                  {patient.fullName.charAt(0)}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{patient.fullName}</div>
                                <div className="text-xs text-gray-500">ID: {patient.idNumber}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Radio className="w-4 h-4 text-blue-600 mr-2" />
                              <div className="text-sm text-gray-900">{test.testType}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getPriorityColor(test.priority)}`}>
                              {test.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusColor(test.status)}`}>
                              {test.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(test.requestedAt), 'MMM d, h:mm a')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2">
                              {test.status === 'pending' && (
                                <button
                                  onClick={() => handleReceiveTest(test, patient)}
                                  disabled={isProcessing}
                                  className="px-3 py-1 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
                                >
                                  Receive
                                </button>
                              )}
                              
                              {(test.status === 'received' || test.status === 'sent') && (
                                <button
                                  onClick={() => handleStartScan(test, patient)}
                                  disabled={isProcessing}
                                  className="px-3 py-1 bg-amber-600 text-white rounded-lg text-xs hover:bg-amber-700"
                                >
                                  Start Scan
                                </button>
                              )}
                              
                              {test.status === 'in-progress' && (
                                <button
                                  onClick={() => handleCompleteTest(test, patient)}
                                  disabled={isProcessing}
                                  className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700"
                                >
                                  Complete Scan
                                </button>
                              )}
                              
                              {test.status === 'completed' && (
                                <button
                                  onClick={() => handleCompleteTest(test, patient)}
                                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200"
                                >
                                  View
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                
                {filteredTests.length === 0 && viewMode === 'list' && (
                  <div className="py-8">
                    <div className="text-center">
                      <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                        <Radio className="w-6 h-6 text-slate-400" />
                      </div>
                      <h3 className="text-base font-medium text-slate-900 mb-1">
                        No {activeTab} tests
                      </h3>
                      <p className="text-sm text-slate-500">
                        {activeTab === 'pending'
                          ? 'No pending radiology tests'
                          : activeTab === 'in-progress'
                          ? 'No tests currently in progress'
                          : 'No completed tests yet'}
                      </p>
                    </div>
                  </div>
                )}
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(indexOfLastItem, filteredTests.length)}</span> of{' '}
                      <span className="font-medium">{filteredTests.length}</span> tests
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
            </div>
          </div>

          {/* Right Section (Stats & Info) */}
          <div className="w-1/3 flex flex-col space-y-3 h-[calc(100vh-180px)]">
            {/* Department Overview Card */}
            <div className="bg-white rounded-xl border shadow-sm p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Radio className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-sm">Radiology Overview</h2>
                </div>
                <div className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                  Today
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { 
                    label: 'Pending', 
                    value: stats.pending,
                    icon: Clock,
                    color: 'blue'
                  },
                  { 
                    label: 'In Progress', 
                    value: stats.inProgress,
                    icon: Activity,
                    color: 'amber'
                  },
                  { 
                    label: 'Completed', 
                    value: stats.completed,
                    icon: CheckCircle2,
                    color: 'green'
                  },
                  { 
                    label: 'Urgent', 
                    value: stats.urgent,
                    icon: AlertTriangle,
                    color: 'red'
                  }
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className={`flex items-center justify-between p-1.5 bg-${color}-50 rounded-lg border border-${color}-100`}>
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 text-${color}-600`} />
                      <span className="text-xs font-medium text-slate-700">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border shadow-sm p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-sm">Quick Actions</h2>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { 
                    label: 'View Records',
                    icon: FileText,
                    color: 'indigo',
                    action: () => setCurrentSection('records')
                  },
                  { 
                    label: 'Upload Images',
                    icon: Upload,
                    color: 'emerald',
                    action: () => {}
                  },
                  { 
                    label: 'Send Results',
                    icon: Send,
                    color: 'amber',
                    action: () => {}
                  },
                  { 
                    label: 'View Schedule',
                    icon: Calendar,
                    color: 'blue',
                    action: () => {}
                  }
                ].map(({ label, icon: Icon, color, action }) => (
                  <button 
                    key={label} 
                    onClick={action}
                    className={`flex items-center gap-1.5 p-1.5 bg-${color}-50 rounded-lg border border-${color}-100 hover:bg-${color}-100 transition-colors transform hover:-translate-y-0.5 hover:shadow-sm duration-200`}
                  >
                    <Icon className={`w-3.5 h-3.5 text-${color}-600`} />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Patient Queue */}
            <div className="flex-grow">
              <PatientWorkflowManager
                departmentId={departments.RADIOLOGY}
                onPatientSelect={handlePatientSelect}
                className="h-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Result Form Modal */}
      {showResultForm && selectedTest && selectedPatient && (
        <ResultForm
          test={selectedTest}
          patient={selectedPatient}
          onClose={() => {
            setShowResultForm(false);
            setSelectedTest(null);
            setSelectedPatient(null);
          }}
          onSubmit={handleSubmitResults}
        />
      )}
    </div>
  );
};
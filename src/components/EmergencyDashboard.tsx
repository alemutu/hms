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
  Eye,
  Pill,
  Upload,
  Send,
  Timer,
  Skull,
  Heartbeat
} from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { departments, departmentNames } from '../types/departments';
import { EmergencyTreatmentForm } from './emergency/EmergencyTreatmentForm';
import { EmergencyTriageForm } from './emergency/EmergencyTriageForm';
import { Patient } from '../types';

export const EmergencyDashboard = () => {
  const { 
    patientQueue, 
    setCurrentSection,
    updatePatientStatus,
    movePatientToNextDepartment,
    updateParallelWorkflow,
    addNotification
  } = usePatientStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showTreatmentForm, setShowTreatmentForm] = useState(false);
  const [showTriageForm, setShowTriageForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'registered' | 'triage' | 'treatment' | 'stabilized'>('registered');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [patientTimers, setPatientTimers] = useState<Record<string, number>>({});

  // Get emergency patients
  const emergencyPatients = useMemo(() => {
    return patientQueue.filter(patient => 
      patient.isEmergency || 
      patient.patientType === 'emergency' ||
      patient.status.startsWith('emergency-')
    );
  }, [patientQueue]);

  // Update timers for emergency patients
  useEffect(() => {
    const interval = setInterval(() => {
      const timers: Record<string, number> = {};
      
      emergencyPatients.forEach(patient => {
        if (patient.emergencyRegistrationTime) {
          const startTime = new Date(patient.emergencyRegistrationTime);
          const now = new Date();
          const minutes = differenceInMinutes(now, startTime);
          timers[patient.id] = minutes;
        }
      });
      
      setPatientTimers(timers);
    }, 60000); // Update every minute
    
    // Initial calculation
    const initialTimers: Record<string, number> = {};
    emergencyPatients.forEach(patient => {
      if (patient.emergencyRegistrationTime) {
        const startTime = new Date(patient.emergencyRegistrationTime);
        const now = new Date();
        const minutes = differenceInMinutes(now, startTime);
        initialTimers[patient.id] = minutes;
      }
    });
    setPatientTimers(initialTimers);
    
    return () => clearInterval(interval);
  }, [emergencyPatients]);

  // Filter patients based on active tab
  const filteredPatients = useMemo(() => {
    let patients = emergencyPatients;
    
    if (activeTab === 'registered') {
      patients = patients.filter(p => p.status === 'emergency-registered');
    } else if (activeTab === 'triage') {
      patients = patients.filter(p => p.status === 'emergency-triage');
    } else if (activeTab === 'treatment') {
      patients = patients.filter(p => p.status === 'emergency-treatment');
    } else if (activeTab === 'stabilized') {
      patients = patients.filter(p => 
        p.status === 'emergency-stabilized' || 
        p.status === 'emergency-transferred' || 
        p.status === 'emergency-admitted'
      );
    }
    
    if (searchQuery) {
      return patients.filter(patient =>
        patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.idNumber.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedFilter === 'trauma') {
      return patients.filter(p => p.emergencyType === 'trauma');
    } else if (selectedFilter === 'medical') {
      return patients.filter(p => p.emergencyType === 'medical');
    }
    
    return patients;
  }, [emergencyPatients, activeTab, searchQuery, selectedFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);

  const stats = {
    registered: emergencyPatients.filter(p => p.status === 'emergency-registered').length,
    triage: emergencyPatients.filter(p => p.status === 'emergency-triage').length,
    treatment: emergencyPatients.filter(p => p.status === 'emergency-treatment').length,
    stabilized: emergencyPatients.filter(p => 
      p.status === 'emergency-stabilized' || 
      p.status === 'emergency-transferred' || 
      p.status === 'emergency-admitted'
    ).length,
    total: emergencyPatients.length
  };

  const handleStartTriage = async (patientId: string) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      // Get the patient
      const patient = patientQueue.find(p => p.id === patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Update patient status to emergency-triage
      await updatePatientStatus(patientId, 'emergency-triage');
      
      // Update emergency triage time
      await updateParallelWorkflow(patientId, {
        emergencyTriageTime: new Date().toISOString()
      });
      
      // Show triage form
      setSelectedPatient(patientId);
      setShowTriageForm(true);
      
      // Create notification
      addNotification({
        id: crypto.randomUUID(),
        type: 'emergency',
        title: 'Emergency Triage Started',
        message: `Emergency triage started for ${patient.fullName}`,
        timestamp: new Date().toISOString(),
        read: false,
        patientId: patientId,
        priority: 'emergency',
        action: 'emergency-response',
        departmentTarget: 'emergency'
      });
      
      setSuccessMessage('Emergency triage started');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error starting emergency triage:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to start emergency triage');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleStartTreatment = async (patientId: string) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      // Get the patient
      const patient = patientQueue.find(p => p.id === patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Update patient status to emergency-treatment
      await updatePatientStatus(patientId, 'emergency-treatment');
      
      // Update emergency doctor assigned time
      await updateParallelWorkflow(patientId, {
        emergencyDoctorAssignedTime: new Date().toISOString()
      });
      
      // Show treatment form
      setSelectedPatient(patientId);
      setShowTreatmentForm(true);
      
      // Create notification
      addNotification({
        id: crypto.randomUUID(),
        type: 'emergency',
        title: 'Emergency Treatment Started',
        message: `Emergency treatment started for ${patient.fullName}`,
        timestamp: new Date().toISOString(),
        read: false,
        patientId: patientId,
        priority: 'emergency',
        action: 'emergency-response',
        departmentTarget: 'emergency'
      });
      
      setSuccessMessage('Emergency treatment started');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error starting emergency treatment:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to start emergency treatment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTriageComplete = async (patientId: string) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      // Get the patient
      const patient = patientQueue.find(p => p.id === patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Update patient status to emergency-treatment
      await updatePatientStatus(patientId, 'emergency-treatment');
      
      // Close the triage form
      setShowTriageForm(false);
      setSelectedPatient(null);
      
      // Create notification
      addNotification({
        id: crypto.randomUUID(),
        type: 'emergency',
        title: 'Emergency Triage Completed',
        message: `Emergency triage completed for ${patient.fullName}`,
        timestamp: new Date().toISOString(),
        read: false,
        patientId: patientId,
        priority: 'emergency',
        action: 'emergency-response',
        departmentTarget: 'emergency'
      });
      
      setSuccessMessage('Emergency triage completed');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error completing emergency triage:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to complete emergency triage');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTreatmentComplete = async (patientId: string, outcome: 'stabilized' | 'admitted' | 'transferred' | 'discharged' | 'deceased') => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      // Get the patient
      const patient = patientQueue.find(p => p.id === patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }

      // Update patient status based on outcome
      let newStatus: string;
      switch (outcome) {
        case 'stabilized':
          newStatus = 'emergency-stabilized';
          break;
        case 'admitted':
          newStatus = 'emergency-admitted';
          break;
        case 'transferred':
          newStatus = 'emergency-transferred';
          break;
        case 'discharged':
          newStatus = 'discharged';
          break;
        case 'deceased':
          newStatus = 'discharged'; // We don't have a specific status for deceased
          break;
        default:
          newStatus = 'emergency-stabilized';
      }
      
      await updatePatientStatus(patientId, newStatus as any);
      
      // Update emergency outcome and time
      await updateParallelWorkflow(patientId, {
        emergencyOutcome: outcome,
        emergencyOutcomeTime: new Date().toISOString(),
        emergencyStabilizationTime: new Date().toISOString(),
        emergencyResponseDuration: patientTimers[patientId] || 0
      });
      
      // Close the treatment form
      setShowTreatmentForm(false);
      setSelectedPatient(null);
      
      // Create notification
      addNotification({
        id: crypto.randomUUID(),
        type: 'emergency',
        title: 'Emergency Treatment Completed',
        message: `Emergency treatment completed for ${patient.fullName}. Outcome: ${outcome}`,
        timestamp: new Date().toISOString(),
        read: false,
        patientId: patientId,
        priority: 'emergency',
        action: 'emergency-response',
        departmentTarget: 'emergency'
      });
      
      setSuccessMessage(`Emergency treatment completed. Patient ${outcome}.`);
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      console.error('Error completing emergency treatment:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to complete emergency treatment');
    } finally {
      setIsProcessing(false);
    }
  };

  const getEmergencyTypeIcon = (type?: string) => {
    switch (type) {
      case 'trauma':
        return Ambulance;
      case 'medical':
        return Heartbeat;
      case 'surgical':
        return Stethoscope;
      case 'obstetric':
        return Baby;
      case 'pediatric':
        return Baby;
      default:
        return Siren;
    }
  };

  const getEmergencyTypeColor = (type?: string) => {
    switch (type) {
      case 'trauma':
        return 'text-red-600 bg-red-100';
      case 'medical':
        return 'text-blue-600 bg-blue-100';
      case 'surgical':
        return 'text-purple-600 bg-purple-100';
      case 'obstetric':
        return 'text-pink-600 bg-pink-100';
      case 'pediatric':
        return 'text-green-600 bg-green-100';
      default:
        return 'text-amber-600 bg-amber-100';
    }
  };

  const getTimerColor = (minutes: number) => {
    if (minutes < 5) return 'text-green-600';
    if (minutes < 15) return 'text-amber-600';
    return 'text-red-600';
  };

  const formatTimer = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    
    return `${mins}m`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-red-50 to-white border-b">
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
                <h1 className="text-lg font-bold text-gray-900">Emergency Department</h1>
                <p className="text-xs text-gray-500">Manage emergency cases</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentSection('registration')}
                className="flex items-center gap-2 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Emergency</span>
              </button>
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
          {/* Left Section (Patient Queue) */}
          <div className="flex-1 w-2/3">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden h-[calc(100vh-180px)] flex flex-col">
              <div className="border-b">
                <div className="flex items-center p-1 gap-1">
                  {[
                    { id: 'registered', label: 'Registered', icon: Clock, count: stats.registered },
                    { id: 'triage', label: 'Triage', icon: Activity, count: stats.triage },
                    { id: 'treatment', label: 'Treatment', icon: Stethoscope, count: stats.treatment },
                    { id: 'stabilized', label: 'Stabilized', icon: CheckCircle2, count: stats.stabilized }
                  ].map(({ id, label, icon: Icon, count }) => (
                    <button
                      key={id}
                      onClick={() => {
                        setActiveTab(id as typeof activeTab);
                        setCurrentPage(1); // Reset to first page when changing tabs
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all ${
                        activeTab === id
                          ? 'bg-red-50 text-red-700 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="font-medium text-sm">{label}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                        activeTab === id
                          ? 'bg-red-100 text-red-700'
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
                      placeholder={`Search ${activeTab} patients...`}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-red-500 transition-all duration-200"
                    />
                  </div>
                  <select
                    value={selectedFilter}
                    onChange={(e) => {
                      setSelectedFilter(e.target.value);
                      setCurrentPage(1); // Reset to first page when filtering
                    }}
                    className="px-3 py-1.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-red-500 transition-all duration-200"
                  >
                    <option value="all">All Types</option>
                    <option value="trauma">Trauma</option>
                    <option value="medical">Medical</option>
                    <option value="surgical">Surgical</option>
                    <option value="obstetric">Obstetric</option>
                    <option value="pediatric">Pediatric</option>
                  </select>
                </div>
              </div>

              <div className="overflow-y-auto flex-grow">
                <div className="divide-y divide-slate-100">
                  {currentItems.map(patient => {
                    const EmergencyTypeIcon = getEmergencyTypeIcon(patient.emergencyType);
                    const emergencyTypeColor = getEmergencyTypeColor(patient.emergencyType);
                    const responseTime = patientTimers[patient.id] || 0;
                    const timerColor = getTimerColor(responseTime);
                    
                    return (
                      <div key={patient.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                              <span className="text-red-700 font-medium">{patient.fullName.charAt(0)}</span>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">{patient.fullName}</h3>
                              <div className="flex items-center gap-3 mt-0.5">
                                <p className="text-xs text-gray-500">ID: {patient.idNumber}</p>
                                <p className="text-xs text-gray-500">{patient.age} years, {patient.gender}</p>
                                <div className={`px-2 py-0.5 rounded-full text-xs font-medium ${emergencyTypeColor}`}>
                                  {patient.emergencyType || 'Unknown'}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <div className={`flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-sm ${timerColor}`}>
                              <Timer className="w-4 h-4" />
                              <span>{formatTimer(responseTime)}</span>
                            </div>
                            
                            {activeTab === 'registered' && (
                              <button
                                onClick={() => handleStartTriage(patient.id)}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                              >
                                <Activity className="w-4 h-4" />
                                <span>Start Triage</span>
                              </button>
                            )}
                            
                            {activeTab === 'triage' && (
                              <button
                                onClick={() => handleStartTreatment(patient.id)}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                              >
                                <Stethoscope className="w-4 h-4" />
                                <span>Start Treatment</span>
                              </button>
                            )}
                            
                            {activeTab === 'treatment' && (
                              <button
                                onClick={() => {
                                  setSelectedPatient(patient.id);
                                  setShowTreatmentForm(true);
                                }}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
                              >
                                <Stethoscope className="w-4 h-4" />
                                <span>Continue Treatment</span>
                              </button>
                            )}
                            
                            {activeTab === 'stabilized' && (
                              <button
                                onClick={() => {
                                  setSelectedPatient(patient.id);
                                  setShowTreatmentForm(true);
                                }}
                                disabled={isProcessing}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                              >
                                <FileText className="w-4 h-4" />
                                <span>View Details</span>
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-3">
                          <div>
                            <p className="text-sm text-gray-500">Emergency Description</p>
                            <p className="font-medium">{patient.emergencyDescription || 'No description provided'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Brought By</p>
                            <p className="font-medium">{patient.emergencyBroughtBy || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Status</p>
                            <p className="font-medium capitalize">{patient.status.replace('emergency-', '').replace(/-/g, ' ')}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Registration Time</p>
                            <p className="font-medium">
                              {patient.emergencyRegistrationTime 
                                ? format(new Date(patient.emergencyRegistrationTime), 'h:mm a')
                                : format(new Date(patient.registrationTime || ''), 'h:mm a')
                              }
                            </p>
                          </div>
                        </div>
                        
                        {patient.emergencyOutcome && (
                          <div className="mt-2 p-2 bg-blue-50 rounded-lg border border-blue-100">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="w-4 h-4 text-blue-600" />
                              <p className="text-sm font-medium text-blue-700">
                                Outcome: <span className="capitalize">{patient.emergencyOutcome}</span>
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  
                  {filteredPatients.length === 0 && (
                    <div className="py-8">
                      <div className="text-center">
                        <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                          <Ambulance className="w-6 h-6 text-slate-400" />
                        </div>
                        <h3 className="text-base font-medium text-slate-900 mb-1">
                          No emergency patients
                        </h3>
                        <p className="text-sm text-slate-500">
                          {searchQuery 
                            ? `No results for "${searchQuery}"`
                            : activeTab === 'registered'
                            ? 'No newly registered emergency patients'
                            : activeTab === 'triage'
                            ? 'No emergency patients in triage'
                            : activeTab === 'treatment'
                            ? 'No emergency patients in treatment'
                            : 'No stabilized emergency patients'}
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
                              ? 'bg-red-600 text-white'
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
                  <div className="p-1.5 bg-red-100 rounded-lg">
                    <Ambulance className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-sm">Emergency Overview</h2>
                </div>
                <div className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                  Today
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { 
                    label: 'Registered', 
                    value: stats.registered,
                    icon: Clock,
                    color: 'blue'
                  },
                  { 
                    label: 'In Triage', 
                    value: stats.triage,
                    icon: Activity,
                    color: 'amber'
                  },
                  { 
                    label: 'In Treatment', 
                    value: stats.treatment,
                    icon: Stethoscope,
                    color: 'purple'
                  },
                  { 
                    label: 'Stabilized', 
                    value: stats.stabilized,
                    icon: CheckCircle2,
                    color: 'green'
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
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-sm">Quick Actions</h2>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { 
                    label: 'New Emergency',
                    icon: Plus,
                    color: 'red',
                    action: () => setCurrentSection('registration')
                  },
                  { 
                    label: 'View Records',
                    icon: FileText,
                    color: 'indigo',
                    action: () => setCurrentSection('records')
                  },
                  { 
                    label: 'Lab Tests',
                    icon: TestTube,
                    color: 'amber',
                    action: () => setCurrentSection('laboratory')
                  },
                  { 
                    label: 'Radiology',
                    icon: Radio,
                    color: 'blue',
                    action: () => setCurrentSection('radiology')
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

            {/* Emergency Protocol Guide */}
            <div className="bg-white rounded-xl border shadow-sm p-3 flex-grow overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-100 rounded-lg">
                    <ClipboardList className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-sm">Emergency Protocols</h2>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <h3 className="text-xs font-medium text-slate-700 mb-1.5">Trauma Protocol</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">1. Primary Survey (ABCDE)</span>
                      <span className="text-blue-600">View Protocol</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">2. Secondary Survey</span>
                      <span className="text-blue-600">View Protocol</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">3. Trauma Team Activation</span>
                      <span className="text-blue-600">View Protocol</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <h3 className="text-xs font-medium text-slate-700 mb-1.5">Medical Emergencies</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">1. Cardiac Arrest</span>
                      <span className="text-blue-600">View Protocol</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">2. Stroke</span>
                      <span className="text-blue-600">View Protocol</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">3. Anaphylaxis</span>
                      <span className="text-blue-600">View Protocol</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <h3 className="text-xs font-medium text-slate-700 mb-1.5">Pediatric Emergencies</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">1. Pediatric Resuscitation</span>
                      <span className="text-blue-600">View Protocol</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">2. Pediatric Dosing</span>
                      <span className="text-blue-600">View Protocol</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">3. Neonatal Emergencies</span>
                      <span className="text-blue-600">View Protocol</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <h3 className="text-xs font-medium text-slate-700 mb-1.5">Obstetric Emergencies</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">1. Postpartum Hemorrhage</span>
                      <span className="text-blue-600">View Protocol</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">2. Eclampsia</span>
                      <span className="text-blue-600">View Protocol</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">3. Emergency Delivery</span>
                      <span className="text-blue-600">View Protocol</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Triage Form Modal */}
      {showTriageForm && selectedPatient && (
        <EmergencyTriageForm
          patientId={selectedPatient}
          onClose={() => {
            setShowTriageForm(false);
            setSelectedPatient(null);
          }}
          onComplete={handleTriageComplete}
        />
      )}

      {/* Emergency Treatment Form Modal */}
      {showTreatmentForm && selectedPatient && (
        <EmergencyTreatmentForm
          patientId={selectedPatient}
          onClose={() => {
            setShowTreatmentForm(false);
            setSelectedPatient(null);
          }}
          onComplete={handleTreatmentComplete}
        />
      )}
    </div>
  );
};
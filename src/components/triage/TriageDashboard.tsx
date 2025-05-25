import React, { useState, useEffect } from 'react';
import { usePatientStore } from '../../lib/store';
import {
  Activity,
  Users,
  Clock,
  Heart,
  ThermometerSun,
  Gauge,
  ArrowRight,
  Search,
  Filter,
  CheckCircle2,
  ArrowLeft,
  Plus,
  FileText,
  Stethoscope,
  XCircle,
  LayoutGrid,
  ListFilter,
  Layers,
  Bell,
  Hourglass,
  ChevronDown,
  CalendarDays,
  Building2,
  User,
  ClipboardList,
  BadgeCheck,
  Info,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Play,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { TriageForm } from './TriageForm';
import type { Patient } from '../../types';
import { departments, departmentNames } from '../../types/departments';
import { PatientWorkflowManager } from '../PatientWorkflowManager';

export const TriageDashboard = () => {
  const { 
    patientQueue, 
    setCurrentSection,
    vitalSigns = {}, 
    updatePatientStatus,
    movePatientToNextDepartment,
    addNotification,
    unassignPatientFromDoctor
  } = usePatientStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showTriageForm, setShowTriageForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [showPerformanceMetrics, setShowPerformanceMetrics] = useState(false);
  const [activeTab, setActiveTab] = useState<'waiting' | 'in-progress' | 'paused'>('waiting');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get patients waiting for triage
  const triagePatients = patientQueue.filter(patient => 
    patient.status === 'registered' || 
    patient.status === 'activated' || 
    patient.status === 'in-triage'
  );

  // Get patients with paused triage (started but not completed)
  const pausedTriagePatients = patientQueue.filter(patient => 
    patient.inTriageTime && !patient.triageCompleteTime && patient.status !== 'in-triage'
  );

  // Filter patients based on active tab
  const filteredPatients = React.useMemo(() => {
    let patients = triagePatients;
    
    if (activeTab === 'waiting') {
      patients = patients.filter(p => p.status === 'registered' || p.status === 'activated');
    } else if (activeTab === 'in-progress') {
      patients = patients.filter(p => p.status === 'in-triage');
    } else if (activeTab === 'paused') {
      patients = pausedTriagePatients;
    }
    
    if (searchQuery) {
      return patients.filter(patient =>
        patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    if (selectedFilter === 'urgent') {
      return patients.filter(p => p.priority === 'urgent');
    }
    
    return patients;
  }, [triagePatients, pausedTriagePatients, activeTab, searchQuery, selectedFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);

  const stats = {
    waiting: triagePatients.filter(p => p.status === 'registered' || p.status === 'activated').length,
    inProgress: triagePatients.filter(p => p.status === 'in-triage').length,
    paused: pausedTriagePatients.length,
    completed: patientQueue.filter(p => 
      p.previousDepartments?.includes('triage') && 
      p.status !== 'registered' &&
      p.status !== 'activated' &&
      p.status !== 'in-triage'
    ).length,
    urgent: triagePatients.filter(p => p.priority === 'urgent').length
  };

  const handleStartTriage = async (patientId: string) => {
    try {
      // Clear any previous error messages
      setErrorMessage(null);

      // Get the patient
      const patient = patientQueue.find(p => p.id === patientId);
      if (!patient) {
        setErrorMessage('Patient not found');
        return;
      }

      // Only allow starting triage for patients with 'registered' or 'activated' status
      if (patient.status !== 'registered' && patient.status !== 'activated') {
        setErrorMessage('Cannot start triage for this patient at this time. Patient must be in registered or activated status.');
        return;
      }

      // Ensure patient is not assigned to any doctor
      if (patient.assignedDoctorId) {
        await unassignPatientFromDoctor(patientId);
      }

      await updatePatientStatus(patientId, 'in-triage');
      setSelectedPatient(patientId);
      setShowTriageForm(true);
    } catch (error) {
      console.error('Error starting triage:', error);
      setErrorMessage('An error occurred while starting triage. Please try again.');
    }
  };

  const handleContinueTriage = async (patientId: string) => {
    try {
      // Clear any previous error messages
      setErrorMessage(null);

      // Get the patient
      const patient = patientQueue.find(p => p.id === patientId);
      if (!patient) {
        setErrorMessage('Patient not found');
        return;
      }

      // Ensure patient is not assigned to any doctor
      if (patient.assignedDoctorId) {
        await unassignPatientFromDoctor(patientId);
      }

      // Update status to in-triage if it's not already
      if (patient.status !== 'in-triage') {
        await updatePatientStatus(patientId, 'in-triage');
      }
      
      setSelectedPatient(patientId);
      setShowTriageForm(true);
    } catch (error) {
      console.error('Error continuing triage:', error);
      setErrorMessage('An error occurred while continuing triage. Please try again.');
    }
  };

  const handleTriageComplete = async (
    patientId: string, 
    priority: Patient['priority'],
    nextDepartment: string
  ) => {
    try {
      setErrorMessage(null);
      
      // Get the patient
      const patient = patientQueue.find(p => p.id === patientId);
      if (!patient) {
        setErrorMessage('Patient not found');
        return;
      }

      // Only allow completing triage for patients with 'in-triage' status
      if (patient.status !== 'in-triage') {
        setErrorMessage('Cannot complete triage. Patient must be in triage status.');
        return;
      }

      // First update status to triage-complete
      await updatePatientStatus(patientId, 'triage-complete', priority);
      
      // Ensure patient is not assigned to any doctor before moving to next department
      if (patient.assignedDoctorId) {
        await unassignPatientFromDoctor(patientId);
      }
      
      // Then move to next department
      await movePatientToNextDepartment(patientId, nextDepartment);
      
      // Create notification for the destination department
      const notification = {
        id: crypto.randomUUID(),
        type: 'info',
        title: 'New Patient from Triage',
        message: `${patient.fullName} has been triaged and assigned to your department`,
        timestamp: new Date().toISOString(),
        read: false,
        patientId: patientId,
        priority: priority === 'urgent' || priority === 'critical' ? 'high' : 'normal',
        action: 'view-patient',
        departmentTarget: nextDepartment
      };
      
      // Add notification
      addNotification(notification);
      
      // Show success message
      setSuccessMessage(`Patient successfully triaged and sent to ${departmentNames[nextDepartment]}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      setShowTriageForm(false);
      setSelectedPatient(null);
      
      // Switch back to waiting tab
      setActiveTab('waiting');
    } catch (error) {
      console.error('Error completing triage:', error);
      setErrorMessage('An error occurred while completing triage. Please try again.');
    }
  };

  const handlePatientSelect = (patientId: string) => {
    const patient = patientQueue.find(p => p.id === patientId);
    if (!patient) {
      setErrorMessage('Patient not found');
      return;
    }
    
    // If patient is in triage, continue triage
    if (patient.status === 'in-triage') {
      setSelectedPatient(patientId);
      setShowTriageForm(true);
    } 
    // If patient has started triage but not completed, continue triage
    else if (patient.inTriageTime && !patient.triageCompleteTime) {
      handleContinueTriage(patientId);
    } 
    // Otherwise start new triage
    else {
      handleStartTriage(patientId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header - More compact */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentSection('reception')}
                className="p-1.5 hover:bg-white/80 rounded-lg text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Triage</h1>
                <p className="text-xs text-gray-500">Patient Assessment & Prioritization</p>
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

      {/* Error Message */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-8 py-3">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-3 animate-fade">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
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

      {/* Success Message */}
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

      {/* Main Content - Horizontal Split Layout - More compact */}
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex gap-4">
          {/* Left Section (Patient Queue) - Wider */}
          <div className="flex-1 w-2/3">
            <PatientWorkflowManager 
              departmentId={departments.TRIAGE}
              onPatientSelect={handlePatientSelect}
              onContinueWorkflow={(patientId) => handleContinueTriage(patientId)}
              className="h-[calc(100vh-180px)]"
            />
          </div>

          {/* Right Section (Department Stats) - Adjusted to match left section height */}
          <div className="w-1/3 flex flex-col space-y-3 h-[calc(100vh-180px)]">
            {/* Department Overview Card - Compact metrics */}
            <div className="bg-white rounded-xl border shadow-sm p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <Activity className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-sm">Triage Overview</h2>
                </div>
                <div className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                  Today
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { 
                    label: 'Waiting', 
                    value: stats.waiting,
                    icon: Clock,
                    color: 'indigo'
                  },
                  { 
                    label: 'In Progress', 
                    value: stats.inProgress,
                    icon: Activity,
                    color: 'amber'
                  },
                  { 
                    label: 'Paused', 
                    value: stats.paused,
                    icon: Hourglass,
                    color: 'purple'
                  },
                  { 
                    label: 'Completed', 
                    value: stats.completed,
                    icon: CheckCircle2,
                    color: 'emerald'
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
                    label: 'View Records',
                    icon: FileText,
                    color: 'indigo',
                    action: () => setCurrentSection('records')
                  },
                  { 
                    label: 'Reception',
                    icon: Users,
                    color: 'emerald',
                    action: () => setCurrentSection('reception')
                  },
                  { 
                    label: 'Consultations',
                    icon: Stethoscope,
                    color: 'amber',
                    action: () => setCurrentSection('consultation')
                  },
                  { 
                    label: 'Appointments',
                    icon: CalendarDays,
                    color: 'blue',
                    action: () => setCurrentSection('appointments')
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

            {/* Performance Metrics - Collapsible */}
            <div className="bg-white rounded-xl border shadow-sm p-3">
              <button 
                onClick={() => setShowPerformanceMetrics(!showPerformanceMetrics)}
                className="w-full flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 rounded-lg">
                    <Gauge className="w-3.5 h-3.5 text-emerald-600" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-sm">Performance Metrics</h2>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 text-slate-500 transition-transform duration-200 ${showPerformanceMetrics ? 'rotate-180' : ''}`} />
              </button>

              {showPerformanceMetrics && (
                <div className="space-y-2 mt-2 pt-2 border-t border-slate-100">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">Avg. Triage Time</span>
                      <span className="text-xs font-medium text-slate-900">8 min</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '75%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">Wait Time</span>
                      <span className="text-xs font-medium text-slate-900">12 min</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: '60%' }}></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-slate-600">Accuracy</span>
                      <span className="text-xs font-medium text-slate-900">95%</span>
                    </div>
                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '95%' }}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Vital Signs Reference */}
            <div className="bg-white rounded-xl border shadow-sm p-3 flex-grow overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-100 rounded-lg">
                    <Heart className="w-3.5 h-3.5 text-red-600" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-sm">Vital Signs Reference</h2>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <h3 className="text-xs font-medium text-slate-700 mb-1.5">Blood Pressure</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Normal</span>
                      <span className="text-emerald-600">90-120/60-80 mmHg</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Elevated</span>
                      <span className="text-amber-600">120-129/&lt;80 mmHg</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Hypertension</span>
                      <span className="text-rose-600">&gt;130/&gt;80 mmHg</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <h3 className="text-xs font-medium text-slate-700 mb-1.5">Heart Rate</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Adult</span>
                      <span className="text-emerald-600">60-100 bpm</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Child</span>
                      <span className="text-emerald-600">70-120 bpm</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Infant</span>
                      <span className="text-emerald-600">100-160 bpm</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <h3 className="text-xs font-medium text-slate-700 mb-1.5">Temperature</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Normal</span>
                      <span className="text-emerald-600">36.5-37.5°C</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Fever</span>
                      <span className="text-amber-600">37.6-38.3°C</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">High Fever</span>
                      <span className="text-rose-600">&gt;38.3°C</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <h3 className="text-xs font-medium text-slate-700 mb-1.5">Oxygen Saturation</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Normal</span>
                      <span className="text-emerald-600">95-100%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Mild Hypoxemia</span>
                      <span className="text-amber-600">91-94%</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Severe Hypoxemia</span>
                      <span className="text-rose-600">&lt;91%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Triage Form Modal */}
      {showTriageForm && selectedPatient && (
        <TriageForm
          patientId={selectedPatient}
          onClose={() => {
            setShowTriageForm(false);
            setSelectedPatient(null);
          }}
          onComplete={handleTriageComplete}
        />
      )}
    </div>
  );
};
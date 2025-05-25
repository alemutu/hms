import * as React from 'react';
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
  ChevronDown,
  ChevronUp,
  Play
} from 'lucide-react';
import { format } from 'date-fns';
import { ConsultationForm } from './ConsultationForm';
import type { Patient } from '../types';
import { departments, departmentNames } from '../types/departments';
import { PatientWorkflowManager } from './PatientWorkflowManager';

export const ConsultationDashboard = () => {
  const { 
    patientQueue, 
    currentDepartment,
    setCurrentSection,
    updatePatientStatus,
    movePatientToNextDepartment,
    getDepartmentQueue,
    addNotification
  } = usePatientStore();

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFilter, setSelectedFilter] = React.useState('all');
  const [showConsultationForm, setShowConsultationForm] = React.useState(false);
  const [selectedPatient, setSelectedPatient] = React.useState<string | null>(null);
  const [isStartingConsultation, setIsStartingConsultation] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'waiting' | 'in-progress' | 'paused'>('waiting');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(5);
  const [expandedPatients, setExpandedPatients] = React.useState<Record<string, boolean>>({});

  // Get department patients
  const departmentPatients = getDepartmentQueue(currentDepartment || departments.GENERAL);

  // Get patients with paused consultations (started but not completed)
  const pausedConsultations = patientQueue.filter(patient => 
    patient.inConsultationTime && 
    !patient.consultationCompleteTime && 
    patient.status !== 'in-consultation' &&
    (patient.currentDepartment === currentDepartment || 
     patient.returnToDepartment === currentDepartment)
  );

  // Filter patients based on active tab
  const filteredPatients = React.useMemo(() => {
    let patients = departmentPatients;
    
    if (activeTab === 'waiting') {
      patients = patients.filter(p => p.status === 'triage-complete' || p.status === 'registered');
    } else if (activeTab === 'in-progress') {
      patients = patients.filter(p => p.status === 'in-consultation');
    } else if (activeTab === 'paused') {
      patients = pausedConsultations;
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
  }, [departmentPatients, pausedConsultations, activeTab, searchQuery, selectedFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);

  const stats = {
    waiting: departmentPatients.filter(p => p.status === 'triage-complete' || p.status === 'registered').length,
    inProgress: departmentPatients.filter(p => p.status === 'in-consultation').length,
    paused: pausedConsultations.length,
    completed: patientQueue.filter(p => 
      p.status === 'consultation-complete' || 
      p.status === 'discharged'
    ).length,
    urgent: departmentPatients.filter(p => p.priority === 'urgent').length
  };

  const handleStartConsultation = async (patientId: string) => {
    try {
      // Clear any previous error messages
      setErrorMessage(null);
      setIsStartingConsultation(true);

      const patient = patientQueue.find(p => p.id === patientId);
      if (!patient) {
        setErrorMessage('Patient not found');
        return;
      }

      // Allow starting consultation for patients with 'triage-complete' status
      // or patients with lab results received
      if (patient.status !== 'triage-complete' && 
          patient.status !== 'registered' && 
          patient.status !== 'lab-results-received' && 
          patient.status !== 'under-treatment') {
        setErrorMessage('Cannot start consultation for this patient at this time.');
        return;
      }

      await updatePatientStatus(patientId, 'in-consultation');
      setSelectedPatient(patientId);
      setShowConsultationForm(true);
      
      // Switch to in-progress tab to show the patient there
      setActiveTab('in-progress');
    } catch (error) {
      console.error('Error starting consultation:', error);
      setErrorMessage('An error occurred while starting consultation. Please try again.');
    } finally {
      setIsStartingConsultation(false);
    }
  };

  const handleContinueConsultation = async (patientId: string) => {
    try {
      // Clear any previous error messages
      setErrorMessage(null);
      setIsStartingConsultation(true);

      const patient = patientQueue.find(p => p.id === patientId);
      if (!patient) {
        setErrorMessage('Patient not found');
        return;
      }

      // Update status to in-consultation if it's not already
      if (patient.status !== 'in-consultation') {
        await updatePatientStatus(patientId, 'in-consultation');
      }
      
      setSelectedPatient(patientId);
      setShowConsultationForm(true);
      
      // Switch to in-progress tab to show the patient there
      setActiveTab('in-progress');
    } catch (error) {
      console.error('Error continuing consultation:', error);
      setErrorMessage('An error occurred while continuing consultation. Please try again.');
    } finally {
      setIsStartingConsultation(false);
    }
  };

  const handleConsultationComplete = async (patientId: string, nextDepartment: string) => {
    try {
      setErrorMessage(null);
      
      // Get the patient
      const patient = patientQueue.find(p => p.id === patientId);
      if (!patient) {
        setErrorMessage('Patient not found');
        return;
      }

      // Only allow completing consultation for patients with 'in-consultation' status
      if (patient.status !== 'in-consultation') {
        setErrorMessage('Cannot complete consultation. Patient must be in consultation status.');
        return;
      }

      // First update status to consultation-complete
      await updatePatientStatus(patientId, 'consultation-complete');
      
      // Then move to next department
      await movePatientToNextDepartment(patientId, nextDepartment);
      
      // Create notification for the destination department
      const notification = {
        id: crypto.randomUUID(),
        type: 'info',
        title: 'New Patient from Consultation',
        message: `${patient.fullName} has completed consultation and is now in your department`,
        timestamp: new Date().toISOString(),
        read: false,
        patientId: patientId,
        priority: patient.priority === 'urgent' || patient.priority === 'critical' ? 'high' : 'normal',
        action: 'view-patient',
        departmentTarget: nextDepartment
      };
      
      // Add notification
      addNotification(notification);
      
      // Show success message
      setSuccessMessage(`Consultation completed. Patient sent to ${departmentNames[nextDepartment]}`);
      setTimeout(() => setSuccessMessage(null), 3000);
      
      setShowConsultationForm(false);
      setSelectedPatient(null);
      
      // Switch back to waiting tab after completion
      setActiveTab('waiting');
    } catch (error) {
      console.error('Error completing consultation:', error);
      setErrorMessage('An error occurred while completing consultation. Please try again.');
    }
  };

  const handlePatientSelect = (patientId: string) => {
    const patient = patientQueue.find(p => p.id === patientId);
    if (!patient) {
      setErrorMessage('Patient not found');
      return;
    }
    
    // If patient is in consultation, continue consultation
    if (patient.status === 'in-consultation') {
      setSelectedPatient(patientId);
      setShowConsultationForm(true);
    } 
    // If patient has started consultation but not completed, continue consultation
    else if (patient.inConsultationTime && !patient.consultationCompleteTime) {
      handleContinueConsultation(patientId);
    } 
    // Otherwise start new consultation
    else {
      handleStartConsultation(patientId);
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
                onClick={() => setCurrentSection('reception')}
                className="p-1.5 hover:bg-white/80 rounded-lg text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">
                  {currentDepartment ? departmentNames[currentDepartment] : 'Consultation'}
                </h1>
                <p className="text-xs text-gray-500">Patient Consultation & Treatment</p>
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
          {/* Left Section (Patient Queue) - Wider */}
          <div className="flex-1 w-2/3">
            <PatientWorkflowManager 
              departmentId={currentDepartment || departments.GENERAL}
              onPatientSelect={handlePatientSelect}
              onContinueWorkflow={(patientId) => handleContinueConsultation(patientId)}
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
                    <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-sm">Consultation Overview</h2>
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
                    label: 'Lab Tests',
                    icon: TestTube,
                    color: 'amber',
                    action: () => setCurrentSection('laboratory')
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

            {/* Clinical Guidelines */}
            <div className="bg-white rounded-xl border shadow-sm p-3 flex-grow overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <ClipboardList className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-sm">Clinical Guidelines</h2>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <h3 className="text-xs font-medium text-slate-700 mb-1.5">Common Conditions</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Hypertension</span>
                      <span className="text-blue-600">View Protocol</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Diabetes Mellitus</span>
                      <span className="text-blue-600">View Protocol</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Asthma</span>
                      <span className="text-blue-600">View Protocol</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <h3 className="text-xs font-medium text-slate-700 mb-1.5">Prescription Guidelines</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Antibiotics</span>
                      <span className="text-blue-600">View Guidelines</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Pain Management</span>
                      <span className="text-blue-600">View Guidelines</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Chronic Conditions</span>
                      <span className="text-blue-600">View Guidelines</span>
                    </div>
                  </div>
                </div>
                
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  <h3 className="text-xs font-medium text-slate-700 mb-1.5">Referral Criteria</h3>
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Specialist Referral</span>
                      <span className="text-blue-600">View Criteria</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Emergency Referral</span>
                      <span className="text-blue-600">View Criteria</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">Inpatient Admission</span>
                      <span className="text-blue-600">View Criteria</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
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
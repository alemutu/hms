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
  ChevronDown,
  ChevronUp,
  UserMinus,
  UserPlus,
  Play
} from 'lucide-react';
import { format } from 'date-fns';
import { ConsultationForm } from './ConsultationForm';
import type { Patient } from '../types';
import { departments, departmentNames } from '../types/departments';
import { useAuth } from '../hooks/useAuth';
import { PatientWorkflowManager } from './PatientWorkflowManager';

export const DoctorDashboard = () => {
  const { 
    patientQueue, 
    currentDepartment,
    setCurrentSection,
    updatePatientStatus,
    movePatientToNextDepartment,
    getDepartmentQueue,
    assignPatientToDoctor,
    unassignPatientFromDoctor,
    getAssignedPatients
  } = usePatientStore();
  
  const { user } = useAuth();
  const doctorId = user?.id || 'current-doctor';

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFilter, setSelectedFilter] = React.useState('all');
  const [showConsultationForm, setShowConsultationForm] = React.useState(false);
  const [selectedPatient, setSelectedPatient] = React.useState<string | null>(null);
  const [isStartingConsultation, setIsStartingConsultation] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'assigned' | 'department' | 'waiting'>('assigned');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(5);
  const [expandedPatients, setExpandedPatients] = React.useState<Record<string, boolean>>({});
  const [showAssignModal, setShowAssignModal] = React.useState(false);
  const [patientToAssign, setPatientToAssign] = React.useState<string | null>(null);

  // Get department patients
  const departmentPatients = getDepartmentQueue(currentDepartment || departments.GENERAL);
  
  // Get patients assigned to the current doctor
  const assignedPatients = useMemo(() => {
    return getAssignedPatients(doctorId);
  }, [getAssignedPatients, doctorId, patientQueue]);
  
  // Get patients waiting for assignment
  const waitingPatients = useMemo(() => {
    return departmentPatients.filter(p => !p.assignedDoctorId);
  }, [departmentPatients]);

  // Get patients with paused consultations (started but not completed)
  const pausedConsultations = patientQueue.filter(patient => 
    patient.inConsultationTime && 
    !patient.consultationCompleteTime && 
    patient.status !== 'in-consultation' &&
    (patient.currentDepartment === currentDepartment || 
     patient.returnToDepartment === currentDepartment)
  );

  // Filter patients based on active tab
  const filteredPatients = useMemo(() => {
    let patients: Patient[] = [];
    
    switch (activeTab) {
      case 'assigned':
        patients = assignedPatients;
        break;
      case 'department':
        patients = departmentPatients;
        break;
      case 'waiting':
        patients = waitingPatients;
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
  }, [activeTab, assignedPatients, departmentPatients, waitingPatients, searchQuery, selectedFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);

  const stats = {
    assigned: assignedPatients.length,
    department: departmentPatients.length,
    waiting: waitingPatients.length,
    paused: pausedConsultations.length,
    urgent: [...assignedPatients, ...waitingPatients].filter(p => p.priority === 'urgent').length
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
      
      // Switch to assigned tab to show the patient there
      setActiveTab('assigned');
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
      
      // Switch to assigned tab to show the patient there
      setActiveTab('assigned');
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
      
      setShowConsultationForm(false);
      setSelectedPatient(null);
      
      // Switch back to assigned tab after completion
      setActiveTab('assigned');
    } catch (error) {
      console.error('Error completing consultation:', error);
      setErrorMessage('An error occurred while completing consultation. Please try again.');
    }
  };

  const handleAssignPatient = async (patientId: string) => {
    try {
      setErrorMessage(null);
      await assignPatientToDoctor(patientId, doctorId);
      setShowAssignModal(false);
      setPatientToAssign(null);
      setActiveTab('assigned');
    } catch (error) {
      console.error('Error assigning patient:', error);
      setErrorMessage('Failed to assign patient. Please try again.');
    }
  };
  
  const handleUnassignPatient = async (patientId: string) => {
    try {
      setErrorMessage(null);
      
      // Check if patient has completed consultation
      const patient = patientQueue.find(p => p.id === patientId);
      if (patient && patient.consultationCompleteTime) {
        setErrorMessage('Cannot release patient after consultation is completed.');
        return;
      }
      
      // Check if patient has moved to next department
      if (patient && patient.currentDepartment !== currentDepartment) {
        setErrorMessage('Cannot release patient who has moved to another department.');
        return;
      }
      
      await unassignPatientFromDoctor(patientId);
    } catch (error) {
      console.error('Error unassigning patient:', error);
      setErrorMessage('Failed to unassign patient. Please try again.');
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
            <h1 className="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
            <p className="text-gray-500 mt-1">Manage your assigned patients and consultations</p>
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
      <div className="grid grid-cols-5 gap-6">
        {[
          { 
            label: 'My Patients', 
            value: stats.assigned,
            icon: Users,
            color: 'blue'
          },
          { 
            label: 'Department Patients', 
            value: stats.department,
            icon: Building2,
            color: 'indigo'
          },
          { 
            label: 'Waiting Assignment', 
            value: stats.waiting,
            icon: Clock,
            color: 'amber'
          },
          { 
            label: 'Paused Consultations', 
            value: stats.paused,
            icon: Hourglass,
            color: 'purple'
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

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center gap-4">
          {[
            { id: 'assigned', label: 'My Patients', icon: Users, count: stats.assigned },
            { id: 'department', label: 'Department', icon: Building2, count: stats.department },
            { id: 'waiting', label: 'Waiting Assignment', icon: Clock, count: stats.waiting }
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

      {/* Patient Workflow Manager */}
      <PatientWorkflowManager 
        departmentId={currentDepartment || departments.GENERAL}
        onPatientSelect={handlePatientSelect}
        onContinueWorkflow={(patientId) => handleContinueConsultation(patientId)}
        onAssignPatient={(patientId) => handleAssignPatient(patientId)}
        onReleasePatient={(patientId) => handleUnassignPatient(patientId)}
      />

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
      
      {/* Assign Patient Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {patientToAssign ? 'Confirm Assignment' : 'Assign Patient'}
            </h3>
            
            {patientToAssign ? (
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Are you sure you want to assign this patient to yourself?
                </p>
                <div className="bg-blue-50 p-4 rounded-lg">
                  {(() => {
                    const patient = patientQueue.find(p => p.id === patientToAssign);
                    return patient ? (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-700 font-medium">{patient.fullName.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-medium">{patient.fullName}</p>
                          <p className="text-sm text-gray-500">{patient.age} years, {patient.gender}</p>
                        </div>
                      </div>
                    ) : (
                      <p>Patient not found</p>
                    );
                  })()}
                </div>
              </div>
            ) : (
              <div className="mb-6">
                <p className="text-gray-600 mb-4">
                  Select a patient from the waiting list to assign to yourself:
                </p>
                <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
                  {waitingPatients.length > 0 ? (
                    waitingPatients.map(patient => (
                      <div 
                        key={patient.id}
                        className="p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => setPatientToAssign(patient.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-700 font-medium">{patient.fullName.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-medium">{patient.fullName}</p>
                            <div className="flex items-center gap-2">
                              <p className="text-xs text-gray-500">{patient.age} years, {patient.gender}</p>
                              <span className={`px-2 py-0.5 rounded-full text-xs ${
                                patient.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                              }`}>
                                {patient.priority}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-gray-500">
                      No patients waiting for assignment
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAssignModal(false);
                  setPatientToAssign(null);
                }}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              
              {patientToAssign && (
                <button
                  onClick={() => handleAssignPatient(patientToAssign)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Confirm Assignment
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
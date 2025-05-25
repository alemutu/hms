import React, { useState, useEffect } from 'react';
import { usePatientStore } from '../lib/store';
import { useAuth } from '../hooks/useAuth';
import {
  Users,
  Clock,
  Search,
  ArrowRight,
  UserPlus,
  UserMinus,
  ChevronRight,
  ChevronLeft,
  FileText,
  Activity,
  Stethoscope,
  TestTube,
  Radio,
  Pill,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  MoreVertical,
  Play,
  Pause,
  SkipForward,
  Calendar,
  Tag,
  User,
  ClipboardList,
  BadgeCheck,
  Info,
  AlertCircle as CircleAlert,
  ChevronDown,
  ChevronUp,
  Hourglass,
  Building2
} from 'lucide-react';
import { format, differenceInMinutes } from 'date-fns';
import { departments, departmentNames } from '../types/departments';
import type { Patient } from '../types';

interface PatientWorkflowManagerProps {
  departmentId?: string;
  onPatientSelect?: (patientId: string) => void;
  onContinueWorkflow?: (patientId: string, status: string) => void;
  onAssignPatient?: (patientId: string) => void;
  onReleasePatient?: (patientId: string) => void;
  className?: string;
}

const PatientWorkflowManager: React.FC<PatientWorkflowManagerProps> = ({
  departmentId,
  onPatientSelect,
  onContinueWorkflow,
  onAssignPatient,
  onReleasePatient,
  className = ''
}) => {
  const { 
    patientQueue, 
    getDepartmentQueue, 
    assignPatientToDoctor, 
    unassignPatientFromDoctor,
    getAssignedPatients,
    updatePatientStatus,
    addNotification,
    currentDepartment: storeDepartment
  } = usePatientStore();
  
  const { user } = useAuth();
  const doctorId = user?.id || 'current-doctor';

  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedFilter, setSelectedFilter] = React.useState('all');
  const [activeTab, setActiveTab] = React.useState<'care' | 'assigned' | 'in-progress' | 'paused'>('care');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [itemsPerPage] = React.useState(5); // Fixed page size of 5
  const [expandedPatients, setExpandedPatients] = React.useState<Record<string, boolean>>({});
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [showActionMenu, setShowActionMenu] = React.useState<string | null>(null);
  const [viewMode, setViewMode] = React.useState<'compact' | 'detailed'>('compact');
  const [patientWaitTimes, setPatientWaitTimes] = useState<Record<string, number>>({});

  // Use the provided departmentId or fall back to the store's current department
  const effectiveDepartmentId = departmentId || storeDepartment || departments.GENERAL;

  // Get department patients
  const departmentPatients = React.useMemo(() => {
    // For triage, we need to include patients with status 'registered' or 'activated'
    // regardless of their current department
    if (effectiveDepartmentId === departments.TRIAGE) {
      return patientQueue.filter(p => 
        p.status === 'registered' || 
        p.status === 'activated' || 
        p.currentDepartment === departments.TRIAGE
      );
    }
    
    // For other departments, use the standard department queue
    return getDepartmentQueue(effectiveDepartmentId);
  }, [patientQueue, getDepartmentQueue, effectiveDepartmentId]);
  
  // Get patients assigned to the current doctor
  const assignedPatients = React.useMemo(() => {
    // Filter by both doctor ID and department
    return getAssignedPatients(doctorId).filter(p => 
      p.currentDepartment === effectiveDepartmentId
    );
  }, [getAssignedPatients, doctorId, patientQueue, effectiveDepartmentId]);
  
  // Get patients in progress (based on department-specific statuses)
  const inProgressPatients = React.useMemo(() => {
    return departmentPatients.filter(p => {
      // Department-specific in-progress statuses
      if (effectiveDepartmentId === departments.TRIAGE) {
        return p.status === 'in-triage';
      } else if (effectiveDepartmentId === departments.GENERAL || effectiveDepartmentId?.includes('consultation')) {
        return p.status === 'in-consultation';
      } else if (effectiveDepartmentId === departments.LABORATORY) {
        return p.status === 'in-lab';
      } else if (effectiveDepartmentId === departments.RADIOLOGY) {
        return p.status === 'in-radiology';
      } else if (effectiveDepartmentId === departments.PHARMACY) {
        return p.status === 'in-pharmacy';
      }
      
      // Generic in-progress statuses
      return p.status.includes('in-') || p.status.includes('progress');
    });
  }, [departmentPatients, effectiveDepartmentId]);
  
  // Get paused patients (patients who started a workflow but didn't complete it)
  const pausedPatients = React.useMemo(() => {
    return departmentPatients.filter(p => {
      // Patients who have been in a workflow but aren't currently active
      if (effectiveDepartmentId === departments.TRIAGE) {
        // Started triage but didn't complete
        return p.inTriageTime && !p.triageCompleteTime && p.status !== 'in-triage';
      } else if (effectiveDepartmentId === departments.GENERAL || effectiveDepartmentId?.includes('consultation')) {
        // Started consultation but didn't complete
        return p.inConsultationTime && !p.consultationCompleteTime && p.status !== 'in-consultation';
      } else if (effectiveDepartmentId === departments.LABORATORY) {
        // Started lab but didn't complete
        return p.inLabTime && !p.labCompleteTime && p.status !== 'in-lab';
      } else if (effectiveDepartmentId === departments.RADIOLOGY) {
        // Started radiology but didn't complete
        return p.inRadiologyTime && !p.radiologyCompleteTime && p.status !== 'in-radiology';
      } else if (effectiveDepartmentId === departments.PHARMACY) {
        // Started pharmacy but didn't complete
        return p.inPharmacyTime && !p.pharmacyCompleteTime && p.status !== 'in-pharmacy';
      }
      
      return false;
    });
  }, [departmentPatients, effectiveDepartmentId]);

  // Calculate wait times for patients
  useEffect(() => {
    const interval = setInterval(() => {
      const waitTimes: Record<string, number> = {};
      
      departmentPatients.forEach(patient => {
        // Calculate wait time based on registration time or department entry time
        let startTime: Date | null = null;
        
        if (effectiveDepartmentId === departments.TRIAGE) {
          // For triage, use registration time
          startTime = patient.registrationTime ? new Date(patient.registrationTime) : null;
        } else if (effectiveDepartmentId === departments.GENERAL || effectiveDepartmentId?.includes('consultation')) {
          // For consultation, use triage complete time
          startTime = patient.triageCompleteTime ? new Date(patient.triageCompleteTime) : null;
        } else if (effectiveDepartmentId === departments.LABORATORY) {
          // For lab, use sent to lab time
          startTime = patient.sentToLabTime ? new Date(patient.sentToLabTime) : null;
        } else if (effectiveDepartmentId === departments.RADIOLOGY) {
          // For radiology, use sent to radiology time
          startTime = patient.sentToRadiologyTime ? new Date(patient.sentToRadiologyTime) : null;
        } else if (effectiveDepartmentId === departments.PHARMACY) {
          // For pharmacy, use in pharmacy time
          startTime = patient.inPharmacyTime ? new Date(patient.inPharmacyTime) : null;
        }
        
        // If no specific time is found, fall back to registration time
        if (!startTime && patient.registrationTime) {
          startTime = new Date(patient.registrationTime);
        }
        
        // Calculate wait time in minutes
        if (startTime) {
          const waitTimeMinutes = differenceInMinutes(new Date(), startTime);
          waitTimes[patient.id] = waitTimeMinutes;
        }
      });
      
      setPatientWaitTimes(waitTimes);
    }, 60000); // Update every minute
    
    // Initial calculation
    const initialWaitTimes: Record<string, number> = {};
    departmentPatients.forEach(patient => {
      let startTime: Date | null = null;
      
      if (effectiveDepartmentId === departments.TRIAGE) {
        startTime = patient.registrationTime ? new Date(patient.registrationTime) : null;
      } else if (effectiveDepartmentId === departments.GENERAL || effectiveDepartmentId?.includes('consultation')) {
        startTime = patient.triageCompleteTime ? new Date(patient.triageCompleteTime) : null;
      } else if (effectiveDepartmentId === departments.LABORATORY) {
        startTime = patient.sentToLabTime ? new Date(patient.sentToLabTime) : null;
      } else if (effectiveDepartmentId === departments.RADIOLOGY) {
        startTime = patient.sentToRadiologyTime ? new Date(patient.sentToRadiologyTime) : null;
      } else if (effectiveDepartmentId === departments.PHARMACY) {
        startTime = patient.inPharmacyTime ? new Date(patient.inPharmacyTime) : null;
      }
      
      if (!startTime && patient.registrationTime) {
        startTime = new Date(patient.registrationTime);
      }
      
      if (startTime) {
        const waitTimeMinutes = differenceInMinutes(new Date(), startTime);
        initialWaitTimes[patient.id] = waitTimeMinutes;
      }
    });
    
    setPatientWaitTimes(initialWaitTimes);
    
    return () => clearInterval(interval);
  }, [departmentPatients, effectiveDepartmentId]);

  // Filter patients based on active tab, search query, and filter
  const filteredPatients = React.useMemo(() => {
    let patients: Patient[] = [];
    
    switch (activeTab) {
      case 'assigned':
        patients = assignedPatients;
        break;
      case 'in-progress':
        patients = inProgressPatients;
        break;
      case 'paused':
        patients = pausedPatients;
        break;
      case 'care':
      default:
        // Care queue should only show unassigned patients
        patients = departmentPatients.filter(p => !p.assignedDoctorId);
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
    
    // Filter out discharged/completed patients
    patients = patients.filter(p => p.status !== 'discharged' && !p.isCompleted);
    
    return patients;
  }, [activeTab, departmentPatients, assignedPatients, inProgressPatients, pausedPatients, searchQuery, selectedFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPatients.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPatients.slice(indexOfFirstItem, indexOfLastItem);

  // Stats
  const stats = {
    total: departmentPatients.length,
    assigned: assignedPatients.length,
    inProgress: inProgressPatients.length,
    paused: pausedPatients.length,
    care: departmentPatients.filter(p => !p.assignedDoctorId).length,
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
      
      // Create notification for assignment
      const patient = patientQueue.find(p => p.id === patientId);
      if (patient) {
        addNotification({
          id: crypto.randomUUID(),
          type: 'info',
          title: 'Patient Assigned',
          message: `${patient.fullName} has been assigned to you`,
          timestamp: new Date().toISOString(),
          read: false,
          patientId: patientId,
          priority: 'normal',
          action: 'view-patient'
        });
      }
      
      setSuccessMessage('Patient assigned successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      if (onAssignPatient) {
        onAssignPatient(patientId);
      }
    } catch (error) {
      console.error('Error assigning patient:', error);
      setErrorMessage('Failed to assign patient. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleReleasePatient = async (patientId: string) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      // Check if patient has completed workflow
      const patient = patientQueue.find(p => p.id === patientId);
      if (patient && hasCompletedWorkflow(patient)) {
        setErrorMessage(`Cannot release patient after ${effectiveDepartmentId} workflow is completed.`);
        return;
      }
      
      // Check if patient has moved to next department
      if (patient && hasMovedToNextDepartment(patient)) {
        setErrorMessage('Cannot release patient who has moved to another department.');
        return;
      }
      
      await unassignPatientFromDoctor(patientId);
      
      // Create notification for release
      if (patient) {
        addNotification({
          id: crypto.randomUUID(),
          type: 'info',
          title: 'Patient Released',
          message: `${patient.fullName} has been released back to the care queue`,
          timestamp: new Date().toISOString(),
          read: false,
          patientId: patientId,
          priority: 'normal',
          action: 'view-patient',
          departmentTarget: effectiveDepartmentId
        });
      }
      
      setSuccessMessage('Patient released successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      if (onReleasePatient) {
        onReleasePatient(patientId);
      }
    } catch (error) {
      console.error('Error releasing patient:', error);
      setErrorMessage('Failed to release patient. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const handleContinueWorkflow = async (patientId: string) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      const patient = patientQueue.find(p => p.id === patientId);
      if (!patient) {
        throw new Error('Patient not found');
      }
      
      // Determine the appropriate status based on department and current status
      let newStatus = '';
      
      if (effectiveDepartmentId === departments.TRIAGE) {
        newStatus = 'in-triage';
      } else if (effectiveDepartmentId === departments.GENERAL || effectiveDepartmentId?.includes('consultation')) {
        newStatus = 'in-consultation';
      } else if (effectiveDepartmentId === departments.LABORATORY) {
        newStatus = 'in-lab';
      } else if (effectiveDepartmentId === departments.RADIOLOGY) {
        newStatus = 'in-radiology';
      } else if (effectiveDepartmentId === departments.PHARMACY) {
        newStatus = 'in-pharmacy';
      }
      
      if (!newStatus) {
        throw new Error('Unable to determine workflow status for this department');
      }
      
      // Update patient status
      await updatePatientStatus(patientId, newStatus);
      
      // Create notification for workflow continuation
      addNotification({
        id: crypto.randomUUID(),
        type: 'info',
        title: 'Workflow Continued',
        message: `${patient.fullName}'s workflow has been resumed`,
        timestamp: new Date().toISOString(),
        read: false,
        patientId: patientId,
        priority: 'normal',
        action: 'view-patient',
        departmentTarget: effectiveDepartmentId
      });
      
      setSuccessMessage('Workflow continued successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
      
      if (onContinueWorkflow) {
        onContinueWorkflow(patientId, newStatus);
      }
    } catch (error) {
      console.error('Error continuing workflow:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to continue workflow. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const getStatusIcon = (status: string) => {
    if (status.includes('triage')) return Activity;
    if (status.includes('consultation')) return Stethoscope;
    if (status.includes('lab')) return TestTube;
    if (status.includes('radiology')) return Radio;
    if (status.includes('pharmacy')) return Pill;
    if (status.includes('payment')) return CreditCard;
    return Clock;
  };
  
  const canContinueWorkflow = (patient: Patient) => {
    // Check if the patient can continue in the current department workflow
    if (effectiveDepartmentId === departments.TRIAGE) {
      return patient.inTriageTime && !patient.triageCompleteTime && patient.status !== 'in-triage';
    } else if (effectiveDepartmentId === departments.GENERAL || effectiveDepartmentId?.includes('consultation')) {
      return patient.inConsultationTime && !patient.consultationCompleteTime && patient.status !== 'in-consultation';
    } else if (effectiveDepartmentId === departments.LABORATORY) {
      return patient.inLabTime && !patient.labCompleteTime && patient.status !== 'in-lab';
    } else if (effectiveDepartmentId === departments.RADIOLOGY) {
      return patient.inRadiologyTime && !patient.radiologyCompleteTime && patient.status !== 'in-radiology';
    } else if (effectiveDepartmentId === departments.PHARMACY) {
      return patient.inPharmacyTime && !patient.pharmacyCompleteTime && patient.status !== 'in-pharmacy';
    }
    
    return false;
  };
  
  const isInProgress = (patient: Patient) => {
    if (effectiveDepartmentId === departments.TRIAGE) {
      return patient.status === 'in-triage';
    } else if (effectiveDepartmentId === departments.GENERAL || effectiveDepartmentId?.includes('consultation')) {
      return patient.status === 'in-consultation';
    } else if (effectiveDepartmentId === departments.LABORATORY) {
      return patient.status === 'in-lab';
    } else if (effectiveDepartmentId === departments.RADIOLOGY) {
      return patient.status === 'in-radiology';
    } else if (effectiveDepartmentId === departments.PHARMACY) {
      return patient.status === 'in-pharmacy';
    }
    
    return false;
  };
  
  // Check if patient has completed the workflow in this department
  const hasCompletedWorkflow = (patient: Patient) => {
    if (effectiveDepartmentId === departments.TRIAGE) {
      return patient.triageCompleteTime !== undefined;
    } else if (effectiveDepartmentId === departments.GENERAL || effectiveDepartmentId?.includes('consultation')) {
      return patient.consultationCompleteTime !== undefined;
    } else if (effectiveDepartmentId === departments.LABORATORY) {
      return patient.labCompleteTime !== undefined;
    } else if (effectiveDepartmentId === departments.RADIOLOGY) {
      return patient.radiologyCompleteTime !== undefined;
    } else if (effectiveDepartmentId === departments.PHARMACY) {
      return patient.pharmacyCompleteTime !== undefined;
    }
    
    return false;
  };
  
  // Check if patient has moved to next department
  const hasMovedToNextDepartment = (patient: Patient) => {
    if (!effectiveDepartmentId) return false;
    
    // If patient's current department is different from this department
    // and this department is in the previous departments list
    return (
      patient.currentDepartment !== effectiveDepartmentId &&
      patient.previousDepartments?.includes(effectiveDepartmentId)
    );
  };

  // Get wait time color based on duration
  const getWaitTimeColor = (waitTime: number) => {
    if (waitTime >= 30) return 'text-red-600 font-bold';
    if (waitTime >= 20) return 'text-amber-600 font-bold';
    if (waitTime >= 10) return 'text-amber-500';
    return 'text-gray-500';
  };

  // Get wait time background color based on duration
  const getWaitTimeBackground = (waitTime: number) => {
    if (waitTime >= 30) return 'bg-red-50 border-red-200';
    if (waitTime >= 20) return 'bg-amber-50 border-amber-200';
    return '';
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
                {effectiveDepartmentId ? departmentNames[effectiveDepartmentId] : 'All Departments'} • {filteredPatients.length} patients
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode(viewMode === 'compact' ? 'detailed' : 'compact')}
              className="p-1.5 bg-gray-100 rounded-lg text-gray-600 hover:bg-gray-200"
              title={viewMode === 'compact' ? 'Show more details' : 'Show less details'}
            >
              {viewMode === 'compact' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex items-center gap-2 mt-3">
          {[
            { id: 'care', label: 'Care Queue', count: stats.care },
            { id: 'assigned', label: 'Assigned Patients', count: stats.assigned },
            { id: 'in-progress', label: 'In Progress', count: stats.inProgress },
            { id: 'paused', label: 'Paused', count: stats.paused }
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
        
        {/* Search */}
        <div className="mt-3">
          <div className="relative">
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
        </div>

        {/* Wait Time Legend */}
        <div className="mt-3 flex items-center gap-3 p-2 bg-gray-50 rounded-lg text-xs">
          <span className="font-medium">Wait Time:</span>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-gray-300"></div>
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            <span>≥ 20 min</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span>≥ 30 min</span>
          </div>
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
        {currentItems.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {currentItems.map(patient => {
              const isExpanded = expandedPatients[patient.id] || false;
              const isAssigned = patient.assignedDoctorId === doctorId;
              const isAssignedToOther = patient.assignedDoctorId && patient.assignedDoctorId !== doctorId;
              const canContinue = canContinueWorkflow(patient);
              const isActive = isInProgress(patient);
              const StatusIcon = getStatusIcon(patient.status);
              const hasCompleted = hasCompletedWorkflow(patient);
              const hasMovedOn = hasMovedToNextDepartment(patient);
              const waitTime = patientWaitTimes[patient.id] || 0;
              const waitTimeColor = getWaitTimeColor(waitTime);
              const waitTimeBackground = getWaitTimeBackground(waitTime);
              
              // Check if this is a referred patient (patient is in another department but has been referred here)
              const isReferredPatient = patient.currentDepartment !== effectiveDepartmentId;
              
              return (
                <div key={patient.id} className={`p-3 hover:bg-gray-50 border-b relative ${waitTimeBackground} ${
                  isReferredPatient ? 'border-l-4 border-l-blue-500' : ''
                }`}>
                  {/* Compact View */}
                  <div className="flex items-center justify-between">
                    {/* Left side - Patient info */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {/* Priority indicator */}
                      <div className={`w-1 h-10 rounded-full flex-shrink-0 ${
                        patient.priority === 'urgent' ? 'bg-red-500' : 
                        patient.priority === 'critical' ? 'bg-purple-500' : 
                        'bg-green-500'
                      }`}></div>
                      
                      {/* Patient avatar and basic info */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-blue-700 font-medium">{patient.fullName.charAt(0)}</span>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{patient.fullName}</p>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <span className="truncate">{patient.age}y, {patient.gender}</span>
                            <span>•</span>
                            <span className="truncate">ID: {patient.idNumber}</span>
                          </div>
                        </div>
                      </div>
                
                    </div>
                    
                    {/* Right side - Status and actions */}
                    <div className="flex items-center gap-2">
                      {/* Wait time indicator */}
                      <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs">
                        <Clock className={`w-3 h-3 ${waitTimeColor}`} />
                        <span className={waitTimeColor}>
                          {waitTime < 1 ? 'Just now' : `${waitTime}m wait`}
                        </span>
                      </div>
                      
                      {/* Status badge */}
                      <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs">
                        <StatusIcon className="w-3 h-3 text-gray-600" />
                        <span className="capitalize">{patient.status.replace(/-/g, ' ')}</span>
                      </div>
                      
                      {/* Referred badge */}
                      {isReferredPatient && (
                        <div className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs hidden sm:flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          <span>Referred</span>
                        </div>
                      )}
                      
                      {/* Assignment badges */}
                      {isAssigned && (
                        <div className="px-2 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs hidden sm:flex items-center gap-1">
                          <User className="w-3 h-3" />
                          <span>My patient</span>
                        </div>
                      )}
                      
                      {/* Action buttons */}
                      <div className="flex items-center">
                        {canContinue && (
                          <button
                            onClick={() => handleContinueWorkflow(patient.id)}
                            className="p-1.5 hover:bg-green-100 rounded-lg text-green-600"
                            title="Continue workflow"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                        )}
                        
                        {!isAssigned && !isAssignedToOther && !hasCompleted && !hasMovedOn && (
                          <button
                            onClick={() => handleAssignPatient(patient.id)}
                            className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600"
                            title="Assign to me"
                          >
                            <UserPlus className="w-4 h-4" />
                          </button>
                        )}
                        
                        {isAssigned && !hasCompleted && !hasMovedOn && (
                          <button
                            onClick={() => handleReleasePatient(patient.id)}
                            className="p-1.5 hover:bg-red-100 rounded-lg text-red-600"
                            title="Release patient"
                          >
                            <UserMinus className="w-4 h-4" />
                          </button>
                        )}
                        
                        <button
                          onClick={() => onPatientSelect && onPatientSelect(patient.id)}
                          className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600"
                          title="Select patient"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        
                        <button
                          onClick={() => togglePatientDetails(patient.id)}
                          className="p-1.5 hover:bg-gray-100 rounded-lg"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="mt-2 grid grid-cols-2 gap-3 bg-gray-50 rounded-lg p-3 text-xs">
                      <div>
                        <p className="text-gray-500">Status</p>
                        <p className="font-medium capitalize">{patient.status.replace(/-/g, ' ')}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Department</p>
                        <p className="font-medium">{departmentNames[patient.currentDepartment]}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Wait Time</p>
                        <p className={`font-medium ${waitTimeColor}`}>
                          {waitTime < 1 ? 'Just arrived' : `${waitTime} min`}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Registration</p>
                        <p className="font-medium">{format(new Date(patient.registrationDate), 'MMM d, h:mm a')}</p>
                      </div>
                      
                      {viewMode === 'detailed' && (
                        <>
                          <div>
                            <p className="text-gray-500">Phone</p>
                            <p className="font-medium">{patient.phoneNumber}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Email</p>
                            <p className="font-medium">{patient.email}</p>
                          </div>
                          <div className="col-span-2">
                            <p className="text-gray-500">Address</p>
                            <p className="font-medium">{patient.placeOfResidence}</p>
                          </div>
                        </>
                      )}
                      
                      {/* Action buttons in expanded view */}
                      <div className="col-span-2 flex justify-end gap-2 mt-2">
                        {canContinue && (
                          <button
                            onClick={() => handleContinueWorkflow(patient.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700"
                          >
                            <Play className="w-3 h-3" />
                            <span>Continue</span>
                          </button>
                        )}
                        
                        {!isAssigned && !isAssignedToOther && !hasCompleted && !hasMovedOn && (
                          <button
                            onClick={() => handleAssignPatient(patient.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
                          >
                            <UserPlus className="w-3 h-3" />
                            <span>Assign</span>
                          </button>
                        )}
                        
                        {isAssigned && !hasCompleted && !hasMovedOn && (
                          <button
                            onClick={() => handleReleasePatient(patient.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-xs hover:bg-gray-200"
                          >
                            <UserMinus className="w-3 h-3" />
                            <span>Release</span>
                          </button>
                        )}
                        
                        <button
                          onClick={() => onPatientSelect && onPatientSelect(patient.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs hover:bg-blue-700"
                        >
                          <ArrowRight className="w-3 h-3" />
                          <span>Select</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No patients found</h3>
            <p className="text-gray-500">
              {searchQuery 
                ? `No results for "${searchQuery}"`
                : activeTab === 'assigned'
                ? 'No patients assigned to you'
                : activeTab === 'in-progress'
                ? 'No patients currently in progress'
                : activeTab === 'paused'
                ? 'No paused workflows'
                : 'No patients in the queue'
              }
            </p>
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
              aria-label="Previous page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            
            {/* Page numbers */}
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
                  aria-label={`Page ${pageNum}`}
                  aria-current={currentPage === pageNum ? 'page' : undefined}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1 border rounded hover:bg-gray-50 disabled:opacity-50"
              aria-label="Next page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientWorkflowManager;

export { PatientWorkflowManager }
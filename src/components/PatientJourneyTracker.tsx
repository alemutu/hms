import React, { useState, useEffect } from 'react';
import { usePatientStore } from '../lib/store';
import { 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Building2, 
  Activity, 
  TestTube, 
  Radio, 
  Pill, 
  CreditCard,
  Hourglass,
  User
} from 'lucide-react';
import { format, formatDistance } from 'date-fns';
import { departmentNames } from '../types/departments';
import type { Patient } from '../types';

interface PatientJourneyTrackerProps {
  patientId: string;
  compact?: boolean;
  className?: string;
}

export const PatientJourneyTracker: React.FC<PatientJourneyTrackerProps> = ({
  patientId,
  compact = false,
  className = ''
}) => {
  const { patientQueue, labTests = {}, prescriptions = {} } = usePatientStore();
  const [showDetails, setShowDetails] = useState(!compact);
  
  // Get patient data
  const patient = patientQueue.find(p => p.id === patientId);
  if (!patient) return null;
  
  // Get patient's lab tests
  const patientLabTests = labTests[patientId] || [];
  
  // Get patient's prescriptions
  const patientPrescriptions = prescriptions[patientId] || [];
  
  // Calculate wait times for each stage
  const calculateWaitTime = (startTime?: string, endTime?: string) => {
    if (!startTime) return null;
    
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    
    // Calculate difference in minutes
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.round(diffMs / 60000);
    
    return diffMinutes;
  };
  
  // Define journey stages
  const journeyStages = [
    {
      id: 'registration',
      label: 'Registration',
      icon: User,
      color: 'blue',
      startTime: patient.registrationTime,
      endTime: patient.activationTime || patient.triageTime,
      isCompleted: !!patient.activationTime || !!patient.triageTime,
      isActive: patient.status === 'registered' || patient.status === 'activated'
    },
    {
      id: 'triage',
      label: 'Triage',
      icon: Activity,
      color: 'indigo',
      startTime: patient.inTriageTime,
      endTime: patient.triageCompleteTime,
      isCompleted: !!patient.triageCompleteTime,
      isActive: patient.status === 'in-triage'
    },
    {
      id: 'consultation',
      label: 'Consultation',
      icon: Building2,
      color: 'purple',
      startTime: patient.inConsultationTime,
      endTime: patient.consultationCompleteTime,
      isCompleted: !!patient.consultationCompleteTime,
      isActive: patient.status === 'in-consultation' || patient.status === 'under-consultation'
    },
    {
      id: 'lab',
      label: 'Laboratory',
      icon: TestTube,
      color: 'amber',
      startTime: patient.sentToLabTime || patient.inLabTime,
      endTime: patient.labCompleteTime,
      isCompleted: patient.labTestsCompleted || patientLabTests.some(t => t.department === 'laboratory' && t.status === 'completed'),
      isActive: patient.pendingLabTests && !patient.labTestsCompleted,
      isSkipped: !patient.pendingLabTests && !patientLabTests.some(t => t.department === 'laboratory')
    },
    {
      id: 'radiology',
      label: 'Radiology',
      icon: Radio,
      color: 'cyan',
      startTime: patient.sentToRadiologyTime || patient.inRadiologyTime,
      endTime: patient.radiologyCompleteTime,
      isCompleted: patient.radiologyTestsCompleted || patientLabTests.some(t => t.department === 'radiology' && t.status === 'completed'),
      isActive: patient.pendingRadiologyTests && !patient.radiologyTestsCompleted,
      isSkipped: !patient.pendingRadiologyTests && !patientLabTests.some(t => t.department === 'radiology')
    },
    {
      id: 'pharmacy',
      label: 'Pharmacy',
      icon: Pill,
      color: 'green',
      startTime: patient.inPharmacyTime,
      endTime: patient.medicationDispensedTime,
      isCompleted: patient.medicationsDispensed || patientPrescriptions.some(p => p.status === 'dispensed'),
      isActive: patient.pendingMedications && !patient.medicationsDispensed,
      isSkipped: !patient.pendingMedications && patientPrescriptions.length === 0
    },
    {
      id: 'billing',
      label: 'Billing',
      icon: CreditCard,
      color: 'rose',
      startTime: patient.awaitingPaymentTime,
      endTime: patient.paymentCompleteTime,
      isCompleted: patient.paymentCompleted,
      isActive: patient.pendingPayment && !patient.paymentCompleted,
      isSkipped: !patient.pendingPayment && !patient.awaitingPaymentTime
    },
    {
      id: 'discharge',
      label: 'Discharge',
      icon: CheckCircle2,
      color: 'emerald',
      startTime: patient.readyForDischargeTime,
      endTime: patient.dischargedTime,
      isCompleted: patient.status === 'discharged',
      isActive: patient.status === 'ready-for-discharge',
      isSkipped: false
    }
  ];
  
  // Filter out skipped stages
  const filteredStages = journeyStages.filter(stage => !stage.isSkipped);
  
  // Calculate total wait time
  const totalWaitTime = calculateWaitTime(patient.registrationTime, patient.dischargedTime) || 0;
  
  // Calculate current stage
  const currentStage = filteredStages.find(stage => stage.isActive);
  const currentStageIndex = currentStage ? filteredStages.indexOf(currentStage) : -1;
  
  // Calculate progress percentage
  const completedStages = filteredStages.filter(stage => stage.isCompleted).length;
  const progressPercentage = Math.round((completedStages / filteredStages.length) * 100);
  
  return (
    <div className={`bg-white rounded-lg border shadow-sm p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Hourglass className="w-4 h-4 text-blue-600" />
          <h3 className="font-medium text-gray-900">Patient Journey</h3>
        </div>
        {compact && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="text-xs text-blue-600 hover:text-blue-800"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </button>
        )}
      </div>
      
      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-gray-500">Progress</span>
          <span className="font-medium">{progressPercentage}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-500 rounded-full" 
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
      </div>
      
      {/* Current status */}
      <div className="flex items-center justify-between mb-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-gray-900">Current Location</p>
            <p className="text-xs text-gray-500">
              {currentStage 
                ? `${currentStage.label} (${departmentNames[patient.currentDepartment]})`
                : patient.status === 'discharged'
                ? 'Discharged'
                : departmentNames[patient.currentDepartment]}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">Total Time</p>
          <p className="text-xs text-gray-500">
            {totalWaitTime > 0 
              ? `${Math.floor(totalWaitTime / 60)}h ${totalWaitTime % 60}m`
              : 'Just started'}
          </p>
        </div>
      </div>
      
      {/* Journey timeline */}
      {showDetails && (
        <div className="space-y-3">
          {filteredStages.map((stage, index) => {
            const waitTime = calculateWaitTime(stage.startTime, stage.endTime);
            
            return (
              <div key={stage.id} className="relative">
                {/* Connector line */}
                {index < filteredStages.length - 1 && (
                  <div className={`absolute left-3.5 top-6 bottom-0 w-0.5 ${
                    stage.isCompleted ? 'bg-green-200' : 'bg-gray-200'
                  }`}></div>
                )}
                
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
                    stage.isCompleted 
                      ? 'bg-green-100 text-green-600' 
                      : stage.isActive
                      ? 'bg-blue-100 text-blue-600 animate-pulse'
                      : 'bg-gray-100 text-gray-400'
                  }`}>
                    {stage.isCompleted ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <stage.icon className="w-4 h-4" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className={`text-sm font-medium ${
                        stage.isActive ? 'text-blue-700' : 'text-gray-900'
                      }`}>
                        {stage.label}
                      </p>
                      <span className={`text-xs ${
                        stage.isCompleted 
                          ? 'text-green-600' 
                          : stage.isActive
                          ? 'text-blue-600'
                          : 'text-gray-500'
                      }`}>
                        {stage.isCompleted 
                          ? 'Completed' 
                          : stage.isActive
                          ? 'In Progress'
                          : 'Pending'}
                      </span>
                    </div>
                    
                    {stage.startTime && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {stage.isCompleted 
                          ? `Started: ${format(new Date(stage.startTime), 'h:mm a')} • Completed: ${format(new Date(stage.endTime!), 'h:mm a')}`
                          : stage.isActive
                          ? `Started: ${format(new Date(stage.startTime), 'h:mm a')} • Duration: ${waitTime} min`
                          : `Expected start: ${format(new Date(stage.startTime), 'h:mm a')}`}
                      </p>
                    )}
                    
                    {stage.isActive && waitTime && waitTime > 15 && (
                      <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        <span>Waiting longer than expected</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {/* Next steps */}
      {currentStageIndex >= 0 && currentStageIndex < filteredStages.length - 1 && (
        <div className="mt-4 pt-3 border-t">
          <p className="text-xs text-gray-500 mb-2">Next Steps:</p>
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gray-100 rounded-full">
              <ArrowRight className="w-3 h-3 text-gray-600" />
            </div>
            <span className="text-sm text-gray-700">
              {filteredStages[currentStageIndex + 1].label}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useState } from 'react';
import { FileText, CheckCircle2, AlertCircle, ChevronDown, ChevronUp, Clock, Calendar, TestTube, Pill, Activity } from 'lucide-react';
import type { Patient, Consultation, LabTest, VitalSigns, MedicalHistory } from '../../types';

interface PatientHistorySummaryProps {
  patient: Patient;
  consultations: Consultation[];
  labTests: LabTest[];
  vitals: VitalSigns[];
  medicalHistory: MedicalHistory | null;
  compact?: boolean;
}

export const PatientHistorySummary: React.FC<PatientHistorySummaryProps> = ({
  patient,
  consultations,
  labTests,
  vitals,
  medicalHistory,
  compact = false
}) => {
  const [showDetails, setShowDetails] = useState(!compact);

  // Generate a simple summary of patient history
  const generateSummary = () => {
    const summary: string[] = [];
    
    // Basic patient info
    summary.push(`${patient.fullName}, ${patient.age} years, ${patient.gender}`);
    
    // Medical history summary
    if (medicalHistory) {
      const conditions: string[] = [];
      if (medicalHistory.hasDiabetes) conditions.push('Diabetes');
      if (medicalHistory.hasHypertension) conditions.push('Hypertension');
      if (medicalHistory.hasHeartDisease) conditions.push('Heart Disease');
      if (medicalHistory.hasAsthma) conditions.push('Asthma');
      if (medicalHistory.hasCancer) conditions.push('Cancer');
      if (medicalHistory.hasSurgeries) conditions.push('Previous Surgeries');
      
      if (conditions.length > 0) {
        summary.push(`Medical History: ${conditions.join(', ')}`);
      }
      
      if (medicalHistory.hasAllergies && medicalHistory.allergies.length > 0) {
        summary.push(`Allergies: ${medicalHistory.allergies.join(', ')}`);
      }
      
      if (medicalHistory.medications.length > 0) {
        summary.push(`Current Medications: ${medicalHistory.medications.join(', ')}`);
      }
    }
    
    // Latest vitals
    if (vitals.length > 0) {
      const latestVitals = vitals[0];
      summary.push(`Latest Vitals: BP ${latestVitals.bloodPressure}, HR ${latestVitals.pulseRate} bpm, Temp ${latestVitals.temperature}°C, SpO2 ${latestVitals.oxygenSaturation}%, RR ${latestVitals.respiratoryRate}/min`);
    }
    
    // Recent consultations
    if (consultations.length > 0) {
      const recentConsultations = consultations.slice(0, 3);
      const consultationSummary = recentConsultations.map(c => {
        const date = new Date(c.startTime).toLocaleDateString();
        const diagnoses = c.diagnosis.length > 0 ? c.diagnosis.join(', ') : 'No diagnosis recorded';
        return `${date}: ${diagnoses}`;
      }).join('; ');
      
      summary.push(`Recent Consultations: ${consultationSummary}`);
    }
    
    // Recent lab tests
    if (labTests.length > 0) {
      const recentTests = labTests.slice(0, 3);
      const testSummary = recentTests.map(t => {
        const date = new Date(t.requestedAt).toLocaleDateString();
        return `${date}: ${t.testType} (${t.status})`;
      }).join('; ');
      
      summary.push(`Recent Tests: ${testSummary}`);
    }
    
    // Join all summary points with line breaks
    return summary.join('\n');
  };

  const summaryText = generateSummary();
  const summaryLines = summaryText.split('\n');

  return (
    <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-600" />
          <h3 className="font-medium text-indigo-700">Patient History Summary</h3>
        </div>
        
        {compact && (
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="p-1 hover:bg-indigo-100 rounded-full"
          >
            {showDetails ? (
              <ChevronUp className="w-4 h-4 text-indigo-600" />
            ) : (
              <ChevronDown className="w-4 h-4 text-indigo-600" />
            )}
          </button>
        )}
      </div>
      
      {showDetails && (
        <div className="mt-3 space-y-2">
          {summaryLines.map((line, index) => {
            // Skip empty lines
            if (!line.trim()) return null;
            
            // Determine icon based on line content
            let Icon = FileText;
            let iconColor = 'text-indigo-600';
            
            if (line.includes('Medical History:')) {
              Icon = Clock;
            } else if (line.includes('Allergies:')) {
              Icon = AlertCircle;
              iconColor = 'text-amber-600';
            } else if (line.includes('Current Medications:')) {
              Icon = Pill;
              iconColor = 'text-green-600';
            } else if (line.includes('Latest Vitals:')) {
              Icon = Activity;
              iconColor = 'text-purple-600';
            } else if (line.includes('Recent Consultations:')) {
              Icon = Calendar;
              iconColor = 'text-blue-600';
            } else if (line.includes('Recent Tests:')) {
              Icon = TestTube;
              iconColor = 'text-rose-600';
            }
            
            return (
              <div key={index} className="flex items-start gap-2">
                <Icon className={`w-4 h-4 mt-0.5 ${iconColor}`} />
                <p className="text-sm text-indigo-700">{line}</p>
              </div>
            );
          })}
        </div>
      )}
      
      {!showDetails && (
        <button
          onClick={() => setShowDetails(true)}
          className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
        >
          <span>Show patient history summary</span>
          <ChevronDown className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
import React from 'react';
import { Patient, Consultation, LabTest, VitalSigns, MedicalHistory } from '../../types';

interface PatientHistorySummaryProps {
  patient: Patient;
  consultations: Consultation[];
  labTests: LabTest[];
  vitals: VitalSigns[];
  medicalHistory: MedicalHistory | undefined;
  compact?: boolean;
}

export function PatientHistorySummary({
  patient,
  consultations,
  labTests,
  vitals,
  medicalHistory,
  compact = false
}: PatientHistorySummaryProps) {
  if (!medicalHistory) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-500 mb-2">Medical History</h3>
        <p className="text-sm text-gray-500">No medical history recorded</p>
      </div>
    );
  }

  const conditions = [
    { name: 'Diabetes', value: medicalHistory.hasDiabetes },
    { name: 'Hypertension', value: medicalHistory.hasHypertension },
    { name: 'Heart Disease', value: medicalHistory.hasHeartDisease },
    { name: 'Asthma', value: medicalHistory.hasAsthma },
    { name: 'Cancer', value: medicalHistory.hasCancer }
  ].filter(condition => condition.value);

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-500 mb-2">Medical History</h3>
      
      {/* Pre-existing conditions */}
      {conditions.length > 0 ? (
        <div className="space-y-2">
          <div className="text-sm">
            <span className="font-medium">Pre-existing Conditions:</span>
            <ul className="list-disc list-inside ml-2">
              {conditions.map(condition => (
                <li key={condition.name}>{condition.name}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <p className="text-sm text-gray-500">No pre-existing conditions</p>
      )}

      {/* Allergies */}
      {!compact && medicalHistory.hasAllergies && medicalHistory.allergies.length > 0 && (
        <div className="mt-4">
          <span className="text-sm font-medium">Allergies:</span>
          <ul className="list-disc list-inside ml-2 text-sm">
            {medicalHistory.allergies.map((allergy: string, index: number) => (
              <li key={index}>{allergy}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Medications */}
      {!compact && medicalHistory.medications && medicalHistory.medications.length > 0 && (
        <div className="mt-4">
          <span className="text-sm font-medium">Current Medications:</span>
          <ul className="list-disc list-inside ml-2 text-sm">
            {medicalHistory.medications.map((medication: string, index: number) => (
              <li key={index}>{medication}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Family History */}
      {!compact && medicalHistory.familyHistory && medicalHistory.familyHistory.length > 0 && (
        <div className="mt-4">
          <span className="text-sm font-medium">Family History:</span>
          <ul className="list-disc list-inside ml-2 text-sm">
            {medicalHistory.familyHistory.map((history: string, index: number) => (
              <li key={index}>{history}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Additional Notes */}
      {!compact && medicalHistory.notes && (
        <div className="mt-4">
          <span className="text-sm font-medium">Additional Notes:</span>
          <p className="text-sm ml-2">{medicalHistory.notes}</p>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Info, ArrowRight, Activity, AlertCircle } from 'lucide-react';
import type { VitalSigns } from '../../types';

interface TriageAssistantProps {
  vitals: VitalSigns | null;
  symptoms: string[];
  patientAge?: number;
  onPriorityChange?: (priority: 'normal' | 'urgent' | 'critical') => void;
}

export const TriageAssistant: React.FC<TriageAssistantProps> = ({
  vitals,
  symptoms,
  patientAge = 30,
  onPriorityChange
}) => {
  const [suggestion, setSuggestion] = useState<{
    priority: 'normal' | 'urgent' | 'critical';
    confidence: number;
    reasoning: string[];
  } | null>(null);
  
  // Get triage suggestion when vitals or symptoms change
  useEffect(() => {
    const getSuggestion = async () => {
      // Only get suggestion if we have either vitals or symptoms
      if ((!vitals && symptoms.length === 0) || !onPriorityChange) return;
      
      try {
        // Simple priority calculation based on vitals
        let priority: 'normal' | 'urgent' | 'critical' = 'normal';
        const reasoning: string[] = [];
        
        if (vitals) {
          // Parse blood pressure
          const bpParts = vitals.bloodPressure.split('/');
          const systolic = parseInt(bpParts[0], 10);
          const diastolic = parseInt(bpParts[1], 10);
          
          // Check for critical conditions
          if (
            systolic > 180 || systolic < 90 ||
            diastolic > 120 || diastolic < 60 ||
            vitals.temperature > 39.5 ||
            vitals.oxygenSaturation < 90 ||
            vitals.pulseRate > 120 || vitals.pulseRate < 50 ||
            vitals.respiratoryRate > 30 || vitals.respiratoryRate < 10
          ) {
            priority = 'critical';
            
            // Add reasons
            if (systolic > 180 || diastolic > 120) {
              reasoning.push(`Blood pressure (${vitals.bloodPressure}) indicates hypertensive crisis`);
            } else if (systolic < 90 || diastolic < 60) {
              reasoning.push(`Blood pressure (${vitals.bloodPressure}) indicates hypotension`);
            }
            
            if (vitals.temperature > 39.5) {
              reasoning.push(`High fever (${vitals.temperature}°C)`);
            }
            
            if (vitals.oxygenSaturation < 90) {
              reasoning.push(`Severe hypoxemia (SpO2 ${vitals.oxygenSaturation}%)`);
            }
            
            if (vitals.pulseRate > 120) {
              reasoning.push(`Tachycardia (${vitals.pulseRate} bpm)`);
            } else if (vitals.pulseRate < 50) {
              reasoning.push(`Bradycardia (${vitals.pulseRate} bpm)`);
            }
            
            if (vitals.respiratoryRate > 30) {
              reasoning.push(`Severe tachypnea (${vitals.respiratoryRate} breaths/min)`);
            } else if (vitals.respiratoryRate < 10) {
              reasoning.push(`Bradypnea (${vitals.respiratoryRate} breaths/min)`);
            }
          }
          // Check for urgent conditions
          else if (
            (systolic > 160 || systolic < 100) ||
            (diastolic > 100 || diastolic < 65) ||
            vitals.temperature > 38.5 ||
            vitals.oxygenSaturation < 94 ||
            vitals.pulseRate > 100 || vitals.pulseRate < 55 ||
            vitals.respiratoryRate > 24 || vitals.respiratoryRate < 12
          ) {
            priority = 'urgent';
            
            // Add reasons
            if (systolic > 160 || diastolic > 100) {
              reasoning.push(`Blood pressure (${vitals.bloodPressure}) indicates hypertension`);
            } else if (systolic < 100 || diastolic < 65) {
              reasoning.push(`Blood pressure (${vitals.bloodPressure}) indicates mild hypotension`);
            }
            
            if (vitals.temperature > 38.5) {
              reasoning.push(`Moderate fever (${vitals.temperature}°C)`);
            }
            
            if (vitals.oxygenSaturation < 94) {
              reasoning.push(`Moderate hypoxemia (SpO2 ${vitals.oxygenSaturation}%)`);
            }
            
            if (vitals.pulseRate > 100) {
              reasoning.push(`Mild tachycardia (${vitals.pulseRate} bpm)`);
            } else if (vitals.pulseRate < 55) {
              reasoning.push(`Mild bradycardia (${vitals.pulseRate} bpm)`);
            }
            
            if (vitals.respiratoryRate > 24) {
              reasoning.push(`Tachypnea (${vitals.respiratoryRate} breaths/min)`);
            } else if (vitals.respiratoryRate < 12) {
              reasoning.push(`Mild bradypnea (${vitals.respiratoryRate} breaths/min)`);
            }
          }
        }
        
        // Check symptoms for urgency
        const urgentSymptoms = [
          'chest pain', 'difficulty breathing', 'shortness of breath', 
          'severe bleeding', 'unconscious', 'unresponsive', 'seizure'
        ];
        
        const mediumSymptoms = [
          'moderate bleeding', 'high fever', 'vomiting', 'dehydration',
          'severe pain', 'fracture', 'head injury'
        ];
        
        // Check if any urgent symptoms are present
        if (symptoms.some(s => 
          urgentSymptoms.some(us => s.toLowerCase().includes(us))
        )) {
          priority = 'critical';
          reasoning.push('Critical symptoms detected');
        }
        // Check if any medium symptoms are present and priority isn't already critical
        else if (
          priority !== 'critical' && 
          symptoms.some(s => 
            mediumSymptoms.some(ms => s.toLowerCase().includes(ms))
          )
        ) {
          priority = 'urgent';
          reasoning.push('Urgent symptoms detected');
        } else if (symptoms.length > 0 && priority === 'normal') {
          reasoning.push('Non-urgent symptoms');
        }
        
        // Age-based adjustments
        if ((patientAge < 5 || patientAge > 65) && priority === 'normal') {
          priority = 'urgent';
          reasoning.push(`Age (${patientAge}) is a risk factor`);
        }
        
        // Set the suggestion
        const newSuggestion = {
          priority,
          confidence: priority === 'critical' ? 0.9 : priority === 'urgent' ? 0.8 : 0.7,
          reasoning
        };
        
        setSuggestion(newSuggestion);
        
        // Notify parent component of suggested priority
        onPriorityChange(priority);
      } catch (error) {
        console.error('Error getting triage suggestion:', error);
      }
    };
    
    getSuggestion();
  }, [vitals, symptoms, patientAge, onPriorityChange]);

  // If no vitals or symptoms, show placeholder
  if (!vitals && symptoms.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-5 h-5 text-gray-400" />
          <h3 className="font-medium text-gray-700">Triage Assistant</h3>
        </div>
        <p className="text-sm text-gray-500">
          Enter vital signs or symptoms to get triage priority suggestions.
        </p>
      </div>
    );
  }

  // Show loading state
  if (!suggestion) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center gap-2 mb-2">
          <div className="animate-spin">
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-medium text-blue-700">Analyzing Patient Data</h3>
        </div>
        <p className="text-sm text-blue-600">
          Evaluating vital signs and symptoms to suggest appropriate triage priority...
        </p>
      </div>
    );
  }

  // Show suggestion
  return (
    <div className={`p-4 ${
      suggestion.priority === 'critical' ? 'bg-red-50 border-red-100' :
      suggestion.priority === 'urgent' ? 'bg-amber-50 border-amber-100' :
      'bg-green-50 border-green-100'
    } rounded-lg border`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {suggestion.priority === 'critical' ? (
            <AlertTriangle className="w-5 h-5 text-red-600" />
          ) : suggestion.priority === 'urgent' ? (
            <AlertTriangle className="w-5 h-5 text-amber-600" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-green-600" />
          )}
          <h3 className={`font-medium ${
            suggestion.priority === 'critical' ? 'text-red-700' :
            suggestion.priority === 'urgent' ? 'text-amber-700' :
            'text-green-700'
          }`}>
            AI Suggestion: {suggestion.priority.toUpperCase()} Priority
          </h3>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500">Confidence:</span>
          <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className={`h-full ${
                suggestion.confidence > 0.7 ? 'bg-green-500' : 
                suggestion.confidence > 0.4 ? 'bg-amber-500' : 
                'bg-red-500'
              }`} 
              style={{ width: `${suggestion.confidence * 100}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-500">{Math.round(suggestion.confidence * 100)}%</span>
        </div>
      </div>
      
      {suggestion.reasoning.length > 0 && (
        <div className="mt-2">
          <p className="text-xs text-gray-600 mb-1">Reasoning:</p>
          <ul className="space-y-1">
            {suggestion.reasoning.map((reason, index) => (
              <li key={index} className={`text-sm ${
                suggestion.priority === 'critical' ? 'text-red-700' :
                suggestion.priority === 'urgent' ? 'text-amber-700' :
                'text-green-700'
              } flex items-start gap-1`}>
                <ArrowRight className="w-3 h-3 mt-1 flex-shrink-0" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
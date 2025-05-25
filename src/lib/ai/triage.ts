// Basic Triage AI
import { VitalSigns } from '../../types';

// Define normal ranges for vital signs
const vitalRanges = {
  // Blood pressure ranges (systolic/diastolic)
  bloodPressure: {
    normal: { min: [90, 60], max: [120, 80] },
    elevated: { min: [120, 60], max: [129, 80] },
    hypertensionStage1: { min: [130, 80], max: [139, 89] },
    hypertensionStage2: { min: [140, 90], max: [180, 120] },
    hypertensiveCrisis: { min: [180, 120], max: [300, 200] },
    hypotension: { min: [0, 0], max: [90, 60] }
  },
  
  // Temperature ranges (°C)
  temperature: {
    hypothermia: { min: 0, max: 35 },
    normal: { min: 36.1, max: 37.2 },
    lowGradeFever: { min: 37.3, max: 38.0 },
    moderateFever: { min: 38.1, max: 39.0 },
    highFever: { min: 39.1, max: 41.0 },
    hyperpyrexia: { min: 41.1, max: 45.0 }
  },
  
  // Pulse rate ranges (bpm)
  pulseRate: {
    bradycardia: { min: 0, max: 60 },
    normal: { min: 60, max: 100 },
    tachycardia: { min: 100, max: 250 }
  },
  
  // Oxygen saturation ranges (%)
  oxygenSaturation: {
    severe: { min: 0, max: 90 },
    moderate: { min: 91, max: 94 },
    mild: { min: 95, max: 96 },
    normal: { min: 97, max: 100 }
  },
  
  // Respiratory rate ranges (breaths per minute)
  respiratoryRate: {
    bradypnea: { min: 0, max: 12 },
    normal: { min: 12, max: 20 },
    tachypnea: { min: 20, max: 60 }
  }
};

// Symptom severity mapping
const symptomSeverity: Record<string, number> = {
  // High severity symptoms (score: 3)
  'chest pain': 3,
  'difficulty breathing': 3,
  'shortness of breath': 3,
  'severe bleeding': 3,
  'unconscious': 3,
  'unresponsive': 3,
  'seizure': 3,
  'stroke': 3,
  'heart attack': 3,
  
  // Medium severity symptoms (score: 2)
  'moderate bleeding': 2,
  'high fever': 2,
  'vomiting': 2,
  'dehydration': 2,
  'severe pain': 2,
  'fracture': 2,
  'head injury': 2,
  'allergic reaction': 2,
  
  // Low severity symptoms (score: 1)
  'mild pain': 1,
  'cough': 1,
  'cold': 1,
  'sore throat': 1,
  'headache': 1,
  'nausea': 1,
  'rash': 1,
  'minor injury': 1
};

// Parse blood pressure string into systolic and diastolic values
const parseBloodPressure = (bp: string): [number, number] => {
  const parts = bp.split('/');
  if (parts.length !== 2) {
    return [120, 80]; // Default values if parsing fails
  }
  
  const systolic = parseInt(parts[0], 10);
  const diastolic = parseInt(parts[1], 10);
  
  if (isNaN(systolic) || isNaN(diastolic)) {
    return [120, 80]; // Default values if parsing fails
  }
  
  return [systolic, diastolic];
};

// Calculate triage priority based on vitals
const calculateVitalsPriority = (vitals: VitalSigns): 'low' | 'medium' | 'high' => {
  let criticalCount = 0;
  let warningCount = 0;
  
  // Check blood pressure
  const [systolic, diastolic] = parseBloodPressure(vitals.bloodPressure);
  
  if (
    systolic >= vitalRanges.bloodPressure.hypertensiveCrisis.min[0] ||
    diastolic >= vitalRanges.bloodPressure.hypertensiveCrisis.min[1] ||
    systolic <= vitalRanges.bloodPressure.hypotension.max[0]
  ) {
    criticalCount++;
  } else if (
    systolic >= vitalRanges.bloodPressure.hypertensionStage2.min[0] ||
    diastolic >= vitalRanges.bloodPressure.hypertensionStage2.min[1]
  ) {
    warningCount++;
  }
  
  // Check temperature
  if (
    vitals.temperature <= vitalRanges.temperature.hypothermia.max ||
    vitals.temperature >= vitalRanges.temperature.hyperpyrexia.min
  ) {
    criticalCount++;
  } else if (
    vitals.temperature >= vitalRanges.temperature.highFever.min
  ) {
    warningCount++;
  }
  
  // Check pulse rate
  if (
    vitals.pulseRate <= vitalRanges.pulseRate.bradycardia.max / 2 ||
    vitals.pulseRate >= vitalRanges.pulseRate.tachycardia.min * 1.5
  ) {
    criticalCount++;
  } else if (
    vitals.pulseRate <= vitalRanges.pulseRate.bradycardia.max ||
    vitals.pulseRate >= vitalRanges.pulseRate.tachycardia.min
  ) {
    warningCount++;
  }
  
  // Check oxygen saturation
  if (vitals.oxygenSaturation <= vitalRanges.oxygenSaturation.severe.max) {
    criticalCount++;
  } else if (vitals.oxygenSaturation <= vitalRanges.oxygenSaturation.moderate.max) {
    warningCount++;
  }
  
  // Check respiratory rate
  if (
    vitals.respiratoryRate <= vitalRanges.respiratoryRate.bradypnea.max / 2 ||
    vitals.respiratoryRate >= vitalRanges.respiratoryRate.tachypnea.min * 1.5
  ) {
    criticalCount++;
  } else if (
    vitals.respiratoryRate <= vitalRanges.respiratoryRate.bradypnea.max ||
    vitals.respiratoryRate >= vitalRanges.respiratoryRate.tachypnea.min
  ) {
    warningCount++;
  }
  
  // Determine priority based on counts
  if (criticalCount > 0) {
    return 'high';
  } else if (warningCount > 0) {
    return 'medium';
  } else {
    return 'low';
  }
};

// Calculate symptom severity score
const calculateSymptomSeverity = (symptoms: string[]): number => {
  let severityScore = 0;
  
  symptoms.forEach(symptom => {
    const symptomLower = symptom.toLowerCase();
    
    // Check for exact matches
    if (symptomSeverity[symptomLower]) {
      severityScore += symptomSeverity[symptomLower];
      return;
    }
    
    // Check for partial matches
    for (const [key, value] of Object.entries(symptomSeverity)) {
      if (symptomLower.includes(key)) {
        severityScore += value;
        break;
      }
    }
  });
  
  return severityScore;
};

export const triageAI = {
  // Suggest triage priority based on vitals and symptoms
  suggestPriority: (
    vitals: VitalSigns | null, 
    symptoms: string[] = [], 
    age: number = 30
  ): { 
    priority: 'normal' | 'urgent' | 'critical';
    confidence: number;
    reasoning: string[];
  } => {
    const reasoning: string[] = [];
    
    // If vitals are missing, use symptoms only with medium confidence
    if (!vitals) {
      const symptomScore = calculateSymptomSeverity(symptoms);
      
      if (symptomScore >= 5) {
        reasoning.push('High severity symptoms detected');
        reasoning.push('No vital signs available for assessment');
        return { 
          priority: 'critical', 
          confidence: 0.7,
          reasoning
        };
      } else if (symptomScore >= 3) {
        reasoning.push('Moderate severity symptoms detected');
        reasoning.push('No vital signs available for assessment');
        return { 
          priority: 'urgent', 
          confidence: 0.6,
          reasoning
        };
      } else {
        reasoning.push('Low severity symptoms detected');
        reasoning.push('No vital signs available for assessment');
        return { 
          priority: 'normal', 
          confidence: 0.5,
          reasoning
        };
      }
    }
    
    // Calculate priority based on vitals
    const vitalsPriorityValue = calculateVitalsPriority(vitals);
    
    // Add reasoning based on vitals
    const [systolic, diastolic] = parseBloodPressure(vitals.bloodPressure);
    
    if (systolic >= 180 || diastolic >= 120) {
      reasoning.push(`Blood pressure (${vitals.bloodPressure}) indicates hypertensive crisis`);
    } else if (systolic >= 140 || diastolic >= 90) {
      reasoning.push(`Blood pressure (${vitals.bloodPressure}) indicates hypertension`);
    } else if (systolic <= 90 || diastolic <= 60) {
      reasoning.push(`Blood pressure (${vitals.bloodPressure}) indicates hypotension`);
    }
    
    if (vitals.temperature >= 39.1) {
      reasoning.push(`High fever (${vitals.temperature}°C)`);
    } else if (vitals.temperature >= 38.1) {
      reasoning.push(`Moderate fever (${vitals.temperature}°C)`);
    } else if (vitals.temperature <= 35) {
      reasoning.push(`Hypothermia (${vitals.temperature}°C)`);
    }
    
    if (vitals.oxygenSaturation <= 90) {
      reasoning.push(`Severe hypoxemia (SpO2 ${vitals.oxygenSaturation}%)`);
    } else if (vitals.oxygenSaturation <= 94) {
      reasoning.push(`Moderate hypoxemia (SpO2 ${vitals.oxygenSaturation}%)`);
    }
    
    if (vitals.pulseRate >= 120) {
      reasoning.push(`Tachycardia (${vitals.pulseRate} bpm)`);
    } else if (vitals.pulseRate <= 50) {
      reasoning.push(`Bradycardia (${vitals.pulseRate} bpm)`);
    }
    
    if (vitals.respiratoryRate >= 30) {
      reasoning.push(`Severe tachypnea (${vitals.respiratoryRate} breaths/min)`);
    } else if (vitals.respiratoryRate >= 20) {
      reasoning.push(`Tachypnea (${vitals.respiratoryRate} breaths/min)`);
    } else if (vitals.respiratoryRate <= 10) {
      reasoning.push(`Bradypnea (${vitals.respiratoryRate} breaths/min)`);
    }
    
    // Calculate symptom severity
    const symptomScore = calculateSymptomSeverity(symptoms);
    
    if (symptomScore >= 5) {
      reasoning.push('High severity symptoms detected');
    } else if (symptomScore >= 3) {
      reasoning.push('Moderate severity symptoms detected');
    } else if (symptomScore > 0) {
      reasoning.push('Low severity symptoms detected');
    }
    
    // Age-based adjustments
    let vitalsPriority = vitalsPriorityValue;
    if (age < 5 || age > 65) {
      if (vitalsPriority === 'medium' || symptomScore >= 2) {
        reasoning.push(`Age (${age}) is a risk factor`);
        // Increase priority for very young or elderly patients
        if (vitalsPriority === 'medium') {
          vitalsPriority = 'high';
        }
      }
    }
    
    // Determine final priority
    let finalPriority: 'normal' | 'urgent' | 'critical';
    let confidence = 0.8; // Base confidence with vitals
    
    if (vitalsPriority === 'high' || symptomScore >= 5) {
      finalPriority = 'critical';
      confidence = 0.9;
    } else if (vitalsPriority === 'medium' || symptomScore >= 3) {
      finalPriority = 'urgent';
      confidence = 0.8;
    } else {
      finalPriority = 'normal';
      confidence = 0.7;
    }
    
    return {
      priority: finalPriority,
      confidence,
      reasoning
    };
  }
};
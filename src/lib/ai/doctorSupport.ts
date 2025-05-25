// Doctor Support Tools
import { Patient, Consultation, LabTest, VitalSigns, MedicalHistory } from '../../types';

// Common diagnoses and their associated treatments
const diagnosisTreatmentMap: Record<string, string[]> = {
  'malaria': [
    'Artemisinin-based combination therapy (ACT)',
    'Oral rehydration and antipyretics',
    'Follow-up blood test after treatment'
  ],
  'pneumonia': [
    'Appropriate antibiotics based on severity',
    'Supportive care including hydration and rest',
    'Antipyretics for fever'
  ],
  'urinary tract infection': [
    'Antibiotics (e.g., Nitrofurantoin, Trimethoprim-Sulfamethoxazole)',
    'Increased fluid intake',
    'Analgesics for pain relief'
  ],
  'hypertension': [
    'Lifestyle modifications (diet, exercise, salt restriction)',
    'Antihypertensive medication as appropriate',
    'Regular blood pressure monitoring'
  ],
  'diabetes': [
    'Blood glucose monitoring',
    'Dietary modifications and exercise',
    'Oral hypoglycemics or insulin as appropriate'
  ],
  'asthma': [
    'Short-acting beta agonists for acute symptoms',
    'Inhaled corticosteroids for long-term control',
    'Avoidance of triggers'
  ],
  'gastritis': [
    'Proton pump inhibitors or H2 blockers',
    'Avoidance of irritating foods and NSAIDs',
    'Antacids for symptom relief'
  ],
  'bronchitis': [
    'Rest and increased fluid intake',
    'Bronchodilators if wheezing present',
    'Antibiotics only if bacterial infection suspected'
  ],
  'tonsillitis': [
    'Analgesics for pain and fever',
    'Antibiotics if bacterial infection confirmed',
    'Warm salt water gargles'
  ],
  'otitis media': [
    'Analgesics for pain',
    'Antibiotics if indicated',
    'Decongestants may help with eustachian tube function'
  ]
};

// Generic treatments for symptom categories
const symptomTreatmentMap: Record<string, string[]> = {
  'pain': [
    'Appropriate analgesics based on pain severity',
    'Physical therapy if indicated',
    'Identify and treat underlying cause'
  ],
  'fever': [
    'Antipyretics (Paracetamol or Ibuprofen)',
    'Adequate hydration',
    'Identify and treat underlying cause'
  ],
  'cough': [
    'Cough suppressants for dry cough',
    'Expectorants for productive cough',
    'Treat underlying cause'
  ],
  'diarrhea': [
    'Oral rehydration therapy',
    'Probiotics may be beneficial',
    'Antimotility agents if appropriate'
  ],
  'vomiting': [
    'Antiemetics if severe',
    'Oral rehydration therapy',
    'Small, frequent meals once tolerated'
  ],
  'rash': [
    'Topical corticosteroids for inflammation',
    'Antihistamines for itching',
    'Identify and avoid triggers'
  ],
  'headache': [
    'Appropriate analgesics',
    'Rest in quiet, dark environment for migraine',
    'Identify and address triggers'
  ]
};

export const doctorSupport = {
  // Summarize patient history
  summarizeHistory: (
    patient: Patient,
    consultations: Consultation[],
    labTests: LabTest[],
    vitals: VitalSigns[],
    medicalHistory: MedicalHistory | null
  ): string => {
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
  },
  
  // Suggest treatments based on diagnosis
  suggestTreatments: (diagnosis: string[]): { 
    suggestions: string[];
    confidence: number;
    notes: string;
  } => {
    if (!diagnosis || diagnosis.length === 0) {
      return {
        suggestions: [],
        confidence: 0,
        notes: 'No diagnosis provided'
      };
    }
    
    let allSuggestions: string[] = [];
    let matchedDiagnoses = 0;
    
    // Check each diagnosis against our knowledge base
    diagnosis.forEach(d => {
      const diagnosisLower = d.toLowerCase();
      
      // Check for exact matches in diagnosis map
      if (diagnosisTreatmentMap[diagnosisLower]) {
        allSuggestions.push(...diagnosisTreatmentMap[diagnosisLower]);
        matchedDiagnoses++;
        return;
      }
      
      // Check for partial matches in diagnosis map
      for (const [key, treatments] of Object.entries(diagnosisTreatmentMap)) {
        if (diagnosisLower.includes(key) || key.includes(diagnosisLower)) {
          allSuggestions.push(...treatments);
          matchedDiagnoses++;
          return;
        }
      }
      
      // Check for symptom matches
      for (const [symptom, treatments] of Object.entries(symptomTreatmentMap)) {
        if (diagnosisLower.includes(symptom)) {
          allSuggestions.push(...treatments);
          matchedDiagnoses += 0.5; // Partial match
          return;
        }
      }
    });
    
    // Remove duplicates
    const uniqueSuggestions = [...new Set(allSuggestions)];
    
    // Calculate confidence based on match ratio
    const confidence = matchedDiagnoses > 0 
      ? Math.min(matchedDiagnoses / diagnosis.length, 1) 
      : 0;
    
    // Generate notes
    let notes = '';
    if (confidence === 0) {
      notes = 'No matching treatments found for the provided diagnoses';
    } else if (confidence < 0.5) {
      notes = 'Limited matches found. Consider consulting treatment guidelines';
    } else if (confidence < 1) {
      notes = 'Some treatments suggested based on partial matches';
    } else {
      notes = 'Treatments suggested based on standard guidelines';
    }
    
    return {
      suggestions: uniqueSuggestions.slice(0, 5), // Limit to top 5 suggestions
      confidence,
      notes
    };
  }
};
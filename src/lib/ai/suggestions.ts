// Auto-Suggestion Engine
import { usePatientStore } from '../store';
import { departments, departmentNames } from '../../types/departments';

// Common medical terms for auto-suggestions
const commonMedicalTerms = [
  'fever', 'headache', 'cough', 'cold', 'flu', 'pain', 'nausea',
  'vomiting', 'diarrhea', 'rash', 'allergy', 'infection', 'injury',
  'fracture', 'wound', 'diabetes', 'hypertension', 'asthma', 'cancer',
  'prescription', 'medication', 'lab test', 'x-ray', 'ultrasound',
  'blood test', 'urine test', 'consultation', 'follow-up', 'emergency'
];

// Common medications for auto-suggestions
const commonMedications = [
  'Paracetamol', 'Ibuprofen', 'Aspirin', 'Amoxicillin', 'Azithromycin',
  'Metformin', 'Amlodipine', 'Atorvastatin', 'Omeprazole', 'Salbutamol',
  'Cetirizine', 'Prednisolone', 'Metronidazole', 'Diazepam', 'Morphine'
];

// Common lab tests for auto-suggestions
const commonLabTests = [
  'Complete Blood Count', 'Blood Glucose', 'Lipid Profile', 'Liver Function Test',
  'Kidney Function Test', 'Thyroid Function Test', 'Urinalysis', 'Electrolytes',
  'HbA1c', 'HIV Test', 'Malaria Test', 'Pregnancy Test', 'COVID-19 Test'
];

export const autoSuggestions = {
  // Get suggestions based on partial input
  getSuggestions: async (
    partialInput: string, 
    context: 'patient' | 'medication' | 'lab' | 'department' | 'general' = 'general',
    limit: number = 10
  ) => {
    const input = partialInput.toLowerCase().trim();
    
    if (!input) return [];
    
    let suggestions: string[] = [];
    
    // Get suggestions based on context
    switch (context) {
      case 'patient':
        // Get patient name suggestions
        suggestions = usePatientStore.getState().patientQueue
          .map(patient => patient.fullName)
          .filter(name => name.toLowerCase().includes(input));
        break;
        
      case 'medication':
        // Get medication suggestions
        suggestions = commonMedications
          .filter(med => med.toLowerCase().includes(input));
        break;
        
      case 'lab':
        // Get lab test suggestions
        suggestions = commonLabTests
          .filter(test => test.toLowerCase().includes(input));
        break;
        
      case 'department':
        // Get department suggestions
        suggestions = Object.values(departmentNames)
          .filter(dept => dept.toLowerCase().includes(input));
        break;
        
      case 'general':
      default:
        // Get general suggestions from all sources
        const patientSuggestions = usePatientStore.getState().patientQueue
          .map(patient => patient.fullName)
          .filter(name => name.toLowerCase().includes(input));
          
        const medicalTermSuggestions = commonMedicalTerms
          .filter(term => term.toLowerCase().includes(input));
          
        const medicationSuggestions = commonMedications
          .filter(med => med.toLowerCase().includes(input));
          
        const labTestSuggestions = commonLabTests
          .filter(test => test.toLowerCase().includes(input));
          
        const departmentSuggestions = Object.values(departmentNames)
          .filter(dept => dept.toLowerCase().includes(input));
        
        // Combine all suggestions
        suggestions = [
          ...patientSuggestions,
          ...medicalTermSuggestions,
          ...medicationSuggestions,
          ...labTestSuggestions,
          ...departmentSuggestions
        ];
        break;
    }
    
    // Remove duplicates and limit results
    return [...new Set(suggestions)].slice(0, limit);
  }
};
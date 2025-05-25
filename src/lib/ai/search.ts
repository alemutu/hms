// Smart Search System
import { Patient, LabTest, Consultation, Prescription } from '../../types';
import { usePatientStore } from '../store';

// Simple NLP utilities
const extractEntities = (query: string) => {
  // Extract potential patient names (capitalized words)
  const namePattern = /\b[A-Z][a-z]+\b/g;
  const potentialNames = query.match(namePattern) || [];
  
  // Extract potential dates (simple pattern matching)
  const datePattern = /\b\d{1,2}[-/]\d{1,2}[-/]\d{2,4}\b|\b\d{4}\b/g;
  const dates = query.match(datePattern) || [];
  
  // Extract department names
  const departmentKeywords = [
    'lab', 'laboratory', 'radiology', 'pharmacy', 'emergency',
    'pediatric', 'dental', 'surgery', 'consultation', 'triage'
  ];
  const departments = departmentKeywords.filter(dept => 
    query.toLowerCase().includes(dept)
  );
  
  // Extract record types
  const recordTypes = [
    { keyword: 'lab', type: 'lab_result' },
    { keyword: 'test', type: 'lab_result' },
    { keyword: 'prescription', type: 'prescription' },
    { keyword: 'medication', type: 'prescription' },
    { keyword: 'consult', type: 'consultation' },
    { keyword: 'visit', type: 'consultation' },
    { keyword: 'bill', type: 'billing' },
    { keyword: 'payment', type: 'billing' },
    { keyword: 'invoice', type: 'billing' }
  ].filter(record => query.toLowerCase().includes(record.keyword))
   .map(record => record.type);
  
  return {
    names: potentialNames,
    dates,
    departments,
    recordTypes: [...new Set(recordTypes)]
  };
};

// Correct minor spelling mistakes
const correctSpelling = (query: string) => {
  // Simple corrections for common medical terms
  const corrections: Record<string, string> = {
    'labratory': 'laboratory',
    'radilogy': 'radiology',
    'pharmasy': 'pharmacy',
    'medicin': 'medicine',
    'perscription': 'prescription',
    'consultion': 'consultation',
    'emergancy': 'emergency',
    'patiant': 'patient',
    'docter': 'doctor',
    'surgary': 'surgery'
  };
  
  let correctedQuery = query;
  
  // Apply corrections
  Object.entries(corrections).forEach(([misspelled, correct]) => {
    const regex = new RegExp(`\\b${misspelled}\\b`, 'gi');
    correctedQuery = correctedQuery.replace(regex, correct);
  });
  
  return correctedQuery;
};

// Search function
export const searchEngine = {
  search: async (query: string, options: { limit?: number; userId: string } = { userId: 'unknown' }) => {
    // Log the search action
    console.log(`Search: "${query}" by user ${options.userId}`);
    
    // Correct spelling mistakes
    const correctedQuery = correctSpelling(query);
    const wasQueryCorrected = correctedQuery !== query;
    
    // Extract entities from the query
    const entities = extractEntities(correctedQuery);
    
    // Get data from the store
    const patients = usePatientStore.getState().patientQueue;
    
    // Filter patients based on extracted entities
    let filteredPatients = patients;
    
    // Filter by name if names were extracted
    if (entities.names.length > 0) {
      filteredPatients = filteredPatients.filter(patient => 
        entities.names.some(name => 
          patient.fullName.toLowerCase().includes(name.toLowerCase())
        )
      );
    }
    
    // Filter by department if departments were extracted
    if (entities.departments.length > 0) {
      filteredPatients = filteredPatients.filter(patient => 
        entities.departments.some(dept => 
          patient.currentDepartment?.toLowerCase().includes(dept) ||
          patient.previousDepartments?.some(prevDept => 
            prevDept.toLowerCase().includes(dept)
          )
        )
      );
    }
    
    // Apply limit if specified
    const limit = options.limit || 10;
    const results = filteredPatients.slice(0, limit);
    
    return {
      results,
      correctedQuery: wasQueryCorrected ? correctedQuery : null,
      entities,
      totalResults: filteredPatients.length,
      limitedResults: results.length
    };
  }
};
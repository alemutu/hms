// Lab Result Summarization
import { LabTest } from '../../types';

// Define normal ranges for common lab tests
const normalRanges: Record<string, { min: number; max: number; unit: string }> = {
  // Complete Blood Count
  'wbc': { min: 4.0, max: 11.0, unit: '×10⁹/L' },
  'rbc': { min: 4.5, max: 5.5, unit: '×10¹²/L' },
  'hemoglobin': { min: 13.5, max: 17.5, unit: 'g/dL' },
  'hematocrit': { min: 41, max: 50, unit: '%' },
  'platelets': { min: 150, max: 450, unit: '×10⁹/L' },
  
  // Liver Function Tests
  'alt': { min: 7, max: 56, unit: 'U/L' },
  'ast': { min: 10, max: 40, unit: 'U/L' },
  'alp': { min: 44, max: 147, unit: 'U/L' },
  'bilirubin': { min: 0.3, max: 1.2, unit: 'mg/dL' },
  'albumin': { min: 3.5, max: 5.0, unit: 'g/dL' },
  
  // Lipid Profile
  'total_cholesterol': { min: 0, max: 200, unit: 'mg/dL' },
  'ldl': { min: 0, max: 100, unit: 'mg/dL' },
  'hdl': { min: 40, max: 60, unit: 'mg/dL' },
  'triglycerides': { min: 0, max: 150, unit: 'mg/dL' },
  
  // Blood Glucose
  'fasting_glucose': { min: 70, max: 100, unit: 'mg/dL' },
  'random_glucose': { min: 70, max: 140, unit: 'mg/dL' },
  'hba1c': { min: 4.0, max: 5.7, unit: '%' },
  
  // Kidney Function
  'creatinine': { min: 0.7, max: 1.3, unit: 'mg/dL' },
  'bun': { min: 7, max: 20, unit: 'mg/dL' },
  'egfr': { min: 90, max: 120, unit: 'mL/min/1.73m²' },
  
  // Electrolytes
  'sodium': { min: 135, max: 145, unit: 'mmol/L' },
  'potassium': { min: 3.5, max: 5.0, unit: 'mmol/L' },
  'chloride': { min: 98, max: 107, unit: 'mmol/L' },
  'bicarbonate': { min: 22, max: 29, unit: 'mmol/L' }
};

// Template phrases for abnormal results
const abnormalPhrases: Record<string, { high: string[]; low: string[] }> = {
  'wbc': {
    high: ['Elevated white blood cell count suggests possible infection or inflammation'],
    low: ['Low white blood cell count may indicate bone marrow suppression or viral infection']
  },
  'rbc': {
    high: ['Elevated red blood cell count may indicate polycythemia or dehydration'],
    low: ['Low red blood cell count suggests possible anemia']
  },
  'hemoglobin': {
    high: ['Elevated hemoglobin may indicate polycythemia or dehydration'],
    low: ['Low hemoglobin indicates anemia']
  },
  'platelets': {
    high: ['Elevated platelet count suggests possible inflammation or infection'],
    low: ['Low platelet count (thrombocytopenia) may increase bleeding risk']
  },
  'alt': {
    high: ['Elevated ALT suggests liver cell damage'],
    low: ['Low ALT is generally not clinically significant']
  },
  'ast': {
    high: ['Elevated AST suggests liver or muscle damage'],
    low: ['Low AST is generally not clinically significant']
  },
  'bilirubin': {
    high: ['Elevated bilirubin may indicate liver dysfunction or hemolysis'],
    low: ['Low bilirubin is generally not clinically significant']
  },
  'total_cholesterol': {
    high: ['Elevated total cholesterol increases cardiovascular risk'],
    low: ['Low cholesterol may be associated with malnutrition or liver disease']
  },
  'ldl': {
    high: ['Elevated LDL ("bad cholesterol") increases cardiovascular risk'],
    low: ['Low LDL is generally beneficial for cardiovascular health']
  },
  'hdl': {
    high: ['High HDL ("good cholesterol") is generally protective against heart disease'],
    low: ['Low HDL may increase cardiovascular risk']
  },
  'triglycerides': {
    high: ['Elevated triglycerides increase cardiovascular risk and may indicate metabolic syndrome'],
    low: ['Low triglycerides are generally not clinically significant']
  },
  'fasting_glucose': {
    high: ['Elevated fasting glucose suggests diabetes or prediabetes'],
    low: ['Low blood glucose (hypoglycemia) may cause symptoms like dizziness and confusion']
  },
  'hba1c': {
    high: ['Elevated HbA1c indicates poor glycemic control over the past 3 months'],
    low: ['Low HbA1c may indicate recent hypoglycemic episodes']
  },
  'creatinine': {
    high: ['Elevated creatinine suggests decreased kidney function'],
    low: ['Low creatinine may indicate decreased muscle mass']
  },
  'sodium': {
    high: ['Elevated sodium (hypernatremia) may indicate dehydration'],
    low: ['Low sodium (hyponatremia) may cause neurological symptoms']
  },
  'potassium': {
    high: ['Elevated potassium (hyperkalemia) may affect cardiac function'],
    low: ['Low potassium (hypokalemia) may cause muscle weakness and cardiac arrhythmias']
  }
};

// Generic phrases for tests without specific templates
const genericPhrases = {
  high: [
    'Elevated {test} levels detected',
    '{test} is above normal range',
    'High {test} may require clinical attention'
  ],
  low: [
    'Low {test} levels detected',
    '{test} is below normal range',
    'Decreased {test} may require clinical attention'
  ],
  normal: [
    '{test} is within normal range',
    '{test} levels are normal',
    'No abnormalities detected in {test}'
  ]
};

// Get a random phrase from an array
const getRandomPhrase = (phrases: string[]): string => {
  return phrases[Math.floor(Math.random() * phrases.length)];
};

// Replace placeholders in a phrase
const formatPhrase = (phrase: string, testName: string): string => {
  return phrase.replace('{test}', testName);
};

export const labSummarizer = {
  // Summarize lab results
  summarize: (labTest: LabTest): { 
    summary: string[]; 
    abnormalResults: string[];
    criticalResults: string[];
    normalResults: string[];
  } => {
    const summary: string[] = [];
    const abnormalResults: string[] = [];
    const criticalResults: string[] = [];
    const normalResults: string[] = [];
    
    // Check if results exist and have custom fields
    if (!labTest.results || !labTest.results.customFields) {
      return { 
        summary: ['No detailed results available for analysis'], 
        abnormalResults: [],
        criticalResults: [],
        normalResults: []
      };
    }
    
    // Process each result field
    Object.entries(labTest.results.customFields).forEach(([key, value]) => {
      // Skip non-numeric values
      if (typeof value !== 'number') return;
      
      // Get normal range for this test
      const range = normalRanges[key.toLowerCase()];
      if (!range) return;
      
      const testName = key.replace(/_/g, ' ');
      
      // Check if value is within normal range
      if (value < range.min) {
        // Value is low
        const phrases = abnormalPhrases[key.toLowerCase()]?.low || 
          genericPhrases.low.map(phrase => formatPhrase(phrase, testName));
        
        const resultPhrase = `${testName.toUpperCase()}: ${value} ${range.unit} (Low - Normal range: ${range.min}-${range.max} ${range.unit})`;
        
        // Add to appropriate lists
        abnormalResults.push(resultPhrase);
        summary.push(getRandomPhrase(phrases));
        
        // Check if critically low
        if (value < range.min * 0.7) {
          criticalResults.push(resultPhrase);
        }
      } else if (value > range.max) {
        // Value is high
        const phrases = abnormalPhrases[key.toLowerCase()]?.high || 
          genericPhrases.high.map(phrase => formatPhrase(phrase, testName));
        
        const resultPhrase = `${testName.toUpperCase()}: ${value} ${range.unit} (High - Normal range: ${range.min}-${range.max} ${range.unit})`;
        
        // Add to appropriate lists
        abnormalResults.push(resultPhrase);
        summary.push(getRandomPhrase(phrases));
        
        // Check if critically high
        if (value > range.max * 1.5) {
          criticalResults.push(resultPhrase);
        }
      } else {
        // Value is normal
        normalResults.push(`${testName.toUpperCase()}: ${value} ${range.unit} (Normal range: ${range.min}-${range.max} ${range.unit})`);
      }
    });
    
    // If no abnormal results were found, add a general normal statement
    if (summary.length === 0) {
      summary.push('All test results are within normal ranges');
    }
    
    // Add a note about critical values if any were found
    if (criticalResults.length > 0) {
      summary.unshift('ATTENTION: Critical values detected that may require immediate clinical attention');
    }
    
    // Limit summary to 3 points maximum
    return {
      summary: summary.slice(0, 3),
      abnormalResults,
      criticalResults,
      normalResults
    };
  }
};
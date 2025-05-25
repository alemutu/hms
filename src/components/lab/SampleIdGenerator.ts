import { format } from 'date-fns';

// Department prefixes
const DEPARTMENT_PREFIXES = {
  'hematology': 'HEM',
  'biochemistry': 'BIO',
  'microbiology': 'MIC',
  'immunology': 'IMM',
  'urinalysis': 'URI',
  'serology': 'SER',
  'coagulation': 'COA',
  'molecular': 'MOL'
} as const;

// Test type prefixes
const TEST_TYPE_PREFIXES = {
  'Complete Blood Count (CBC)': 'CBC',
  'Liver Function Test': 'LFT',
  'Lipid Profile': 'LIP',
  'Blood Culture': 'BCX',
  'Urinalysis': 'URI',
  'Coagulation Profile': 'CPF'
} as const;

// Counter for sequence numbers (reset daily)
let dailyCounter = 1;
let lastDate = '';

export function generateSampleId(testType: string, category: string): string {
  // Get current date components
  const now = new Date();
  const dateStr = format(now, 'yyyyMMdd');
  
  // Reset counter if it's a new day
  if (dateStr !== lastDate) {
    dailyCounter = 1;
    lastDate = dateStr;
  }

  // Get department prefix
  const deptPrefix = DEPARTMENT_PREFIXES[category.toLowerCase() as keyof typeof DEPARTMENT_PREFIXES] || 'LAB';
  
  // Get test prefix
  const testPrefix = TEST_TYPE_PREFIXES[testType as keyof typeof TEST_TYPE_PREFIXES] || 
    testType.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 3);

  // Generate sequence number with padding
  const sequence = dailyCounter.toString().padStart(4, '0');
  
  // Increment counter for next use
  dailyCounter++;

  // Format: DEPT-TEST-YYYYMMDD-SEQUENCE
  // Example: HEM-CBC-20250417-0001
  return `${deptPrefix}-${testPrefix}-${dateStr}-${sequence}`;
}
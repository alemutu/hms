import { TestTube, Activity, Brain, Heart, Bone, Microscope, Beaker, Radio, Stethoscope } from 'lucide-react';

export interface LabTestOption {
  id: string;
  name: string;
  type: string;
  department: 'laboratory' | 'radiology';
  category: string;
  description?: string;
  preparationNeeded?: string;
  estimatedDuration?: number;
  normalRange?: string;
  units?: string;
  urgentTurnaroundTime?: string;
  routineTurnaroundTime?: string;
  sampleType?: string;
  machineType?: string;
  reportFormat?: 'numeric' | 'descriptive' | 'image' | 'waveform';
  price?: number;
}

// Test-specific field configurations
export const testFields: Record<string, Array<{
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'image' | 'file';
  unit?: string;
  options?: string[];
  required?: boolean;
  normalRange?: string;
  description?: string;
  format?: string;
  allowMultiple?: boolean;
}>> = {
  'Complete Blood Count (CBC)': [
    { id: 'wbc', label: 'White Blood Cell Count', type: 'number', unit: '×10⁹/L', normalRange: '4.0-11.0', required: true },
    { id: 'rbc', label: 'Red Blood Cell Count', type: 'number', unit: '×10¹²/L', normalRange: '4.5-5.5', required: true },
    { id: 'hemoglobin', label: 'Hemoglobin', type: 'number', unit: 'g/dL', normalRange: '13.5-17.5', required: true },
    { id: 'hematocrit', label: 'Hematocrit', type: 'number', unit: '%', normalRange: '41-50', required: true },
    { id: 'platelets', label: 'Platelet Count', type: 'number', unit: '×10⁹/L', normalRange: '150-450', required: true },
    { id: 'microscopy', label: 'Blood Film Microscopy', type: 'text', required: false }
  ],
  'CT Scan - Brain': [
    { id: 'scanImages', label: 'CT Scan Images', type: 'file', required: true, allowMultiple: true, format: 'DICOM' },
    { id: 'contrastUsed', label: 'Contrast Used', type: 'select', options: ['Yes', 'No'], required: true },
    { id: 'sliceThickness', label: 'Slice Thickness', type: 'number', unit: 'mm', required: true },
    { id: 'findings', label: 'Radiological Findings', type: 'text', required: true },
    { id: 'impression', label: 'Impression', type: 'text', required: true }
  ],
  'MRI - Brain': [
    { id: 'mriImages', label: 'MRI Sequences', type: 'file', required: true, allowMultiple: true, format: 'DICOM' },
    { id: 'sequences', label: 'Sequences Performed', type: 'select', options: ['T1', 'T2', 'FLAIR', 'DWI', 'ADC'], required: true, allowMultiple: true },
    { id: 'contrastUsed', label: 'Contrast Used', type: 'select', options: ['Yes', 'No'], required: true },
    { id: 'findings', label: 'Radiological Findings', type: 'text', required: true },
    { id: 'impression', label: 'Impression', type: 'text', required: true }
  ],
  'X-Ray - Chest': [
    { id: 'xrayImage', label: 'X-Ray Image', type: 'file', required: true, format: 'DICOM' },
    { id: 'view', label: 'View', type: 'select', options: ['PA', 'Lateral', 'AP'], required: true },
    { id: 'findings', label: 'Radiological Findings', type: 'text', required: true },
    { id: 'impression', label: 'Impression', type: 'text', required: true }
  ],
  'Liver Function Test': [
    { id: 'alt', label: 'ALT', type: 'number', unit: 'U/L', normalRange: '7-56', required: true },
    { id: 'ast', label: 'AST', type: 'number', unit: 'U/L', normalRange: '10-40', required: true },
    { id: 'alp', label: 'ALP', type: 'number', unit: 'U/L', normalRange: '44-147', required: true },
    { id: 'bilirubin', label: 'Total Bilirubin', type: 'number', unit: 'mg/dL', normalRange: '0.3-1.2', required: true },
    { id: 'albumin', label: 'Albumin', type: 'number', unit: 'g/dL', normalRange: '3.5-5.0', required: true }
  ]
};

export const labTestCategories = [
  {
    id: 'hematology',
    name: 'Hematology',
    department: 'laboratory',
    icon: TestTube,
    description: 'Blood tests and analysis',
    tests: [
      { 
        id: 'cbc', 
        name: 'Complete Blood Count (CBC)', 
        description: 'Measures different components of blood',
        urgentTurnaroundTime: '1 hour',
        routineTurnaroundTime: '4 hours',
        sampleType: 'Whole Blood',
        machineType: 'Automated Hematology Analyzer',
        price: 800
      },
      { 
        id: 'coagulation', 
        name: 'Coagulation Profile', 
        description: 'Assesses blood clotting function',
        urgentTurnaroundTime: '1 hour',
        routineTurnaroundTime: '4 hours',
        sampleType: 'Plasma',
        machineType: 'Coagulation Analyzer',
        price: 1200
      }
    ]
  },
  {
    id: 'biochemistry',
    name: 'Clinical Chemistry',
    department: 'laboratory',
    icon: Beaker,
    description: 'Chemical analysis of blood and fluids',
    tests: [
      { 
        id: 'lft', 
        name: 'Liver Function Test', 
        description: 'Assesses liver health and function',
        urgentTurnaroundTime: '2 hours',
        routineTurnaroundTime: '6 hours',
        sampleType: 'Serum',
        machineType: 'Chemistry Analyzer',
        price: 1500
      },
      { 
        id: 'lipid', 
        name: 'Lipid Profile', 
        description: 'Measures cholesterol and triglycerides',
        urgentTurnaroundTime: '2 hours',
        routineTurnaroundTime: '6 hours',
        sampleType: 'Serum',
        machineType: 'Chemistry Analyzer',
        price: 1200
      }
    ]
  },
  {
    id: 'microbiology',
    name: 'Microbiology',
    department: 'laboratory',
    icon: Microscope,
    description: 'Bacterial cultures and sensitivity',
    tests: [
      { 
        id: 'culture', 
        name: 'Blood Culture', 
        description: 'Detects bacteria in blood',
        urgentTurnaroundTime: '24 hours',
        routineTurnaroundTime: '72 hours',
        sampleType: 'Blood',
        machineType: 'Blood Culture System',
        price: 2000
      },
      { 
        id: 'sensitivity', 
        name: 'Antibiotic Sensitivity', 
        description: 'Tests antibiotic effectiveness',
        urgentTurnaroundTime: '24 hours',
        routineTurnaroundTime: '72 hours',
        sampleType: 'Isolate',
        machineType: 'Manual/Automated System',
        price: 1800
      }
    ]
  },
  {
    id: 'ct-scan',
    name: 'CT Scan',
    department: 'radiology',
    icon: Brain,
    description: 'Computed Tomography imaging',
    tests: [
      { 
        id: 'ct-brain', 
        name: 'CT Scan - Brain', 
        description: 'Detailed brain imaging',
        urgentTurnaroundTime: '1 hour',
        routineTurnaroundTime: '24 hours',
        machineType: 'CT Scanner',
        reportFormat: 'image',
        price: 8000
      },
      { 
        id: 'ct-chest', 
        name: 'CT Scan - Chest', 
        description: 'Detailed chest imaging',
        urgentTurnaroundTime: '1 hour',
        routineTurnaroundTime: '24 hours',
        machineType: 'CT Scanner',
        reportFormat: 'image',
        price: 7500
      }
    ]
  },
  {
    id: 'mri',
    name: 'MRI',
    department: 'radiology',
    icon: Brain,
    description: 'Magnetic Resonance Imaging',
    tests: [
      { 
        id: 'mri-brain', 
        name: 'MRI - Brain', 
        description: 'Detailed brain MRI',
        urgentTurnaroundTime: '2 hours',
        routineTurnaroundTime: '48 hours',
        machineType: 'MRI Scanner',
        reportFormat: 'image',
        price: 12000
      },
      { 
        id: 'mri-spine', 
        name: 'MRI - Spine', 
        description: 'Spinal cord imaging',
        urgentTurnaroundTime: '2 hours',
        routineTurnaroundTime: '48 hours',
        machineType: 'MRI Scanner',
        reportFormat: 'image',
        price: 15000
      }
    ]
  },
  {
    id: 'xray',
    name: 'X-Ray',
    department: 'radiology',
    icon: Radio,
    description: 'Plain radiography',
    tests: [
      { 
        id: 'xray-chest', 
        name: 'X-Ray - Chest', 
        description: 'Chest radiograph',
        urgentTurnaroundTime: '30 minutes',
        routineTurnaroundTime: '4 hours',
        machineType: 'X-Ray Machine',
        reportFormat: 'image',
        price: 1500
      },
      { 
        id: 'xray-bone', 
        name: 'X-Ray - Bone', 
        description: 'Bone radiograph',
        urgentTurnaroundTime: '30 minutes',
        routineTurnaroundTime: '4 hours',
        machineType: 'X-Ray Machine',
        reportFormat: 'image',
        price: 1800
      }
    ]
  }
];

export const searchTests = (query: string): LabTestOption[] => {
  const searchTerm = query.toLowerCase().trim();
  
  if (!searchTerm) return [];
  
  const results: LabTestOption[] = [];

  labTestCategories.forEach(category => {
    category.tests.forEach(test => {
      if (
        test.name.toLowerCase().includes(searchTerm) ||
        test.description?.toLowerCase().includes(searchTerm) ||
        category.name.toLowerCase().includes(searchTerm)
      ) {
        results.push({
          id: test.id,
          name: test.name,
          type: test.id,
          department: category.department,
          category: category.name,
          description: test.description,
          urgentTurnaroundTime: test.urgentTurnaroundTime,
          routineTurnaroundTime: test.routineTurnaroundTime,
          sampleType: test.sampleType,
          machineType: test.machineType,
          reportFormat: test.reportFormat as any,
          price: test.price
        });
      }
    });
  });

  return results;
};

export const getTestsByCategory = (categoryId: string): LabTestOption[] => {
  const category = labTestCategories.find(c => c.id === categoryId);
  if (!category) return [];

  return category.tests.map(test => ({
    id: test.id,
    name: test.name,
    type: test.id,
    department: category.department,
    category: category.name,
    description: test.description,
    urgentTurnaroundTime: test.urgentTurnaroundTime,
    routineTurnaroundTime: test.routineTurnaroundTime,
    sampleType: test.sampleType,
    machineType: test.machineType,
    reportFormat: test.reportFormat as any,
    price: test.price
  }));
};
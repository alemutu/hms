import type { Patient, VitalSigns, MedicalHistory } from './index';

export interface ConsultationNote {
  id: string;
  consultationId: string;
  type: 'general' | 'assessment' | 'plan' | 'followup';
  content: string;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface ConsultationTemplate {
  id: string;
  name: string;
  department: string;
  sections: {
    id: string;
    title: string;
    type: 'text' | 'checkbox' | 'radio' | 'select' | 'number';
    required: boolean;
    options?: string[];
    defaultValue?: string | number | boolean;
  }[];
}

export interface ConsultationWorkflow {
  currentStep: 'history' | 'examination' | 'assessment' | 'plan';
  patient: Patient;
  vitals?: VitalSigns;
  history?: MedicalHistory;
  notes: ConsultationNote[];
  template?: ConsultationTemplate;
}

export interface ConsultationStats {
  totalToday: number;
  completed: number;
  inProgress: number;
  averageDuration: number;
  byPriority: {
    normal: number;
    urgent: number;
    critical: number;
  };
  byDepartment: Record<string, number>;
}
import { useState, useCallback } from 'react';
import { usePatientStore } from '../lib/store';
import type { 
  Consultation, 
  ConsultationNote,
  ConsultationWorkflow,
  Patient,
  LabTest 
} from '../types';

interface ConsultationState {
  consultation: Consultation | null;
  labTests: LabTest[];
  isLoading: boolean;
  error: string | null;
}

export function useConsultation(patientId?: string) {
  const store = usePatientStore();
  const [state, setState] = useState<ConsultationState>({
    consultation: null,
    labTests: [],
    isLoading: false,
    error: null
  });

  const startConsultation = useCallback(async (patient: Patient) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      // Create new consultation
      const consultation: Consultation = {
        id: crypto.randomUUID(),
        patientId: patient.id,
        department: patient.currentDepartment,
        doctorId: 'current-doctor-id', // Replace with actual doctor ID
        doctorName: 'Dr. Sarah Chen', // Replace with actual doctor name
        startTime: new Date(),
        status: 'in-progress',
        priority: patient.priority,
        chiefComplaints: [],
        symptoms: [],
        diagnosis: [],
        treatment: '',
        notes: '',
        timeline: [{
          timestamp: new Date(),
          event: 'Consultation Started',
          actor: 'Dr. Sarah Chen'
        }]
      };

      await store.createConsultation(consultation);
      await store.updatePatientStatus(patient.id, 'in-consultation');

      setState(prev => ({
        ...prev,
        consultation,
        isLoading: false
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: 'Failed to start consultation',
        isLoading: false
      }));
      console.error('Error starting consultation:', err);
    }
  }, [store]);

  const updateConsultation = useCallback(async (updates: Partial<Consultation>) => {
    if (!state.consultation) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const updatedConsultation = {
        ...state.consultation,
        ...updates,
        timeline: [
          ...(state.consultation.timeline || []),
          {
            timestamp: new Date(),
            event: 'Consultation Updated',
            actor: 'Dr. Sarah Chen'
          }
        ]
      };

      await store.updateConsultation(state.consultation.id, updatedConsultation);

      setState(prev => ({
        ...prev,
        consultation: updatedConsultation,
        isLoading: false
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: 'Failed to update consultation',
        isLoading: false
      }));
      console.error('Error updating consultation:', err);
    }
  }, [state.consultation, store]);

  const requestLabTests = useCallback(async (tests: Omit<LabTest, 'id' | 'requestedAt'>[]) => {
    if (!state.consultation) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const labRequests = tests.map(test => ({
        ...test,
        id: crypto.randomUUID(),
        requestedAt: new Date(),
        status: 'pending' as const
      }));

      for (const request of labRequests) {
        await store.createLabRequest(request);
      }

      // Update consultation with lab test references
      const updatedConsultation = {
        ...state.consultation,
        labTests: [
          ...(state.consultation.labTests || []),
          ...labRequests.map(test => ({
            id: test.id,
            type: test.testType,
            status: 'pending' as const
          }))
        ],
        timeline: [
          ...(state.consultation.timeline || []),
          {
            timestamp: new Date(),
            event: 'Lab Tests Requested',
            details: tests.map(t => t.testType).join(', '),
            actor: 'Dr. Sarah Chen'
          }
        ]
      };

      await store.updateConsultation(state.consultation.id, updatedConsultation);

      setState({
        consultation: updatedConsultation,
        labTests: [...state.labTests, ...labRequests],
        isLoading: false,
        error: null
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: 'Failed to request lab tests',
        isLoading: false
      }));
      console.error('Error requesting lab tests:', err);
    }
  }, [state.consultation, state.labTests, store]);

  const completeConsultation = useCallback(async (data: Partial<Consultation>) => {
    if (!state.consultation) return;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const updatedConsultation = {
        ...state.consultation,
        ...data,
        status: 'completed',
        endTime: new Date(),
        timeline: [
          ...(state.consultation.timeline || []),
          {
            timestamp: new Date(),
            event: 'Consultation Completed',
            actor: 'Dr. Sarah Chen'
          }
        ]
      };

      await store.updateConsultation(state.consultation.id, updatedConsultation);
      await store.updatePatientStatus(state.consultation.patientId, 'completed');

      setState({
        consultation: updatedConsultation,
        labTests: state.labTests,
        isLoading: false,
        error: null
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: 'Failed to complete consultation',
        isLoading: false
      }));
      console.error('Error completing consultation:', err);
    }
  }, [state.consultation, state.labTests, store]);

  const loadConsultation = useCallback(async (consultationId: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const consultation = store.getCurrentConsultation(consultationId);
      const labTests = store.labTests[consultationId] || [];

      setState({
        consultation,
        labTests,
        isLoading: false,
        error: null
      });
    } catch (err) {
      setState(prev => ({
        ...prev,
        error: 'Failed to load consultation',
        isLoading: false
      }));
      console.error('Error loading consultation:', err);
    }
  }, [store]);

  return {
    ...state,
    startConsultation,
    updateConsultation,
    requestLabTests,
    completeConsultation,
    loadConsultation
  };
}
import { usePatientStore } from '../lib/store';
import type { Notification } from '../types';

export function useNavigationHandler() {
  const { 
    setCurrentSection, 
    setCurrentDepartment, 
    setCurrentPatient, 
    patientQueue, 
    labTests 
  } = usePatientStore();

  const handleNotificationAction = (notification: Notification) => {
    if (!notification.patientId) return;
    
    // Find the patient
    const patient = patientQueue.find(p => p.id === notification.patientId);
    if (!patient) return;
    
    // Set as current patient
    setCurrentPatient(patient);
    
    // Navigate based on action type
    switch (notification.action) {
      case 'view-results':
        // Navigate to the appropriate section based on the test type
        if (notification.testId) {
          const test = Object.values(labTests)
            .flat()
            .find(t => t.id === notification.testId);
            
          if (test) {
            if (test.department === 'laboratory') {
              setCurrentSection('consultation');
              setCurrentDepartment(patient.currentDepartment);
            } else if (test.department === 'radiology') {
              setCurrentSection('consultation');
              setCurrentDepartment(patient.currentDepartment);
            }
          }
        }
        break;
        
      case 'view-patient':
        // Navigate to the patient's current department
        setCurrentSection('consultation');
        setCurrentDepartment(patient.currentDepartment);
        break;
        
      default:
        // Default to patient management
        setCurrentSection('patient-management');
        setCurrentDepartment(patient.currentDepartment);
    }
  };

  return {
    handleNotificationAction
  };
}
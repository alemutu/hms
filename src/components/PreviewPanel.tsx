import React, { useEffect, useCallback, useRef } from 'react';
import { usePatientStore } from '../lib/store';
import { departments } from '../types/departments';

export const PreviewPanel = () => {
  const currentDepartment = usePatientStore((state) => state.currentDepartment);
  const patientQueue = usePatientStore((state) => state.patientQueue);
  
  // Use a ref to track the interval
  const intervalRef = useRef<number>();

  // Memoize the update function to prevent unnecessary re-renders
  const updateStats = useCallback(() => {
    const store = usePatientStore.getState();
    const activeDepartments = new Set<string>();
    
    // Add current department if it exists
    if (currentDepartment) {
      activeDepartments.add(currentDepartment);
    }

    // Add departments from patient queue
    patientQueue.forEach(patient => {
      if (patient.currentDepartment) {
        activeDepartments.add(patient.currentDepartment);
      }
      if (patient.nextDestination) {
        activeDepartments.add(patient.nextDestination);
      }
    });

    // Add key departments
    [
      departments.LABORATORY,
      departments.RADIOLOGY,
      departments.PHARMACY,
      departments.RECEPTION
    ].forEach(dept => {
      activeDepartments.add(dept);
    });

    // Update stats for each active department
    activeDepartments.forEach(dept => {
      store.updateDepartmentStats(dept);
    });
  }, [currentDepartment, patientQueue]);

  useEffect(() => {
    // Initial update
    updateStats();

    // Set up interval for periodic updates
    intervalRef.current = window.setInterval(updateStats, 60000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateStats]);

  return null;
};
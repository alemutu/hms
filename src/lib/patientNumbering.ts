import { format } from 'date-fns';
import { PatientNumberingSettings } from '../types';

// Default settings for patient numbering
export const defaultNumberingSettings: PatientNumberingSettings = {
  outpatient: {
    enabled: true,
    format: 'OP-{year}-{sequence}',
    startingSequence: 1,
    resetInterval: 'yearly',
    currentSequence: 1
  },
  inpatient: {
    enabled: true,
    format: 'IP-{year}-{sequence}',
    startingSequence: 1,
    resetInterval: 'yearly',
    currentSequence: 1
  },
  emergency: {
    enabled: true,
    format: 'EM-{year}-{sequence}',
    startingSequence: 1,
    resetInterval: 'yearly',
    currentSequence: 1
  }
};

// Get the current settings from localStorage or use defaults
export const getNumberingSettings = (): PatientNumberingSettings => {
  try {
    const savedSettings = localStorage.getItem('patientNumberingSettings');
    if (savedSettings) {
      return JSON.parse(savedSettings);
    }
  } catch (error) {
    console.error('Error loading patient numbering settings:', error);
  }
  
  return defaultNumberingSettings;
};

// Save settings to localStorage
export const saveNumberingSettings = (settings: PatientNumberingSettings): void => {
  try {
    localStorage.setItem('patientNumberingSettings', JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving patient numbering settings:', error);
  }
};

// Check if we need to reset the sequence based on the reset interval
const shouldResetSequence = (
  lastReset: string | undefined,
  resetInterval: 'daily' | 'monthly' | 'yearly' | 'never' | 'per-admission'
): boolean => {
  if (resetInterval === 'never' || !lastReset) {
    return false;
  }
  
  const now = new Date();
  const lastResetDate = new Date(lastReset);
  
  switch (resetInterval) {
    case 'daily':
      return (
        now.getDate() !== lastResetDate.getDate() ||
        now.getMonth() !== lastResetDate.getMonth() ||
        now.getFullYear() !== lastResetDate.getFullYear()
      );
    case 'monthly':
      return (
        now.getMonth() !== lastResetDate.getMonth() ||
        now.getFullYear() !== lastResetDate.getFullYear()
      );
    case 'yearly':
      return now.getFullYear() !== lastResetDate.getFullYear();
    case 'per-admission':
      // For inpatient, this is handled differently - each admission gets a new number
      return true;
    default:
      return false;
  }
};

// Generate a formatted patient number
const formatPatientNumber = (
  formatString: string,
  sequence: number,
  date: Date = new Date()
): string => {
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  // Format the sequence number with leading zeros
  const paddedSequence = sequence.toString().padStart(5, '0');
  
  return formatString
    .replace('{year}', year)
    .replace('{month}', month)
    .replace('{day}', day)
    .replace('{sequence}', paddedSequence);
};

// Generate a new outpatient number
export const generateOutpatientNumber = (): string => {
  const settings = getNumberingSettings();
  const { outpatient } = settings;
  
  if (!outpatient.enabled) {
    return '';
  }
  
  const now = new Date();
  
  // Check if we need to reset the sequence
  if (shouldResetSequence(outpatient.lastReset, outpatient.resetInterval)) {
    outpatient.currentSequence = outpatient.startingSequence;
  }
  
  // Generate the number
  const opNumber = formatPatientNumber(outpatient.format, outpatient.currentSequence, now);
  
  // Update the sequence and last reset date
  outpatient.currentSequence++;
  outpatient.lastReset = now.toISOString();
  
  // Save the updated settings
  saveNumberingSettings(settings);
  
  return opNumber;
};

// Generate a new inpatient number
export const generateInpatientNumber = (): string => {
  const settings = getNumberingSettings();
  const { inpatient } = settings;
  
  if (!inpatient.enabled) {
    return '';
  }
  
  const now = new Date();
  
  // For per-admission, we don't reset the sequence, just increment it
  if (inpatient.resetInterval !== 'per-admission') {
    // Check if we need to reset the sequence
    if (shouldResetSequence(inpatient.lastReset, inpatient.resetInterval)) {
      inpatient.currentSequence = inpatient.startingSequence;
    }
  }
  
  // Generate the number
  const ipNumber = formatPatientNumber(inpatient.format, inpatient.currentSequence, now);
  
  // Update the sequence and last reset date
  inpatient.currentSequence++;
  inpatient.lastReset = now.toISOString();
  
  // Save the updated settings
  saveNumberingSettings(settings);
  
  return ipNumber;
};

// Generate a new emergency number
export const generateEmergencyNumber = (): string => {
  const settings = getNumberingSettings();
  const { emergency } = settings;
  
  if (!emergency.enabled) {
    return '';
  }
  
  const now = new Date();
  
  // Check if we need to reset the sequence
  if (shouldResetSequence(emergency.lastReset, emergency.resetInterval)) {
    emergency.currentSequence = emergency.startingSequence;
  }
  
  // Generate the number
  const emNumber = formatPatientNumber(emergency.format, emergency.currentSequence, now);
  
  // Update the sequence and last reset date
  emergency.currentSequence++;
  emergency.lastReset = now.toISOString();
  
  // Save the updated settings
  saveNumberingSettings(settings);
  
  return emNumber;
};
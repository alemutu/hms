import { useState, useEffect, useRef, useCallback } from 'react';

interface AutosaveOptions<T> {
  data: T;
  onSave: (data: T) => Promise<void>;
  interval?: number;
  saveOnBlur?: boolean;
  saveOnUnmount?: boolean;
  debounceMs?: number;
  enabled?: boolean;
}

interface AutosaveResult {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  error: Error | null;
  save: () => Promise<void>;
  isSaving: boolean;
}

/**
 * A hook that provides autosave functionality
 * @param options Configuration options for autosave
 * @returns Status and control functions for the autosave process
 */
export function useAutosave<T>({
  data,
  onSave,
  interval = 30000, // Default: save every 30 seconds
  saveOnBlur = true,
  saveOnUnmount = true,
  debounceMs = 1000, // Default: debounce for 1 second
  enabled = true,
}: AutosaveOptions<T>): AutosaveResult {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [error, setError] = useState<Error | null>(null);
  
  const dataRef = useRef(data);
  const timeoutRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<number | null>(null);
  const hasUnsavedChanges = useRef(false);
  const isMounted = useRef(true);
  
  // Cleanup function to prevent updates after unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // The save function
  const saveData = useCallback(async () => {
    if (!hasUnsavedChanges.current || !enabled || !isMounted.current) return;
    
    try {
      setStatus('saving');
      await onSave(dataRef.current);
      
      if (isMounted.current) {
        setStatus('saved');
        setLastSaved(new Date());
        setError(null);
        hasUnsavedChanges.current = false;
      }
    } catch (err) {
      if (isMounted.current) {
        setStatus('error');
        setError(err instanceof Error ? err : new Error('Failed to save'));
        console.error('Autosave error:', err);
      }
    }
  }, [onSave, enabled]);
  
  // Update the ref when data changes
  useEffect(() => {
    const isEqual = JSON.stringify(dataRef.current) === JSON.stringify(data);
    if (!isEqual) {
      dataRef.current = data;
      hasUnsavedChanges.current = true;
      
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      if (enabled && isMounted.current) {
        debounceTimerRef.current = window.setTimeout(() => {
          if (isMounted.current) {
            saveData();
          }
        }, debounceMs);
      }
    }
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [data, debounceMs, enabled, saveData]);
  
  // Set up interval timer
  useEffect(() => {
    if (!enabled) return;
    
    // Clear any existing interval
    if (timeoutRef.current) {
      clearInterval(timeoutRef.current);
    }
    
    // Set up new interval
    timeoutRef.current = window.setInterval(() => {
      if (hasUnsavedChanges.current && isMounted.current) {
        saveData();
      }
    }, interval);
    
    return () => {
      if (timeoutRef.current) {
        clearInterval(timeoutRef.current);
      }
    };
  }, [interval, saveData, enabled]);
  
  // Save on blur if enabled
  useEffect(() => {
    if (!saveOnBlur || !enabled) return;
    
    const handleBlur = () => {
      if (hasUnsavedChanges.current && isMounted.current) {
        saveData();
      }
    };
    
    window.addEventListener('blur', handleBlur);
    
    return () => {
      window.removeEventListener('blur', handleBlur);
    };
  }, [saveOnBlur, saveData, enabled]);
  
  // Save on unmount if enabled
  useEffect(() => {
    return () => {
      if (saveOnUnmount && hasUnsavedChanges.current && enabled) {
        saveData();
      }
    };
  }, [saveOnUnmount, saveData, enabled]);
  
  // Manual save function
  const save = useCallback(async () => {
    await saveData();
  }, [saveData]);
  
  return {
    status,
    lastSaved,
    error,
    save,
    isSaving: status === 'saving',
  };
}
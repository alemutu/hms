import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

// Initialize the Supabase client with the provided URL and key
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://rsoowhcvtdbzgnmstrus.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJzb293aGN2dGRiemdubXN0cnVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgxNTY3NDEsImV4cCI6MjA2MzczMjc0MX0.Bs63uQjHpEuIBrxLRLLeh9eSWlb7NMV_5mopU05zDgc';

// Create a mock client for development
const mockClient = {
  auth: {
    getUser: async () => ({ data: { user: null }, error: null }),
    getSession: async () => ({ data: { session: null }, error: null }),
    signInWithPassword: async () => ({ data: { user: null }, error: null }),
    signUp: async () => ({ data: { user: null }, error: null }),
    signOut: async () => ({ error: null }),
    resetPasswordForEmail: async () => ({ error: null }),
    updateUser: async () => ({ error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } })
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        limit: async () => ({ data: [], error: null }),
        order: async () => ({ data: [], error: null })
      }),
      order: async () => ({ data: [], error: null }),
      limit: async () => ({ data: [], error: null })
    }),
    insert: () => ({
      select: () => ({
        single: async () => ({ data: null, error: null })
      })
    }),
    update: () => ({
      eq: () => ({
        select: () => ({
          single: async () => ({ data: null, error: null })
        })
      })
    })
  }),
  rpc: () => ({ data: null, error: null })
};

// Use the mock client for development
export const supabase = mockClient as any;

// Helper function to check if Supabase is available
export const isSupabaseAvailable = async (): Promise<boolean> => {
  return false; // Always return false in dev mode
};

// Error handling helper
export const handleSupabaseError = (error: any): string => {
  if (!error) return 'An unknown error occurred';
  
  // If it's an Error object, return its message
  if (error instanceof Error) {
    return error.message;
  }
  
  // If it's a Supabase error
  if (error.message) {
    return error.message;
  }
  
  // If it's a string, return it directly
  if (typeof error === 'string') {
    return error;
  }
  
  // For other types, return a generic message
  return 'An error occurred. Please try again later.';
};

// All other functions remain as stubs that return mock data
export const getUser = async () => null;
export const getUserByEmail = async () => null;
export const createUser = async () => null;
export const updateUser = async () => null;
export const getHospitals = async () => [];
export const getHospital = async () => null;
export const createHospital = async () => null;
export const updateHospital = async () => null;
export const getPatients = async () => [];
export const getPatient = async () => null;
export const createPatient = async () => null;
export const updatePatient = async () => null;
export const updatePatientStatus = async () => null;
export const assignPatientToDoctor = async () => null;
export const getPatientHistory = async () => null;
export const createConsultation = async () => null;
export const updateConsultation = async () => null;
export const completeConsultation = async () => null;
export const createLabTest = async () => null;
export const updateLabTest = async () => null;
export const createPrescription = async () => null;
export const updatePrescription = async () => null;
export const createInvoice = async () => null;
export const updateInvoice = async () => null;
export const processPayment = async () => null;
export const getServiceCharges = async () => [];
export const createServiceCharge = async () => null;
export const updateServiceCharge = async () => null;
export const getNotifications = async () => [];
export const createNotification = async () => null;
export const markNotificationAsRead = async () => null;
export const markAllNotificationsAsRead = async () => null;
export const getDepartmentStats = async () => [];
export const getFinancialSummary = async () => [];
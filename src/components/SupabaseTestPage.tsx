import React from 'react';
import { SupabaseConnectionTest } from './SupabaseConnectionTest';
import { ArrowLeft } from 'lucide-react';
import { usePatientStore } from '../lib/store';

export const SupabaseTestPage: React.FC = () => {
  const { setCurrentSection } = usePatientStore();
  
  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setCurrentSection('dashboard')}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h1 className="text-2xl font-bold text-gray-900">Supabase Connection Test</h1>
      </div>
      
      <div className="space-y-6">
        <p className="text-gray-600">
          This page tests the connection to your Supabase instance and displays basic information about the database.
        </p>
        
        <SupabaseConnectionTest />
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="font-medium text-blue-800 mb-2">Connection Details</h3>
          <p className="text-sm text-blue-700">
            URL: {import.meta.env.VITE_SUPABASE_URL || 'Not configured'}
          </p>
          <p className="text-sm text-blue-700 mt-1">
            Key: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '********' : 'Not configured'}
          </p>
        </div>
      </div>
    </div>
  );
};
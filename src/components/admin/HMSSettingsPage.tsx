import React, { useState } from 'react';
import { PatientNumberingSettings } from './PatientNumberingSettings';
import { UserManagement } from './UserManagement';
import { Settings, Users, Database, Server, Shield, FileText, Globe } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { usePatientStore } from '../../lib/store';

export const HMSSettingsPage = () => {
  const { user } = useAuth();
  const { setCurrentSection } = usePatientStore();
  const [activeTab, setActiveTab] = useState<'general' | 'patient-numbering' | 'users' | 'database' | 'security'>('users');

  // Check if user is super admin
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Check if user is hospital admin
  const isHospitalAdmin = user?.role === 'admin';

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="bg-white rounded-xl shadow-md border p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">System Settings</h2>
        
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('patient-numbering')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'patient-numbering'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Patient Numbering
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Users & Permissions
          </button>
          <button
            onClick={() => setActiveTab('database')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'database'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Database
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Security
          </button>
        </div>
        
        {activeTab === 'general' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
            </div>
            
            <p className="text-gray-600">
              General system settings will be available in a future update.
            </p>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Globe className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900">Supabase Connection</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Test your connection to the Supabase backend.
              </p>
              <button
                onClick={() => setCurrentSection('supabase-test')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Test Supabase Connection
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'patient-numbering' && (
          <PatientNumberingSettings />
        )}
        
        {activeTab === 'users' && (
          <UserManagement />
        )}
        
        {activeTab === 'database' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Database Settings</h3>
            </div>
            
            <p className="text-gray-600">
              Database configuration and backup settings will be available in a future update.
            </p>
            
            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Server className="w-5 h-5 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900">Supabase Connection</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Test your connection to the Supabase backend.
              </p>
              <button
                onClick={() => setCurrentSection('supabase-test')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Test Supabase Connection
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
            </div>
            
            <p className="text-gray-600">
              Security and authentication settings will be available in a future update.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
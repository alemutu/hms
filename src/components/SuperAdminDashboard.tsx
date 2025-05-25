import React, { useState } from 'react';
import { usePatientStore } from '../lib/store';
import { useAuth } from '../hooks/useAuth';
import {
  Settings,
  Users,
  Database,
  Server,
  Shield,
  FileText,
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit,
  Trash2,
  ExternalLink,
  Info
} from 'lucide-react';
import { HospitalManagement } from './admin/HospitalManagement';

export const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'hospitals' | 'users' | 'system' | 'security'>('hospitals');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Check if user is super admin
  const isSuperAdmin = user?.role === 'super_admin';
  
  if (!isSuperAdmin) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-center">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
        <p className="text-red-600">
          You need super administrator privileges to access this section.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Super Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">System-wide administration and management</p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{errorMessage}</p>
          <button 
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700">{successMessage}</p>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-md border p-6">
        <div className="flex border-b mb-6">
          <button
            onClick={() => setActiveTab('hospitals')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'hospitals'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>Hospitals</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>System Users</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'system'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              <span>System Settings</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span>Security</span>
            </div>
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'hospitals' && (
          <HospitalManagement />
        )}

        {activeTab === 'users' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">System Users Management</h3>
            </div>
            
            <p className="text-gray-600">
              Manage system-level administrators and users across all hospitals.
            </p>
            
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-700">Super Admin Access</h4>
              </div>
              <p className="text-sm text-blue-600">
                This section allows you to manage users with system-wide access. Use caution when granting super admin privileges.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'system' && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Server className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">System Settings</h3>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-medium text-gray-900">Database Configuration</h4>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Configure database settings and manage backups.
                </p>
                <button className="text-sm text-indigo-600 hover:text-indigo-800">
                  Manage Configuration
                </button>
              </div>
              
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Globe className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-gray-900">Domain Settings</h4>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Manage system domains and SSL certificates.
                </p>
                <button className="text-sm text-green-600 hover:text-green-800">
                  Manage Domains
                </button>
              </div>
              
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Mail className="w-5 h-5 text-blue-600" />
                  <h4 className="font-medium text-gray-900">Email Configuration</h4>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Configure system email settings and templates.
                </p>
                <button className="text-sm text-blue-600 hover:text-blue-800">
                  Manage Email Settings
                </button>
              </div>
              
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <CreditCard className="w-5 h-5 text-purple-600" />
                  <h4 className="font-medium text-gray-900">Payment Gateways</h4>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Configure payment providers and processing options.
                </p>
                <button className="text-sm text-purple-600 hover:text-purple-800">
                  Manage Payment Settings
                </button>
              </div>
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
            
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <h4 className="font-medium text-gray-900">Authentication</h4>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Configure authentication methods and security policies.
                </p>
                <button className="text-sm text-indigo-600 hover:text-indigo-800">
                  Manage Authentication
                </button>
              </div>
              
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <FileText className="w-5 h-5 text-green-600" />
                  <h4 className="font-medium text-gray-900">Audit Logs</h4>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  View system audit logs and security events.
                </p>
                <button className="text-sm text-green-600 hover:text-green-800">
                  View Logs
                </button>
              </div>
              
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-5 h-5 text-red-600" />
                  <h4 className="font-medium text-gray-900">Security Policies</h4>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Configure system-wide security policies and compliance settings.
                </p>
                <button className="text-sm text-red-600 hover:text-red-800">
                  Manage Policies
                </button>
              </div>
              
              <div className="bg-white rounded-lg border p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Database className="w-5 h-5 text-amber-600" />
                  <h4 className="font-medium text-gray-900">Data Protection</h4>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Configure data protection and privacy settings.
                </p>
                <button className="text-sm text-amber-600 hover:text-amber-800">
                  Manage Data Protection
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
import React, { useState } from 'react';
import { TenantSettings } from './TenantSettings';
import { TenantManagement } from './TenantManagement';
import { SystemSettings } from './SystemSettings';
import {
  Building2,
  Settings,
  Users,
  Shield,
  Database,
  Server,
  Globe,
  CreditCard,
  Package,
  FileText,
  BarChart3,
  HelpCircle,
  ChevronRight
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [activeSection, setActiveSection] = useState<'tenant' | 'system' | 'tenants'>('tenant');
  const [isSuperAdmin, setIsSuperAdmin] = useState(true); // For demo purposes

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
              <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                <h2 className="font-semibold text-lg">Settings</h2>
                <p className="text-sm text-blue-100">Manage your system</p>
              </div>
              
              <div className="p-2">
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveSection('tenant')}
                    className={`w-full flex items-center justify-between p-2 rounded-lg text-left ${
                      activeSection === 'tenant'
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5" />
                      <span className="font-medium">Hospital Settings</span>
                    </div>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  {isSuperAdmin && (
                    <>
                      <button
                        onClick={() => setActiveSection('tenants')}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left ${
                          activeSection === 'tenants'
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Globe className="w-5 h-5" />
                          <span className="font-medium">Hospital Management</span>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                      
                      <button
                        onClick={() => setActiveSection('system')}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-left ${
                          activeSection === 'system'
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Settings className="w-5 h-5" />
                          <span className="font-medium">System Settings</span>
                        </div>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="px-2 mb-2">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Other Settings
                    </h3>
                  </div>
                  <div className="space-y-1">
                    <button className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-gray-700 hover:bg-gray-50">
                      <Users className="w-5 h-5" />
                      <span className="font-medium">User Management</span>
                    </button>
                    <button className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-gray-700 hover:bg-gray-50">
                      <Shield className="w-5 h-5" />
                      <span className="font-medium">Roles & Permissions</span>
                    </button>
                    <button className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-gray-700 hover:bg-gray-50">
                      <Database className="w-5 h-5" />
                      <span className="font-medium">Backup & Restore</span>
                    </button>
                    <button className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-gray-700 hover:bg-gray-50">
                      <CreditCard className="w-5 h-5" />
                      <span className="font-medium">Billing & Invoices</span>
                    </button>
                    <button className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-gray-700 hover:bg-gray-50">
                      <Package className="w-5 h-5" />
                      <span className="font-medium">Modules</span>
                    </button>
                    <button className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-gray-700 hover:bg-gray-50">
                      <FileText className="w-5 h-5" />
                      <span className="font-medium">Logs</span>
                    </button>
                    <button className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-gray-700 hover:bg-gray-50">
                      <BarChart3 className="w-5 h-5" />
                      <span className="font-medium">Reports</span>
                    </button>
                    <button className="w-full flex items-center gap-2 p-2 rounded-lg text-left text-gray-700 hover:bg-gray-50">
                      <HelpCircle className="w-5 h-5" />
                      <span className="font-medium">Help & Support</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Super Admin Toggle (for demo) */}
            <div className="mt-4 p-4 bg-white rounded-xl shadow-sm border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-purple-600" />
                  <span className="font-medium text-gray-900">Super Admin Mode</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={isSuperAdmin}
                    onChange={() => setIsSuperAdmin(!isSuperAdmin)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Toggle to switch between hospital admin and platform super admin views.
              </p>
            </div>
          </div>
          
          {/* Main Content */}
          <div className="flex-1">
            {activeSection === 'tenant' && <TenantSettings />}
            {activeSection === 'system' && <SystemSettings />}
            {activeSection === 'tenants' && <TenantManagement />}
          </div>
        </div>
      </div>
    </div>
  );
};
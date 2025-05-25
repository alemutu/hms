import React, { useEffect, useCallback, useRef } from 'react';
import { usePatientStore } from '../lib/store';
import { departments, departmentNames, departmentGroups } from '../types/departments';
import { NotificationCenter } from './notifications/NotificationCenter';
import { NotificationManager } from './notifications/NotificationManager';
import { SmartSearch } from './SmartSearch';
import { PatientJourneyTracker } from './PatientJourneyTracker';
import { useAuthContext } from './auth/AuthProvider';
import { AuthModal } from './auth/AuthModal';
import { UserProfile } from './auth/UserProfile';
import { UserSwitcher } from './UserSwitcher';
import { 
  Menu, 
  User, 
  Home, 
  Users, 
  Activity,
  Bell,
  Search,
  Building2,
  Stethoscope,
  Baby,
  UserRound,
  Scissors,
  Bone,
  Bluetooth as Tooth,
  Eye,
  HeartPulse,
  UserPlus,
  LayoutDashboard,
  CalendarClock,
  TestTube,
  Radio,
  Pill,
  Settings,
  CircleOff,
  CircleDot,
  Orbit,
  Sparkles,
  Hourglass,
  Layers,
  Banknote,
  CreditCard,
  Receipt,
  Package,
  DollarSign,
  Heart,
  ChevronDown,
  ChevronRight,
  LogOut,
  HelpCircle,
  FileText,
  Shield,
  Clipboard,
  CalendarDays,
  Globe,
  LogIn,
  Play,
  ChevronUp,
  Clock
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { 
    currentDepartment, 
    setCurrentDepartment, 
    currentSection, 
    setCurrentSection, 
    patientQueue, 
    currentPatient,
    notifications,
    unreadNotificationsCount
  } = usePatientStore();
  
  const { user, isAuthenticated } = useAuthContext();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [collapsedSections, setCollapsedSections] = React.useState<Record<string, boolean>>({
    clinical: false,
    diagnostics: false,
    billing: false
  });
  const [showPatientJourney, setShowPatientJourney] = React.useState(false);
  const [showAuthModal, setShowAuthModal] = React.useState(false);
  const [showUserProfile, setShowUserProfile] = React.useState(false);
  const [showUserSwitcher, setShowUserSwitcher] = React.useState(false);
  const [showContinueWorkflow, setShowContinueWorkflow] = React.useState(false);

  // Check for patients with paused workflows
  const pausedWorkflows = React.useMemo(() => {
    return patientQueue.filter(patient => {
      // Check for paused triage
      if (patient.inTriageTime && !patient.triageCompleteTime && patient.status !== 'in-triage') {
        return true;
      }
      
      // Check for paused consultation
      if (patient.inConsultationTime && !patient.consultationCompleteTime && patient.status !== 'in-consultation') {
        return true;
      }
      
      // Check for paused lab work
      if (patient.inLabTime && !patient.labCompleteTime && patient.status !== 'in-lab') {
        return true;
      }
      
      // Check for paused radiology work
      if (patient.inRadiologyTime && !patient.radiologyCompleteTime && patient.status !== 'in-radiology') {
        return true;
      }
      
      // Check for paused pharmacy work
      if (patient.inPharmacyTime && !patient.pharmacyCompleteTime && patient.status !== 'in-pharmacy') {
        return true;
      }
      
      return false;
    });
  }, [patientQueue]);

  const toggleSection = (section: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getDepartmentIcon = (departmentCode: string) => {
    switch (departmentCode) {
      case departments.GENERAL:
        return Stethoscope;
      case departments.PEDIATRICS:
        return Baby;
      case departments.GYNECOLOGY:
        return Heart; 
      case departments.SURGICAL:
        return Scissors;
      case departments.ORTHOPEDIC:
        return Bone;
      case departments.DENTAL:
        return Tooth;
      case departments.EYE:
        return Eye;
      case departments.PHYSIOTHERAPY:
        return HeartPulse;
      default:
        return Building2;
    }
  };

  const mainMenuItems = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Overview' },
    { id: 'reception', icon: Users, label: 'Reception' },
    { id: 'appointments', icon: CalendarClock, label: 'Appointments' },
  ];

  const patientCareItems = [
    { id: 'triage', icon: Activity, label: 'Triage' },
    { id: 'consultation', icon: Stethoscope, label: 'Consultations' },
  ];

  const clinicalDepartments = departmentGroups.CLINICAL.map(dept => ({
    id: dept,
    icon: getDepartmentIcon(dept),
    label: departmentNames[dept],
    type: 'department'
  }));

  const diagnosticItems = [
    { id: departments.LABORATORY, icon: TestTube, label: 'Laboratory', type: 'department' },
    { id: departments.RADIOLOGY, icon: Radio, label: 'Radiology', type: 'department' }
  ];

  const billingItems = [
    { id: 'billing', icon: Banknote, label: 'Billing Dashboard', type: 'section' },
    { id: 'service-charges', icon: DollarSign, label: 'Service Charges', type: 'section' },
    { id: 'invoices', icon: Receipt, label: 'Invoices', type: 'section' },
    { id: departments.PHARMACY, icon: Pill, label: 'Pharmacy', type: 'department' },
  ];

  const systemItems = [
    { id: 'admin', icon: Settings, label: 'Settings' },
    { id: 'records', icon: Package, label: 'Medical Records' },
  ];

  // Super admin section
  const superAdminItems = [
    { id: 'super-admin', icon: Shield, label: 'Super Admin' },
  ];

  const handleMenuClick = (itemId: string, type?: string) => {
    if (type === 'department') {
      setCurrentSection('consultation');
      setCurrentDepartment(itemId);
    } else if (type === 'section') {
      setCurrentSection(itemId);
      setCurrentDepartment(null);
    } else {
      setCurrentSection(itemId);
      setCurrentDepartment(null);
    }
  };

  const renderMenuItems = (items: any[]) => (
    <div className="space-y-1">
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => handleMenuClick(item.id, item.type)}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
            (item.type === 'department' 
              ? currentSection === 'consultation' && currentDepartment === item.id
              : currentSection === item.id)
              ? 'bg-blue-50 text-blue-600 font-medium'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
        >
          <item.icon className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm truncate">{item.label}</span>
        </button>
      ))}
    </div>
  );

  const renderCollapsibleSection = (title: string, items: any[], sectionKey: string) => (
    <div className="mb-2">
      <button 
        onClick={() => toggleSection(sectionKey)}
        className="w-full flex items-center justify-between px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-600"
      >
        <span>{title}</span>
        {collapsedSections[sectionKey] ? (
          <ChevronRight className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      {!collapsedSections[sectionKey] && renderMenuItems(items)}
    </div>
  );

  // Check if user is super admin
  const showSuperAdminSection = user?.role === 'super_admin';

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-64 bg-white h-screen shadow-lg flex flex-col border-r fixed left-0 top-0 bottom-0 z-10">
        {/* Logo */}
        <div className="p-4 border-b">
          <div className="flex items-center gap-2">
            <Search className="w-7 h-7 text-blue-600" />
            <h1 className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              searchable
            </h1>
          </div>
        </div>

        {/* Search */}
        <div className="px-3 py-3">
          <SmartSearch />
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-2 overflow-y-auto scrollbar-thin">
          <div className="space-y-6">
            {/* Main Menu */}
            <div>
              <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Main Menu
              </p>
              {renderMenuItems(mainMenuItems)}
            </div>
            
            {/* Super Admin Section - Only shown to super admins */}
            {showSuperAdminSection && (
              <div>
                <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Super Admin
                </p>
                {renderMenuItems(superAdminItems)}
              </div>
            )}
            
            {/* Patient Care */}
            <div>
              <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Patient Care
              </p>
              {renderMenuItems(patientCareItems)}
            </div>
            
            {/* Clinical Departments */}
            {renderCollapsibleSection('Clinical Departments', clinicalDepartments, 'clinical')}
            
            {/* Diagnostics */}
            {renderCollapsibleSection('Diagnostics', diagnosticItems, 'diagnostics')}
            
            {/* Billing & Pharmacy */}
            {renderCollapsibleSection('Billing & Pharmacy', billingItems, 'billing')}
            
            {/* System */}
            <div>
              <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                System
              </p>
              {renderMenuItems(systemItems)}
            </div>
          </div>
        </nav>

        {/* User Profile */}
        <div className="p-3 border-t">
          {isAuthenticated ? (
            <div 
              className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              onClick={() => setShowUserSwitcher(!showUserSwitcher)}
            >
              <img
                src="https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=50&h=50&fit=crop"
                alt="Doctor"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">{user?.name || 'Guest'}</h3>
                <p className="text-xs text-gray-500 truncate">{user?.role?.replace('_', ' ') || 'Not logged in'}</p>
              </div>
              <button className="p-1 hover:bg-gray-200 rounded-full">
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowAuthModal(true)}
              className="flex items-center gap-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      <main className="flex-1 flex flex-col ml-64">
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-8 py-4">
            <button className="p-2 hover:bg-gray-100 rounded-lg">
              <Menu className="w-6 h-6 text-gray-600" />
            </button>
            {currentSection === 'reception' && (
              <button
                onClick={() => setCurrentSection('registration')}
                className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                <UserPlus className="w-5 h-5" />
                <span>New Patient</span>
              </button>
            )}
            <div className="flex items-center gap-4">
              {pausedWorkflows.length > 0 && (
                <button
                  onClick={() => setShowContinueWorkflow(!showContinueWorkflow)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100 transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span className="text-sm">Continue Workflows ({pausedWorkflows.length})</span>
                </button>
              )}
              
              {currentPatient && (
                <button
                  onClick={() => setShowPatientJourney(!showPatientJourney)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Hourglass className="w-4 h-4" />
                  <span className="text-sm">Patient Journey</span>
                </button>
              )}
              <NotificationCenter />
              <div className="h-6 w-px bg-gray-200"></div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">Welcome back,</span>
                <span className="text-sm font-medium text-gray-900">{user?.name || 'Guest'}</span>
              </div>
            </div>
          </div>
        </header>
        <div className="flex-1 p-8 overflow-y-auto">
          {children}
        </div>
        
        {/* Footer */}
        <footer className="bg-white border-t py-4 px-8 text-center text-sm text-gray-500 w-full">
          All rights reserved © Gosearch Link
        </footer>
        
        {/* Dev Mode User Switcher */}
        {process.env.NODE_ENV === 'development' && showUserSwitcher && (
          <div className="fixed top-20 right-8 z-40 w-80 shadow-xl">
            <UserSwitcher />
          </div>
        )}
        
        {/* Patient Journey Tracker Popup */}
        {showPatientJourney && currentPatient && (
          <div className="fixed top-20 right-8 z-40 w-80 shadow-xl">
            <div className="bg-white rounded-lg shadow-lg border">
              <div className="p-3 bg-blue-600 text-white rounded-t-lg flex items-center justify-between">
                <h3 className="font-medium">Patient Journey</h3>
                <button 
                  onClick={() => setShowPatientJourney(false)}
                  className="p-1 hover:bg-blue-500 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <PatientJourneyTracker patientId={currentPatient.id} />
            </div>
          </div>
        )}
        
        {/* Continue Workflow Popup */}
        {showContinueWorkflow && pausedWorkflows.length > 0 && (
          <div className="fixed top-20 right-8 z-40 w-96 shadow-xl">
            <div className="bg-white rounded-lg shadow-lg border">
              <div className="p-3 bg-amber-600 text-white rounded-t-lg flex items-center justify-between">
                <h3 className="font-medium">Continue Workflows</h3>
                <button 
                  onClick={() => setShowContinueWorkflow(false)}
                  className="p-1 hover:bg-amber-500 rounded-full"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-4 max-h-96 overflow-y-auto">
                <p className="text-sm text-gray-600 mb-3">
                  The following patients have paused workflows that can be continued:
                </p>
                <div className="space-y-3">
                  {pausedWorkflows.map(patient => {
                    // Determine workflow type
                    let workflowType = '';
                    let icon = Clock;
                    let color = 'gray';
                    let departmentToGo = '';
                    
                    if (patient.inTriageTime && !patient.triageCompleteTime) {
                      workflowType = 'Triage';
                      icon = Activity;
                      color = 'indigo';
                      departmentToGo = 'triage';
                    } else if (patient.inConsultationTime && !patient.consultationCompleteTime) {
                      workflowType = 'Consultation';
                      icon = Stethoscope;
                      color = 'blue';
                      departmentToGo = patient.currentDepartment;
                    } else if (patient.inLabTime && !patient.labCompleteTime) {
                      workflowType = 'Laboratory';
                      icon = TestTube;
                      color = 'purple';
                      departmentToGo = 'laboratory';
                    } else if (patient.inRadiologyTime && !patient.radiologyCompleteTime) {
                      workflowType = 'Radiology';
                      icon = Radio;
                      color = 'cyan';
                      departmentToGo = 'radiology';
                    } else if (patient.inPharmacyTime && !patient.pharmacyCompleteTime) {
                      workflowType = 'Pharmacy';
                      icon = Pill;
                      color = 'green';
                      departmentToGo = 'pharmacy';
                    }
                    
                    const Icon = icon;
                    
                    return (
                      <div 
                        key={patient.id} 
                        className={`p-3 bg-${color}-50 rounded-lg border border-${color}-100`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 bg-${color}-100 rounded-lg`}>
                              <Icon className={`w-4 h-4 text-${color}-600`} />
                            </div>
                            <span className="font-medium text-gray-900">{patient.fullName}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-xs ${
                            patient.priority === 'urgent' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {patient.priority}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          Paused {workflowType} workflow started {patient.inTriageTime ? format(new Date(patient.inTriageTime), 'MMM d, h:mm a') : ''}
                        </p>
                        <button
                          onClick={() => {
                            setCurrentSection(departmentToGo);
                            setCurrentDepartment(departmentToGo === 'consultation' ? patient.currentDepartment : null);
                            setShowContinueWorkflow(false);
                          }}
                          className={`w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-${color}-600 text-white rounded-lg hover:bg-${color}-700 text-sm`}
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Continue {workflowType}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* User Profile Popup */}
        {showUserProfile && (
          <div className="fixed top-20 right-8 z-40 w-80 shadow-xl">
            <UserProfile />
          </div>
        )}
        
        {/* Auth Modal */}
        <AuthModal 
          isOpen={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </main>
      
      {/* Notification Manager for toast notifications */}
      <NotificationManager />
    </div>
  );
};
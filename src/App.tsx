import * as React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { usePatientStore } from './lib/store';
import { departments } from './types/departments';
import { Layout } from './components/Layout';
import { ReceptionDashboard } from './components/ReceptionDashboard';
import { PatientRegistration } from './components/PatientRegistration';
import { DoctorDashboard } from './components/DoctorDashboard';
import { DepartmentDashboard } from './components/DepartmentDashboard';
import { PharmacyDashboard } from './components/PharmacyDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { AppointmentScheduler } from './components/AppointmentScheduler';
import { MedicalRecordsViewer } from './components/MedicalRecordsViewer';
import { LaboratoryDashboard } from './components/LaboratoryDashboard';
import { RadiologyDashboard } from './components/RadiologyDashboard';
import { TriageDashboard } from './components/triage/TriageDashboard';
import { OverviewDashboard } from './components/OverviewDashboard';
import { BillingDashboard } from './components/billing/BillingDashboard';
import { ServiceChargesPage } from './components/billing/ServiceChargesPage';
import { PreviewPanel } from './components/PreviewPanel';
import { AuthProvider } from './components/auth/AuthProvider';
import { LoginPage } from './components/auth/LoginPage';
import { SignUpPage } from './components/auth/SignUpPage';
import { ResetPasswordPage } from './components/auth/ResetPasswordPage';
import { UpdatePasswordPage } from './components/auth/UpdatePasswordPage';
import { UnauthorizedPage } from './components/auth/UnauthorizedPage';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SuperAdminDashboard } from './components/SuperAdminDashboard';
import { Loader2 } from 'lucide-react';
import { SupabaseTestPage } from './components/SupabaseTestPage';

function App() {
  const { 
    currentSection, 
    currentDepartment,
    fetchPatients,
    fetchServiceCharges,
    fetchMedicationStock,
    fetchNotifications,
    error
  } = usePatientStore();
  
  const [initialized, setInitialized] = React.useState(false);
  const [initError, setInitError] = React.useState<string | null>(null);

  // Initialize data
  React.useEffect(() => {
    const initializeData = async () => {
      try {
        setInitError(null);
        
        // Fetch initial data with error handling for each call
        await Promise.allSettled([
          fetchPatients().catch(err => console.error('Error fetching patients:', err)),
          fetchServiceCharges().catch(err => console.error('Error fetching service charges:', err)),
          fetchMedicationStock().catch(err => console.error('Error fetching medication stock:', err)),
          fetchNotifications().catch(err => console.error('Error fetching notifications:', err))
        ]);
        
        setInitialized(true);
      } catch (error) {
        console.error('Error initializing data:', error);
        setInitError(
          error instanceof Error 
            ? error.message 
            : 'Failed to initialize application data. Please try again.'
        );
      }
    };
    
    initializeData();
  }, [fetchPatients, fetchServiceCharges, fetchMedicationStock, fetchNotifications]);

  const renderConsultationContent = () => {
    if (currentDepartment === departments.LABORATORY) {
      return <LaboratoryDashboard />;
    }
    if (currentDepartment === departments.RADIOLOGY) {
      return <RadiologyDashboard />;
    }
    if (currentDepartment === departments.PHARMACY) {
      return <PharmacyDashboard />;
    }
    return currentDepartment ? <DepartmentDashboard /> : <DoctorDashboard />;
  };

  // Show loading state while initializing
  if (!initialized) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading application data...</p>
          {(error || initError) && (
            <div className="mt-4">
              <p className="text-red-600">{error || initError}</p>
              <p className="text-sm text-gray-500 mt-2">
                Please check your internet connection and refresh the page.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <AuthProvider>
      <Routes>
        <Route path="/sign-in" element={<LoginPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />
        <Route path="/" element={
          process.env.NODE_ENV === 'development' ? (
            <Layout>
              {renderContent()}
              <PreviewPanel />
            </Layout>
          ) : (
            <ProtectedRoute>
              <Layout>
                {renderContent()}
                <PreviewPanel />
              </Layout>
            </ProtectedRoute>
          )
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );

  function renderContent() {
    const contentMap: Record<string, React.ReactNode> = {
      dashboard: <OverviewDashboard />,
      reception: <ReceptionDashboard />,
      registration: <PatientRegistration />,
      triage: <TriageDashboard />,
      consultation: renderConsultationContent(),
      admin: <AdminDashboard />,
      appointments: <AppointmentScheduler />,
      records: <MedicalRecordsViewer />,
      billing: <BillingDashboard />,
      'service-charges': <ServiceChargesPage />,
      'super-admin': <SuperAdminDashboard />,
      'supabase-test': <SupabaseTestPage />
    };

    return contentMap[currentSection] || <OverviewDashboard />;
  }
}

export default App;
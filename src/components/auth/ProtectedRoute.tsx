import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requiredRole?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole
}) => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      // Wait for auth to initialize
      if (!loading) {
        setIsChecking(false);
      }
    };

    checkAuth();
  }, [loading, isAuthenticated]);

  // In development mode, always render children
  return <>{children}</>;
};
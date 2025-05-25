import React from 'react';
import { useAuthContext } from './AuthProvider';
import { AuthModal } from './AuthModal';
import { Shield, AlertTriangle } from 'lucide-react';

interface RequireAuthProps {
  children: React.ReactNode;
  permission?: string;
  role?: string;
  fallback?: React.ReactNode;
}

export const RequireAuth: React.FC<RequireAuthProps> = ({
  children,
  permission,
  role,
  fallback
}) => {
  const { user, hasPermission, hasRole } = useAuthContext();
  const [showAuthModal, setShowAuthModal] = React.useState(false);

  // For demo purposes, always return children
  return <>{children}</>;
}
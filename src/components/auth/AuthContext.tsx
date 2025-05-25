import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '../../types/users';
import { Loader2 } from 'lucide-react';
import { defaultUsers } from '../../types/users';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (email: string, password: string, userData: { firstName: string; lastName: string; role?: string; department?: string }) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (userData: Partial<User>) => Promise<{ success: boolean; error?: string }>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // For demo purposes, set a default user
    setUser(defaultUsers[0]);
    setLoading(false);
  }, []);

  // Mock authentication functions for demo
  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Find user by email (mock implementation)
      const user = defaultUsers.find(u => u.email === email);
      if (user) {
        setUser(user);
        return { success: true };
      }
      return { success: false, error: 'Invalid email or password' };
    } catch (error) {
      console.error('Sign in error:', error);
      return { success: false, error: 'An error occurred during sign in' };
    }
  };

  const signUp = async (
    email: string, 
    password: string, 
    userData: { firstName: string; lastName: string; role?: string; department?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Mock successful signup
      return { success: true };
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: 'An error occurred during sign up' };
    }
  };

  const signOut = async (): Promise<void> => {
    setUser(null);
  };

  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Mock successful password reset
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'An error occurred during password reset' };
    }
  };

  const updatePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Mock successful password update
      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, error: 'An error occurred during password update' };
    }
  };

  const updateProfile = async (userData: Partial<User>): Promise<{ success: boolean; error?: string }> => {
    try {
      if (user) {
        setUser({ ...user, ...userData });
      }
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'An error occurred during profile update' };
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const hasRole = (role: string): boolean => {
    if (!user) return false;
    return user.role === role;
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updatePassword,
    updateProfile,
    hasPermission,
    hasRole,
    isAuthenticated: !!user
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export { AuthContext }
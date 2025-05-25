import React, { createContext, useState, useEffect } from 'react';
import { usePatientStore } from '../../lib/store';
import { User } from '../../types/users';
import { Loader2 } from 'lucide-react';
import { auth } from '../../lib/auth';
import { defaultUsers } from '../../types/users';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, userData: { firstName: string; lastName: string; role?: string; department?: string }) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (password: string) => Promise<{ success: boolean; error?: string }>;
  hasPermission: (permission: string) => boolean;
  hasRole: (role: string) => boolean;
  isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => false,
  logout: async () => {},
  signUp: async () => ({ success: false }),
  resetPassword: async () => ({ success: false }),
  updatePassword: async () => ({ success: false }),
  hasPermission: () => false,
  hasRole: () => false,
  isAuthenticated: false
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(defaultUsers[1]); // Start with hospital admin user
  const [loading, setLoading] = useState(false);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const currentUser = await auth.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
        setUser(defaultUsers[1]); // Fallback to hospital admin user
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const success = await auth.login(email, password);
      
      if (success) {
        const currentUser = await auth.getCurrentUser();
        setUser(currentUser);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await auth.logout();
      setUser(defaultUsers[1]); // Reset to hospital admin
    } catch (error) {
      console.error('Logout error:', error);
    }
  };
  
  const signUp = async (
    email: string, 
    password: string, 
    userData: { firstName: string; lastName: string; role?: string; department?: string }
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      const result = await auth.signUp(email, password, userData);
      
      if (result.success) {
        const currentUser = await auth.getCurrentUser();
        setUser(currentUser);
      }
      
      return result;
    } catch (error) {
      console.error('Sign up error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'An error occurred during sign up' };
    } finally {
      setLoading(false);
    }
  };
  
  const resetPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      return await auth.resetPassword(email);
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'An error occurred during password reset' };
    } finally {
      setLoading(false);
    }
  };
  
  const updatePassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setLoading(true);
      return await auth.updatePassword(password);
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'An error occurred during password update' };
    } finally {
      setLoading(false);
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

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        loading, 
        login, 
        logout, 
        signUp,
        resetPassword,
        updatePassword,
        hasPermission, 
        hasRole, 
        isAuthenticated: !!user 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => React.useContext(AuthContext);
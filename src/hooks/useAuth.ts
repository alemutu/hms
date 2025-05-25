import { useState, useEffect } from 'react';
import { User } from '../types/users';
import { auth } from '../lib/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      try {
        const currentUser = await auth.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error loading user:', error);
        setUser(null);
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

  const logout = async () => {
    try {
      setLoading(true);
      await auth.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const signUp = async (email: string, password: string, userData: any) => {
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
      return { success: false, error: 'An unexpected error occurred during sign up' };
    } finally {
      setLoading(false);
    }
  };
  
  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      return await auth.resetPassword(email);
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'An unexpected error occurred during password reset' };
    } finally {
      setLoading(false);
    }
  };
  
  const updatePassword = async (password: string) => {
    try {
      setLoading(true);
      return await auth.updatePassword(password);
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, error: 'An unexpected error occurred during password update' };
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const hasRole = (role: string) => {
    if (!user) return false;
    return user.role === role;
  };

  return {
    user,
    loading,
    login,
    logout,
    signUp,
    resetPassword,
    updatePassword,
    isAuthenticated: !!user,
    hasPermission,
    hasRole
  };
}
import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { 
  Lock, 
  Mail, 
  User, 
  LogIn, 
  UserPlus, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  RefreshCw,
  ArrowRight,
  Shield
} from 'lucide-react';

interface AuthFormProps {
  mode?: 'login' | 'register' | 'reset';
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const AuthForm: React.FC<AuthFormProps> = ({ 
  mode = 'login',
  onSuccess,
  onCancel
}) => {
  const { login } = useAuth();
  const [formMode, setFormMode] = useState<'login' | 'register' | 'reset'>(mode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formTouched, setFormTouched] = useState(false);

  const validateForm = () => {
    setError(null);
    
    if (!email) {
      setError('Email is required');
      return false;
    }
    
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return false;
    }
    
    if (formMode !== 'reset') {
      if (!password) {
        setError('Password is required');
        return false;
      }
      
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
    }
    
    if (formMode === 'register') {
      if (!fullName) {
        setError('Full name is required');
        return false;
      }
      
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    }
    
    return true;
  };

  const handleInputChange = () => {
    setFormTouched(true);
    // Clear any previous errors when the user starts typing
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (formMode === 'login') {
        // For demo purposes, use the useAuth hook's login method
        const success = await login(email, password);
        
        if (success) {
          setSuccess('Login successful!');
          if (onSuccess) onSuccess();
        } else {
          setError('Invalid email or password');
        }
      } else if (formMode === 'register') {
        // In a real app, this would use Supabase Auth
        setSuccess('Registration successful! Please check your email for verification.');
      } else if (formMode === 'reset') {
        // In a real app, this would use Supabase Auth
        setSuccess('Password reset instructions have been sent to your email.');
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = (newMode: 'login' | 'register' | 'reset') => {
    setFormMode(newMode);
    setError(null);
    setSuccess(null);
    setFormTouched(false);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border p-6 w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          {formMode === 'login' ? (
            <LogIn className="w-6 h-6 text-blue-600" />
          ) : formMode === 'register' ? (
            <UserPlus className="w-6 h-6 text-blue-600" />
          ) : (
            <Shield className="w-6 h-6 text-blue-600" />
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {formMode === 'login' ? 'Sign In' : formMode === 'register' ? 'Create Account' : 'Reset Password'}
        </h2>
        <p className="text-gray-500 mt-1">
          {formMode === 'login' 
            ? 'Sign in to access your account' 
            : formMode === 'register' 
            ? 'Create a new account to get started' 
            : 'Enter your email to reset your password'}
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{success}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Full Name - Only for Register */}
        {formMode === 'register' && (
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  handleInputChange();
                }}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your full name"
              />
            </div>
          </div>
        )}

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                handleInputChange();
              }}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter your email"
            />
          </div>
        </div>

        {/* Password - Not for Reset */}
        {formMode !== 'reset' && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  handleInputChange();
                }}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
          </div>
        )}

        {/* Confirm Password - Only for Register */}
        {formMode === 'register' && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  handleInputChange();
                }}
                className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Confirm your password"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading || !!success || !formTouched}
          className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg ${
            isLoading || !!success || !formTouched
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Processing...</span>
            </>
          ) : (
            <>
              {formMode === 'login' ? (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>Sign In</span>
                </>
              ) : formMode === 'register' ? (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Create Account</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-5 h-5" />
                  <span>Reset Password</span>
                </>
              )}
            </>
          )}
        </button>

        {/* Mode Toggle Links */}
        <div className="mt-4 text-center text-sm">
          {formMode === 'login' ? (
            <div className="space-y-2">
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => toggleMode('register')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Sign Up
                </button>
              </p>
              <p>
                <button
                  type="button"
                  onClick={() => toggleMode('reset')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  Forgot Password?
                </button>
              </p>
            </div>
          ) : (
            <p>
              {formMode === 'register' ? 'Already have an account? ' : 'Remember your password? '}
              <button
                type="button"
                onClick={() => toggleMode('login')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Sign In
              </button>
            </p>
          )}
        </div>
      </form>

      {/* Cancel Button */}
      {onCancel && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
};
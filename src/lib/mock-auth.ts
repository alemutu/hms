import { User, UserRole, rolePermissions } from '../types/users';

// Mock users for development
const mockUsers: User[] = [
  {
    id: 'super-admin-1',
    name: 'System Administrator',
    email: 'admin@example.com',
    role: 'super_admin',
    status: 'active',
    permissions: rolePermissions.super_admin,
    admin_role: 'super_admin'
  },
  {
    id: 'admin-1',
    name: 'Hospital Admin',
    email: 'hospital-admin@example.com',
    role: 'admin',
    status: 'active',
    permissions: rolePermissions.admin,
    hospital_id: 'hospital-1'
  },
  {
    id: 'reception-1',
    name: 'Jane Smith',
    email: 'reception@example.com',
    role: 'receptionist',
    department: 'reception',
    status: 'active',
    permissions: rolePermissions.receptionist
  },
  {
    id: 'doctor-1',
    name: 'Dr. Sarah Chen',
    email: 'doctor@example.com',
    role: 'doctor',
    department: 'general-consultation',
    specialization: 'Internal Medicine',
    status: 'active',
    permissions: rolePermissions.doctor
  }
];

// Store the current user in memory
let currentUser: User = mockUsers[1]; // Default to hospital admin user

export const mockAuth = {
  getCurrentUser: async (): Promise<User> => {
    return currentUser;
  },
  
  login: async (email: string, password: string): Promise<boolean> => {
    // For development, accept any password but require a valid email
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (user) {
      currentUser = user;
      return true;
    }
    
    return false;
  },
  
  logout: async (): Promise<void> => {
    currentUser = mockUsers[1]; // Reset to hospital admin
  },
  
  signUp: async (email: string, password: string, userData: any): Promise<{ success: boolean; error?: string }> => {
    // Check if email already exists
    if (mockUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Email already in use' };
    }
    
    // Create new user
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: `${userData.firstName} ${userData.lastName}`,
      email,
      role: (userData.role as UserRole) || 'doctor',
      department: userData.department,
      status: 'active',
      permissions: rolePermissions[userData.role as UserRole] || rolePermissions.doctor
    };
    
    // Add to mock users
    mockUsers.push(newUser);
    
    // Auto login
    currentUser = newUser;
    
    return { success: true };
  },
  
  resetPassword: async (email: string): Promise<{ success: boolean; error?: string }> => {
    // Check if email exists
    if (!mockUsers.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return { success: false, error: 'Email not found' };
    }
    
    return { success: true };
  },
  
  updatePassword: async (password: string): Promise<{ success: boolean; error?: string }> => {
    return { success: true };
  },
  
  hasPermission: (permission: string): boolean => {
    return currentUser.permissions.includes(permission);
  },
  
  hasRole: (role: string): boolean => {
    return currentUser.role === role;
  },
  
  isAuthenticated: async (): Promise<boolean> => {
    return true; // Always authenticated in dev mode
  }
};
import React, { useState, useEffect } from 'react';
import { usePatientStore } from '../../lib/store';
import { useAuth } from '../../hooks/useAuth';
import {
  Users,
  UserPlus,
  UserMinus,
  UserCog,
  Search,
  Filter,
  MoreVertical,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Edit,
  Trash2,
  Lock,
  Mail,
  Building2,
  Shield,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  Save
} from 'lucide-react';
import { departmentNames } from '../../types/departments';
import { User, UserRole, rolePermissions } from '../../types/users';

export const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedUsers, setExpandedUsers] = useState<Record<string, boolean>>({});

  // Mock users data
  const mockUsers: User[] = [
    {
      id: 'user1',
      name: 'Dr. Sarah Chen',
      email: 'sarah.chen@hospital.com',
      role: 'doctor',
      department: 'general-consultation',
      specialization: 'Internal Medicine',
      status: 'active',
      permissions: rolePermissions.doctor,
      hospital_id: '1'
    },
    {
      id: 'user2',
      name: 'Jane Smith',
      email: 'jane.smith@hospital.com',
      role: 'receptionist',
      department: 'reception',
      status: 'active',
      permissions: rolePermissions.receptionist,
      hospital_id: '1'
    },
    {
      id: 'user3',
      name: 'Michael Johnson',
      email: 'michael.johnson@hospital.com',
      role: 'lab_technician',
      department: 'laboratory',
      status: 'active',
      permissions: rolePermissions.lab_technician,
      hospital_id: '1'
    }
  ];

  // Fetch users - mock implementation
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setUsers(mockUsers);
      setFilteredUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter users based on search query and filters
  useEffect(() => {
    let filtered = [...users];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(user => 
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply role filter
    if (selectedRole !== 'all') {
      filtered = filtered.filter(user => user.role === selectedRole);
    }
    
    // Apply department filter
    if (selectedDepartment !== 'all') {
      filtered = filtered.filter(user => user.department === selectedDepartment);
    }
    
    setFilteredUsers(filtered);
  }, [users, searchQuery, selectedRole, selectedDepartment]);

  // Load users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Toggle user expanded state
  const toggleUserExpanded = (userId: string) => {
    setExpandedUsers(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Create a new user
  const createUser = async (userData: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    department?: string;
    specialization?: string;
  }) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Mock implementation
      const newUser: User = {
        id: crypto.randomUUID(),
        email: userData.email,
        name: userData.name,
        role: userData.role,
        department: userData.department,
        specialization: userData.specialization,
        status: 'active',
        permissions: rolePermissions[userData.role] || [],
        hospital_id: currentUser?.hospital_id
      };
      
      setUsers(prev => [...prev, newUser]);
      setFilteredUsers(prev => [...prev, newUser]);
      
      setSuccess('User created successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      return true;
    } catch (error) {
      console.error('Error creating user:', error);
      setError(error instanceof Error ? error.message : 'Failed to create user');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Update an existing user
  const updateUser = async (userId: string, userData: {
    name?: string;
    role?: UserRole;
    department?: string;
    specialization?: string;
    status?: 'active' | 'inactive';
  }) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Mock implementation
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, ...userData, permissions: userData.role ? rolePermissions[userData.role] : user.permissions } 
          : user
      ));
      
      setFilteredUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, ...userData, permissions: userData.role ? rolePermissions[userData.role] : user.permissions } 
          : user
      ));
      
      setSuccess('User updated successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      return true;
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error instanceof Error ? error.message : 'Failed to update user');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete a user
  const deleteUser = async (userId: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Mock implementation
      setUsers(prev => prev.filter(user => user.id !== userId));
      setFilteredUsers(prev => prev.filter(user => user.id !== userId));
      
      setSuccess('User deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete user');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset a user's password
  const resetUserPassword = async (userId: string, newPassword: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Mock implementation - in a real app, this would call an API
      console.log(`Resetting password for user ${userId} to ${newPassword}`);
      
      setSuccess('Password reset successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      setError(error instanceof Error ? error.message : 'Failed to reset password');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if current user has admin role
  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'super_admin';

  if (!isAdmin) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-center">
        <Shield className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-red-800 mb-2">Access Denied</h2>
        <p className="text-red-600">
          You need administrator privileges to access this section.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Users className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
            <p className="text-sm text-gray-500">Manage hospital staff accounts</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddUserModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto p-1 hover:bg-red-100 rounded-full"
          >
            <X className="w-3.5 h-3.5 text-red-600" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
          <button 
            onClick={() => setSuccess(null)}
            className="ml-auto p-1 hover:bg-green-100 rounded-full"
          >
            <X className="w-3.5 h-3.5 text-green-600" />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="doctor">Doctor</option>
              <option value="nurse">Nurse</option>
              <option value="receptionist">Receptionist</option>
              <option value="lab_technician">Lab Technician</option>
              <option value="radiologist">Radiologist</option>
              <option value="pharmacist">Pharmacist</option>
              <option value="cashier">Cashier</option>
            </select>
          </div>
          
          <div>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Departments</option>
              {Object.entries(departmentNames).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Hospital Users</h3>
            <div className="text-sm text-gray-500">
              {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No users found</h3>
            <p className="text-gray-500">
              {searchQuery || selectedRole !== 'all' || selectedDepartment !== 'all'
                ? 'Try adjusting your filters'
                : 'Add users to get started'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredUsers.map((user) => {
              const isExpanded = expandedUsers[user.id] || false;
              
              return (
                <div key={user.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-medium">
                          {user.name.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{user.name}</h4>
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {user.status}
                      </span>
                      
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {user.role.replace('_', ' ')}
                      </span>
                      
                      <button
                        onClick={() => toggleUserExpanded(user.id)}
                        className="p-1 hover:bg-gray-100 rounded-lg"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        )}
                      </button>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm text-gray-500">Department</p>
                          <p className="font-medium">
                            {user.department 
                              ? departmentNames[user.department as keyof typeof departmentNames] || user.department
                              : 'Not assigned'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Specialization</p>
                          <p className="font-medium">
                            {user.specialization || 'None'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowEditUserModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                        >
                          <Edit className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        
                        <button
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to delete ${user.name}?`)) {
                              deleteUser(user.id);
                            }
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add User Modal */}
      {showAddUserModal && (
        <AddUserModal
          onClose={() => setShowAddUserModal(false)}
          onSubmit={createUser}
          isProcessing={isProcessing}
          currentUser={currentUser}
        />
      )}

      {/* Edit User Modal */}
      {showEditUserModal && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditUserModal(false);
            setSelectedUser(null);
          }}
          onSubmit={(userData) => updateUser(selectedUser.id, userData)}
          onResetPassword={(password) => resetUserPassword(selectedUser.id, password)}
          isProcessing={isProcessing}
          currentUser={currentUser}
        />
      )}
    </div>
  );
};

// Add User Modal Component
interface AddUserModalProps {
  onClose: () => void;
  onSubmit: (userData: any) => Promise<boolean>;
  isProcessing: boolean;
  currentUser: User | null;
}

const AddUserModal: React.FC<AddUserModalProps> = ({
  onClose,
  onSubmit,
  isProcessing,
  currentUser
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'doctor' as UserRole,
    department: '',
    specialization: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);

  // Check if current user is super admin
  const isSuperAdmin = currentUser?.role === 'super_admin';
  
  // Check if current user is hospital admin
  const isHospitalAdmin = currentUser?.role === 'admin';

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.email.includes('@')) newErrors.email = 'Valid email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    if (!formData.role) newErrors.role = 'Role is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const success = await onSubmit(formData);
    if (success) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">Add New User</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
              disabled={isProcessing}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500`}
              placeholder="Enter full name"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className={`w-full pl-10 pr-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter email address"
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className={`w-full pl-10 pr-10 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-xs text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type={showPassword ? "text" : "password"}
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                className={`w-full pl-10 pr-3 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500`}
                placeholder="Confirm password"
              />
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className={`w-full pl-10 pr-3 py-2 border ${errors.role ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500`}
              >
                {/* Only super admins can create admin users */}
                {isSuperAdmin && (
                  <option value="admin">Admin</option>
                )}
                <option value="doctor">Doctor</option>
                <option value="nurse">Nurse</option>
                <option value="receptionist">Receptionist</option>
                <option value="lab_technician">Lab Technician</option>
                <option value="radiologist">Radiologist</option>
                <option value="pharmacist">Pharmacist</option>
                <option value="cashier">Cashier</option>
              </select>
            </div>
            {errors.role && (
              <p className="mt-1 text-xs text-red-600">{errors.role}</p>
            )}
          </div>

          {/* Department */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Department
            </label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                {Object.entries(departmentNames).map(([code, name]) => (
                  <option key={code} value={code}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Specialization (for doctors) */}
          {formData.role === 'doctor' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Specialization
              </label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="E.g., Cardiology, Pediatrics, etc."
              />
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
              disabled={isProcessing}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isProcessing}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <UserPlus className="w-5 h-5" />
                  <span>Create User</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Edit User Modal Component
interface EditUserModalProps {
  user: User;
  onClose: () => void;
  onSubmit: (userData: any) => Promise<boolean>;
  onResetPassword: (password: string) => Promise<boolean>;
  isProcessing: boolean;
  currentUser: User | null;
}

const EditUserModal: React.FC<EditUserModalProps> = ({
  user,
  onClose,
  onSubmit,
  onResetPassword,
  isProcessing,
  currentUser
}) => {
  const [formData, setFormData] = useState({
    name: user.name,
    role: user.role,
    department: user.department || '',
    specialization: user.specialization || '',
    status: user.status
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Check if current user is super admin
  const isSuperAdmin = currentUser?.role === 'super_admin';
  
  // Check if current user is hospital admin
  const isHospitalAdmin = currentUser?.role === 'admin';
  
  // Check if editing an admin user
  const isEditingAdmin = user.role === 'admin';
  
  // Only super admins can edit admin users
  const canEditRole = isSuperAdmin || (!isEditingAdmin && isHospitalAdmin);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.role) newErrors.role = 'Role is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordReset = () => {
    const newErrors: Record<string, string> = {};
    
    if (!newPassword) newErrors.newPassword = 'New password is required';
    if (newPassword.length < 6) newErrors.newPassword = 'Password must be at least 6 characters';
    if (newPassword !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const success = await onSubmit(formData);
    if (success) {
      onClose();
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePasswordReset()) return;
    
    const success = await onResetPassword(newPassword);
    if (success) {
      setShowPasswordReset(false);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserCog className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">Edit User</h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
              disabled={isProcessing}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {!showPasswordReset ? (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500`}
                placeholder="Enter full name"
              />
              {errors.name && (
                <p className="mt-1 text-xs text-red-600">{errors.name}</p>
              )}
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="email"
                  value={user.email}
                  readOnly
                  className="w-full pl-10 pr-3 py-2 bg-gray-100 border border-gray-300 rounded-lg cursor-not-allowed"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className={`w-full pl-10 pr-3 py-2 border ${errors.role ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500`}
                  disabled={!canEditRole}
                >
                  {/* Only super admins can create admin users */}
                  {(isSuperAdmin || isEditingAdmin) && (
                    <option value="admin">Admin</option>
                  )}
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="lab_technician">Lab Technician</option>
                  <option value="radiologist">Radiologist</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="cashier">Cashier</option>
                </select>
              </div>
              {errors.role && (
                <p className="mt-1 text-xs text-red-600">{errors.role}</p>
              )}
              {!canEditRole && isEditingAdmin && (
                <p className="mt-1 text-xs text-amber-600">Only super admins can change admin roles</p>
              )}
            </div>

            {/* Department */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {Object.entries(departmentNames).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Specialization (for doctors) */}
            {formData.role === 'doctor' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Specialization
                </label>
                <input
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="E.g., Cardiology, Pediatrics, etc."
                />
              </div>
            )}

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.status === 'active'}
                    onChange={() => setFormData({ ...formData, status: 'active' })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
                
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={formData.status === 'inactive'}
                    onChange={() => setFormData({ ...formData, status: 'inactive' })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                  />
                  <span className="text-sm text-gray-700">Inactive</span>
                </label>
              </div>
            </div>

            {/* Password Reset Button */}
            <div className="pt-4 border-t">
              <button
                type="button"
                onClick={() => setShowPasswordReset(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100"
              >
                <Lock className="w-4 h-4" />
                <span>Reset Password</span>
              </button>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                disabled={isProcessing}
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="p-6 space-y-4">
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Lock className="w-5 h-5 text-amber-600" />
                <h4 className="font-medium text-amber-800">Reset Password</h4>
              </div>
              <p className="text-sm text-amber-700">
                You are about to reset the password for {user.name}. The user will need to use this new password for their next login.
              </p>
            </div>

            {/* New Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={`w-full pl-10 pr-10 py-2 border ${errors.newPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500`}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.newPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.newPassword}</p>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500`}
                  placeholder="Confirm new password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t mt-6">
              <button
                type="button"
                onClick={() => setShowPasswordReset(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-900"
                disabled={isProcessing}
              >
                Back
              </button>
              
              <button
                type="submit"
                disabled={isProcessing}
                className="flex items-center gap-2 px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5" />
                    <span>Reset Password</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
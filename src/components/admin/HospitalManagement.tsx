import React, { useState, useEffect } from 'react';
import { usePatientStore } from '../../lib/store';
import { useAuth } from '../../hooks/useAuth';
import {
  Building2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Globe,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Users,
  Settings,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';
import { AddHospitalForm } from './AddHospitalForm';

interface Hospital {
  id: string;
  name: string;
  domain: string;
  address?: string;
  city?: string;
  country?: string;
  contact_phone?: string;
  contact_email?: string;
  logo_url?: string;
  subscription_plan?: string;
  subscription_status?: 'active' | 'inactive' | 'trial' | 'expired';
  subscription_expiry?: string;
  created_at: string;
  updated_at: string;
  user_count?: number;
}

export const HospitalManagement: React.FC = () => {
  const { user } = useAuth();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [filteredHospitals, setFilteredHospitals] = useState<Hospital[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddHospitalForm, setShowAddHospitalForm] = useState(false);
  const [showEditHospitalForm, setShowEditHospitalForm] = useState(false);
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [expandedHospitals, setExpandedHospitals] = useState<Record<string, boolean>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Check if user is super admin
  const isSuperAdmin = user?.role === 'super_admin';
  
  // Check if user is hospital admin
  const isHospitalAdmin = user?.role === 'admin';

  // Fetch hospitals - mock implementation
  const fetchHospitals = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Mock data
      const mockHospitals: Hospital[] = [
        {
          id: '1',
          name: 'General Hospital',
          domain: 'general',
          address: '123 Main St',
          city: 'Nairobi',
          country: 'Kenya',
          contact_phone: '+254 712 345 678',
          contact_email: 'info@generalhospital.com',
          subscription_plan: 'pro-annual',
          subscription_status: 'active',
          subscription_expiry: '2026-05-24',
          created_at: '2025-01-15',
          updated_at: '2025-01-15',
          user_count: 45
        },
        {
          id: '2',
          name: 'City Medical Center',
          domain: 'citymedical',
          address: '456 Park Ave',
          city: 'Mombasa',
          country: 'Kenya',
          contact_phone: '+254 723 456 789',
          contact_email: 'info@citymedical.com',
          subscription_plan: 'basic-monthly',
          subscription_status: 'active',
          subscription_expiry: '2025-06-24',
          created_at: '2025-02-20',
          updated_at: '2025-02-20',
          user_count: 28
        }
      ];
      
      setHospitals(mockHospitals);
      setFilteredHospitals(mockHospitals);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      setError('Failed to load hospitals. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter hospitals based on search query and filter
  useEffect(() => {
    let filtered = [...hospitals];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(hospital => 
        hospital.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hospital.domain.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hospital.city?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        hospital.country?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply status filter
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(hospital => hospital.subscription_status === selectedFilter);
    }
    
    setFilteredHospitals(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [hospitals, searchQuery, selectedFilter]);

  // Load hospitals on component mount
  useEffect(() => {
    fetchHospitals();
  }, []);

  // Toggle hospital expanded state
  const toggleHospitalExpanded = (hospitalId: string) => {
    setExpandedHospitals(prev => ({
      ...prev,
      [hospitalId]: !prev[hospitalId]
    }));
  };

  // Create a new hospital
  const createHospital = async (hospitalData: any) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Mock implementation
      const newHospital: Hospital = {
        id: crypto.randomUUID(),
        name: hospitalData.name,
        domain: hospitalData.domain,
        address: hospitalData.address,
        city: hospitalData.city,
        country: hospitalData.country,
        contact_phone: hospitalData.contactPhone,
        contact_email: hospitalData.contactEmail,
        logo_url: hospitalData.logoUrl,
        subscription_plan: hospitalData.plan,
        subscription_status: 'active',
        subscription_expiry: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_count: 1
      };
      
      setHospitals(prev => [...prev, newHospital]);
      setFilteredHospitals(prev => [...prev, newHospital]);
      
      setSuccess('Hospital created successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      return true;
    } catch (error) {
      console.error('Error creating hospital:', error);
      setError(error instanceof Error ? error.message : 'Failed to create hospital');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Update an existing hospital
  const updateHospital = async (hospitalId: string, hospitalData: any) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Mock implementation
      setHospitals(prev => prev.map(hospital => 
        hospital.id === hospitalId 
          ? { 
              ...hospital, 
              name: hospitalData.name,
              domain: hospitalData.domain,
              address: hospitalData.address,
              city: hospitalData.city,
              country: hospitalData.country,
              contact_phone: hospitalData.contactPhone,
              contact_email: hospitalData.contactEmail,
              logo_url: hospitalData.logoUrl,
              subscription_plan: hospitalData.plan,
              subscription_status: hospitalData.status,
              updated_at: new Date().toISOString()
            } 
          : hospital
      ));
      
      setFilteredHospitals(prev => prev.map(hospital => 
        hospital.id === hospitalId 
          ? { 
              ...hospital, 
              name: hospitalData.name,
              domain: hospitalData.domain,
              address: hospitalData.address,
              city: hospitalData.city,
              country: hospitalData.country,
              contact_phone: hospitalData.contactPhone,
              contact_email: hospitalData.contactEmail,
              logo_url: hospitalData.logoUrl,
              subscription_plan: hospitalData.plan,
              subscription_status: hospitalData.status,
              updated_at: new Date().toISOString()
            } 
          : hospital
      ));
      
      setSuccess('Hospital updated successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      return true;
    } catch (error) {
      console.error('Error updating hospital:', error);
      setError(error instanceof Error ? error.message : 'Failed to update hospital');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Delete a hospital
  const deleteHospital = async (hospitalId: string) => {
    try {
      setIsProcessing(true);
      setError(null);
      
      // Mock implementation
      setHospitals(prev => prev.filter(hospital => hospital.id !== hospitalId));
      setFilteredHospitals(prev => prev.filter(hospital => hospital.id !== hospitalId));
      
      setSuccess('Hospital deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
      
      return true;
    } catch (error) {
      console.error('Error deleting hospital:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete hospital');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  // Generate a random password
  const generateRandomPassword = (length: number): string => {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      password += charset[randomIndex];
    }
    return password;
  };

  // Pagination
  const totalPages = Math.ceil(filteredHospitals.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredHospitals.slice(indexOfFirstItem, indexOfLastItem);

  // If not super admin or hospital admin, show access denied
  if (!isSuperAdmin && !isHospitalAdmin) {
    return (
      <div className="p-6 bg-red-50 rounded-lg border border-red-200 text-center">
        <Building2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
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
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Hospital Management</h2>
            <p className="text-sm text-gray-500">Manage hospital accounts and settings</p>
          </div>
        </div>
        {isSuperAdmin && (
          <button
            onClick={() => setShowAddHospitalForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Hospital</span>
          </button>
        )}
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-sm text-green-700">{success}</p>
          <button 
            onClick={() => setSuccess(null)}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <X className="w-4 h-4" />
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
                placeholder="Search hospitals by name or domain..."
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          {isSuperAdmin && (
            <div>
              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="trial">Trial</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Hospitals List */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Hospitals</h3>
            <div className="text-sm text-gray-500">
              {filteredHospitals.length} {filteredHospitals.length === 1 ? 'hospital' : 'hospitals'}
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading hospitals...</p>
          </div>
        ) : filteredHospitals.length === 0 ? (
          <div className="p-8 text-center">
            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">No hospitals found</h3>
            <p className="text-gray-500">
              {searchQuery || selectedFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Add hospitals to get started'}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {currentItems.map((hospital) => {
              const isExpanded = expandedHospitals[hospital.id] || false;
              
              return (
                <div key={hospital.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        {hospital.logo_url ? (
                          <img 
                            src={hospital.logo_url} 
                            alt={hospital.name} 
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <Building2 className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{hospital.name}</h4>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Globe className="w-3.5 h-3.5 text-gray-400" />
                          <p className="text-xs text-gray-500">{hospital.domain}.searchable.today</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        hospital.subscription_status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : hospital.subscription_status === 'trial'
                          ? 'bg-blue-100 text-blue-700'
                          : hospital.subscription_status === 'expired'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {hospital.subscription_status}
                      </span>
                      
                      <button
                        onClick={() => toggleHospitalExpanded(hospital.id)}
                        className="p-1 hover:bg-gray-100 rounded-lg"
                      >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                      </button>
                      
                      <div className="relative">
                        <button
                          className="p-1 hover:bg-gray-100 rounded-lg"
                        >
                          <MoreVertical className="w-5 h-5" />
                        </button>
                        {/* Dropdown menu would go here */}
                      </div>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Location</p>
                          <p className="font-medium">
                            {hospital.city ? `${hospital.city}, ${hospital.country}` : 'Not specified'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Contact</p>
                          <p className="font-medium">
                            {hospital.contact_email || 'No contact info'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Users</p>
                          <p className="font-medium">
                            {hospital.user_count || 0} users
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Subscription Plan</p>
                          <p className="font-medium capitalize">
                            {hospital.subscription_plan || 'No plan'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Expiry Date</p>
                          <p className="font-medium">
                            {hospital.subscription_expiry 
                              ? format(new Date(hospital.subscription_expiry), 'PP') 
                              : 'N/A'}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm text-gray-500">Created</p>
                          <p className="font-medium">
                            {format(new Date(hospital.created_at), 'PP')}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-2 mt-4">
                        {isSuperAdmin && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedHospital(hospital);
                                setShowEditHospitalForm(true);
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Edit</span>
                            </button>
                            
                            <button
                              onClick={() => {
                                if (window.confirm(`Are you sure you want to delete ${hospital.name}?`)) {
                                  deleteHospital(hospital.id);
                                }
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-700 rounded-lg hover:bg-red-100"
                            >
                              <Trash2 className="w-4 h-4" />
                              <span>Delete</span>
                            </button>
                          </>
                        )}
                        
                        <a
                          href={`https://${hospital.domain}.searchable.today`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          <ExternalLink className="w-4 h-4" />
                          <span>Visit</span>
                        </a>
                        
                        <button
                          onClick={() => {
                            // Navigate to hospital users management
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
                        >
                          <Users className="w-4 h-4" />
                          <span>Manage Users</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
              <span className="font-medium">{Math.min(indexOfLastItem, filteredHospitals.length)}</span> of{' '}
              <span className="font-medium">{filteredHospitals.length}</span> hospitals
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`w-8 h-8 rounded-md ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Hospital Modal */}
      {showAddHospitalForm && (
        <AddHospitalForm
          onClose={() => setShowAddHospitalForm(false)}
          onSubmit={createHospital}
        />
      )}

      {/* Edit Hospital Modal */}
      {showEditHospitalForm && selectedHospital && (
        <EditHospitalForm
          hospital={selectedHospital}
          onClose={() => {
            setShowEditHospitalForm(false);
            setSelectedHospital(null);
          }}
          onSubmit={(data) => updateHospital(selectedHospital.id, data)}
        />
      )}
    </div>
  );
};

// Edit Hospital Form Component
interface EditHospitalFormProps {
  hospital: Hospital;
  onClose: () => void;
  onSubmit: (hospitalData: any) => Promise<boolean>;
}

const EditHospitalForm: React.FC<EditHospitalFormProps> = ({
  hospital,
  onClose,
  onSubmit
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: hospital.name,
    domain: hospital.domain,
    address: hospital.address || '',
    city: hospital.city || '',
    country: hospital.country || 'Kenya',
    contactPhone: hospital.contact_phone || '',
    contactEmail: hospital.contact_email || '',
    logoUrl: hospital.logo_url || '',
    plan: hospital.subscription_plan || 'basic-monthly',
    status: hospital.subscription_status || 'active'
  });

  const validateForm = () => {
    if (!formData.name) {
      setError('Hospital name is required');
      return false;
    }
    
    if (!formData.domain) {
      setError('Domain is required');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await onSubmit(formData);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update hospital');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">Edit Hospital</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Hospital Information */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Hospital Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hospital Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter hospital name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Domain <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <input
                    type="text"
                    value={formData.domain}
                    onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                    className="flex-1 px-3 py-2 border rounded-l-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter domain prefix"
                    required
                  />
                  <span className="px-3 py-2 bg-gray-100 border-y border-r rounded-r-lg text-gray-500">
                    .searchable.today
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  This will be the URL where your hospital can access the system.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter hospital address"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter city"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country
                  </label>
                  <select
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="Kenya">Kenya</option>
                    <option value="Uganda">Uganda</option>
                    <option value="Tanzania">Tanzania</option>
                    <option value="Rwanda">Rwanda</option>
                    <option value="Ethiopia">Ethiopia</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="South Africa">South Africa</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.contactPhone}
                  onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter contact phone"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email
                </label>
                <input
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter contact email"
                />
              </div>
              
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Logo URL
                </label>
                <input
                  type="text"
                  value={formData.logoUrl}
                  onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter logo URL"
                />
              </div>
            </div>
          </div>

          {/* Subscription Information */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Plan
                </label>
                <select
                  value={formData.plan}
                  onChange={(e) => setFormData({ ...formData, plan: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="basic-monthly">Basic Monthly</option>
                  <option value="pro-annual">Pro Annual</option>
                  <option value="lifetime-standard">Lifetime Standard</option>
                  <option value="lifetime-pro">Lifetime Pro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subscription Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="inactive">Inactive</option>
                  <option value="expired">Expired</option>
                </select>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="pt-6 border-t flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Updating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Update Hospital</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HospitalManagement;
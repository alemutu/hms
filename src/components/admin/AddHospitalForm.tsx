import React, { useState } from 'react';
import {
  Building2,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Mail,
  Globe,
  CreditCard,
  Shield,
  Calendar,
  Users,
  Upload,
  Info
} from 'lucide-react';

interface AddHospitalFormProps {
  onClose: () => void;
  onSubmit: (hospitalData: any) => Promise<void>;
}

export const AddHospitalForm: React.FC<AddHospitalFormProps> = ({
  onClose,
  onSubmit
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    domain: '',
    adminEmail: '',
    adminName: '',
    adminPhone: '',
    plan: 'basic-monthly',
    logo: null as File | null,
    logoPreview: '',
    address: '',
    city: '',
    country: 'Kenya',
    contactPhone: '',
    contactEmail: '',
    notes: ''
  });

  const plans = [
    { id: 'basic-monthly', name: 'Basic Monthly', price: 5000, period: 'month', description: 'Essential features for small clinics' },
    { id: 'pro-annual', name: 'Pro Annual', price: 50000, period: 'year', description: 'Advanced features with annual savings' },
    { id: 'lifetime-standard', name: 'Lifetime Standard', price: 250000, period: 'one-time', description: 'One-time payment with standard features' },
    { id: 'lifetime-pro', name: 'Lifetime Pro', price: 500000, period: 'one-time', description: 'Complete package with all features forever' }
  ];

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({
        ...formData,
        logo: file,
        logoPreview: URL.createObjectURL(file)
      });
    }
  };

  const validateForm = () => {
    if (!formData.name) {
      setError('Hospital name is required');
      return false;
    }
    
    if (!formData.domain) {
      setError('Domain is required');
      return false;
    }
    
    if (!formData.adminEmail) {
      setError('Admin email is required');
      return false;
    }
    
    if (!formData.adminName) {
      setError('Admin name is required');
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
      setError(error instanceof Error ? error.message : 'Failed to create hospital');
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
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
              <h2 className="text-xl font-semibold text-gray-900">Add New Hospital</h2>
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
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-red-700">{error}</p>
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
                  Hospital Logo
                </label>
                <div className="flex items-center gap-4">
                  {formData.logoPreview ? (
                    <img 
                      src={formData.logoPreview} 
                      alt="Hospital Logo Preview" 
                      className="w-16 h-16 object-cover rounded-lg border"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center border">
                      <Building2 className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <label className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200 cursor-pointer hover:bg-blue-100">
                      <Upload className="w-4 h-4" />
                      <span>Upload Logo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoChange}
                        className="hidden"
                      />
                    </label>
                    <p className="mt-1 text-xs text-gray-500 text-center">
                      Recommended size: 128x128px (PNG, JPG)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Admin Information */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Admin Information</h3>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.adminName}
                  onChange={(e) => setFormData({ ...formData, adminName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter admin name"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => setFormData({ ...formData, adminEmail: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter admin email"
                  required
                />
                <p className="mt-1 text-xs text-gray-500">
                  This email will receive admin credentials and important notifications.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Phone
                </label>
                <input
                  type="tel"
                  value={formData.adminPhone}
                  onChange={(e) => setFormData({ ...formData, adminPhone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter admin phone"
                />
              </div>
            </div>
          </div>

          {/* Subscription Plan */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Subscription Plan</h3>
            <div className="grid grid-cols-2 gap-6">
              {plans.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => setFormData({ ...formData, plan: plan.id })}
                  className={`border rounded-xl p-4 cursor-pointer transition-all ${
                    formData.plan === plan.id 
                      ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500/20' 
                      : 'hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900">{plan.name}</h4>
                      <p className="text-sm text-gray-500">
                        {plan.period === 'one-time' 
                          ? 'Lifetime License' 
                          : plan.period === 'month'
                          ? 'Monthly Subscription'
                          : 'Annual Subscription'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(plan.price)}</p>
                      <p className="text-xs text-gray-500">
                        {plan.period === 'one-time' 
                          ? 'One-time payment' 
                          : `per ${plan.period}`}
                      </p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{plan.description}</p>
                  
                  {formData.plan === plan.id && (
                    <div className="mt-2 flex justify-end">
                      <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-blue-600" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Additional Notes */}
          <div className="pt-6 border-t">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Additional Notes</h3>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Enter any additional notes or special requirements..."
            />
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
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Creating...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create Hospital</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
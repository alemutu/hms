import React, { useState, useEffect } from 'react';
import { usePatientStore } from '../../lib/store';
import {
  Settings,
  Search,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  Filter,
  ChevronRight,
  Building2,
  DollarSign,
  Package,
  Tag,
  LayoutGrid,
  ListFilter,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  RefreshCw
} from 'lucide-react';
import { departmentNames } from '../../types/departments';
import type { ServiceCharge } from '../../types';
import { ServiceChargeForm } from './ServiceChargeForm';

export const ServiceChargesPage = () => {
  const { serviceCharges, updateServiceCharge, addServiceCharge, setCurrentSection } = usePatientStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showServiceChargeForm, setShowServiceChargeForm] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceCharge | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [sortField, setSortField] = useState<'name' | 'department' | 'amount'>('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Filter service charges
  const filteredServiceCharges = serviceCharges.filter(service => {
    const matchesSearch = searchQuery === '' || 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesDepartment = selectedDepartment === 'all' || service.department === selectedDepartment;
    const matchesCategory = selectedCategory === 'all' || service.category === selectedCategory;
    
    return matchesSearch && matchesDepartment && matchesCategory;
  });

  // Sort service charges
  const sortedServiceCharges = [...filteredServiceCharges].sort((a, b) => {
    let comparison = 0;
    
    if (sortField === 'name') {
      comparison = a.name.localeCompare(b.name);
    } else if (sortField === 'department') {
      comparison = a.department.localeCompare(b.department);
    } else if (sortField === 'amount') {
      comparison = a.amount - b.amount;
    }
    
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  // Get unique categories
  const categories = Array.from(new Set(serviceCharges.map(service => service.category)));
  
  // Get unique departments
  const departments = Array.from(new Set(serviceCharges.map(service => service.department)));

  const handleSortChange = (field: 'name' | 'department' | 'amount') => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleServiceCharge = async (serviceId: string, service: Partial<ServiceCharge> | ServiceCharge) => {
    try {
      setErrorMessage(null);
      
      if ('id' in service) {
        // New service
        await addServiceCharge(service as ServiceCharge);
      } else {
        // Update existing service
        await updateServiceCharge(serviceId, service);
      }
      
      setSuccessMessage('Service charge saved successfully');
      setShowServiceChargeForm(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving service charge:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save service charge');
    }
  };

  const formatCurrency = (amount: number) => {
    return `Ksh ${amount.toLocaleString()}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentSection('billing')}
                className="p-1.5 hover:bg-white/80 rounded-lg text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Service Charges</h1>
                <p className="text-xs text-gray-500">Manage pricing for services and procedures</p>
              </div>
            </div>
            <button
              onClick={() => {
                setSelectedService(null);
                setShowServiceChargeForm(true);
              }}
              className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Service</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-8 py-3">
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3 animate-fade">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-700">{errorMessage}</p>
            <button 
              onClick={() => setErrorMessage(null)}
              className="ml-auto p-1 hover:bg-red-100 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5 text-red-600" />
            </button>
          </div>
        </div>
      )}

      {successMessage && (
        <div className="max-w-7xl mx-auto px-8 py-3">
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center gap-3 animate-fade">
            <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
            <p className="text-sm text-green-700">{successMessage}</p>
            <button 
              onClick={() => setSuccessMessage(null)}
              className="ml-auto p-1 hover:bg-green-100 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5 text-green-600" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-8 py-4">
        <div className="flex gap-4">
          {/* Left Section - Filters */}
          <div className="w-64 space-y-4">
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Filter className="w-4 h-4 text-gray-600" />
                <h2 className="font-semibold text-gray-900 text-sm">Filters</h2>
              </div>
              
              {/* Department Filter */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Department
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>
                      {departmentNames[dept as keyof typeof departmentNames] || dept}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Category Filter */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* View Options */}
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Settings className="w-4 h-4 text-gray-600" />
                <h2 className="font-semibold text-gray-900 text-sm">View Options</h2>
              </div>
              
              {/* View Mode */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Display Mode
                </label>
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 flex items-center justify-center gap-1 p-1.5 rounded-md text-xs ${
                      viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5 text-gray-600" />
                    <span>List</span>
                  </button>
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 flex items-center justify-center gap-1 p-1.5 rounded-md text-xs ${
                      viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5 text-gray-600" />
                    <span>Grid</span>
                  </button>
                </div>
              </div>
              
              {/* Sort Options */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <div className="space-y-1">
                  {[
                    { id: 'name', label: 'Service Name' },
                    { id: 'department', label: 'Department' },
                    { id: 'amount', label: 'Amount' }
                  ].map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => handleSortChange(id as 'name' | 'department' | 'amount')}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                        sortField === id
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span>{label}</span>
                      {sortField === id && (
                        <ArrowUpDown className={`w-3.5 h-3.5 ${
                          sortDirection === 'asc' ? 'rotate-0' : 'rotate-180'
                        } transition-transform`} />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Quick Stats */}
            <div className="bg-white rounded-xl border shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-gray-600" />
                <h2 className="font-semibold text-gray-900 text-sm">Quick Stats</h2>
              </div>
              
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Total Services</p>
                  <p className="text-lg font-bold text-gray-900">{serviceCharges.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Departments</p>
                  <p className="text-lg font-bold text-gray-900">{departments.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Categories</p>
                  <p className="text-lg font-bold text-gray-900">{categories.length}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Section - Service Charges */}
          <div className="flex-1">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              {/* Search Bar */}
              <div className="p-4 border-b">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search service charges..."
                    className="w-full pl-9 pr-4 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              {/* Service Charges List */}
              {viewMode === 'list' ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-10">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          <button 
                            onClick={() => handleSortChange('name')}
                            className="flex items-center gap-1 hover:text-gray-700"
                          >
                            Service Name
                            {sortField === 'name' && (
                              <ArrowUpDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          <button 
                            onClick={() => handleSortChange('department')}
                            className="flex items-center gap-1 hover:text-gray-700"
                          >
                            Department
                            {sortField === 'department' && (
                              <ArrowUpDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          <button 
                            onClick={() => handleSortChange('amount')}
                            className="flex items-center gap-1 ml-auto hover:text-gray-700"
                          >
                            Amount
                            {sortField === 'amount' && (
                              <ArrowUpDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sortedServiceCharges.map((service, index) => (
                        <tr key={service.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {index + 1}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">{service.name}</span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {departmentNames[service.department as keyof typeof departmentNames] || service.department}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 capitalize">
                              {service.category}
                            </span>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                            {formatCurrency(service.amount)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => {
                                  setSelectedService(service);
                                  setShowServiceChargeForm(true);
                                }}
                                className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                className="p-1.5 hover:bg-red-100 rounded-lg text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {sortedServiceCharges.length === 0 && (
                    <div className="text-center py-12">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No service charges found</h3>
                      <p className="text-gray-500 mb-4">
                        {searchQuery 
                          ? `No results for "${searchQuery}"`
                          : 'Add service charges to get started'
                        }
                      </p>
                      <button
                        onClick={() => {
                          setSelectedService(null);
                          setShowServiceChargeForm(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Service Charge</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 grid grid-cols-3 gap-4">
                  {sortedServiceCharges.map((service, index) => (
                    <div key={service.id} className="bg-white rounded-lg border shadow-sm hover:shadow-md transition-all p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-xs font-medium text-blue-700">{index + 1}</span>
                          </div>
                          <h3 className="font-medium text-gray-900 text-sm">{service.name}</h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setSelectedService(service);
                              setShowServiceChargeForm(true);
                            }}
                            className="p-1 hover:bg-blue-100 rounded-lg text-blue-600"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            className="p-1 hover:bg-red-100 rounded-lg text-red-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-xs text-gray-600">
                            {departmentNames[service.department as keyof typeof departmentNames] || service.department}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Tag className="w-3.5 h-3.5 text-gray-500" />
                          <span className="text-xs text-gray-600 capitalize">{service.category}</span>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">Price</span>
                          <span className="text-sm font-bold text-gray-900">{formatCurrency(service.amount)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {sortedServiceCharges.length === 0 && (
                    <div className="col-span-3 text-center py-12">
                      <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">No service charges found</h3>
                      <p className="text-gray-500 mb-4">
                        {searchQuery 
                          ? `No results for "${searchQuery}"`
                          : 'Add service charges to get started'
                        }
                      </p>
                      <button
                        onClick={() => {
                          setSelectedService(null);
                          setShowServiceChargeForm(true);
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Service Charge</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Service Charge Form Modal */}
      {showServiceChargeForm && (
        <ServiceChargeForm
          service={selectedService || undefined}
          onClose={() => {
            setShowServiceChargeForm(false);
            setSelectedService(null);
          }}
          onSubmit={handleServiceCharge}
        />
      )}
    </div>
  );
};
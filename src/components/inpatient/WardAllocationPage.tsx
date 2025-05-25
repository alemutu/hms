import React, { useState, useEffect } from 'react';
import { usePatientStore } from '../../lib/store';
import {
  Bed,
  Search,
  Filter,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  X,
  FileText,
  User,
  Building2,
  RefreshCw,
  Edit,
  Trash2,
  Plus,
  Users,
  DollarSign,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  LayoutGrid,
  ListFilter
} from 'lucide-react';
import { format } from 'date-fns';
import type { Admission, Ward, Bed as BedType } from '../../types';

export const WardAllocationPage: React.FC = () => {
  const { setCurrentSection } = usePatientStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWard, setSelectedWard] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sample data for wards
  const [wards, setWards] = useState<Ward[]>([
    {
      id: 'ward-1',
      name: 'General Ward',
      type: 'general',
      capacity: 20,
      dailyRate: 2500,
      floor: '1st Floor',
      building: 'Main Building'
    },
    {
      id: 'ward-2',
      name: 'Private Ward',
      type: 'private',
      capacity: 10,
      dailyRate: 5000,
      floor: '2nd Floor',
      building: 'Main Building'
    },
    {
      id: 'ward-3',
      name: 'ICU',
      type: 'icu',
      capacity: 8,
      dailyRate: 15000,
      floor: '3rd Floor',
      building: 'Main Building'
    },
    {
      id: 'ward-4',
      name: 'Maternity Ward',
      type: 'maternity',
      capacity: 15,
      dailyRate: 3500,
      floor: '2nd Floor',
      building: 'East Wing'
    },
    {
      id: 'ward-5',
      name: 'Pediatric Ward',
      type: 'pediatric',
      capacity: 12,
      dailyRate: 3000,
      floor: '1st Floor',
      building: 'East Wing'
    }
  ]);

  // Sample data for beds
  const [beds, setBeds] = useState<BedType[]>([
    // General Ward Beds
    ...Array.from({ length: 20 }, (_, i) => ({
      id: `bed-${i + 101}`,
      wardId: 'ward-1',
      number: `${i + 101}`,
      status: i < 15 ? 'occupied' : 'available',
      type: 'standard',
      lastSanitized: format(new Date(), 'yyyy-MM-dd')
    })),
    // Private Ward Beds
    ...Array.from({ length: 10 }, (_, i) => ({
      id: `bed-${i + 201}`,
      wardId: 'ward-2',
      number: `${i + 201}`,
      status: i < 6 ? 'occupied' : 'available',
      type: 'electric',
      lastSanitized: format(new Date(), 'yyyy-MM-dd')
    })),
    // ICU Beds
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `bed-${i + 301}`,
      wardId: 'ward-3',
      number: `${i + 301}`,
      status: i < 5 ? 'occupied' : i === 5 ? 'maintenance' : 'available',
      type: 'icu',
      lastSanitized: format(new Date(), 'yyyy-MM-dd')
    })),
    // Maternity Ward Beds
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `bed-${i + 401}`,
      wardId: 'ward-4',
      number: `${i + 401}`,
      status: i < 10 ? 'occupied' : 'available',
      type: 'standard',
      lastSanitized: format(new Date(), 'yyyy-MM-dd')
    })),
    // Pediatric Ward Beds
    ...Array.from({ length: 12 }, (_, i) => ({
      id: `bed-${i + 501}`,
      wardId: 'ward-5',
      number: `${i + 501}`,
      status: i < 8 ? 'occupied' : 'available',
      type: 'pediatric',
      lastSanitized: format(new Date(), 'yyyy-MM-dd')
    }))
  ]);

  // Sample data for admissions
  const [admissions, setAdmissions] = useState<Admission[]>([
    // This would be populated from the API in a real application
  ]);

  // Filter beds based on selected ward and search query
  const filteredBeds = beds.filter(bed => {
    const matchesWard = !selectedWard || bed.wardId === selectedWard;
    const matchesSearch = !searchQuery || 
      bed.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bed.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesWard && matchesSearch;
  });

  // Calculate ward statistics
  const wardStats = wards.map(ward => {
    const wardBeds = beds.filter(bed => bed.wardId === ward.id);
    const occupiedBeds = wardBeds.filter(bed => bed.status === 'occupied').length;
    const availableBeds = wardBeds.filter(bed => bed.status === 'available').length;
    const maintenanceBeds = wardBeds.filter(bed => bed.status === 'maintenance').length;
    const occupancyRate = Math.round((occupiedBeds / ward.capacity) * 100);
    
    return {
      ...ward,
      occupiedBeds,
      availableBeds,
      maintenanceBeds,
      occupancyRate
    };
  });

  const handleBedStatusChange = (bedId: string, newStatus: BedType['status']) => {
    setBeds(beds.map(bed => 
      bed.id === bedId ? { ...bed, status: newStatus } : bed
    ));
    
    setSuccessMessage(`Bed ${bedId} status updated to ${newStatus}`);
    
    // Clear success message after 3 seconds
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const getBedStatusColor = (status: BedType['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'occupied':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'maintenance':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'reserved':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setCurrentSection('dashboard')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ward & Bed Allocation</h1>
            <p className="text-gray-500 mt-1">Manage hospital wards and bed assignments</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
            >
              <LayoutGrid className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
            >
              <ListFilter className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          <button
            onClick={() => {}}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-4 h-4" />
            <span>Add Bed</span>
          </button>
        </div>
      </div>

      {/* Error/Success Messages */}
      {errorMessage && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{errorMessage}</p>
          <button 
            onClick={() => setErrorMessage(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700">{successMessage}</p>
          <button 
            onClick={() => setSuccessMessage(null)}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Ward Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {wardStats.map(ward => (
          <div 
            key={ward.id}
            className={`bg-white rounded-xl border shadow-sm p-4 cursor-pointer transition-all hover:shadow-md ${
              selectedWard === ward.id ? 'ring-2 ring-blue-500 border-blue-500' : ''
            }`}
            onClick={() => setSelectedWard(ward.id === selectedWard ? null : ward.id)}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-100 rounded-lg">
                  <Building2 className="w-4 h-4 text-blue-600" />
                </div>
                <h3 className="font-medium text-gray-900">{ward.name}</h3>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                ward.occupancyRate > 90 ? 'bg-red-100 text-red-800' :
                ward.occupancyRate > 70 ? 'bg-amber-100 text-amber-800' :
                'bg-green-100 text-green-800'
              }`}>
                {ward.occupancyRate}% Full
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="p-2 bg-blue-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">Occupied</p>
                <p className="font-bold text-blue-700">{ward.occupiedBeds}</p>
              </div>
              <div className="p-2 bg-green-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">Available</p>
                <p className="font-bold text-green-700">{ward.availableBeds}</p>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg text-center">
                <p className="text-xs text-gray-500">Maintenance</p>
                <p className="font-bold text-amber-700">{ward.maintenanceBeds}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-600">{formatCurrency(ward.dailyRate)}/day</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-600">{ward.building}, {ward.floor}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search beds..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedWard || ''}
            onChange={(e) => setSelectedWard(e.target.value || null)}
            className="px-4 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Wards</option>
            {wards.map(ward => (
              <option key={ward.id} value={ward.id}>{ward.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Beds Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredBeds.map(bed => {
            const ward = wards.find(w => w.id === bed.wardId);
            
            return (
              <div 
                key={bed.id}
                className={`bg-white rounded-xl border shadow-sm p-4 ${
                  bed.status === 'available' ? 'hover:border-green-500' :
                  bed.status === 'occupied' ? 'hover:border-blue-500' :
                  'hover:border-amber-500'
                } transition-all`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded-lg ${
                      bed.status === 'available' ? 'bg-green-100' :
                      bed.status === 'occupied' ? 'bg-blue-100' :
                      'bg-amber-100'
                    }`}>
                      <Bed className={`w-4 h-4 ${
                        bed.status === 'available' ? 'text-green-600' :
                        bed.status === 'occupied' ? 'text-blue-600' :
                        'text-amber-600'
                      }`} />
                    </div>
                    <h3 className="font-medium text-gray-900">Bed {bed.number}</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getBedStatusColor(bed.status)}`}>
                    {bed.status.charAt(0).toUpperCase() + bed.status.slice(1)}
                  </span>
                </div>
                
                <div className="text-sm text-gray-600 mb-3">
                  <p>{ward?.name}</p>
                  <p className="text-xs text-gray-500">{bed.type.charAt(0).toUpperCase() + bed.type.slice(1)} bed</p>
                </div>
                
                {bed.status === 'occupied' ? (
                  <div className="p-2 bg-blue-50 rounded-lg text-xs">
                    <p className="text-gray-600">Occupied since: Apr 15, 2025</p>
                    <p className="text-gray-600 mt-1">Patient: John Doe</p>
                  </div>
                ) : bed.status === 'maintenance' ? (
                  <div className="p-2 bg-amber-50 rounded-lg text-xs">
                    <p className="text-gray-600">Under maintenance</p>
                    <p className="text-gray-600 mt-1">Expected completion: Apr 20, 2025</p>
                  </div>
                ) : (
                  <div className="p-2 bg-green-50 rounded-lg text-xs">
                    <p className="text-gray-600">Last sanitized: {bed.lastSanitized}</p>
                    <p className="text-gray-600 mt-1">Ready for admission</p>
                  </div>
                )}
                
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Open bed details or actions modal
                    }}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-lg border overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Bed className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Beds</h2>
                  <p className="text-sm text-gray-500">
                    {filteredBeds.length} beds {selectedWard ? `in ${wards.find(w => w.id === selectedWard)?.name}` : 'across all wards'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bed Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ward</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Sanitized</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Occupant</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredBeds.map((bed) => {
                  const ward = wards.find(w => w.id === bed.wardId);
                  
                  return (
                    <tr key={bed.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {bed.number}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ward?.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bed.type.charAt(0).toUpperCase() + bed.type.slice(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getBedStatusColor(bed.status)}`}>
                          {bed.status.charAt(0).toUpperCase() + bed.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bed.lastSanitized}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {bed.status === 'occupied' ? 'John Doe' : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          {bed.status === 'available' && (
                            <button
                              onClick={() => handleBedStatusChange(bed.id, 'maintenance')}
                              className="p-1.5 hover:bg-amber-100 rounded-lg text-amber-600"
                              title="Mark as Maintenance"
                            >
                              <AlertTriangle className="w-4 h-4" />
                            </button>
                          )}
                          
                          {bed.status === 'maintenance' && (
                            <button
                              onClick={() => handleBedStatusChange(bed.id, 'available')}
                              className="p-1.5 hover:bg-green-100 rounded-lg text-green-600"
                              title="Mark as Available"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                          )}
                          
                          <button
                            onClick={() => {}}
                            className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600"
                            title="Edit Bed"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {filteredBeds.length === 0 && (
              <div className="py-12">
                <div className="text-center">
                  <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Bed className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">
                    No beds found
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery 
                      ? `No results for "${searchQuery}"`
                      : selectedWard
                      ? `No beds found in ${wards.find(w => w.id === selectedWard)?.name}`
                      : 'No beds found'
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
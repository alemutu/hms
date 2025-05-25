import React, { useState, useMemo } from 'react';
import { usePatientStore } from '../../lib/store';
import {
  Activity,
  Users,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  FileText,
  ArrowRight,
  X,
  Plus,
  ArrowLeft,
  Building2,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Stethoscope,
  CalendarDays,
  User,
  ClipboardList,
  TestTube,
  LayoutDashboard,
  Layers,
  Hourglass,
  Clipboard,
  Radio,
  Loader2,
  ChevronDown,
  ChevronUp,
  Play,
  Banknote,
  Receipt,
  Settings,
  ListFilter,
  DollarSign,
  BarChart3,
  CreditCard,
  Printer
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import type { Invoice, Payment, ServiceCharge, Patient } from '../../types';
import { InvoiceForm } from './InvoiceForm';
import { InvoiceDetails } from './InvoiceDetails';
import { PaymentForm } from './PaymentForm';
import { ServiceChargeForm } from './ServiceChargeForm';
import { departmentNames } from '../../types/departments';
import { PatientWorkflowManager } from '../PatientWorkflowManager';

export const BillingDashboard = () => {
  const { 
    patientQueue,
    invoices = {},
    payments = {},
    serviceCharges,
    setCurrentSection,
    createInvoice,
    updateInvoice,
    addPayment,
    updateServiceCharge,
    addServiceCharge
  } = usePatientStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [showInvoiceDetails, setShowInvoiceDetails] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showServiceChargeForm, setShowServiceChargeForm] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceCharge | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'paid' | 'charges'>('pending');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Get all invoices as a flat array with patient info
  const allInvoices = useMemo(() => {
    const result: Array<Invoice & { patient: { fullName: string; idNumber: string } }> = [];
    
    Object.entries(invoices).forEach(([patientId, patientInvoices]) => {
      const patient = patientQueue.find(p => p.id === patientId);
      if (patient) {
        patientInvoices.forEach(invoice => {
          result.push({
            ...invoice,
            patient: {
              fullName: patient.fullName,
              idNumber: patient.idNumber
            }
          });
        });
      }
    });
    
    return result;
  }, [invoices, patientQueue]);

  // Get all payments as a flat array
  const allPayments = useMemo(() => {
    const result: Payment[] = [];
    
    Object.values(payments).forEach(patientPayments => {
      result.push(...patientPayments);
    });
    
    return result;
  }, [payments]);

  // Filter invoices based on active tab and search query
  const filteredInvoices = useMemo(() => {
    let filtered = allInvoices;
    
    // Filter by tab
    if (activeTab === 'pending') {
      filtered = filtered.filter(i => i.status === 'pending');
    } else if (activeTab === 'paid') {
      filtered = filtered.filter(i => i.status === 'paid');
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(i => 
        i.patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.visitId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by time range
    if (timeRange === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(i => new Date(i.createdAt) >= today);
    } else if (timeRange === 'week') {
      const weekAgo = subDays(new Date(), 7);
      filtered = filtered.filter(i => new Date(i.createdAt) >= weekAgo);
    } else if (timeRange === 'month') {
      const monthAgo = subDays(new Date(), 30);
      filtered = filtered.filter(i => new Date(i.createdAt) >= monthAgo);
    }
    
    // Filter by status
    if (selectedFilter === 'urgent') {
      const urgentPatientIds = patientQueue
        .filter(p => p.priority === 'urgent' || p.priority === 'critical')
        .map(p => p.id);
      filtered = filtered.filter(i => urgentPatientIds.includes(i.patientId));
    }
    
    // Sort by date (newest first)
    return filtered.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [allInvoices, activeTab, searchQuery, timeRange, selectedFilter, patientQueue]);

  // Pagination
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredInvoices.slice(indexOfFirstItem, indexOfLastItem);

  // Filter service charges
  const filteredServiceCharges = useMemo(() => {
    if (!searchQuery) return serviceCharges;
    
    return serviceCharges.filter(service => 
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      departmentNames[service.department]?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [serviceCharges, searchQuery]);

  // Calculate billing stats
  const stats = useMemo(() => {
    const pendingInvoices = allInvoices.filter(i => i.status === 'pending');
    const paidInvoices = allInvoices.filter(i => i.status === 'paid');
    
    const pendingAmount = pendingInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    const paidAmount = paidInvoices.reduce((sum, i) => sum + i.totalAmount, 0);
    
    // Today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayPayments = allPayments.filter(p => new Date(p.timestamp) >= today);
    const todayRevenue = todayPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // This week's revenue
    const weekAgo = subDays(new Date(), 7);
    const weekPayments = allPayments.filter(p => new Date(p.timestamp) >= weekAgo);
    const weekRevenue = weekPayments.reduce((sum, p) => sum + p.amount, 0);
    
    return {
      pendingInvoices: pendingInvoices.length,
      pendingAmount,
      paidInvoices: paidInvoices.length,
      paidAmount,
      todayRevenue,
      weekRevenue,
      serviceCharges: serviceCharges.length
    };
  }, [allInvoices, allPayments, serviceCharges]);

  const handleCreateInvoice = async (invoice: Invoice) => {
    try {
      setErrorMessage(null);
      
      await createInvoice(invoice);
      
      setSuccessMessage('Invoice created successfully');
      setShowInvoiceForm(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error creating invoice:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to create invoice');
    }
  };

  const handleProcessPayment = async (payment: Payment) => {
    try {
      setErrorMessage(null);
      
      await addPayment(payment);
      
      setSuccessMessage('Payment processed successfully');
      setShowPaymentForm(false);
      setShowInvoiceDetails(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error processing payment:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to process payment');
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

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return Banknote;
      case 'mpesa':
        return CreditCard;
      case 'card':
        return CreditCard;
      case 'insurance':
        return CreditCard;
      case 'bank':
        return CreditCard;
      default:
        return CreditCard;
    }
  };

  const handlePatientSelect = (patientId: string) => {
    setSelectedPatient(patientId);
    setShowInvoiceForm(true);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentSection('reception')}
                className="p-1.5 hover:bg-white/80 rounded-lg text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Billing</h1>
                <p className="text-xs text-gray-500">Financial Management & Invoicing</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
                {['today', 'week', 'month'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range as typeof timeRange)}
                    className={`px-3 py-1 rounded-md text-xs ${
                      timeRange === range
                        ? 'bg-white shadow-sm text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {range.charAt(0).toUpperCase() + range.slice(1)}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setShowInvoiceForm(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Invoice</span>
              </button>
            </div>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-4 gap-3 py-4">
            {[
              { 
                label: 'Pending Invoices', 
                value: stats.pendingInvoices,
                subvalue: formatCurrency(stats.pendingAmount),
                icon: Clock,
                color: 'amber'
              },
              { 
                label: 'Paid Invoices', 
                value: stats.paidInvoices,
                subvalue: formatCurrency(stats.paidAmount),
                icon: CheckCircle2,
                color: 'green'
              },
              { 
                label: "Today's Revenue", 
                value: formatCurrency(stats.todayRevenue),
                subvalue: `${allPayments.filter(p => new Date(p.timestamp) >= new Date(new Date().setHours(0, 0, 0, 0))).length} payments`,
                icon: Banknote,
                color: 'blue'
              },
              { 
                label: 'This Week', 
                value: formatCurrency(stats.weekRevenue),
                subvalue: `${allPayments.filter(p => new Date(p.timestamp) >= subDays(new Date(), 7)).length} payments`,
                icon: BarChart3,
                color: 'indigo'
              }
            ].map(({ label, value, subvalue, icon: Icon, color }) => (
              <div 
                key={label}
                className={`bg-white rounded-xl p-3 border shadow-sm hover:shadow-md transition-all`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className={`p-1.5 bg-${color}-50 rounded-lg`}>
                    <Icon className={`w-3.5 h-3.5 text-${color}-600`} />
                  </div>
                </div>
                <p className="text-lg font-bold text-gray-900 mb-0.5">{value}</p>
                <p className="text-xs text-gray-500">{label}</p>
                <p className="text-xs text-gray-400 mt-1">{subvalue}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Error/Success Messages */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-8 py-3">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-3 animate-fade">
            <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <p className="text-sm text-rose-700">{errorMessage}</p>
            <button 
              onClick={() => setErrorMessage(null)}
              className="ml-auto p-1 hover:bg-rose-100 rounded-lg transition-colors"
            >
              <X className="w-3.5 h-3.5 text-rose-600" />
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
          {/* Left Section - Invoices */}
          <div className="flex-1 w-2/3">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
              {/* Tabs */}
              <div className="border-b">
                <div className="flex items-center p-1 gap-1">
                  {[
                    { id: 'pending', label: 'Pending Invoices', icon: Clock, count: stats.pendingInvoices },
                    { id: 'paid', label: 'Paid Invoices', icon: CheckCircle2, count: stats.paidInvoices },
                    { id: 'charges', label: 'Service Charges', icon: Settings, count: stats.serviceCharges }
                  ].map(({ id, label, icon: Icon, count }) => (
                    <button
                      key={id}
                      onClick={() => {
                        if (id === 'charges') {
                          setCurrentSection('service-charges');
                        } else {
                          setActiveTab(id as typeof activeTab);
                          setCurrentPage(1); // Reset to first page when changing tabs
                        }
                      }}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all ${
                        activeTab === id
                          ? 'bg-blue-50 text-blue-700 shadow-sm'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="font-medium text-sm">{label}</span>
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                        activeTab === id
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Search and Filters */}
              <div className="p-3 bg-gray-50 border-b">
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1); // Reset to first page when searching
                      }}
                      placeholder="Search invoices..."
                      className="w-full pl-8 pr-3 py-1.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                    />
                  </div>
                  
                  <select
                    value={selectedFilter}
                    onChange={(e) => {
                      setSelectedFilter(e.target.value);
                      setCurrentPage(1); // Reset to first page when filtering
                    }}
                    className="px-3 py-1.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                  >
                    <option value="all">All Patients</option>
                    <option value="urgent">Urgent</option>
                  </select>
                  
                  <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-1.5 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    >
                      <ListFilter className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-1.5 rounded-md ${viewMode === 'grid' ? 'bg-white shadow-sm' : 'hover:bg-white/50'}`}
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content Area */}
              <div className="p-4">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Invoice</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        {activeTab === 'paid' && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment Method</th>
                        )}
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {currentItems.map((invoice, index) => {
                        const PaymentIcon = invoice.paymentMethod ? getPaymentMethodIcon(invoice.paymentMethod) : null;
                        
                        return (
                          <tr key={invoice.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {indexOfFirstItem + index + 1}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="p-1.5 bg-blue-100 rounded-lg">
                                  <Receipt className="w-4 h-4 text-blue-600" />
                                </div>
                                <div>
                                  <p className="text-sm font-medium text-gray-900">#{invoice.id.slice(0, 8)}</p>
                                  <p className="text-xs text-gray-500">{invoice.visitId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 bg-gray-100 rounded-full flex items-center justify-center">
                                  <span className="text-xs font-medium text-gray-600">
                                    {invoice.patient.fullName.charAt(0)}
                                  </span>
                                </div>
                                <span className="text-sm">{invoice.patient.fullName}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {format(new Date(invoice.createdAt), 'MMM d, yyyy')}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium">
                              {formatCurrency(invoice.totalAmount)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                invoice.status === 'paid'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}>
                                {invoice.status === 'paid' ? 'Paid' : 'Pending'}
                              </span>
                            </td>
                            {activeTab === 'paid' && (
                              <td className="px-4 py-3 whitespace-nowrap">
                                {invoice.paymentMethod ? (
                                  <div className="flex items-center gap-1.5">
                                    {PaymentIcon && <PaymentIcon className="w-3.5 h-3.5 text-gray-500" />}
                                    <span className="text-sm text-gray-600 capitalize">{invoice.paymentMethod}</span>
                                  </div>
                                ) : (
                                  <span className="text-sm text-gray-400">-</span>
                                )}
                              </td>
                            )}
                            <td className="px-4 py-3 whitespace-nowrap text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  onClick={() => {
                                    setSelectedInvoice(invoice.id);
                                    setShowInvoiceDetails(true);
                                  }}
                                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                                
                                {invoice.status === 'pending' && (
                                  <button
                                    onClick={() => {
                                      setSelectedInvoice(invoice.id);
                                      setShowInvoiceDetails(true);
                                      setTimeout(() => {
                                        setShowPaymentForm(true);
                                      }, 100);
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-xs"
                                  >
                                    <CreditCard className="w-3.5 h-3.5" />
                                    <span>Pay</span>
                                  </button>
                                )}
                                
                                {invoice.status === 'paid' && (
                                  <button
                                    onClick={() => {}}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-xs"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                    <span>Print</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  
                  {filteredInvoices.length === 0 && (
                    <div className="text-center py-12">
                      <Receipt className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        No {activeTab === 'pending' ? 'pending' : 'paid'} invoices
                      </h3>
                      <p className="text-gray-500 mb-4">
                        {searchQuery 
                          ? `No results for "${searchQuery}"`
                          : activeTab === 'pending'
                          ? 'All invoices have been paid'
                          : 'No paid invoices yet'
                        }
                      </p>
                      {activeTab === 'pending' && (
                        <button
                          onClick={() => setShowInvoiceForm(true)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create Invoice</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 bg-gray-50 border-t flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(indexOfLastItem, filteredInvoices.length)}</span> of{' '}
                    <span className="font-medium">{filteredInvoices.length}</span> invoices
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
          </div>

          {/* Right Section - Patient Queue */}
          <div className="w-1/3 flex flex-col space-y-3 h-[calc(100vh-180px)]">
            {/* Department Overview Card */}
            <div className="bg-white rounded-xl border shadow-sm p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <DollarSign className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-sm">Billing Overview</h2>
                </div>
                <div className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                  Today
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { 
                    label: 'Pending', 
                    value: stats.pendingInvoices,
                    icon: Clock,
                    color: 'amber'
                  },
                  { 
                    label: 'Paid', 
                    value: stats.paidInvoices,
                    icon: CheckCircle2,
                    color: 'green'
                  },
                  { 
                    label: "Today's Revenue", 
                    value: formatCurrency(stats.todayRevenue),
                    icon: Banknote,
                    color: 'blue'
                  },
                  { 
                    label: 'This Week', 
                    value: formatCurrency(stats.weekRevenue),
                    icon: BarChart3,
                    color: 'indigo'
                  }
                ].map(({ label, value, icon: Icon, color }) => (
                  <div key={label} className={`flex items-center justify-between p-1.5 bg-${color}-50 rounded-lg border border-${color}-100`}>
                    <div className="flex items-center gap-1.5">
                      <Icon className={`w-3.5 h-3.5 text-${color}-600`} />
                      <span className="text-xs font-medium text-slate-700">{label}</span>
                    </div>
                    <span className="text-sm font-bold text-slate-900">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-xl border shadow-sm p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-sm">Quick Actions</h2>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { 
                    label: 'New Invoice',
                    icon: Plus,
                    color: 'blue',
                    action: () => setShowInvoiceForm(true)
                  },
                  { 
                    label: 'Service Charges',
                    icon: Settings,
                    color: 'purple',
                    action: () => setCurrentSection('service-charges')
                  },
                  { 
                    label: 'Print Report',
                    icon: Printer,
                    color: 'gray',
                    action: () => {}
                  },
                  { 
                    label: 'View Payments',
                    icon: CreditCard,
                    color: 'green',
                    action: () => setActiveTab('paid')
                  }
                ].map(({ label, icon: Icon, color, action }) => (
                  <button 
                    key={label} 
                    onClick={action}
                    className={`flex items-center gap-1.5 p-1.5 bg-${color}-50 rounded-lg border border-${color}-100 hover:bg-${color}-100 transition-colors transform hover:-translate-y-0.5 hover:shadow-sm duration-200`}
                  >
                    <Icon className={`w-3.5 h-3.5 text-${color}-600`} />
                    <span className="text-xs font-medium">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Patient Queue */}
            <div className="flex-grow">
              <PatientWorkflowManager
                departmentId="billing"
                onPatientSelect={handlePatientSelect}
                className="h-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Invoice Form Modal */}
      {showInvoiceForm && (
        <InvoiceForm
          onClose={() => setShowInvoiceForm(false)}
          onSubmit={handleCreateInvoice}
          patientId={selectedPatient}
          serviceCharges={serviceCharges}
        />
      )}

      {/* Invoice Details Modal */}
      {showInvoiceDetails && selectedInvoice && (
        <InvoiceDetails
          invoice={allInvoices.find(i => i.id === selectedInvoice)!}
          onClose={() => {
            setShowInvoiceDetails(false);
            setSelectedInvoice(null);
          }}
          onProcessPayment={() => {
            setShowPaymentForm(true);
          }}
        />
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && selectedInvoice && (
        <PaymentForm
          invoice={allInvoices.find(i => i.id === selectedInvoice)!}
          onClose={() => {
            setShowPaymentForm(false);
          }}
          onSubmit={handleProcessPayment}
        />
      )}

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
import React, { useState, useEffect, useRef } from 'react';
import { usePatientStore } from '../../lib/store';
import { TestAutocomplete } from '../ui/TestAutocomplete';
import { LabTestOption, labTestCategories, getTestsByCategory } from '@/data/labTests';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  TestTube,
  Plus,
  X,
  Radio,
  Save,
  RefreshCw,
  Clock,
  Info,
  Search,
  Filter,
  FileText,
  Brain,
  Heart,
  Bone,
  Microscope,
  Beaker,
  ChevronRight,
  CalendarDays,
  User,
  FileBarChart,
  ClipboardList,
  Send,
  CreditCard,
  DollarSign
} from 'lucide-react';

interface LabTestManagerProps {
  patientId: string;
  onTestsChange: (tests: any[]) => Promise<void>;
  onClose: () => void;
  department?: 'laboratory' | 'radiology'; // Add department prop to control which tests are shown
}

export const LabTestManager: React.FC<LabTestManagerProps> = ({
  patientId,
  onTestsChange,
  onClose,
  department = 'laboratory' // Default to laboratory if not specified
}) => {
  const { 
    createLabRequest, 
    patientQueue, 
    updateParallelWorkflow, 
    serviceCharges,
    createInvoice,
    checkPaymentStatus,
    updatePatientStatus
  } = usePatientStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<'laboratory' | 'radiology'>(department);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTests, setSelectedTests] = useState<LabTestOption[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clinicalInfo, setClinicalInfo] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [success, setSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [returnToDepartment, setReturnToDepartment] = useState('');
  const [orderStatus, setOrderStatus] = useState<'preparing' | 'sending' | 'sent' | null>(null);
  const [createBillingInvoice, setCreateBillingInvoice] = useState(true);
  const [redirectToBilling, setRedirectToBilling] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
  
  // Get current patient to determine return department
  const currentPatient = patientQueue.find(p => p.id === patientId);

  // Countdown timer effect
  useEffect(() => {
    let timer: number;
    if (success && countdown > 0) {
      timer = window.setTimeout(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (success && countdown === 0) {
      if (redirectToBilling) {
        // Redirect to billing
        usePatientStore.getState().setCurrentSection('billing');
      } else {
        onClose();
      }
    }
    
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [success, countdown, onClose, redirectToBilling]);

  useEffect(() => {
    // Set default return department to patient's current department
    if (currentPatient) {
      setReturnToDepartment(currentPatient.currentDepartment);
      
      // Check if patient is urgent or critical
      if (currentPatient.priority === 'urgent' || currentPatient.priority === 'critical') {
        setPriority('urgent');
      }
    }
    
    // Check payment status
    const checkStatus = async () => {
      try {
        const isPaid = await checkPaymentStatus(patientId, selectedDepartment);
        setPaymentStatus(isPaid ? 'paid' : 'pending');
      } catch (error) {
        console.error("Error checking payment status:", error);
        setPaymentStatus('pending');
      }
    };
    
    checkStatus();
  }, [currentPatient, patientId, selectedDepartment, checkPaymentStatus]);

  const handleTestSelect = (name: string, test: LabTestOption) => {
    // Only allow selecting tests from the current department
    if (test.department !== selectedDepartment) {
      return;
    }
    
    setSelectedTests(prev => {
      const exists = prev.find(t => t.id === test.id);
      if (exists) {
        return prev.filter(t => t.id !== test.id);
      }
      return [...prev, test];
    });
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    const category = labTestCategories.find(c => c.id === categoryId);
    if (category) {
      // Don't change the department when selecting a category
      // This ensures we stay within the selected department
    }
  };

  const validateForm = () => {
    const errors: string[] = [];
    
    if (!clinicalInfo) errors.push('Clinical information is required');
    if (selectedTests.length === 0) errors.push('Please select at least one test');
    if (!returnToDepartment) errors.push('Return department is required');
    
    if (errors.length > 0) {
      setError(errors.join('. '));
      return false;
    }
    
    return true;
  };
  
  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    setError(null);
    setOrderStatus('preparing');
    
    try {
      const patient = patientQueue.find(p => p.id === patientId);
      if (!patient) throw new Error('Patient not found');

      // Create lab test requests
      const labRequests = selectedTests.map(test => ({
        id: crypto.randomUUID(),
        patientId,
        testType: test.name,
        requestedBy: 'Dr. Sarah Chen',
        requestedAt: new Date().toISOString(),
        department: test.department,
        priority,
        clinicalInfo,
        status: 'pending' as const,
        returnToDepartment,
        orderTransmissionStatus: 'ordered' as const,
        orderTransmissionTime: new Date().toISOString(),
        paymentStatus: 'pending' // Set initial payment status to pending
      }));

      // Update order status to sending
      setOrderStatus('sending');

      // Create each lab request
      for (const request of labRequests) {
        await createLabRequest(request);
      }

      // Update order status to sent
      setOrderStatus('sent');

      // Update patient's parallel workflow flags
      const updates: Partial<Patient> = {
        returnToDepartment
      };
      
      // Set the appropriate pending flag based on the first test's department
      if (labRequests[0].department === 'laboratory') {
        updates.pendingLabTests = true;
      } else if (labRequests[0].department === 'radiology') {
        updates.pendingRadiologyTests = true;
      }
      
      await updateParallelWorkflow(patientId, updates);

      // Update patient status to indicate they're waiting for lab/radiology
      const newStatus = labRequests[0].department === 'laboratory' 
        ? 'waiting-for-lab' 
        : 'waiting-for-radiology';
      
      await updatePatientStatus(patientId, newStatus);

      // Create billing invoice for the tests
      if (createBillingInvoice) {
        try {
          // Create billing items from selected tests
          const billingItems = selectedTests.map(test => ({
            id: crypto.randomUUID(),
            patientId,
            serviceId: test.id,
            serviceName: test.name,
            quantity: 1,
            unitPrice: test.price || 0,
            totalAmount: test.price || 0,
            department: test.department,
            category: test.category,
            status: 'pending' as const,
            createdAt: new Date().toISOString(),
            testId: labRequests.find(r => r.testType === test.name)?.id // Link to the test
          }));
          
          // Calculate total amount
          const totalAmount = billingItems.reduce((sum, item) => sum + item.totalAmount, 0);
          
          // Create invoice
          const invoice = {
            id: crypto.randomUUID(),
            patientId,
            visitId: `VISIT-${Date.now().toString().slice(-6)}`,
            items: billingItems,
            totalAmount,
            status: 'pending' as const,
            createdAt: new Date().toISOString(),
            dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
          };
          
          await createInvoice(invoice);
          
          // Set redirect to billing flag
          setRedirectToBilling(true);
        } catch (error) {
          console.error('Error creating invoice:', error);
          // Don't fail the whole operation if billing fails
        }
      }

      // Show success message
      setSuccess(true);
      setCountdown(3);
      
      // Call the callback with the created tests
      await onTestsChange(labRequests);
    } catch (error) {
      console.error('Error creating lab requests:', error);
      setError(error instanceof Error ? error.message : 'Failed to create lab requests. Please try again.');
      setOrderStatus(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filter categories based on selected department
  const filteredCategories = labTestCategories.filter(category => 
    category.department === selectedDepartment
  );

  const categoryTests = selectedCategory ? getTestsByCategory(selectedCategory) : [];

  // Calculate total estimated cost
  const calculateEstimatedCost = () => {
    if (selectedTests.length === 0) return 0;
    
    return selectedTests.reduce((total, test) => {
      return total + (test.price || 0);
    }, 0);
  };

  const estimatedCost = calculateEstimatedCost();
  const formattedCost = `KES ${estimatedCost.toLocaleString()}`;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex-none p-4 border-b bg-gradient-to-r from-indigo-50 to-blue-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-100 rounded-lg shadow-sm">
                {selectedDepartment === 'radiology' ? (
                  <Radio className="w-5 h-5 text-indigo-600" />
                ) : (
                  <TestTube className="w-5 h-5 text-indigo-600" />
                )}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">
                  {selectedDepartment === 'radiology' ? 'Order Radiology Tests' : 'Order Laboratory Tests'}
                </h3>
                <p className="text-sm text-gray-500">Request diagnostic tests for this patient</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {success ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6 shadow-sm">
                <CheckCircle2 className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">Tests Ordered Successfully</h3>
              <p className="text-gray-600 mb-8 max-w-md">
                The tests have been ordered and sent to the {selectedDepartment === 'laboratory' ? 'Laboratory' : 'Radiology'} department.
                <strong className="block mt-2 text-amber-600">Payment required before processing.</strong>
                The patient will remain in the current department while tests are being processed. 
                Results will be sent back to {returnToDepartment}.
              </p>
              <div className="animate-pulse bg-blue-50 px-6 py-3 rounded-full">
                <p className="text-blue-700 font-medium">
                  {redirectToBilling 
                    ? `Redirecting to billing in ${countdown} seconds...` 
                    : `Returning to patient queue in ${countdown} seconds...`}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex h-full overflow-hidden">
              {/* Left sidebar */}
              <div className="w-64 border-r bg-gray-50 overflow-y-auto">
                <div className="p-3 space-y-4">
                  {/* Department Filter - Only show if not passed as prop */}
                  {!department && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Department</h4>
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => setSelectedDepartment('laboratory')}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedDepartment === 'laboratory'
                              ? 'bg-white shadow-sm text-purple-600 font-medium'
                              : 'text-gray-600 hover:bg-white/70'
                          }`}
                        >
                          <TestTube className="w-4 h-4" />
                          <span>Laboratory</span>
                        </button>
                        <button
                          onClick={() => setSelectedDepartment('radiology')}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            selectedDepartment === 'radiology'
                              ? 'bg-white shadow-sm text-blue-600 font-medium'
                              : 'text-gray-600 hover:bg-white/70'
                          }`}
                        >
                          <Radio className="w-4 h-4" />
                          <span>Radiology</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Categories */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Categories</h4>
                    <div className="space-y-1 max-h-[200px] overflow-y-auto pr-1">
                      {filteredCategories.map(category => (
                        <button
                          key={category.id}
                          onClick={() => handleCategorySelect(category.id)}
                          className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                            selectedCategory === category.id
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <div className={`p-1.5 ${
                            selectedCategory === category.id 
                              ? 'bg-indigo-100' 
                              : 'bg-white'
                          } rounded-lg shadow-sm`}>
                            <category.icon className={`w-4 h-4 ${
                              selectedCategory === category.id
                                ? 'text-indigo-600'
                                : 'text-gray-500'
                            }`} />
                          </div>
                          <div className="min-w-0">
                            <p className={`font-medium text-sm truncate ${
                              selectedCategory === category.id
                                ? 'text-indigo-700'
                                : 'text-gray-700'
                            }`}>{category.name}</p>
                            <p className="text-xs text-gray-500 truncate">{category.description}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Priority Selection */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Priority</h4>
                    <div className="space-y-2">
                      <button
                        onClick={() => setPriority('normal')}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                          priority === 'normal'
                            ? 'bg-green-50 text-green-700 border border-green-100'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className={`p-1.5 ${
                          priority === 'normal' 
                            ? 'bg-green-100' 
                            : 'bg-white'
                        } rounded-lg shadow-sm`}>
                          <Clock className={`w-4 h-4 ${
                            priority === 'normal'
                              ? 'text-green-600'
                              : 'text-gray-500'
                          }`} />
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${
                            priority === 'normal'
                              ? 'text-green-700'
                              : 'text-gray-700'
                          }`}>Normal</p>
                          <p className="text-xs text-gray-500">Standard processing time</p>
                        </div>
                      </button>
                      <button
                        onClick={() => setPriority('urgent')}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-colors ${
                          priority === 'urgent'
                            ? 'bg-red-50 text-red-700 border border-red-100'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        <div className={`p-1.5 ${
                          priority === 'urgent' 
                            ? 'bg-red-100' 
                            : 'bg-white'
                        } rounded-lg shadow-sm`}>
                          <AlertCircle className={`w-4 h-4 ${
                            priority === 'urgent'
                              ? 'text-red-600'
                              : 'text-gray-500'
                          }`} />
                        </div>
                        <div>
                          <p className={`font-medium text-sm ${
                            priority === 'urgent'
                              ? 'text-red-700'
                              : 'text-gray-700'
                          }`}>Urgent</p>
                          <p className="text-xs text-gray-500">Expedited processing</p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Return Department */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Return Results To</h4>
                    <select
                      value={returnToDepartment}
                      onChange={(e) => setReturnToDepartment(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 shadow-sm text-sm"
                    >
                      <option value="">Select Department</option>
                      <option value="general-consultation">General Consultation</option>
                      <option value="pediatrics">Pediatrics</option>
                      <option value="gynecology">Gynecology</option>
                      <option value="surgical">Surgical</option>
                      <option value="orthopedic">Orthopedic</option>
                      <option value="dental">Dental</option>
                      <option value="eye-clinic">Eye Clinic</option>
                      <option value="physiotherapy">Physiotherapy</option>
                    </select>
                    {!returnToDepartment && (
                      <p className="text-xs text-red-500 mt-1 px-1">
                        Please select where to send results
                      </p>
                    )}
                  </div>

                  {/* Billing Information */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">Billing Information</h4>
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                      <div className="flex items-center gap-2 mb-2">
                        <CreditCard className="w-4 h-4 text-amber-600" />
                        <h3 className="text-sm font-medium text-amber-800">
                          Payment Required
                        </h3>
                      </div>
                      <p className="text-xs text-amber-700 mb-3">
                        Tests require payment before processing. Estimated cost:
                      </p>
                      <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-amber-200">
                        <div className="flex items-center gap-1.5">
                          <DollarSign className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-sm font-medium text-amber-800">Estimated Cost:</span>
                        </div>
                        <span className="text-sm font-bold text-amber-800">{formattedCost}</span>
                      </div>
                      <div className="mt-3">
                        <label className="flex items-center gap-2 text-xs text-amber-800">
                          <input
                            type="checkbox"
                            checked={createBillingInvoice}
                            onChange={(e) => setCreateBillingInvoice(e.target.checked)}
                            className="rounded text-amber-600 focus:ring-amber-500"
                          />
                          <span>Automatically create invoice for billing</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main content */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-4">
                  {/* Payment Notice */}
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Info className="w-5 h-5 text-amber-600 flex-shrink-0" />
                      <p className="text-sm text-amber-700">
                        Payment required before processing. Patient will be directed to billing after test ordering.
                      </p>
                    </div>
                  </div>

                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <TestAutocomplete
                      value={searchQuery}
                      onChange={handleTestSelect}
                      placeholder={`Search for ${selectedDepartment} tests by name or category...`}
                      department={selectedDepartment}
                    />
                  </div>

                  {/* Selected Tests */}
                  {selectedTests.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-4 border border-blue-100 shadow-sm">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-blue-100 rounded-lg shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-blue-600" />
                          </div>
                          <h4 className="font-medium text-blue-900">Selected Tests ({selectedTests.length})</h4>
                        </div>
                      </div>
                      <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
                        {selectedTests.map(test => (
                          <div
                            key={test.id}
                            className="flex items-center justify-between bg-white p-3 rounded-lg border border-blue-100 shadow-sm"
                          >
                            <div className="flex items-center gap-2">
                              <div className="p-1.5 bg-blue-50 rounded-lg">
                                {test.department === 'laboratory' ? (
                                  <TestTube className="w-4 h-4 text-blue-600" />
                                ) : (
                                  <Radio className="w-4 h-4 text-blue-600" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{test.name}</p>
                                <p className="text-xs text-gray-500">{test.department} • {test.category}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-gray-500">
                                KES {test.price?.toLocaleString() || '0'}
                              </span>
                              <button
                                onClick={() => handleTestSelect(test.name, test)}
                                className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-200 flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-800">Total Estimated Cost:</span>
                        <span className="text-sm font-bold text-blue-800">{formattedCost}</span>
                      </div>
                    </div>
                  )}

                  {/* Order Status */}
                  {orderStatus && (
                    <div className={`p-4 rounded-lg border ${
                      orderStatus === 'preparing' ? 'bg-blue-50 border-blue-200' :
                      orderStatus === 'sending' ? 'bg-amber-50 border-amber-200' :
                      'bg-green-50 border-green-200'
                    }`}>
                      <div className="flex items-center gap-2">
                        {orderStatus === 'preparing' ? (
                          <>
                            <ClipboardList className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="font-medium text-blue-800">Preparing Order</p>
                              <p className="text-sm text-blue-600">Preparing test order details...</p>
                            </div>
                          </>
                        ) : orderStatus === 'sending' ? (
                          <>
                            <Send className="w-5 h-5 text-amber-600" />
                            <div>
                              <p className="font-medium text-amber-800">Sending Order</p>
                              <p className="text-sm text-amber-600">Transmitting order to {selectedDepartment}...</p>
                            </div>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <div>
                              <p className="font-medium text-green-800">Order Sent</p>
                              <p className="text-sm text-green-600">Order successfully transmitted to {selectedDepartment}</p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Available Tests */}
                  {selectedCategory && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">Available Tests</h4>
                        <span className="text-sm text-gray-500">
                          {categoryTests.length} tests in {labTestCategories.find(c => c.id === selectedCategory)?.name}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 max-h-[200px] overflow-y-auto pr-1">
                        {categoryTests.map(test => {
                          // Only show tests from the selected department
                          if (test.department !== selectedDepartment) return null;
                          
                          return (
                            <button
                              key={test.id}
                              onClick={() => handleTestSelect(test.name, test)}
                              className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                                selectedTests.find(t => t.id === test.id)
                                  ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-500/20'
                                  : 'hover:bg-gray-50 border-gray-200'
                              }`}
                            >
                              <div className={`p-2 rounded-lg ${
                                selectedTests.find(t => t.id === test.id)
                                  ? 'bg-indigo-100'
                                  : 'bg-gray-100'
                              }`}>
                                {test.department === 'laboratory' ? (
                                  <TestTube className={`w-4 h-4 ${
                                    selectedTests.find(t => t.id === test.id)
                                      ? 'text-indigo-600'
                                      : 'text-gray-500'
                                  }`} />
                                ) : (
                                  <Radio className={`w-4 h-4 ${
                                    selectedTests.find(t => t.id === test.id)
                                      ? 'text-indigo-600'
                                      : 'text-gray-500'
                                  }`} />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`font-medium text-sm ${
                                  selectedTests.find(t => t.id === test.id)
                                    ? 'text-indigo-900'
                                    : 'text-gray-900'
                                }`}>{test.name}</p>
                                <p className="text-xs text-gray-500 truncate">{test.description}</p>
                              </div>
                              <div className="text-xs font-medium text-gray-700">
                                KES {test.price?.toLocaleString() || '0'}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                      
                      {categoryTests.filter(test => test.department === selectedDepartment).length === 0 && (
                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed">
                          {selectedDepartment === 'laboratory' ? (
                            <TestTube className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          ) : (
                            <Radio className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                          )}
                          <p className="text-gray-500 font-medium">No tests found</p>
                          <p className="text-sm text-gray-400 mt-1">Try a different category</p>
                        </div>
                      )}
                    </div>
                  )}

                  {!selectedCategory && !searchQuery && (
                    <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed">
                      {selectedDepartment === 'laboratory' ? (
                        <TestTube className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      ) : (
                        <Radio className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      )}
                      <p className="text-gray-500 font-medium">Select a category</p>
                      <p className="text-sm text-gray-400 mt-1">Choose a category from the sidebar to view available tests</p>
                    </div>
                  )}

                  {/* Clinical Information */}
                  <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-1.5 bg-indigo-100 rounded-lg shadow-sm">
                        <FileText className="w-4 h-4 text-indigo-600" />
                      </div>
                      <h4 className="font-medium text-indigo-900">Clinical Information</h4>
                    </div>
                    <textarea
                      value={clinicalInfo}
                      onChange={(e) => setClinicalInfo(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border border-indigo-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                      placeholder="Enter clinical information, symptoms, or reason for test..."
                    />
                    {!clinicalInfo && (
                      <p className="mt-2 text-sm text-indigo-600 flex items-center gap-1.5">
                        <Info className="w-4 h-4" />
                        <span>Please provide relevant clinical information to help with test interpretation</span>
                      </p>
                    )}
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!success && (
          <div className="flex-none p-4 bg-gray-50 border-t">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 flex items-center gap-2">
                <div className="p-1.5 bg-indigo-100 rounded-full">
                  {selectedDepartment === 'radiology' ? (
                    <Radio className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <TestTube className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
                <span>{selectedTests.length} test{selectedTests.length !== 1 ? 's' : ''} selected</span>
                {selectedTests.length > 0 && (
                  <span className="ml-2 font-medium text-indigo-600">{formattedCost}</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:text-gray-900 font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || selectedTests.length === 0 || !clinicalInfo || !returnToDepartment}
                  className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed shadow-sm font-medium transition-colors"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Send Order</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LabTestManager;
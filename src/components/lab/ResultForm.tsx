import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { useAutosave } from '../../lib/useAutosave';
import { AutosaveIndicator } from '../AutosaveIndicator';
import { 
  X, 
  Pill, 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  ArrowRight, 
  Printer, 
  Download, 
  Send, 
  CheckCircle2, 
  Package,
  RefreshCw,
  CreditCard,
  AlertCircle,
  DollarSign,
  ChevronDown,
  ChevronUp,
  UserMinus,
  UserPlus,
  Play,
  X as XIcon,
  TestTube,
  Radio,
  Loader2,
  Gauge,
  BarChart3,
  LineChart,
  PieChart,
  Bell,
  ShieldAlert,
  Server,
  Cpu,
  Zap,
  Calendar as CalendarIcon,
  UserCog,
  Heart,
  ThermometerSun,
  Laptop,
  Wifi,
  CheckCheck,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle as CircleAlert,
  CheckCircle as CircleCheck,
  Siren,
  Ambulance,
  Bed,
  Milestone,
  Settings,
  Info,
  Eye,
  Upload,
  CornerDownLeft,
  MessageSquare,
  Save,
  Plus,
  Globe as GlobeIcon,
  Mail,
  BadgeCheck
} from 'lucide-react';
import type { LabTest, Patient } from '../../types';
import { usePatientStore } from '../../lib/store';
import { useAuth } from '../../hooks/useAuth';

interface ResultFormProps {
  test: LabTest;
  patient: Patient;
  onClose: () => void;
  onSubmit: (results: LabTest['results'], delivery?: LabTest['reportDelivery']) => Promise<void>;
}

export const ResultForm: React.FC<ResultFormProps> = ({
  test,
  patient,
  onClose,
  onSubmit
}) => {
  // Early return if patient is undefined
  if (!patient) {
    console.error('Patient data is missing in ResultForm');
    onClose();
    return null;
  }

  const { checkPaymentStatus, addNotification, updateLabTest } = usePatientStore();
  const { user } = useAuth();
  const [findings, setFindings] = useState('');
  const [interpretation, setInterpretation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [customFields, setCustomFields] = useState<Record<string, any>>({});
  const [rawData, setRawData] = useState<Record<string, any>>({});
  const [criticalValues, setCriticalValues] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState<'email' | 'print' | 'portal'>('portal');
  const [deliveryEmail, setDeliveryEmail] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid'>('pending');
  const [showPaymentWarning, setShowPaymentWarning] = useState(false);
  const [testPrice, setTestPrice] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    findings,
    interpretation,
    imageUrl,
    customFields,
    rawData,
    criticalValues,
    deliveryMethod,
    deliveryEmail
  });

  // Set up autosave
  const { status: saveStatus, lastSaved, error: saveError, save } = useAutosave({
    data: formData,
    onSave: async (data) => {
      // This would typically save to a database
      console.log('Autosaving lab result form data:', data);
      // In a real implementation, you would save this to persistent storage
    },
    interval: 30000, // Save every 30 seconds
    saveOnBlur: true,
    saveOnUnmount: true,
    enabled: true
  });

  // Update formData when form fields change
  React.useEffect(() => {
    setFormData({
      findings,
      interpretation,
      imageUrl,
      customFields,
      rawData,
      criticalValues,
      deliveryMethod,
      deliveryEmail
    });
  }, [findings, interpretation, imageUrl, customFields, rawData, criticalValues, deliveryMethod, deliveryEmail]);
  
  // Load previous values if test was already started
  React.useEffect(() => {
    if (test.results) {
      setFindings(test.results.findings);
      setInterpretation(test.results.interpretation || '');
      setImageUrl(test.results.imageUrl || '');
      setCustomFields(test.results.customFields || {});
      setRawData(test.results.rawData || {});
      setCriticalValues(test.results.criticalValues || false);
    }
    
    // Check payment status
    const checkStatus = async () => {
      // Check if payment status is already set on the test
      if (test.paymentStatus === 'paid') {
        setPaymentStatus('paid');
        return;
      }
      
      // Check payment status
      const isPaid = await checkPaymentStatus(patient.id, test.department);
      setPaymentStatus(isPaid ? 'paid' : 'pending');
    };
    
    checkStatus();
    
    // Get test price from the test type
    const getTestPrice = () => {
      // Import the test categories to find the price
      import('@/data/labTests').then(({ labTestCategories }) => {
        // Find the category that contains this test
        for (const category of labTestCategories) {
          const foundTest = category.tests.find(t => t.name === test.testType);
          if (foundTest && foundTest.price) {
            setTestPrice(foundTest.price);
            break;
          }
        }
      }).catch(err => {
        console.error('Error loading test price:', err);
      });
    };
    
    getTestPrice();
  }, [test, patient.id, checkPaymentStatus]);

  const validateForm = () => {
    if (!findings) {
      setError('Findings are required');
      return false;
    }

    // For radiology tests, image URL is required
    if (test.department === 'radiology' && !imageUrl) {
      setError('Image URL is required for radiology results');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    // Check payment status
    if (paymentStatus === 'pending') {
      setShowPaymentWarning(true);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const results: LabTest['results'] = {
        findings,
        interpretation,
        performedBy: user?.name || 'Lab Technician',
        performedAt: new Date().toISOString(),
        imageUrl: imageUrl || undefined,
        customFields,
        rawData,
        criticalValues
      };

      const delivery: LabTest['reportDelivery'] = {
        method: deliveryMethod,
        deliveredTo: deliveryMethod === 'email' ? deliveryEmail : undefined,
        status: 'delivered'
      };

      await onSubmit(results, delivery);
      
      // Create notification for test completion
      addNotification({
        id: crypto.randomUUID(),
        type: `${test.department === 'laboratory' ? 'lab' : 'radiology'}-result`,
        title: `${test.department === 'laboratory' ? 'Lab' : 'Radiology'} results completed`,
        message: `Results for ${test.testType} have been finalized`,
        timestamp: new Date().toISOString(),
        read: false,
        patientId: patient.id,
        testId: test.id,
        priority: criticalValues ? 'high' : 'normal',
        action: 'view-results',
        departmentTarget: test.returnToDepartment
      });
      
      setSuccess(true);
      
      // Close after a short delay
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error('Error submitting results:', error);
      setError('Failed to submit results. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle raw data input
  const handleRawDataChange = (key: string, value: any) => {
    setRawData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Add a new raw data field
  const [newRawDataKey, setNewRawDataKey] = useState('');
  const [newRawDataValue, setNewRawDataValue] = useState('');
  
  const addRawDataField = () => {
    if (!newRawDataKey) return;
    
    setRawData(prev => ({
      ...prev,
      [newRawDataKey]: newRawDataValue
    }));
    
    setNewRawDataKey('');
    setNewRawDataValue('');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                {test.department === 'laboratory' ? (
                  <TestTube className="w-5 h-5 text-blue-600" />
                ) : (
                  <Radio className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <h3 className="font-medium text-gray-900">{test.testType}</h3>
                <p className="text-sm text-gray-500">{patient.fullName}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <AutosaveIndicator 
                status={saveStatus} 
                lastSaved={lastSaved} 
                error={saveError} 
                onManualSave={save} 
              />
              {paymentStatus === 'pending' && (
                <div className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg flex items-center gap-2 text-sm">
                  <CreditCard className="w-4 h-4" />
                  <span>Payment Required</span>
                </div>
              )}
              {paymentStatus === 'paid' && (
                <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-lg flex items-center gap-2 text-sm">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Payment Verified</span>
                </div>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Test Price Information */}
          {testPrice !== null && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-blue-600" />
              <div className="flex-1">
                <p className="font-medium text-blue-700">Test Price Information</p>
                <p className="text-sm mt-1">
                  This test costs <span className="font-bold">KES {testPrice.toLocaleString()}</span>
                </p>
              </div>
            </div>
          )}
          
          {/* Payment Status Alert */}
          {paymentStatus === 'pending' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600" />
              <div className="flex-1">
                <p className="font-medium text-amber-700">Payment Required</p>
                <p className="text-sm mt-1">
                  Payment must be completed before test results can be released. Please direct the patient to billing.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  usePatientStore.getState().setCurrentSection('billing');
                  onClose();
                }}
                className="px-3 py-1.5 rounded-lg text-sm bg-amber-100 text-amber-700"
              >
                <CreditCard className="w-4 h-4 mr-1 inline-block" />
                Go to Billing
              </button>
            </div>
          )}

          {/* Critical Values */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={criticalValues}
                onChange={(e) => setCriticalValues(e.target.checked)}
                className="text-red-600 focus:ring-red-500"
              />
              <span className="text-sm font-medium">Mark as Critical Values</span>
            </label>
            {criticalValues && (
              <span className="text-xs text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                Requires immediate attention
              </span>
            )}
          </div>

          {/* Findings and Interpretation */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Findings <span className="text-red-500">*</span>
              </label>
              <textarea
                value={findings}
                onChange={(e) => setFindings(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter test findings..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Interpretation
              </label>
              <textarea
                value={interpretation}
                onChange={(e) => setInterpretation(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="Enter result interpretation..."
              />
            </div>
          </div>

          {/* Image URL for Radiology */}
          {test.department === 'radiology' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Image URL <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Enter image URL"
                  className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  required={test.department === 'radiology'}
                />
                <button
                  type="button"
                  className="px-3 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                >
                  <Upload className="w-4 h-4" />
                </button>
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Enter a URL to the image or scan result
              </p>
              {imageUrl && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-700">Image Preview:</span>
                    <a 
                      href={imageUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>View Full Size</span>
                    </a>
                  </div>
                  <div className="bg-gray-200 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">Image URL: {imageUrl}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Custom Fields */}
          {test.testType === 'Complete Blood Count (CBC)' && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 mb-3">Test Parameters</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    White Blood Cell Count
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={customFields.wbc || ''}
                      onChange={(e) => setCustomFields({...customFields, wbc: e.target.value})}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter value"
                    />
                    <span className="text-sm text-gray-500 whitespace-nowrap">×10⁹/L</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Normal range: 4.0-11.0</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Red Blood Cell Count
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={customFields.rbc || ''}
                      onChange={(e) => setCustomFields({...customFields, rbc: e.target.value})}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter value"
                    />
                    <span className="text-sm text-gray-500 whitespace-nowrap">×10¹²/L</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Normal range: 4.5-5.5</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Hemoglobin
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={customFields.hemoglobin || ''}
                      onChange={(e) => setCustomFields({...customFields, hemoglobin: e.target.value})}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter value"
                    />
                    <span className="text-sm text-gray-500 whitespace-nowrap">g/dL</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Normal range: 13.5-17.5</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Platelet Count
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={customFields.platelets || ''}
                      onChange={(e) => setCustomFields({...customFields, platelets: e.target.value})}
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter value"
                    />
                    <span className="text-sm text-gray-500 whitespace-nowrap">×10⁹/L</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Normal range: 150-450</p>
                </div>
              </div>
            </div>
          )}

          {/* Raw Test Data Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Raw Test Data</h4>
              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                For reference purposes
              </div>
            </div>
            
            {/* Existing Raw Data */}
            {Object.keys(rawData).length > 0 && (
              <div className="space-y-2">
                {Object.entries(rawData).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-1/3">
                      <input
                        type="text"
                        value={key}
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleRawDataChange(key, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Value"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Add New Raw Data Field */}
            <div className="flex items-end gap-2">
              <div className="w-1/3">
                <label className="block text-xs text-gray-500 mb-1">Parameter</label>
                <input
                  type="text"
                  value={newRawDataKey}
                  onChange={(e) => setNewRawDataKey(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Parameter name"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Value</label>
                <input
                  type="text"
                  value={newRawDataValue}
                  onChange={(e) => setNewRawDataValue(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Parameter value"
                />
              </div>
              <button
                type="button"
                onClick={addRawDataField}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            
            {Object.keys(rawData).length === 0 && (
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
                <p className="text-sm text-gray-500">No raw data added yet</p>
                <p className="text-xs text-gray-400 mt-1">Add raw test data for reference purposes</p>
              </div>
            )}
          </div>

          {/* Delivery Method */}
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900">Result Delivery</h4>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryMethod('portal')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  deliveryMethod === 'portal'
                    ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500/20'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <GlobeIcon className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">Patient Portal</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Results available in portal
                </p>
              </button>
              
              <button
                type="button"
                onClick={() => setDeliveryMethod('email')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  deliveryMethod === 'email'
                    ? 'border-green-500 bg-green-50 ring-1 ring-green-500/20'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-green-600" />
                  <span className="font-medium">Email</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Send results via email
                </p>
              </button>
              
              <button
                type="button"
                onClick={() => setDeliveryMethod('print')}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  deliveryMethod === 'print'
                    ? 'border-purple-500 bg-purple-50 ring-1 ring-purple-500/20'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Printer className="w-5 h-5 text-purple-600" />
                  <span className="font-medium">Print</span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Print physical copy
                </p>
              </button>
            </div>
            
            {deliveryMethod === 'email' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={deliveryEmail || patient.email || ''}
                  onChange={(e) => setDeliveryEmail(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter email address"
                />
              </div>
            )}
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Results submitted successfully!</span>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
              disabled={isSubmitting || success}
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting || success || paymentStatus === 'pending' || !validateForm()}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg ${
                isSubmitting || success || paymentStatus === 'pending' || !validateForm()
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Results Sent</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Submit Results</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Payment Warning Modal */}
        {showPaymentWarning && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[60]">
            <div className="bg-white rounded-xl w-full max-w-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <h3 className="text-lg font-semibold">Payment Required</h3>
              </div>
              <p className="text-gray-600 mb-6">
                Payment is required before test results can be released. Would you like to:
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => {
                    usePatientStore.getState().setCurrentSection('billing');
                    onClose();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Go to Billing First</span>
                </button>
                
                <button
                  onClick={() => setShowPaymentWarning(false)}
                  className="w-full px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
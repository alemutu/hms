import React, { useState, useEffect } from 'react';
import { usePatientStore } from '../../lib/store';
import { useAutosave } from '../../lib/useAutosave';
import { AutosaveIndicator } from '../AutosaveIndicator';
import {
  X,
  Search,
  Plus,
  Trash2,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Users,
  Receipt,
  Calendar,
  CreditCard,
  TestTube,
  Radio,
  Pill,
  Building2,
  Info
} from 'lucide-react';
import { format } from 'date-fns';
import type { Invoice, BillingItem, ServiceCharge, Patient, LabTest } from '../../types';
import { departments, departmentNames } from '../../types/departments';

interface InvoiceFormProps {
  onClose: () => void;
  onSubmit: (invoice: Invoice) => Promise<void>;
  patientId?: string | null;
  serviceCharges: ServiceCharge[];
  forService?: 'consultation' | 'laboratory' | 'radiology' | 'pharmacy' | 'general';
}

export const InvoiceForm: React.FC<InvoiceFormProps> = ({
  onClose,
  onSubmit,
  patientId,
  serviceCharges,
  forService = 'general'
}) => {
  const { patientQueue, labTests = {}, prescriptions = {}, medicationStock = [] } = usePatientStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [invoiceItems, setInvoiceItems] = useState<BillingItem[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceCharge | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dueDate, setDueDate] = useState<string>(
    format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd')
  );
  const [showPendingTests, setShowPendingTests] = useState(false);
  const [showPendingPrescriptions, setShowPendingPrescriptions] = useState(false);
  const [showConsultationFee, setShowConsultationFee] = useState(false);
  const [formData, setFormData] = useState({
    patientId: '',
    dueDate: format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    invoiceItems: [] as BillingItem[],
    selectedService: null as ServiceCharge | null,
    quantity: 1
  });

  // Set up autosave
  const { status: saveStatus, lastSaved, error: saveError, save } = useAutosave({
    data: formData,
    onSave: async (data) => {
      // This would typically save to a database
      console.log('Autosaving invoice form data:', data);
      // In a real implementation, you would save this to persistent storage
    },
    interval: 30000, // Save every 30 seconds
    saveOnBlur: true,
    saveOnUnmount: true,
    enabled: true
  });

  // Filter patients based on search query
  const filteredPatients = patientQueue.filter(patient =>
    patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.idNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter service charges based on the selected service type
  const filteredServiceCharges = serviceCharges.filter(service => {
    if (forService === 'consultation') {
      return service.category === 'consultation';
    } else if (forService === 'laboratory') {
      return service.department === 'laboratory';
    } else if (forService === 'radiology') {
      return service.department === 'radiology';
    } else if (forService === 'pharmacy') {
      return service.department === 'pharmacy';
    }
    return true;
  });

  // Calculate total amount
  const totalAmount = invoiceItems.reduce((sum, item) => sum + item.totalAmount, 0);

  // Update formData when form fields change
  useEffect(() => {
    setFormData({
      patientId: selectedPatient?.id || '',
      dueDate,
      invoiceItems,
      selectedService,
      quantity
    });
  }, [selectedPatient, dueDate, invoiceItems, selectedService, quantity]);

  // Set selected patient if patientId is provided
  useEffect(() => {
    if (patientId) {
      const patient = patientQueue.find(p => p.id === patientId);
      if (patient) {
        setSelectedPatient(patient);
        setFormData(prev => ({ ...prev, patientId: patient.id }));
        
        // Check for pending lab tests and prescriptions
        const patientLabTests = labTests[patientId] || [];
        const pendingTests = patientLabTests.filter(test => 
          test.paymentStatus === 'pending' || 
          (!test.paymentStatus && test.status !== 'completed')
        );
        
        if (pendingTests.length > 0) {
          setShowPendingTests(true);
        }
        
        const patientPrescriptions = prescriptions[patientId] || [];
        const pendingPrescriptions = patientPrescriptions.filter(prescription => 
          prescription.status === 'stock-verified' || 
          prescription.status === 'pending'
        );
        
        if (pendingPrescriptions.length > 0) {
          setShowPendingPrescriptions(true);
        }

        // Check if we need to add a consultation fee
        if (forService === 'consultation' || 
            (forService === 'general' && 
             (patient.status === 'registered' || 
              patient.status === 'activated' || 
              patient.status === 'triage-complete'))) {
          setShowConsultationFee(true);
        }
      }
    }
  }, [patientId, patientQueue, labTests, prescriptions, forService]);

  // Auto-add consultation fee if needed
  useEffect(() => {
    if (showConsultationFee && selectedPatient) {
      // Find the consultation fee service
      const consultationFee = serviceCharges.find(s => 
        s.category === 'consultation' && s.name.toLowerCase().includes('consultation')
      );
      
      if (consultationFee && invoiceItems.length === 0) {
        // Add consultation fee to invoice items
        const newItem: BillingItem = {
          id: crypto.randomUUID(),
          patientId: selectedPatient.id,
          serviceId: consultationFee.id,
          serviceName: consultationFee.name,
          quantity: 1,
          unitPrice: consultationFee.amount,
          totalAmount: consultationFee.amount,
          department: consultationFee.department,
          category: consultationFee.category,
          status: 'pending',
          createdAt: new Date().toISOString()
        };
        
        setInvoiceItems([newItem]);
      }
    }
  }, [showConsultationFee, selectedPatient, serviceCharges, invoiceItems.length]);

  const handleAddItem = () => {
    if (!selectedService) return;

    const newItem: BillingItem = {
      id: crypto.randomUUID(),
      patientId: selectedPatient!.id,
      serviceId: selectedService.id,
      serviceName: selectedService.name,
      quantity,
      unitPrice: selectedService.amount,
      totalAmount: selectedService.amount * quantity,
      department: selectedService.department,
      category: selectedService.category,
      status: 'pending',
      createdAt: new Date().toISOString()
    };

    setInvoiceItems([...invoiceItems, newItem]);
    setSelectedService(null);
    setQuantity(1);
  };

  const handleRemoveItem = (itemId: string) => {
    setInvoiceItems(invoiceItems.filter(item => item.id !== itemId));
  };

  const validateForm = () => {
    if (!selectedPatient) {
      setError('Please select a patient');
      return false;
    }

    if (invoiceItems.length === 0) {
      setError('Please add at least one item to the invoice');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const invoice: Invoice = {
        id: crypto.randomUUID(),
        patientId: selectedPatient!.id,
        visitId: `VISIT-${Date.now().toString().slice(-6)}`,
        items: invoiceItems,
        totalAmount,
        status: 'pending',
        createdAt: new Date().toISOString(),
        dueDate
      };

      await onSubmit(invoice);
    } catch (error) {
      console.error('Error creating invoice:', error);
      setError(error instanceof Error ? error.message : 'Failed to create invoice');
      setIsSubmitting(false);
    }
  };

  const handleAddPendingTests = () => {
    if (!selectedPatient) return;
    
    const patientLabTests = labTests[selectedPatient.id] || [];
    const pendingTests = patientLabTests.filter(test => 
      test.paymentStatus === 'pending' || 
      (!test.paymentStatus && test.status !== 'completed')
    );
    
    // Create invoice items for each pending test
    const testItems = pendingTests.map(test => {
      // Find matching service charge
      const serviceCharge = serviceCharges.find(sc => 
        sc.name.toLowerCase().includes(test.testType.toLowerCase()) || 
        (sc.department === test.department && sc.category === test.department)
      );
      
      // If no exact match, use default charge for the department
      const defaultCharge = serviceCharges.find(sc => 
        sc.department === test.department && 
        (sc.name.toLowerCase().includes('default') || sc.name.toLowerCase().includes('standard'))
      );
      
      // Find test price from labTests data
      let testPrice = 0;
      import('@/data/labTests').then(({ labTestCategories }) => {
        // Find the category that contains this test
        for (const category of labTestCategories) {
          const foundTest = category.tests.find(t => t.name === test.testType);
          if (foundTest && foundTest.price) {
            testPrice = foundTest.price;
            break;
          }
        }
      }).catch(err => {
        console.error('Error loading test price:', err);
      });
      
      const charge = serviceCharge || defaultCharge || {
        id: `default-${test.department}`,
        name: test.testType,
        department: test.department,
        amount: testPrice > 0 ? testPrice : (test.department === 'laboratory' ? 800 : 1500),
        category: test.department
      };
      
      return {
        id: crypto.randomUUID(),
        patientId: selectedPatient.id,
        serviceId: charge.id,
        serviceName: test.testType,
        quantity: 1,
        unitPrice: charge.amount,
        totalAmount: charge.amount,
        department: test.department,
        category: test.department,
        status: 'pending',
        createdAt: new Date().toISOString(),
        testId: test.id // Reference to the test
      };
    });
    
    // Add test items to invoice items
    setInvoiceItems(prev => [...prev, ...testItems]);
    setShowPendingTests(false);
  };

  const handleAddPendingPrescriptions = () => {
    if (!selectedPatient) return;
    
    const patientPrescriptions = prescriptions[selectedPatient.id] || [];
    const pendingPrescriptions = patientPrescriptions.filter(prescription => 
      prescription.status === 'stock-verified' || 
      prescription.status === 'pending'
    );
    
    // Create invoice items for each pending prescription
    const prescriptionItems = pendingPrescriptions.flatMap(prescription => {
      // Create items for each medication
      const medicationItems = prescription.medications.map(medication => {
        // Find the medication in stock to get the actual price
        const stock = medicationStock.find(s => s.name.toLowerCase() === medication.name.toLowerCase());
        const medicationPrice = stock ? stock.price : 0; // Use actual price or 0
        
        return {
          id: crypto.randomUUID(),
          patientId: selectedPatient.id,
          serviceId: stock?.id || 'medication-item',
          serviceName: `${medication.name} (${medication.dosage})`,
          quantity: medication.quantity,
          unitPrice: medicationPrice, // Use actual medication price
          totalAmount: medicationPrice * medication.quantity,
          department: 'pharmacy',
          category: 'medication',
          status: 'pending',
          createdAt: new Date().toISOString(),
          prescriptionId: prescription.id, // Reference to the prescription
          medicationName: medication.name
        };
      });
      
      return medicationItems;
    });
    
    // Add prescription items to invoice items
    setInvoiceItems(prev => [...prev, ...prescriptionItems]);
    setShowPendingPrescriptions(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900">Create New Invoice</h3>
            </div>
            <div className="flex items-center gap-3">
              <AutosaveIndicator 
                status={saveStatus} 
                lastSaved={lastSaved} 
                error={saveError} 
                onManualSave={save} 
              />
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg"
                disabled={isSubmitting}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Service Type Indicator */}
          {forService !== 'general' && (
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg flex items-center gap-3">
              <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-blue-800">
                  {forService === 'consultation' ? 'Consultation Fee' : 
                   forService === 'laboratory' ? 'Laboratory Tests' :
                   forService === 'radiology' ? 'Radiology Tests' :
                   'Pharmacy Items'}
                </p>
                <p className="text-sm text-blue-600">
                  Creating invoice for {forService === 'consultation' ? 'doctor consultation' : 
                                        forService === 'laboratory' ? 'laboratory tests' :
                                        forService === 'radiology' ? 'radiology tests' :
                                        'pharmacy items'}
                </p>
              </div>
            </div>
          )}

          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Patient <span className="text-red-500">*</span>
            </label>
            {selectedPatient ? (
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-700 font-medium">
                      {selectedPatient.fullName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h4 className="font-medium">{selectedPatient.fullName}</h4>
                    <div className="flex items-center gap-3 mt-0.5">
                      <p className="text-sm text-gray-500">ID: {selectedPatient.idNumber}</p>
                      <p className="text-sm text-gray-500">{selectedPatient.age} years, {selectedPatient.gender}</p>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedPatient(null);
                    setFormData(prev => ({ ...prev, patientId: '' }));
                  }}
                  className="p-1.5 hover:bg-blue-100 rounded-lg"
                >
                  <X className="w-4 h-4 text-blue-600" />
                </button>
              </div>
            ) : (
              <div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search patients by name or ID..."
                    className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {searchQuery && (
                  <div className="mt-2 border rounded-lg divide-y max-h-48 overflow-y-auto">
                    {filteredPatients.length > 0 ? (
                      filteredPatients.map((patient) => (
                        <div
                          key={patient.id}
                          onClick={() => {
                            setSelectedPatient(patient);
                            setSearchQuery('');
                            setFormData(prev => ({ ...prev, patientId: patient.id }));
                            
                            // Check for pending lab tests and prescriptions
                            const patientLabTests = labTests[patient.id] || [];
                            const pendingTests = patientLabTests.filter(test => 
                              test.paymentStatus === 'pending' || 
                              (!test.paymentStatus && test.status !== 'completed')
                            );
                            
                            if (pendingTests.length > 0) {
                              setShowPendingTests(true);
                            }
                            
                            const patientPrescriptions = prescriptions[patient.id] || [];
                            const pendingPrescriptions = patientPrescriptions.filter(prescription => 
                              prescription.status === 'stock-verified' || 
                              prescription.status === 'pending'
                            );
                            
                            if (pendingPrescriptions.length > 0) {
                              setShowPendingPrescriptions(true);
                            }

                            // Check if we need to add a consultation fee
                            if (forService === 'consultation' || 
                                (forService === 'general' && 
                                 (patient.status === 'registered' || 
                                  patient.status === 'activated' || 
                                  patient.status === 'triage-complete'))) {
                              setShowConsultationFee(true);
                            }
                          }}
                          className="p-3 hover:bg-gray-50 cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 font-medium">
                                {patient.fullName.charAt(0)}
                              </span>
                            </div>
                            <div>
                              <p className="font-medium">{patient.fullName}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <p className="text-xs text-gray-500">ID: {patient.idNumber}</p>
                                <p className="text-xs text-gray-500">{patient.age} years, {patient.gender}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-center text-gray-500">
                        No patients found matching "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Consultation Fee Alert */}
          {selectedPatient && showConsultationFee && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Building2 className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-green-800">Consultation Fee</h4>
                  <p className="text-sm text-green-600">Consultation fee has been automatically added</p>
                </div>
              </div>
            </div>
          )}

          {/* Pending Tests Alert */}
          {selectedPatient && showPendingTests && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <TestTube className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-medium text-blue-800">Pending Laboratory Tests</h4>
                  <p className="text-sm text-blue-600">This patient has pending tests that require payment</p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddPendingTests}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Tests to Invoice</span>
                </button>
              </div>
            </div>
          )}

          {/* Pending Prescriptions Alert */}
          {selectedPatient && showPendingPrescriptions && (
            <div className="bg-green-50 rounded-lg p-4 border border-green-100">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Pill className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <h4 className="font-medium text-green-800">Pending Prescriptions</h4>
                  <p className="text-sm text-green-600">This patient has prescriptions that require payment</p>
                </div>
              </div>
              
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleAddPendingPrescriptions}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Medications to Invoice</span>
                </button>
              </div>
            </div>
          )}

          {/* Invoice Details */}
          {selectedPatient && (
            <>
              {/* Due Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Add Items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Invoice Items
                  </label>
                  <div className="text-sm text-gray-500">
                    Total: <span className="font-medium">{`Ksh ${totalAmount.toLocaleString()}`}</span>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 border mb-4">
                  <div className="grid grid-cols-[1fr,auto,auto,auto] gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Service
                      </label>
                      <select
                        value={selectedService?.id || ''}
                        onChange={(e) => {
                          const service = serviceCharges.find(s => s.id === e.target.value);
                          setSelectedService(service || null);
                        }}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      >
                        <option value="">Select a service</option>
                        {filteredServiceCharges.map(service => (
                          <option key={service.id} value={service.id}>
                            {service.name} - {`Ksh ${service.amount.toLocaleString()}`}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Quantity
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-20 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Unit Price
                      </label>
                      <div className="w-32 px-3 py-2 border rounded-lg bg-gray-100 text-sm">
                        {selectedService ? `Ksh ${selectedService.amount.toLocaleString()}` : '-'}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        &nbsp;
                      </label>
                      <button
                        type="button"
                        onClick={handleAddItem}
                        disabled={!selectedService}
                        className={`px-3 py-2 rounded-lg ${
                          selectedService
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Items List */}
                {invoiceItems.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Service</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Department</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Quantity</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Unit Price</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                          <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {invoiceItems.map((item) => (
                          <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm">
                              <div className="flex items-center gap-2">
                                {item.category === 'laboratory' && <TestTube className="w-4 h-4 text-purple-600" />}
                                {item.category === 'radiology' && <Radio className="w-4 h-4 text-blue-600" />}
                                {item.category === 'medication' && <Pill className="w-4 h-4 text-green-600" />}
                                {item.category === 'consultation' && <Building2 className="w-4 h-4 text-indigo-600" />}
                                {item.serviceName}
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500">{departmentNames[item.department] || item.department}</td>
                            <td className="px-4 py-3 text-sm text-right">{item.quantity}</td>
                            <td className="px-4 py-3 text-sm text-right">{`Ksh ${item.unitPrice.toLocaleString()}`}</td>
                            <td className="px-4 py-3 text-sm font-medium text-right">{`Ksh ${item.totalAmount.toLocaleString()}`}</td>
                            <td className="px-4 py-3 text-center">
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="p-1 hover:bg-red-50 rounded-full text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50 font-medium">
                          <td colSpan={4} className="px-4 py-3 text-right text-sm">Total:</td>
                          <td className="px-4 py-3 text-right text-sm">{`Ksh ${totalAmount.toLocaleString()}`}</td>
                          <td></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 rounded-lg border border-dashed">
                    <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm font-medium text-gray-900">No items added</p>
                    <p className="text-xs text-gray-500 mt-1">Add services to this invoice</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t">
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-900"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || invoiceItems.length === 0 || !selectedPatient}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg ${
                isSubmitting || invoiceItems.length === 0 || !selectedPatient
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>Create Invoice</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
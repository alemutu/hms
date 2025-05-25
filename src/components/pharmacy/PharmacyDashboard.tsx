import React, { useState, useMemo } from 'react';
import { usePatientStore } from '../lib/store';
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
  FileBarChart,
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
  Gauge,
  BarChart3,
  LineChart,
  PieChart,
  Bell,
  ShieldAlert,
  Server,
  Cpu,
  Zap,
  Calendar,
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
  ChevronDown,
  ListFilter,
  LayoutGrid,
  Eye,
  Pill,
  Package,
  Beaker,
  Goal as Vial,
  Syringe,
  Leaf,
  Cable as Capsule,
  Tablet
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { departments, departmentNames } from '../types/departments';
import { PrescriptionDetails } from './pharmacy/PrescriptionDetails';
import { MedicationDispenseForm } from './pharmacy/MedicationDispenseForm';
import { InventoryManager } from './pharmacy/InventoryManager';
import { StockAdjustmentForm } from './pharmacy/StockAdjustmentForm';

export const PharmacyDashboard = () => {
  const { 
    patientQueue, 
    setCurrentSection,
    prescriptions = {},
    medicationStock = [],
    invoices = {},
    updatePrescription,
    updateMedicationStock,
    addMedicationStock,
    movePatientToNextDepartment,
    updatePatientStatus,
    createInvoice,
    updateParallelWorkflow
  } = usePatientStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [showPrescriptionDetails, setShowPrescriptionDetails] = useState(false);
  const [showDispenseForm, setShowDispenseForm] = useState(false);
  const [showInventoryManager, setShowInventoryManager] = useState(false);
  const [showStockAdjustment, setShowStockAdjustment] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<string | null>(null);
  const [selectedMedication, setSelectedMedication] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'dispensed' | 'inventory'>('pending');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('today');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  // Get all prescriptions
  const allPrescriptions = useMemo(() => {
    const result: Array<{ patient: any, prescription: any }> = [];
    
    // Iterate through all patients and their prescriptions
    Object.entries(prescriptions).forEach(([patientId, patientPrescriptions]) => {
      const patient = patientQueue.find(p => p.id === patientId);
      if (!patient) return;
      
      // Add each prescription with its patient
      patientPrescriptions.forEach(prescription => {
        result.push({ patient, prescription });
      });
    });
    
    return result;
  }, [prescriptions, patientQueue]);

  // Filter prescriptions based on active tab
  const filteredPrescriptions = useMemo(() => {
    let items = allPrescriptions;
    
    if (activeTab === 'pending') {
      items = items.filter(({ prescription }) => 
        prescription.status === 'pending' || prescription.status === 'stock-verified'
      );
    } else if (activeTab === 'dispensed') {
      items = items.filter(({ prescription }) => prescription.status === 'dispensed');
    }
    
    if (searchQuery) {
      return items.filter(({ patient, prescription }) =>
        patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prescription.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        prescription.medications.some((med: any) => 
          med.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
    }
    
    if (selectedFilter === 'urgent') {
      return items.filter(({ patient }) => patient.priority === 'urgent');
    }
    
    return items;
  }, [allPrescriptions, activeTab, searchQuery, selectedFilter]);

  // Filter medications based on search query
  const filteredMedications = useMemo(() => {
    if (activeTab !== 'inventory') return [];
    
    if (!searchQuery) return medicationStock;
    
    return medicationStock.filter(med =>
      med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      med.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [medicationStock, searchQuery, activeTab]);

  // Pagination
  const totalPages = Math.ceil(
    (activeTab === 'inventory' ? filteredMedications : filteredPrescriptions).length / itemsPerPage
  );
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = (activeTab === 'inventory' ? filteredMedications : filteredPrescriptions).slice(
    indexOfFirstItem,
    indexOfLastItem
  );

  const stats = {
    pending: allPrescriptions.filter(({ prescription }) => 
      prescription.status === 'pending' || prescription.status === 'stock-verified'
    ).length,
    dispensed: allPrescriptions.filter(({ prescription }) => 
      prescription.status === 'dispensed'
    ).length,
    inventory: medicationStock.length,
    lowStock: medicationStock.filter(med => med.status === 'low-stock').length,
    outOfStock: medicationStock.filter(med => med.status === 'out-of-stock').length
  };

  const handleConfirmPrescription = async (prescriptionId: string) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      // Find the prescription
      const prescriptionData = allPrescriptions.find(({ prescription }) => prescription.id === prescriptionId);
      if (!prescriptionData) {
        throw new Error('Prescription not found');
      }
      
      const { prescription, patient } = prescriptionData;
      
      // Check if all medications are in stock
      const medicationStatus = prescription.medications.map(med => {
        const stock = medicationStock.find(m => m.name.toLowerCase() === med.name.toLowerCase());
        if (!stock) return { name: med.name, status: 'missing', available: 0, required: med.quantity };
        if (stock.quantity < med.quantity) return { name: med.name, status: 'insufficient', available: stock.quantity, required: med.quantity };
        return { name: med.name, status: 'available', available: stock.quantity, required: med.quantity };
      });
      
      const hasStockIssues = medicationStatus.some(status => status.status !== 'available');
      if (hasStockIssues) {
        throw new Error('Some medications are not available in sufficient quantity');
      }
      
      // 1. First update prescription status to stock-verified
      await updatePrescription(prescriptionId, { 
        status: 'stock-verified'
      });
      
      // 2. Create invoice for the prescription
      const billingItems = prescription.medications.map(med => {
        const stock = medicationStock.find(m => m.name.toLowerCase() === med.name.toLowerCase());
        return {
          id: crypto.randomUUID(),
          patientId: patient.id,
          serviceId: stock?.id || 'medication-item',
          serviceName: med.name,
          quantity: med.quantity,
          unitPrice: stock?.price || 0, // Use stock price or 0
          totalAmount: (stock?.price || 0) * med.quantity,
          department: 'pharmacy',
          category: 'medication',
          status: 'pending',
          createdAt: new Date().toISOString(),
          prescriptionId: prescription.id,
          medicationName: med.name
        };
      });
      
      // Add dispensing fee
      billingItems.push({
        id: crypto.randomUUID(),
        patientId: patient.id,
        serviceId: 'dispensing-fee',
        serviceName: 'Medication Dispensing Fee',
        quantity: 1,
        unitPrice: 500,
        totalAmount: 500,
        department: 'pharmacy',
        category: 'medication',
        status: 'pending',
        createdAt: new Date().toISOString(),
        prescriptionId: prescription.id
      });
      
      // Calculate total amount
      const totalAmount = billingItems.reduce((sum, item) => sum + item.totalAmount, 0);
      
      // Create invoice
      const invoice = {
        id: crypto.randomUUID(),
        patientId: patient.id,
        visitId: `VISIT-${Date.now().toString().slice(-6)}`,
        items: billingItems,
        totalAmount,
        status: 'pending',
        createdAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      };
      
      await createInvoice(invoice);
      
      // 3. Update patient workflow flags
      await updateParallelWorkflow(patient.id, {
        pendingPayment: true
      });
      
      // 4. Update patient status to awaiting payment
      await updatePatientStatus(patient.id, 'awaiting-payment');
      
      // 5. Move patient to billing department
      await movePatientToNextDepartment(patient.id, 'billing');
      
      setSuccessMessage('Prescription confirmed successfully and invoice created');
      setShowPrescriptionDetails(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error confirming prescription:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to confirm prescription. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDispenseMedication = async (prescriptionId: string, dispensingDetails: any) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      // Find the prescription
      let patientId: string | null = null;
      let prescription: any = null;
      
      for (const { patient, prescription: p } of allPrescriptions) {
        if (p.id === prescriptionId) {
          patientId = patient.id;
          prescription = p;
          break;
        }
      }
      
      if (!patientId || !prescription) {
        throw new Error('Prescription not found');
      }
      
      // Update medication stock
      for (const medication of prescription.medications) {
        // Find the medication in stock
        const stock = medicationStock.find(s => s.name.toLowerCase() === medication.name.toLowerCase());
        if (stock) {
          // Calculate new quantity
          const newQuantity = Math.max(0, stock.quantity - medication.quantity);
          
          // Update stock status
          let status: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock';
          if (newQuantity === 0) {
            status = 'out-of-stock';
          } else if (newQuantity <= stock.minimumStock) {
            status = 'low-stock';
          }
          
          // Update stock
          await updateMedicationStock(stock.id, {
            quantity: newQuantity,
            status
          });
        }
      }
      
      // Update prescription status to dispensed
      await updatePrescription(prescriptionId, { 
        status: 'dispensed',
        dispensedAt: new Date().toISOString(),
        dispensedBy: 'Pharmacist',
        dispensingNotes: dispensingDetails.dispensingNotes,
        patientInstructions: dispensingDetails.patientInstructions
      });
      
      // Update patient status
      await updatePatientStatus(patientId, 'medication-dispensed');
      
      // Move patient back to their return department or to reception for discharge
      const patient = patientQueue.find(p => p.id === patientId);
      if (patient) {
        const nextDepartment = patient.returnToDepartment || 'reception';
        await movePatientToNextDepartment(patientId, nextDepartment);
      }
      
      setSuccessMessage('Medication dispensed successfully');
      setShowDispenseForm(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error dispensing medication:', error);
      setErrorMessage('Failed to dispense medication. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddStock = async (medication: any) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      await addMedicationStock(medication);
      
      setSuccessMessage('Medication added to inventory successfully');
      setShowInventoryManager(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error adding medication to inventory:', error);
      setErrorMessage('Failed to add medication to inventory. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAdjustStock = async (medicationId: string, adjustment: number, reason: string) => {
    try {
      setIsProcessing(true);
      setErrorMessage(null);
      
      // Find the medication
      const medication = medicationStock.find(m => m.id === medicationId);
      if (!medication) {
        throw new Error('Medication not found');
      }
      
      // Calculate new quantity
      const newQuantity = Math.max(0, medication.quantity + adjustment);
      
      // Update stock status
      let status: 'in-stock' | 'low-stock' | 'out-of-stock' = 'in-stock';
      if (newQuantity === 0) {
        status = 'out-of-stock';
      } else if (newQuantity <= medication.minimumStock) {
        status = 'low-stock';
      }
      
      // Update stock
      await updateMedicationStock(medicationId, {
        quantity: newQuantity,
        status,
        lastRestocked: adjustment > 0 ? new Date().toISOString() : medication.lastRestocked,
        notes: medication.notes 
          ? `${medication.notes}\n${new Date().toLocaleDateString()}: ${reason}`
          : `${new Date().toLocaleDateString()}: ${reason}`
      });
      
      setSuccessMessage(`Stock ${adjustment > 0 ? 'increased' : 'decreased'} successfully`);
      setShowStockAdjustment(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error adjusting stock:', error);
      setErrorMessage('Failed to adjust stock. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getMedicationIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'antibiotics':
        return Capsule;
      case 'analgesics':
        return Pill;
      case 'antivirals':
        return Vial;
      case 'vaccines':
        return Syringe;
      case 'supplements':
        return Leaf;
      case 'liquids':
        return Beaker;
      default:
        return Tablet;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-100 text-amber-700';
      case 'stock-verified':
        return 'bg-blue-100 text-blue-700';
      case 'dispensed':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'in-stock':
        return 'bg-green-100 text-green-700';
      case 'low-stock':
        return 'bg-amber-100 text-amber-700';
      case 'out-of-stock':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const renderPrescriptionCard = ({ patient, prescription }: any) => {
    if (viewMode === 'grid') {
      return (
        <div key={prescription.id} className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-700 font-medium">
                  {patient.fullName.charAt(0)}
                </span>
              </div>
              <div>
                <h3 className="font-medium text-gray-900 text-sm">{patient.fullName}</h3>
                <p className="text-xs text-gray-500">ID: {patient.idNumber}</p>
              </div>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
              {prescription.status === 'stock-verified' ? 'Confirmed' : prescription.status}
            </span>
          </div>
          
          <div className="mb-3">
            <p className="text-xs text-gray-500">Medications:</p>
            <div className="mt-1 space-y-1">
              {prescription.medications.slice(0, 2).map((med: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="text-xs">{med.name}</span>
                  <span className="text-xs text-gray-500">Qty: {med.quantity}</span>
                </div>
              ))}
              {prescription.medications.length > 2 && (
                <p className="text-xs text-gray-500">+{prescription.medications.length - 2} more</p>
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{format(new Date(prescription.prescribedAt), 'MMM d, h:mm a')}</span>
            <button
              onClick={() => {
                setSelectedPrescription(prescription.id);
                setShowPrescriptionDetails(true);
              }}
              className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
            >
              <FileText className="w-3 h-3" />
              <span>Details</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={prescription.id} className="p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-blue-700 font-medium">
                {patient.fullName.charAt(0)}
              </span>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{patient.fullName}</h3>
              <div className="flex items-center gap-3 mt-0.5">
                <p className="text-xs text-gray-500">ID: {patient.idNumber}</p>
                <p className="text-xs text-gray-500">{patient.age} years, {patient.gender}</p>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  patient.priority === 'urgent' 
                    ? 'bg-red-100 text-red-700' 
                    : patient.priority === 'critical'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {patient.priority}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(prescription.status)}`}>
              {prescription.status === 'stock-verified' ? 'Confirmed' : prescription.status}
            </span>
            
            <button
              onClick={() => {
                setSelectedPrescription(prescription.id);
                setShowPrescriptionDetails(true);
              }}
              className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600"
            >
              <FileText className="w-4 h-4" />
            </button>
            
            {prescription.status === 'stock-verified' && (
              <button
                onClick={() => {
                  setSelectedPrescription(prescription.id);
                  setShowDispenseForm(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                <Pill className="w-4 h-4" />
                <span>Dispense</span>
              </button>
            )}
            
            {prescription.status === 'pending' && (
              <button
                onClick={() => {
                  setSelectedPrescription(prescription.id);
                  setShowPrescriptionDetails(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm</span>
              </button>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-4 bg-gray-50 rounded-lg p-3">
          <div>
            <p className="text-sm text-gray-500">Prescribed By</p>
            <p className="font-medium">{prescription.prescribedBy}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Prescribed At</p>
            <p className="font-medium">{format(new Date(prescription.prescribedAt), 'MMM d, h:mm a')}</p>
          </div>
        </div>
        
        <div className="mt-3">
          <p className="text-sm text-gray-500 mb-2">Medications:</p>
          <div className="grid grid-cols-2 gap-3">
            {prescription.medications.map((med: any, index: number) => {
              // Find medication in stock to get price
              const stock = medicationStock.find(s => s.name.toLowerCase() === med.name.toLowerCase());
              const price = stock ? stock.price : 0;
              
              return (
                <div key={index} className="bg-white p-2 rounded-lg border">
                  <div className="flex items-center gap-2">
                    <Pill className="w-4 h-4 text-blue-600" />
                    <p className="font-medium text-sm">{med.name}</p>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
                    <span>{med.dosage}, {med.frequency}</span>
                    <span>Qty: {med.quantity}</span>
                  </div>
                  <div className="mt-1 text-xs text-gray-500">
                    <span>Price: KES {price.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderMedicationCard = (medication: any) => {
    const Icon = getMedicationIcon(medication.category);
    
    if (viewMode === 'grid') {
      return (
        <div key={medication.id} className="bg-white rounded-xl border shadow-sm p-4 hover:shadow-md transition-all">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <Icon className="w-4 h-4 text-blue-600" />
              </div>
              <h3 className="font-medium text-gray-900 text-sm">{medication.name}</h3>
            </div>
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(medication.status)}`}>
              {medication.status.replace('-', ' ')}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
            <div>
              <p className="text-gray-500">Category</p>
              <p className="font-medium">{medication.category}</p>
            </div>
            <div>
              <p className="text-gray-500">Quantity</p>
              <p className="font-medium">{medication.quantity} {medication.unit}</p>
            </div>
            <div>
              <p className="text-gray-500">Price</p>
              <p className="font-medium">{formatCurrency(medication.price)}</p>
            </div>
            <div>
              <p className="text-gray-500">Expiry</p>
              <p className="font-medium">{medication.expiryDate ? format(new Date(medication.expiryDate), 'MMM d, yyyy') : 'N/A'}</p>
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={() => {
                setSelectedMedication(medication.id);
                setShowStockAdjustment(true);
              }}
              className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-xs"
            >
              <Package className="w-3 h-3" />
              <span>Adjust Stock</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={medication.id} className="p-4 hover:bg-gray-50 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Icon className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{medication.name}</h3>
              <p className="text-sm text-gray-500">{medication.category}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(medication.status)}`}>
              {medication.status.replace('-', ' ')}
            </span>
            
            <button
              onClick={() => {
                setSelectedMedication(medication.id);
                setShowStockAdjustment(true);
              }}
              className="p-1.5 hover:bg-blue-100 rounded-lg text-blue-600"
            >
              <Package className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-4 gap-4 bg-gray-50 rounded-lg p-3">
          <div>
            <p className="text-sm text-gray-500">Quantity</p>
            <p className="font-medium">{medication.quantity} {medication.unit}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Min. Stock</p>
            <p className="font-medium">{medication.minimumStock} {medication.unit}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Price</p>
            <p className="font-medium">{formatCurrency(medication.price)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Expiry</p>
            <p className="font-medium">{medication.expiryDate ? format(new Date(medication.expiryDate), 'MMM d, yyyy') : 'N/A'}</p>
          </div>
        </div>
        
        {medication.notes && (
          <div className="mt-2 text-sm text-gray-500">
            <p className="italic">{medication.notes}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-b from-gray-50 to-white border-b">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentSection('dashboard')}
                className="p-1.5 hover:bg-white/80 rounded-lg text-gray-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Pharmacy</h1>
                <p className="text-xs text-gray-500">Medication Management & Dispensing</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {activeTab === 'inventory' && (
                <button
                  onClick={() => setShowInventoryManager(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Medication</span>
                </button>
              )}
            </div>
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
          {/* Left Section (Prescriptions/Inventory) */}
          <div className="flex-1 w-2/3">
            <div className="bg-white rounded-xl border shadow-sm overflow-hidden h-[calc(100vh-180px)] flex flex-col">
              <div className="border-b">
                <div className="flex items-center p-1 gap-1">
                  {[
                    { id: 'pending', label: 'Pending', icon: Clock, count: stats.pending },
                    { id: 'dispensed', label: 'Dispensed', icon: CheckCircle2, count: stats.dispensed },
                    { id: 'inventory', label: 'Inventory', icon: Package, count: stats.inventory }
                  ].map(({ id, label, icon: Icon, count }) => (
                    <button
                      key={id}
                      onClick={() => {
                        setActiveTab(id as typeof activeTab);
                        setCurrentPage(1); // Reset to first page when changing tabs
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
                      placeholder={`Search ${activeTab === 'pending' ? 'pending prescriptions' : activeTab === 'dispensed' ? 'dispensed prescriptions' : 'inventory'}...`}
                      className="w-full pl-8 pr-3 py-1.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                    />
                  </div>
                  {activeTab !== 'inventory' && (
                    <select
                      value={selectedFilter}
                      onChange={(e) => {
                        setSelectedFilter(e.target.value);
                        setCurrentPage(1); // Reset to first page when filtering
                      }}
                      className="px-3 py-1.5 bg-white border rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 transition-all duration-200"
                    >
                      <option value="all">All Priority</option>
                      <option value="urgent">Urgent</option>
                      <option value="normal">Normal</option>
                    </select>
                  )}
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
                      <LayoutGrid className="w-3.5 h-3.5 text-slate-600" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="overflow-y-auto flex-grow">
                {viewMode === 'grid' ? (
                  <div className="p-4 grid grid-cols-2 gap-4">
                    {activeTab === 'inventory' ? (
                      currentItems.map(renderMedicationCard)
                    ) : (
                      currentItems.map(renderPrescriptionCard)
                    )}
                    
                    {(activeTab === 'inventory' ? filteredMedications : filteredPrescriptions).length === 0 && (
                      <div className="col-span-2 py-8">
                        <div className="text-center">
                          <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                            {activeTab === 'pending' ? (
                              <Clock className="w-6 h-6 text-slate-400" />
                            ) : activeTab === 'dispensed' ? (
                              <CheckCircle2 className="w-6 h-6 text-slate-400" />
                            ) : (
                              <Package className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <h3 className="text-base font-medium text-slate-900 mb-1">
                            {activeTab === 'pending' 
                              ? 'No pending prescriptions' 
                              : activeTab === 'dispensed'
                              ? 'No dispensed prescriptions'
                              : 'No medications in inventory'}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {activeTab === 'pending'
                              ? 'New prescriptions will appear here'
                              : activeTab === 'dispensed'
                              ? 'Dispensed prescriptions will appear here'
                              : 'Add medications to your inventory'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {activeTab === 'inventory' ? (
                      currentItems.map(renderMedicationCard)
                    ) : (
                      currentItems.map(renderPrescriptionCard)
                    )}
                    
                    {(activeTab === 'inventory' ? filteredMedications : filteredPrescriptions).length === 0 && (
                      <div className="py-8">
                        <div className="text-center">
                          <div className="bg-slate-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                            {activeTab === 'pending' ? (
                              <Clock className="w-6 h-6 text-slate-400" />
                            ) : activeTab === 'dispensed' ? (
                              <CheckCircle2 className="w-6 h-6 text-slate-400" />
                            ) : (
                              <Package className="w-6 h-6 text-slate-400" />
                            )}
                          </div>
                          <h3 className="text-base font-medium text-slate-900 mb-1">
                            {activeTab === 'pending' 
                              ? 'No pending prescriptions' 
                              : activeTab === 'dispensed'
                              ? 'No dispensed prescriptions'
                              : 'No medications in inventory'}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {activeTab === 'pending'
                              ? 'New prescriptions will appear here'
                              : activeTab === 'dispensed'
                              ? 'Dispensed prescriptions will appear here'
                              : 'Add medications to your inventory'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-3 bg-gray-50 border-t flex items-center justify-center gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-7 h-7 rounded-md ${
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
                    className="p-1.5 border rounded-md hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Section (Stats & Info) */}
          <div className="w-1/3 flex flex-col space-y-3 h-[calc(100vh-180px)]">
            {/* Department Overview Card */}
            <div className="bg-white rounded-xl border shadow-sm p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-100 rounded-lg">
                    <Pill className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-sm">Pharmacy Overview</h2>
                </div>
                <div className="text-xs text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md">
                  Today
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { 
                    label: 'Pending', 
                    value: stats.pending,
                    icon: Clock,
                    color: 'amber'
                  },
                  { 
                    label: 'Dispensed', 
                    value: stats.dispensed,
                    icon: CheckCircle2,
                    color: 'green'
                  },
                  { 
                    label: 'Low Stock', 
                    value: stats.lowStock,
                    icon: AlertTriangle,
                    color: 'amber'
                  },
                  { 
                    label: 'Out of Stock', 
                    value: stats.outOfStock,
                    icon: X,
                    color: 'red'
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
                  <div className="p-1.5 bg-blue-100 rounded-lg">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-sm">Quick Actions</h2>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {[
                  { 
                    label: 'Add Medication',
                    icon: Plus,
                    color: 'green',
                    action: () => setShowInventoryManager(true)
                  },
                  { 
                    label: 'View Inventory',
                    icon: Package,
                    color: 'blue',
                    action: () => setActiveTab('inventory')
                  },
                  { 
                    label: 'Pending Prescriptions',
                    icon: Clock,
                    color: 'amber',
                    action: () => setActiveTab('pending')
                  },
                  { 
                    label: 'Dispensed Medications',
                    icon: CheckCircle2,
                    color: 'green',
                    action: () => setActiveTab('dispensed')
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

            {/* Low Stock Alert */}
            <div className="bg-white rounded-xl border shadow-sm p-3 flex-grow overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-100 rounded-lg">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <h2 className="font-semibold text-slate-900 text-sm">Low Stock Alert</h2>
                </div>
              </div>
              
              <div className="space-y-2">
                {medicationStock.filter(med => med.status === 'low-stock' || med.status === 'out-of-stock').length > 0 ? (
                  medicationStock
                    .filter(med => med.status === 'low-stock' || med.status === 'out-of-stock')
                    .map((med) => {
                      const Icon = getMedicationIcon(med.category);
                      return (
                        <div key={med.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-1.5">
                              <Icon className="w-3.5 h-3.5 text-slate-600" />
                              <span className="text-xs font-medium text-slate-700">{med.name}</span>
                            </div>
                            <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                              med.status === 'out-of-stock' 
                                ? 'bg-red-100 text-red-700' 
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {med.status === 'out-of-stock' ? 'Out of stock' : 'Low stock'}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500">
                              Current: {med.quantity} {med.unit} (Min: {med.minimumStock})
                            </span>
                            <button
                              onClick={() => {
                                setSelectedMedication(med.id);
                                setShowStockAdjustment(true);
                              }}
                              className="px-2 py-0.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                            >
                              Restock
                            </button>
                          </div>
                        </div>
                      );
                    })
                ) : (
                  <div className="text-center py-4">
                    <CheckCircle2 className="w-8 h-8 text-green-300 mx-auto mb-2" />
                    <p className="text-xs text-slate-500">All medications are well-stocked</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prescription Details Modal */}
      {showPrescriptionDetails && selectedPrescription && (
        <PrescriptionDetails
          prescription={allPrescriptions.find(({ prescription }) => prescription.id === selectedPrescription)?.prescription}
          patient={allPrescriptions.find(({ prescription }) => prescription.id === selectedPrescription)?.patient}
          medications={medicationStock}
          invoices={Object.values(invoices).flat()}
          onClose={() => {
            setShowPrescriptionDetails(false);
            setSelectedPrescription(null);
          }}
          onDispense={() => {
            setShowPrescriptionDetails(false);
            setShowDispenseForm(true);
          }}
          onGoToBilling={() => {
            setCurrentSection('billing');
          }}
          onConfirm={() => handleConfirmPrescription(selectedPrescription)}
        />
      )}

      {/* Medication Dispense Form */}
      {showDispenseForm && selectedPrescription && (
        <MedicationDispenseForm
          prescription={{
            ...allPrescriptions.find(({ prescription }) => prescription.id === selectedPrescription)?.prescription,
            patient: allPrescriptions.find(({ prescription }) => prescription.id === selectedPrescription)?.patient
          }}
          medications={medicationStock}
          invoices={Object.values(invoices).flat()}
          onClose={() => {
            setShowDispenseForm(false);
            setSelectedPrescription(null);
          }}
          onDispense={(prescriptionId, dispensingDetails) => handleDispenseMedication(prescriptionId, dispensingDetails)}
        />
      )}

      {/* Inventory Manager */}
      {showInventoryManager && (
        <InventoryManager
          onClose={() => setShowInventoryManager(false)}
          onAddStock={handleAddStock}
        />
      )}

      {/* Stock Adjustment Form */}
      {showStockAdjustment && selectedMedication && (
        <StockAdjustmentForm
          medication={medicationStock.find(m => m.id === selectedMedication)!}
          onClose={() => {
            setShowStockAdjustment(false);
            setSelectedMedication(null);
          }}
          onAdjust={handleAdjustStock}
        />
      )}
    </div>
  );
};
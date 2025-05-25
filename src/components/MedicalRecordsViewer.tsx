import React, { useState } from 'react';
import { usePatientStore } from '../lib/store';
import {
  FileText,
  Search,
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  Activity,
  Heart,
  Pill,
  TestTube,
  Filter,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  ClipboardList,
  Stethoscope,
  FileBarChart,
  Building2
} from 'lucide-react';
import { format } from 'date-fns';

export const MedicalRecordsViewer = () => {
  const { setCurrentSection, patientQueue, vitalSigns, medicalHistory, consultations, labTests, prescriptions } = usePatientStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'vitals' | 'consultations' | 'labs' | 'prescriptions'>('overview');

  const filteredPatients = patientQueue.filter(patient =>
    patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const renderPatientDetails = () => {
    // Early return if no patient is selected
    if (!selectedPatient) return null;

    // Find the patient in the queue
    const patient = patientQueue.find(p => p.id === selectedPatient);
    
    // If patient not found in queue, show error state
    if (!patient) {
      return (
        <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Patient Not Found</h3>
          <p className="text-gray-500">The selected patient record could not be found.</p>
          <button
            onClick={() => setSelectedPatient(null)}
            className="mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Return to Records
          </button>
        </div>
      );
    }

    // Safely access patient data with optional chaining and null checks
    const patientVitals = vitalSigns?.[patient.id]?.[0] || null;
    const patientHistory = medicalHistory?.[patient.id] || null;
    const patientConsultations = consultations?.[patient.id] || [];
    const patientLabs = labTests?.[patient.id] || [];
    const patientPrescriptions = prescriptions?.[patient.id] || [];

    return (
      <div className="space-y-6">
        {/* Patient Header */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-blue-100 rounded-xl flex items-center justify-center">
              <span className="text-2xl font-semibold text-blue-600">
                {patient.fullName.charAt(0)}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{patient.fullName}</h2>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Users className="w-4 h-4" />
                  <span>{patient.gender}, {patient.age} years</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-gray-500">
                  <Calendar className="w-4 h-4" />
                  <span>Registered: {format(new Date(patient.registrationDate), 'PP')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-4 mt-6 border-b">
            {[
              { id: 'overview', label: 'Overview', icon: FileBarChart },
              { id: 'vitals', label: 'Vital Signs', icon: Activity },
              { id: 'consultations', label: 'Consultations', icon: Stethoscope },
              { id: 'labs', label: 'Lab Results', icon: TestTube },
              { id: 'prescriptions', label: 'Prescriptions', icon: Pill }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-6">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Activity className="w-5 h-5 text-blue-600" />
                    </div>
                    <h3 className="font-medium">Latest Vitals</h3>
                  </div>
                  {patientVitals ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Blood Pressure</span>
                        <span className="font-medium">{patientVitals.bloodPressure}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Heart Rate</span>
                        <span className="font-medium">{patientVitals.pulseRate} bpm</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No vitals recorded</p>
                  )}
                </div>

                <div className="p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <ClipboardList className="w-5 h-5 text-green-600" />
                    </div>
                    <h3 className="font-medium">Recent Consultations</h3>
                  </div>
                  {patientConsultations.length > 0 ? (
                    <div className="space-y-2">
                      {patientConsultations.slice(0, 2).map((consultation) => (
                        <div key={consultation.id} className="text-sm">
                          <p className="font-medium">{consultation.department}</p>
                          <p className="text-gray-500">
                            {format(new Date(consultation.startTime), 'PP')}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No consultations yet</p>
                  )}
                </div>

                <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Pill className="w-5 h-5 text-purple-600" />
                    </div>
                    <h3 className="font-medium">Active Medications</h3>
                  </div>
                  {patientPrescriptions.length > 0 ? (
                    <div className="space-y-2">
                      {patientPrescriptions.slice(0, 2).map((prescription) => (
                        <div key={prescription.id} className="text-sm">
                          {prescription.medications.map((med, index) => (
                            <p key={index} className="text-gray-500">{med.name}</p>
                          ))}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">No active medications</p>
                  )}
                </div>
              </div>

              {patientHistory && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium mb-4">Medical History</h3>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700">Conditions</h4>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            patientHistory.hasDiabetes ? 'bg-red-500' : 'bg-gray-200'
                          }`} />
                          <span className="text-sm">Diabetes</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            patientHistory.hasHypertension ? 'bg-red-500' : 'bg-gray-200'
                          }`} />
                          <span className="text-sm">Hypertension</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h4 className="font-medium text-gray-700">Allergies</h4>
                      <div className="flex flex-wrap gap-2">
                        {patientHistory.allergies.map((allergy, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-sm"
                          >
                            {allergy}
                          </span>
                        ))}
                        {patientHistory.allergies.length === 0 && (
                          <span className="text-sm text-gray-500">No known allergies</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'vitals' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Vital Signs History</h3>
              {vitalSigns?.[patient.id]?.length > 0 ? (
                <div className="space-y-4">
                  {vitalSigns[patient.id].map((vital, index) => (
                    <div key={index} className="p-4 bg-gray-50 rounded-lg">
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Blood Pressure</p>
                          <p className="font-medium">{vital.bloodPressure}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Heart Rate</p>
                          <p className="font-medium">{vital.pulseRate} bpm</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Temperature</p>
                          <p className="font-medium">{vital.temperature}°C</p>
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">
                        Recorded: {format(new Date(vital.recordedAt), 'PP p')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No vital signs recorded yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'consultations' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Consultation History</h3>
              {consultations?.[patient.id]?.length > 0 ? (
                <div className="space-y-4">
                  {consultations[patient.id].map((consultation) => (
                    <div key={consultation.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <Building2 className="w-5 h-5 text-gray-500" />
                          <span className="font-medium">{consultation.department}</span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getStatusColor(consultation.status)
                        }`}>
                          {consultation.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {consultation.diagnosis.length > 0 && (
                          <div>
                            <p className="text-sm text-gray-500">Diagnosis</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {consultation.diagnosis.map((d, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-sm"
                                >
                                  {d}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {consultation.notes && (
                          <p className="text-sm text-gray-600">{consultation.notes}</p>
                        )}
                      </div>
                      <div className="mt-3 text-sm text-gray-500">
                        {format(new Date(consultation.startTime), 'PP p')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No consultations recorded yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'labs' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Laboratory Results</h3>
              {labTests?.[patient.id]?.length > 0 ? (
                <div className="space-y-4">
                  {labTests[patient.id].map((test) => (
                    <div key={test.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-medium">{test.testName}</p>
                          <p className="text-sm text-gray-500">{test.department}</p>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getStatusColor(test.status)
                        }`}>
                          {test.status}
                        </span>
                      </div>
                      {test.results && typeof test.results === 'object' && (
                        <div className="space-y-3 mt-3">
                          {test.results.findings && (
                            <div>
                              <p className="text-sm font-medium text-gray-700">Findings</p>
                              <p className="text-sm text-gray-600">{test.results.findings}</p>
                            </div>
                          )}
                          {test.results.interpretation && (
                            <div>
                              <p className="text-sm font-medium text-gray-700">Interpretation</p>
                              <p className="text-sm text-gray-600">{test.results.interpretation}</p>
                            </div>
                          )}
                          {test.results.criticalValues && test.results.criticalValues.length > 0 && (
                            <div>
                              <p className="text-sm font-medium text-gray-700">Critical Values</p>
                              <div className="flex flex-wrap gap-2">
                                {test.results.criticalValues.map((value, index) => (
                                  <span
                                    key={index}
                                    className="px-2 py-1 bg-red-50 text-red-700 rounded-full text-sm"
                                  >
                                    {value}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {test.results.performedBy && (
                            <p className="text-sm text-gray-500">
                              Performed by: {test.results.performedBy}
                            </p>
                          )}
                          {test.results.performedAt && (
                            <p className="text-sm text-gray-500">
                              Performed at: {format(new Date(test.results.performedAt), 'PP p')}
                            </p>
                          )}
                          {test.results.imageUrl && (
                            <div className="mt-3">
                              <img
                                src={test.results.imageUrl}
                                alt="Test results"
                                className="max-w-full h-auto rounded-lg"
                              />
                            </div>
                          )}
                        </div>
                      )}
                      <div className="mt-3 text-sm text-gray-500">
                        Requested: {format(new Date(test.requestedAt), 'PP p')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <TestTube className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No lab tests recorded yet</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div>
              <h3 className="text-lg font-medium mb-4">Prescriptions</h3>
              {prescriptions?.[patient.id]?.length > 0 ? (
                <div className="space-y-4">
                  {prescriptions[patient.id].map((prescription) => (
                    <div key={prescription.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Pill className="w-5 h-5 text-gray-500" />
                          <span className="font-medium">
                            Prescribed by {prescription.prescribedBy}
                          </span>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          getStatusColor(prescription.status)
                        }`}>
                          {prescription.status}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {prescription.medications.map((med, index) => (
                          <div key={index} className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{med.name}</p>
                              <p className="text-sm text-gray-500">
                                {med.dosage} - {med.frequency}
                              </p>
                            </div>
                            <p className="text-sm text-gray-500">
                              Qty: {med.quantity}
                            </p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 text-sm text-gray-500">
                        Prescribed: {format(new Date(prescription.prescribedAt), 'PP p')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Pill className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No prescriptions recorded yet</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto p-8">
      {selectedPatient ? (
        <>
          <button
            onClick={() => setSelectedPatient(null)}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Records</span>
          </button>
          {renderPatientDetails()}
        </>
      ) : (
        <>
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setCurrentSection('reception')}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Medical Records</h1>
                <p className="text-gray-500 mt-1">View and manage patient records</p>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm border p-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search patients by name or ID..."
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button className="flex items-center gap-2 px-4 py-2 border rounded-lg text-gray-600 hover:bg-gray-50">
                <Filter className="w-4 h-4" />
                <span>Filter</span>
              </button>
            </div>
          </div>

          {/* Patient Records List */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Patient Records</h2>
              </div>
            </div>

            <div className="divide-y">
              {filteredPatients.map((patient) => (
                <div
                  key={patient.id}
                  className="p-6 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedPatient(patient.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {patient.fullName.charAt(0)}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{patient.fullName}</h3>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Calendar className="w-4 h-4" />
                            <span>{format(new Date(patient.registrationDate), 'PP')}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-sm text-gray-500">
                            <Activity className="w-4 h-4" />
                            <span>{patient.status}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  </div>
                </div>
              ))}

              {filteredPatients.length === 0 && (
                <div className="py-12">
                  <div className="text-center">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">
                      No patient records found
                    </h3>
                    <p className="text-gray-500">
                      {searchQuery
                        ? `No results for "${searchQuery}"`
                        : 'Records will appear here once patients are registered'
                      }
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
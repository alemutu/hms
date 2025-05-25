import React, { useState, useEffect } from 'react';
import { format, parse, isWeekend, isBefore, startOfToday, addDays, getDay, eachDayOfInterval, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns';
import { X, Calendar, Clock, Building2, Users, FileText, Search, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { departments, departmentNames } from '../types/departments';
import { doctors } from '../types/doctors';
import { usePatientStore } from '../lib/store';
import type { Patient } from '../types';
import type { Doctor } from '../types/doctors';

interface NewAppointmentFormProps {
  selectedDate: Date;
  selectedTime?: string;
  onClose: () => void;
  onSubmit: (appointment: any) => void;
}

export const NewAppointmentForm: React.FC<NewAppointmentFormProps> = ({
  selectedDate: initialDate,
  selectedTime,
  onClose,
  onSubmit
}) => {
  const { patientQueue } = usePatientStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(initialDate));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [formData, setFormData] = useState({
    department: '',
    type: 'consultation',
    notes: '',
    time: selectedTime || '09:00'
  });
  const [formErrors, setFormErrors] = useState<{
    date?: string;
    time?: string;
    doctor?: string;
  }>({});

  const filteredPatients = patientQueue.filter(patient =>
    patient.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const departmentDoctors = doctors.filter(
    doctor => !formData.department || doctor.department === formData.department
  );

  const getDoctorAvailability = (date: Date, doctor: Doctor) => {
    const dayOfWeek = getDay(date);
    const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek].toLowerCase();
    return doctor.schedule.days.includes(dayName as any);
  };

  const isDateAvailable = (date: Date) => {
    if (isWeekend(date)) return false;
    if (isBefore(date, startOfToday())) return false;
    if (selectedDoctor && !getDoctorAvailability(date, selectedDoctor)) return false;
    return true;
  };

  useEffect(() => {
    if (selectedDoctor) {
      const dayOfWeek = getDay(selectedDate);
      const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][dayOfWeek].toLowerCase();
      
      if (!selectedDoctor.schedule.days.includes(dayName as any)) {
        setFormErrors(prev => ({
          ...prev,
          date: `${selectedDoctor.name} is not available on ${format(selectedDate, 'EEEE')}s`
        }));
        setAvailableSlots([]);
        return;
      }

      const slots = [];
      const start = parse(selectedDoctor.schedule.startTime, 'HH:mm', new Date());
      const end = parse(selectedDoctor.schedule.endTime, 'HH:mm', new Date());
      
      for (let i = start.getHours(); i < end.getHours(); i++) {
        slots.push(`${i.toString().padStart(2, '0')}:00`);
      }

      setAvailableSlots(slots);
      setFormErrors(prev => ({ ...prev, date: undefined }));
    }
  }, [selectedDoctor, selectedDate]);

  const validateForm = () => {
    const errors: typeof formErrors = {};

    if (!isDateAvailable(selectedDate)) {
      errors.date = 'Selected date is not available';
    }

    if (!selectedDoctor) {
      errors.doctor = 'Please select a doctor';
    }

    if (!formData.time) {
      errors.time = 'Please select an appointment time';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatient || !selectedDoctor || !validateForm()) return;

    onSubmit({
      id: crypto.randomUUID(),
      patientId: selectedPatient.id,
      patientName: selectedPatient.fullName,
      date: selectedDate,
      time: formData.time,
      department: selectedDoctor.department,
      doctor: selectedDoctor.name,
      type: formData.type,
      notes: formData.notes,
      status: 'scheduled'
    });
    onClose();
  };

  const renderCalendar = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDay = getDay(monthStart);

    return (
      <div className="p-4 bg-white rounded-lg shadow-lg border absolute top-full left-0 mt-2 z-10">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setCurrentMonth(d => addDays(d, -30))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h3 className="font-medium">{format(currentMonth, 'MMMM yyyy')}</h3>
          <button
            onClick={() => setCurrentMonth(d => addDays(d, 30))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="text-center text-sm text-gray-500 py-1">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: startDay }).map((_, i) => (
            <div key={`empty-${i}`} className="h-9" />
          ))}
          {days.map(day => {
            const isAvailable = isDateAvailable(day);
            const isSelected = format(day, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');

            return (
              <button
                key={format(day, 'yyyy-MM-dd')}
                onClick={() => {
                  if (isAvailable) {
                    setSelectedDate(day);
                    setShowDatePicker(false);
                  }
                }}
                disabled={!isAvailable}
                className={`
                  h-9 rounded-lg flex items-center justify-center text-sm
                  ${isSelected ? 'bg-blue-600 text-white' : ''}
                  ${!isSelected && isAvailable ? 'hover:bg-gray-100' : ''}
                  ${!isAvailable ? 'text-gray-300 cursor-not-allowed' : ''}
                `}
              >
                {format(day, 'd')}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">Schedule New Appointment</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Patient
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedPatient(null);
                }}
                placeholder="Search patients by name or ID..."
                className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                      }}
                      className="p-3 hover:bg-gray-50 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-medium">
                            {patient.fullName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">{patient.fullName}</p>
                          <p className="text-sm text-gray-500">ID: #{patient.id.slice(0, 8)}</p>
                        </div>
                      </div>
                      {selectedPatient?.id === patient.id && (
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-3 text-center text-gray-500">
                    No patients found matching "{searchQuery}"
                  </div>
                )}
              </div>
            )}

            {selectedPatient && !searchQuery && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium">
                      {selectedPatient.fullName.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium">{selectedPatient.fullName}</p>
                    <p className="text-sm text-gray-500">ID: #{selectedPatient.id.slice(0, 8)}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPatient(null)}
                  className="p-1 hover:bg-blue-100 rounded-full"
                >
                  <X className="w-4 h-4 text-blue-600" />
                </button>
              </div>
            )}
          </div>

          {/* Department and Doctor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Department
            </label>
            <select
              value={formData.department}
              onChange={(e) => {
                setFormData({ ...formData, department: e.target.value });
                setSelectedDoctor(null);
              }}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Departments</option>
              {Object.entries(departmentNames).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>

            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Select Doctor
              </label>
              <div className="grid grid-cols-2 gap-3">
                {departmentDoctors.map((doctor) => (
                  <button
                    key={doctor.id}
                    type="button"
                    onClick={() => setSelectedDoctor(doctor)}
                    className={`p-3 rounded-lg border text-left transition-colors ${
                      selectedDoctor?.id === doctor.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 font-medium">
                          {doctor.name.charAt(3)}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{doctor.name}</p>
                        <p className="text-sm text-gray-500">{doctor.specialization}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
              {formErrors.doctor && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {formErrors.doctor}
                </p>
              )}
            </div>
          </div>

          {/* Date and Time Selection */}
          <div className="grid grid-cols-2 gap-6">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <button
                type="button"
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="w-full flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <Calendar className="w-4 h-4 text-gray-500" />
                <span>{format(selectedDate, 'PP')}</span>
              </button>
              {showDatePicker && renderCalendar()}
              {formErrors.date && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {formErrors.date}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time
              </label>
              <select
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={availableSlots.length === 0}
              >
                <option value="">Select time</option>
                {availableSlots.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
              {formErrors.time && (
                <p className="text-sm text-red-600 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-4 h-4" />
                  {formErrors.time}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appointment Type
              </label>
              <select
                required
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="consultation">Consultation</option>
                <option value="follow-up">Follow-up</option>
                <option value="procedure">Procedure</option>
                <option value="new-visit">New Visit</option>
              </select>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
              placeholder="Add any additional notes..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedPatient || !selectedDoctor}
              className={`px-4 py-2 rounded-lg ${
                selectedPatient && selectedDoctor
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              Schedule Appointment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
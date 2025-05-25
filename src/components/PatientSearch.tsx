import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Calendar, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { usePatientStore } from '../lib/store';
import { format } from 'date-fns';
import type { Patient } from '../types';

interface PatientSearchProps {
  onPatientSelect: (patient: Patient) => void;
  className?: string;
}

export const PatientSearch: React.FC<PatientSearchProps> = ({ 
  onPatientSelect,
  className = ''
}) => {
  const { patientQueue } = usePatientStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    const query = searchQuery.toLowerCase().trim();
    
    // Delay search to simulate API call and prevent excessive searches
    const timer = setTimeout(() => {
      const results = patientQueue.filter(patient => 
        patient.fullName.toLowerCase().includes(query) ||
        patient.idNumber.toLowerCase().includes(query) ||
        patient.phoneNumber?.toLowerCase().includes(query)
      );
      
      setSearchResults(results);
      setShowResults(true);
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, patientQueue]);

  // Handle click outside to close results
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatient(patient);
    setSearchQuery('');
    setShowResults(false);
    onPatientSelect(patient);
  };

  const clearSelection = () => {
    setSelectedPatient(null);
    setSearchQuery('');
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
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
            onClick={clearSelection}
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
              placeholder="Search patient by name, phone number, or ID..."
              className="w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {showResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border z-10 max-h-60 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center">
                  <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-gray-300 border-t-blue-600"></div>
                  <p className="mt-2 text-sm text-gray-500">Searching...</p>
                </div>
              ) : searchResults.length > 0 ? (
                <div className="divide-y">
                  {searchResults.map((patient) => (
                    <div
                      key={patient.id}
                      onClick={() => handlePatientSelect(patient)}
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
                            <p className="text-xs text-gray-500">
                              <Calendar className="w-3 h-3 inline mr-1" />
                              {format(new Date(patient.registrationDate), 'PP')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center">
                  <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <p className="text-gray-700 font-medium">No patient found</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Please refine your search or register as a new patient
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
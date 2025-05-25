import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ArrowRight, User, FileText, TestTube, CreditCard, Calendar } from 'lucide-react';
import { usePatientStore } from '../lib/store';
import { format } from 'date-fns';
import { searchEngine } from '../lib/ai/search';

interface SmartSearchProps {
  onResultClick?: (patientId: string) => void;
  className?: string;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({ 
  onResultClick,
  className = ''
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [correctedQuery, setCorrectedQuery] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const { setCurrentSection, setCurrentPatient } = usePatientStore();

  // Handle search query
  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await searchEngine.search(query, { 
        limit: 10,
        userId: 'current-user' // In a real app, this would be the actual user ID
      });
      
      setResults(searchResults.results);
      setCorrectedQuery(searchResults.correctedQuery);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Get suggestions as user types
  useEffect(() => {
    const getSuggestions = async () => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }
      
      // Simple suggestions based on common terms
      const commonTerms = [
        'patient', 'lab results', 'prescription', 'appointment',
        'emergency', 'triage', 'consultation', 'radiology',
        'payment', 'discharge', 'admission'
      ];
      
      const filteredSuggestions = commonTerms.filter(term => 
        term.toLowerCase().includes(query.toLowerCase())
      );
      
      setSuggestions(filteredSuggestions);
    };
    
    const timeoutId = setTimeout(getSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query]);

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

  // Handle search on Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Handle result click
  const handleResultClick = (patient: any) => {
    if (onResultClick) {
      onResultClick(patient.id);
    } else {
      setCurrentPatient(patient);
      setCurrentSection('records');
    }
    setShowResults(false);
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search patients, records, tests..."
          className="w-full pl-9 pr-4 py-2 bg-gray-50 border-0 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setShowResults(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Suggestions */}
      {suggestions.length > 0 && query.length >= 2 && !showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border z-10 max-h-60 overflow-y-auto">
          <div className="p-2 text-xs text-gray-500 border-b">Suggestions</div>
          <div className="p-1">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="px-3 py-2 hover:bg-gray-50 rounded-md cursor-pointer text-sm"
                onClick={() => {
                  setQuery(suggestion);
                  handleSearch();
                }}
              >
                {suggestion}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {showResults && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border z-10 max-h-96 overflow-y-auto">
          <div className="p-3 border-b">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Search Results</h3>
              <button
                onClick={() => setShowResults(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            {correctedQuery && (
              <p className="text-xs text-gray-500 mt-1">
                Showing results for <span className="font-medium">{correctedQuery}</span>
              </p>
            )}
          </div>

          {isLoading ? (
            <div className="p-6 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Searching...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="divide-y">
              {results.map((patient) => (
                <div
                  key={patient.id}
                  className="p-3 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleResultClick(patient)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{patient.fullName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-gray-500">ID: {patient.idNumber}</p>
                          <p className="text-xs text-gray-500">{patient.age} years, {patient.gender}</p>
                        </div>
                      </div>
                    </div>
                    <button className="p-1 hover:bg-blue-50 rounded-lg text-blue-600">
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="mt-2 flex flex-wrap gap-2">
                    <div className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{format(new Date(patient.registrationDate), 'PP')}</span>
                    </div>
                    <div className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded text-xs flex items-center gap-1">
                      <TestTube className="w-3 h-3" />
                      <span>Lab Results</span>
                    </div>
                    <div className="px-2 py-0.5 bg-green-50 text-green-700 rounded text-xs flex items-center gap-1">
                      <FileText className="w-3 h-3" />
                      <span>Medical Records</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center">
              <p className="text-gray-500">No results found for "{query}"</p>
              <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
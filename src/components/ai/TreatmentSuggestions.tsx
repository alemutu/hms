import React, { useState, useEffect } from 'react';
import { Stethoscope, CheckCircle2, AlertCircle, ArrowRight, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { aiService } from '../../lib/ai';

interface TreatmentSuggestionsProps {
  diagnoses: string[];
  compact?: boolean;
  onSelectTreatment?: (treatment: string) => void;
}

export const TreatmentSuggestions: React.FC<TreatmentSuggestionsProps> = ({
  diagnoses,
  compact = false,
  onSelectTreatment
}) => {
  const [suggestions, setSuggestions] = useState<{
    suggestions: string[];
    confidence: number;
    notes: string;
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(!compact);

  // Generate suggestions when diagnoses change
  useEffect(() => {
    const generateSuggestions = async () => {
      // Only generate suggestions if diagnoses are provided
      if (!diagnoses || diagnoses.length === 0) {
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await aiService.suggestTreatments(diagnoses);
        setSuggestions(result);
      } catch (error) {
        console.error('Error generating treatment suggestions:', error);
        setError('Failed to generate suggestions');
      } finally {
        setIsLoading(false);
      }
    };
    
    generateSuggestions();
  }, [diagnoses]);

  // If no diagnoses, show placeholder
  if (!diagnoses || diagnoses.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <Stethoscope className="w-5 h-5 text-gray-400" />
          <h3 className="font-medium text-gray-700">Treatment Suggestions</h3>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Enter diagnoses to get AI-assisted treatment suggestions.
        </p>
      </div>
    );
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center gap-2">
          <div className="animate-spin">
            <Stethoscope className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-medium text-blue-700">Generating Suggestions</h3>
        </div>
        <p className="text-sm text-blue-600 mt-2">
          Analyzing diagnoses to suggest appropriate treatments...
        </p>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-lg border border-red-200">
        <div className="flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <h3 className="font-medium text-red-700">Error</h3>
        </div>
        <p className="text-sm text-red-600 mt-2">{error}</p>
      </div>
    );
  }

  // Show suggestions
  if (suggestions) {
    const { suggestions: treatmentSuggestions, confidence, notes } = suggestions;
    
    // If no suggestions, show message
    if (treatmentSuggestions.length === 0) {
      return (
        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-gray-400" />
            <h3 className="font-medium text-gray-700">Treatment Suggestions</h3>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            No treatment suggestions available for the provided diagnoses.
          </p>
        </div>
      );
    }
    
    return (
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5 text-blue-600" />
            <h3 className="font-medium text-blue-700">AI Treatment Suggestions</h3>
          </div>
          
          {compact && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 hover:bg-blue-100 rounded-full"
            >
              {showDetails ? (
                <ChevronUp className="w-4 h-4 text-blue-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-blue-600" />
              )}
            </button>
          )}
        </div>
        
        {showDetails && (
          <>
            <div className="mt-3">
              <div className="flex items-center gap-1 mb-2">
                <span className="text-xs text-gray-500">Confidence:</span>
                <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      confidence > 0.7 ? 'bg-green-500' : 
                      confidence > 0.4 ? 'bg-amber-500' : 
                      'bg-red-500'
                    }`} 
                    style={{ width: `${confidence * 100}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500">{Math.round(confidence * 100)}%</span>
              </div>
              
              <ul className="space-y-2">
                {treatmentSuggestions.map((treatment, index) => (
                  <li key={index} className="flex items-start gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 mt-0.5 text-blue-600 flex-shrink-0" />
                    <div className="flex-1">
                      <button
                        className="text-sm text-blue-700 text-left hover:text-blue-800 hover:underline"
                        onClick={() => onSelectTreatment && onSelectTreatment(treatment)}
                      >
                        {treatment}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
              
              {notes && (
                <p className="mt-3 text-xs text-blue-600 bg-blue-100 p-2 rounded">
                  <AlertCircle className="w-3.5 h-3.5 inline-block mr-1" />
                  {notes}
                </p>
              )}
            </div>
          </>
        )}
        
        {!showDetails && (
          <button
            onClick={() => setShowDetails(true)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>{treatmentSuggestions.length} suggestions available</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // Fallback
  return null;
};
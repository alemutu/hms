import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import type { Patient, Consultation, LabTest, VitalSigns, MedicalHistory } from '../../types';

interface TreatmentSuggestionsProps {
  patient: Patient;
  consultations: Consultation[];
  labTests: LabTest[];
  vitals: VitalSigns[];
  medicalHistory: MedicalHistory | null;
}

export function TreatmentSuggestions({
  patient,
  consultations,
  labTests,
  vitals,
  medicalHistory
}: TreatmentSuggestionsProps) {
  const [loading, setLoading] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const generateSuggestions = async () => {
      setLoading(true);
      setError(null);
      try {
        // In a real implementation, this would call an AI service
        // For now, we'll just show placeholder suggestions
        setSuggestions([
          'Consider checking blood glucose levels given patient history',
          'Review previous medication effectiveness',
          'Evaluate need for follow-up consultation'
        ]);
      } catch (err) {
        setError('Failed to generate treatment suggestions');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    generateSuggestions();
  }, [patient.id]);

  if (loading) {
    return (
      <div className="p-4 bg-gray-50 rounded-md">
        <p className="text-sm text-gray-500">Generating treatment suggestions...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 rounded-md flex items-start">
        <AlertCircle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-red-800">Error</h4>
          <p className="text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium text-gray-500">AI Treatment Suggestions</h3>
      <div className="bg-blue-50 p-4 rounded-md">
        <ul className="space-y-2">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="flex items-start text-sm text-blue-700">
              <span className="mr-2">•</span>
              {suggestion}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
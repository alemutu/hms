import React, { useState, useEffect } from 'react';
import { TestTube, CheckCircle2, AlertTriangle, AlertCircle, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
import { aiService } from '../../lib/ai';
import { LabTest } from '../../types';

interface LabResultSummaryProps {
  labTest: LabTest;
  compact?: boolean;
}

export const LabResultSummary: React.FC<LabResultSummaryProps> = ({
  labTest,
  compact = false
}) => {
  const [summary, setSummary] = useState<{
    summary: string[];
    abnormalResults: string[];
    criticalResults: string[];
    normalResults: string[];
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(!compact);

  // Generate summary when lab test changes
  useEffect(() => {
    const generateSummary = async () => {
      // Only generate summary if test is completed and has results
      if (labTest.status !== 'completed' || !labTest.results) {
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await aiService.summarizeLabResults(labTest);
        setSummary(result);
      } catch (error) {
        console.error('Error generating lab result summary:', error);
        setError('Failed to generate summary');
      } finally {
        setIsLoading(false);
      }
    };
    
    generateSummary();
  }, [labTest]);

  // If test is not completed, show appropriate message
  if (labTest.status !== 'completed') {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <TestTube className="w-5 h-5 text-gray-400" />
          <h3 className="font-medium text-gray-700">Lab Result Summary</h3>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Results are not yet available for this test.
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
            <TestTube className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-medium text-blue-700">Analyzing Results</h3>
        </div>
        <p className="text-sm text-blue-600 mt-2">
          Generating summary of lab results...
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

  // Show summary
  if (summary) {
    const hasCriticalResults = summary.criticalResults.length > 0;
    const hasAbnormalResults = summary.abnormalResults.length > 0;
    
    return (
      <div className={`p-4 ${
        hasCriticalResults ? 'bg-red-50 border-red-100' : 
        hasAbnormalResults ? 'bg-amber-50 border-amber-100' : 
        'bg-green-50 border-green-100'
      } rounded-lg border`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasCriticalResults ? (
              <AlertTriangle className="w-5 h-5 text-red-600" />
            ) : hasAbnormalResults ? (
              <AlertCircle className="w-5 h-5 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            )}
            <h3 className={`font-medium ${
              hasCriticalResults ? 'text-red-700' : 
              hasAbnormalResults ? 'text-amber-700' : 
              'text-green-700'
            }`}>
              {hasCriticalResults ? 'Critical Results Detected' : 
               hasAbnormalResults ? 'Abnormal Results Detected' : 
               'Normal Results'}
            </h3>
          </div>
          
          {compact && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              {showDetails ? (
                <ChevronUp className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              )}
            </button>
          )}
        </div>
        
        {showDetails && (
          <>
            {/* Summary points */}
            <div className="mt-3">
              <ul className="space-y-1">
                {summary.summary.map((point, index) => (
                  <li key={index} className="flex items-start gap-1.5 text-sm">
                    <ArrowRight className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${
                      hasCriticalResults ? 'text-red-600' : 
                      hasAbnormalResults ? 'text-amber-600' : 
                      'text-green-600'
                    }`} />
                    <span className={
                      hasCriticalResults ? 'text-red-700' : 
                      hasAbnormalResults ? 'text-amber-700' : 
                      'text-green-700'
                    }>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Critical results */}
            {summary.criticalResults.length > 0 && (
              <div className="mt-4 pt-3 border-t border-red-200">
                <h4 className="text-sm font-medium text-red-700 mb-2">Critical Results:</h4>
                <ul className="space-y-1">
                  {summary.criticalResults.map((result, index) => (
                    <li key={index} className="text-sm text-red-600 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>{result}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Abnormal results (non-critical) */}
            {summary.abnormalResults.length > summary.criticalResults.length && (
              <div className="mt-4 pt-3 border-t border-amber-200">
                <h4 className="text-sm font-medium text-amber-700 mb-2">Abnormal Results:</h4>
                <ul className="space-y-1">
                  {summary.abnormalResults
                    .filter(result => !summary.criticalResults.includes(result))
                    .map((result, index) => (
                      <li key={index} className="text-sm text-amber-600 flex items-start gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                        <span>{result}</span>
                      </li>
                    ))}
                </ul>
              </div>
            )}
            
            {/* Normal results (if there are abnormal results) */}
            {summary.normalResults.length > 0 && (hasAbnormalResults || hasCriticalResults) && (
              <div className="mt-4 pt-3 border-t border-green-200">
                <h4 className="text-sm font-medium text-green-700 mb-2">Normal Results:</h4>
                <div className="text-sm text-green-600">
                  {summary.normalResults.length} parameters within normal range
                </div>
              </div>
            )}
          </>
        )}
        
        {!showDetails && (
          <button
            onClick={() => setShowDetails(true)}
            className="mt-2 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            <span>Show details</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // Fallback
  return null;
};
import React, { useState, useEffect } from 'react';
import { AlertCircle, DollarSign, CheckCircle2, ChevronDown, ChevronUp, AlertTriangle, ArrowRight } from 'lucide-react';
import { aiService } from '../../lib/ai';
import { Invoice, ServiceCharge } from '../../types';

interface BillingAnomalyDetectorProps {
  invoice: Invoice;
  historicalInvoices: Invoice[];
  serviceCharges: ServiceCharge[];
  compact?: boolean;
  onAnomalyDetected?: (hasAnomalies: boolean) => void;
}

export const BillingAnomalyDetector: React.FC<BillingAnomalyDetectorProps> = ({
  invoice,
  historicalInvoices,
  serviceCharges,
  compact = false,
  onAnomalyDetected
}) => {
  const [anomalyResults, setAnomalyResults] = useState<{
    hasAnomalies: boolean;
    anomalies: Array<{
      isAnomaly: boolean;
      score: number;
      reason: string;
      suggestedAction?: string;
      itemId: string;
    }>;
    overallRiskScore: number;
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(!compact);

  // Detect anomalies when invoice changes
  useEffect(() => {
    const detectAnomalies = async () => {
      // Only detect anomalies if invoice has items
      if (!invoice || !invoice.items || invoice.items.length === 0) {
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await aiService.detectBillingAnomalies(
          invoice,
          historicalInvoices,
          serviceCharges
        );
        
        setAnomalyResults(result);
        
        // Notify parent component of anomaly detection
        if (onAnomalyDetected) {
          onAnomalyDetected(result.hasAnomalies);
        }
      } catch (error) {
        console.error('Error detecting billing anomalies:', error);
        setError('Failed to analyze billing');
      } finally {
        setIsLoading(false);
      }
    };
    
    detectAnomalies();
  }, [invoice, historicalInvoices, serviceCharges, onAnomalyDetected]);

  // If no invoice or items, show placeholder
  if (!invoice || !invoice.items || invoice.items.length === 0) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-gray-400" />
          <h3 className="font-medium text-gray-700">Billing Analysis</h3>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          No invoice items to analyze.
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
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-medium text-blue-700">Analyzing Invoice</h3>
        </div>
        <p className="text-sm text-blue-600 mt-2">
          Checking for billing anomalies...
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

  // Show results
  if (anomalyResults) {
    const { hasAnomalies, anomalies, overallRiskScore } = anomalyResults;
    
    return (
      <div className={`p-4 ${
        hasAnomalies ? 'bg-amber-50 border-amber-100' : 'bg-green-50 border-green-100'
      } rounded-lg border`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasAnomalies ? (
              <AlertTriangle className="w-5 h-5 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            )}
            <h3 className={`font-medium ${
              hasAnomalies ? 'text-amber-700' : 'text-green-700'
            }`}>
              {hasAnomalies ? 'Billing Anomalies Detected' : 'No Billing Anomalies'}
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
            {/* Risk score */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xs text-gray-600">Risk Score:</span>
              <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className={`h-full ${
                    overallRiskScore > 0.7 ? 'bg-red-500' : 
                    overallRiskScore > 0.3 ? 'bg-amber-500' : 
                    'bg-green-500'
                  }`} 
                  style={{ width: `${overallRiskScore * 100}%` }}
                ></div>
              </div>
              <span className="text-xs text-gray-600">{Math.round(overallRiskScore * 100)}%</span>
            </div>
            
            {/* Anomalies list */}
            {hasAnomalies && (
              <div className="mt-3">
                <h4 className="text-sm font-medium text-amber-700 mb-2">Detected Anomalies:</h4>
                <ul className="space-y-2">
                  {anomalies.map((anomaly, index) => {
                    // Find the corresponding invoice item
                    const item = invoice.items.find(i => i.id === anomaly.itemId);
                    
                    return (
                      <li key={index} className="bg-white p-3 rounded-lg border border-amber-200">
                        <div className="flex items-start gap-1.5">
                          <AlertCircle className="w-4 h-4 mt-0.5 text-amber-600 flex-shrink-0" />
                          <div>
                            <p className="text-sm font-medium text-amber-700">
                              {item?.serviceName || 'Unknown Service'}
                            </p>
                            <p className="text-xs text-amber-600 mt-0.5">{anomaly.reason}</p>
                            
                            {anomaly.suggestedAction && (
                              <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                                <ArrowRight className="w-3 h-3" />
                                <span>{anomaly.suggestedAction}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            
            {/* No anomalies message */}
            {!hasAnomalies && (
              <p className="text-sm text-green-600 mt-2">
                All billing items appear to be within normal price ranges.
              </p>
            )}
          </>
        )}
        
        {!showDetails && hasAnomalies && (
          <button
            onClick={() => setShowDetails(true)}
            className="mt-2 text-xs text-amber-600 hover:text-amber-800 flex items-center gap-1"
          >
            <span>Show {anomalies.length} detected anomalies</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // Fallback
  return null;
};
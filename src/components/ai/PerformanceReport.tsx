import React, { useState, useEffect } from 'react';
import { BarChart3, ArrowUpRight, ArrowDownRight, ChevronDown, ChevronUp, FileBarChart, Building2, DollarSign, Users, Calendar } from 'lucide-react';
import { aiService } from '../../lib/ai';
import { Patient, Consultation, LabTest, Invoice, Payment } from '../../types';

interface PerformanceReportProps {
  patients: Patient[];
  consultations: Consultation[];
  labTests: LabTest[];
  invoices: Invoice[];
  payments: Payment[];
  period?: 'day' | 'week' | 'month';
  compact?: boolean;
}

export const PerformanceReport: React.FC<PerformanceReportProps> = ({
  patients,
  consultations,
  labTests,
  invoices,
  payments,
  period = 'month',
  compact = false
}) => {
  const [report, setReport] = useState<{
    summary: string;
    metrics: Record<string, any>;
    trends: Record<string, any>;
    departmentPerformance: Record<string, any>;
    predictions: Record<string, any>;
  } | null>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(!compact);

  // Generate report when data changes
  useEffect(() => {
    const generateReport = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await aiService.generateReport(
          patients,
          consultations,
          labTests,
          invoices,
          payments,
          period
        );
        
        setReport(result);
      } catch (error) {
        console.error('Error generating performance report:', error);
        setError('Failed to generate report');
      } finally {
        setIsLoading(false);
      }
    };
    
    generateReport();
  }, [patients, consultations, labTests, invoices, payments, period]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
        <div className="flex items-center gap-2">
          <div className="animate-spin">
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="font-medium text-blue-700">Generating Report</h3>
        </div>
        <p className="text-sm text-blue-600 mt-2">
          Analyzing hospital performance data...
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

  // Show report
  if (report) {
    const { trends, predictions } = report;
    
    // Format currency
    const formatCurrency = (amount: number) => {
      return `KES ${amount.toLocaleString()}`;
    };
    
    return (
      <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileBarChart className="w-5 h-5 text-indigo-600" />
            <h3 className="font-medium text-indigo-700">Performance Report</h3>
          </div>
          
          {compact && (
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="p-1 hover:bg-indigo-100 rounded-full"
            >
              {showDetails ? (
                <ChevronUp className="w-4 h-4 text-indigo-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-indigo-600" />
              )}
            </button>
          )}
        </div>
        
        {showDetails && (
          <>
            {/* Trends */}
            {Object.keys(trends).length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-3">
                {trends.patientCount && (
                  <div className="bg-white p-3 rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-sm font-medium text-indigo-700">Patient Volume</h4>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-lg font-bold text-gray-900">{trends.patientCount.current}</p>
                      <div className={`flex items-center gap-1 text-xs ${
                        trends.patientCount.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trends.patientCount.trend === 'up' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        <span>{trends.patientCount.change}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {trends.revenue && (
                  <div className="bg-white p-3 rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-sm font-medium text-indigo-700">Revenue</h4>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-lg font-bold text-gray-900">{formatCurrency(trends.revenue.current)}</p>
                      <div className={`flex items-center gap-1 text-xs ${
                        trends.revenue.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trends.revenue.trend === 'up' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        <span>{trends.revenue.change}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {trends.consultationCount && (
                  <div className="bg-white p-3 rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-sm font-medium text-indigo-700">Consultations</h4>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-lg font-bold text-gray-900">{trends.consultationCount.current}</p>
                      <div className={`flex items-center gap-1 text-xs ${
                        trends.consultationCount.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trends.consultationCount.trend === 'up' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        <span>{trends.consultationCount.change}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {trends.labTestCount && (
                  <div className="bg-white p-3 rounded-lg border border-indigo-100">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <h4 className="text-sm font-medium text-indigo-700">Lab Tests</h4>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className="text-lg font-bold text-gray-900">{trends.labTestCount.current}</p>
                      <div className={`flex items-center gap-1 text-xs ${
                        trends.labTestCount.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {trends.labTestCount.trend === 'up' ? (
                          <ArrowUpRight className="w-3 h-3" />
                        ) : (
                          <ArrowDownRight className="w-3 h-3" />
                        )}
                        <span>{trends.labTestCount.change}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Predictions */}
            {Object.keys(predictions).length > 0 && (
              <div className="mt-4 pt-3 border-t border-indigo-200">
                <h4 className="text-sm font-medium text-indigo-700 mb-2">Predictions for Next {period === 'day' ? 'Day' : period === 'week' ? 'Week' : 'Month'}</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  {predictions.patientCount !== undefined && (
                    <div className="bg-white p-3 rounded-lg border border-indigo-100">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm text-gray-600">Est. Patients</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 mt-1">{Math.round(predictions.patientCount)}</p>
                    </div>
                  )}
                  
                  {predictions.revenue !== undefined && (
                    <div className="bg-white p-3 rounded-lg border border-indigo-100">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm text-gray-600">Est. Revenue</span>
                      </div>
                      <p className="text-lg font-bold text-gray-900 mt-1">{formatCurrency(predictions.revenue)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Summary */}
            <div className="mt-4 pt-3 border-t border-indigo-200">
              <h4 className="text-sm font-medium text-indigo-700 mb-2">Summary</h4>
              <div className="bg-white p-3 rounded-lg border border-indigo-100">
                <pre className="text-xs text-gray-700 whitespace-pre-wrap font-sans">
                  {report.summary}
                </pre>
              </div>
            </div>
          </>
        )}
        
        {!showDetails && (
          <button
            onClick={() => setShowDetails(true)}
            className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Show performance report</span>
            <ChevronDown className="w-3 h-3" />
          </button>
        )}
      </div>
    );
  }

  // Fallback
  return null;
};
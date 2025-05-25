import React from 'react';
import { LabTest } from '../../types';

interface LabResultSummaryProps {
  labTests: LabTest[];
  compact?: boolean;
}

export function LabResultSummary({ labTests, compact = false }: LabResultSummaryProps) {
  const completedTests = labTests.filter(test => test.status === 'completed');

  if (completedTests.length === 0) {
    return (
      <p className="text-sm text-gray-500">No lab results available</p>
    );
  }

  return (
    <div className="space-y-4">
      {completedTests.map(test => (
        <div key={test.id} className="border-b pb-2">
          <div className="flex justify-between items-start">
            <div>
              <h4 className="text-sm font-medium">{test.testType}</h4>
              <p className="text-xs text-gray-500">
                {new Date(test.requestedAt).toLocaleDateString()}
              </p>
            </div>
            {test.priority === 'urgent' && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">
                Urgent
              </span>
            )}
          </div>
          
          {!compact && test.results && (
            <div className="mt-2">
              <div className="text-sm space-y-1">
                {Object.entries(test.results).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600">{key}:</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
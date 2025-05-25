import React from 'react';
import { CheckCircle2, RefreshCw, AlertCircle, Save } from 'lucide-react';
import { format } from 'date-fns';

interface AutosaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved: Date | null;
  error: Error | null;
  onManualSave?: () => void;
  className?: string;
}

export const AutosaveIndicator: React.FC<AutosaveIndicatorProps> = ({
  status,
  lastSaved,
  error,
  onManualSave,
  className = '',
}) => {
  return (
    <div className={`flex items-center gap-2 text-xs ${className}`}>
      {status === 'idle' && (
        <div className="text-gray-500 flex items-center gap-1">
          <span>Changes will be saved automatically</span>
        </div>
      )}
      
      {status === 'saving' && (
        <div className="text-blue-600 flex items-center gap-1">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Saving...</span>
        </div>
      )}
      
      {status === 'saved' && (
        <div className="text-green-600 flex items-center gap-1">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>
            Saved {lastSaved ? format(lastSaved, 'h:mm:ss a') : ''}
          </span>
        </div>
      )}
      
      {status === 'error' && (
        <div className="text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error?.message || 'Failed to save'}</span>
          {onManualSave && (
            <button
              onClick={onManualSave}
              className="ml-2 px-2 py-0.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      )}
      
      {onManualSave && status !== 'saving' && status !== 'error' && (
        <button
          onClick={onManualSave}
          className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
          title="Save manually"
        >
          <Save className="w-3.5 h-3.5 text-gray-500" />
        </button>
      )}
    </div>
  );
};
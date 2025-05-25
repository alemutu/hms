import React, { useState, useEffect } from 'react';
import { 
  Save, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Settings, 
  Hash, 
  Calendar, 
  RotateCcw, 
  User, 
  Bed,
  X
} from 'lucide-react';
import { PatientNumberingSettings as NumberingSettings } from '../../types';
import { getNumberingSettings, saveNumberingSettings, defaultNumberingSettings } from '../../lib/patientNumbering';

export const PatientNumberingSettings: React.FC = () => {
  const [settings, setSettings] = useState<NumberingSettings>(defaultNumberingSettings);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Load settings on component mount
  useEffect(() => {
    const loadedSettings = getNumberingSettings();
    setSettings(loadedSettings);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Save settings
      saveNumberingSettings(settings);
      
      setSuccess(true);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setSettings(defaultNumberingSettings);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Hash className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">Patient Numbering Settings</h3>
          <p className="text-sm text-gray-500">Configure how patient numbers are generated</p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700">Settings saved successfully.</p>
          <button 
            onClick={() => setSuccess(false)}
            className="ml-auto text-green-500 hover:text-green-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-500 hover:text-red-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Outpatient Settings */}
        <div className="bg-gray-50 rounded-xl p-6 border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <User className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Outpatient Numbering</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.outpatient.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    outpatient: {
                      ...settings.outpatient,
                      enabled: e.target.checked
                    }
                  })}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable OP Number generation</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OP Number Format
                </label>
                <input
                  type="text"
                  value={settings.outpatient.format}
                  onChange={(e) => setSettings({
                    ...settings,
                    outpatient: {
                      ...settings.outpatient,
                      format: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., OP-{year}-{sequence}"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Available placeholders: {'{year}'}, {'{month}'}, {'{day}'}, {'{sequence}'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Starting Sequence Number
                </label>
                <input
                  type="number"
                  value={settings.outpatient.startingSequence}
                  onChange={(e) => setSettings({
                    ...settings,
                    outpatient: {
                      ...settings.outpatient,
                      startingSequence: parseInt(e.target.value) || 1
                    }
                  })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reset Sequence
                </label>
                <select
                  value={settings.outpatient.resetInterval}
                  onChange={(e) => setSettings({
                    ...settings,
                    outpatient: {
                      ...settings.outpatient,
                      resetInterval: e.target.value as 'daily' | 'monthly' | 'yearly' | 'never'
                    }
                  })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="daily">Daily</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="never">Never</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Sequence
                </label>
                <input
                  type="number"
                  value={settings.outpatient.currentSequence}
                  onChange={(e) => setSettings({
                    ...settings,
                    outpatient: {
                      ...settings.outpatient,
                      currentSequence: parseInt(e.target.value) || 1
                    }
                  })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This is the next number that will be used
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Inpatient Settings */}
        <div className="bg-gray-50 rounded-xl p-6 border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Bed className="w-5 h-5 text-green-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Inpatient Numbering</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={settings.inpatient.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    inpatient: {
                      ...settings.inpatient,
                      enabled: e.target.checked
                    }
                  })}
                  className="rounded text-green-600 focus:ring-green-500"
                />
                <span className="text-sm font-medium text-gray-700">Enable IP Number generation</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IP Number Format
                </label>
                <input
                  type="text"
                  value={settings.inpatient.format}
                  onChange={(e) => setSettings({
                    ...settings,
                    inpatient: {
                      ...settings.inpatient,
                      format: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., IP-{year}-{sequence}"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Available placeholders: {'{year}'}, {'{month}'}, {'{day}'}, {'{sequence}'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Starting Sequence Number
                </label>
                <input
                  type="number"
                  value={settings.inpatient.startingSequence}
                  onChange={(e) => setSettings({
                    ...settings,
                    inpatient: {
                      ...settings.inpatient,
                      startingSequence: parseInt(e.target.value) || 1
                    }
                  })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reset Sequence
                </label>
                <select
                  value={settings.inpatient.resetInterval}
                  onChange={(e) => setSettings({
                    ...settings,
                    inpatient: {
                      ...settings.inpatient,
                      resetInterval: e.target.value as 'per-admission' | 'monthly' | 'yearly' | 'never'
                    }
                  })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="per-admission">Per Admission</option>
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                  <option value="never">Never</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Sequence
                </label>
                <input
                  type="number"
                  value={settings.inpatient.currentSequence}
                  onChange={(e) => setSettings({
                    ...settings,
                    inpatient: {
                      ...settings.inpatient,
                      currentSequence: parseInt(e.target.value) || 1
                    }
                  })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
                <p className="mt-1 text-xs text-gray-500">
                  This is the next number that will be used
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset to Defaults</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
import React from 'react';
import { AlertCircle, Info } from 'lucide-react';

export const SupabaseConnectionTest: React.FC = () => {
  return (
    <div className="p-4 bg-white rounded-lg border shadow-sm">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Supabase Connection Status</h3>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-amber-600">
          <Info className="w-5 h-5" />
          <span>Supabase is currently disabled in development mode</span>
        </div>
        <p className="text-sm text-gray-600">
          The application is running with mock data. Supabase functionality has been disabled for development.
        </p>
        <div className="p-4 bg-blue-50 border border-blue-100 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Development Mode</h4>
          <p className="text-sm text-blue-700">
            In development mode, you can use these test accounts:
          </p>
          <ul className="mt-2 space-y-1 text-sm text-blue-700">
            <li>Admin: admin@example.com (any password)</li>
            <li>Reception: reception@example.com (any password)</li>
            <li>Doctor: doctor@example.com (any password)</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
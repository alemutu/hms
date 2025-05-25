import React from 'react';
import { defaultUsers } from '../types/users';
import { useAuth } from '../hooks/useAuth';

export const UserSwitcher = () => {
  const { user, login } = useAuth();

  const switchUser = async (email: string) => {
    await login(email, 'password'); // Any password works in dev mode
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border">
      <h3 className="text-sm font-medium text-gray-900 mb-3">Quick User Switch</h3>
      <div className="space-y-2">
        {defaultUsers.map((u) => (
          <button
            key={u.id}
            onClick={() => switchUser(u.email)}
            className={`w-full px-3 py-2 text-left text-sm rounded-lg transition-colors ${
              user?.id === u.id
                ? 'bg-blue-50 text-blue-700'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="font-medium">{u.name}</div>
            <div className="text-xs text-gray-500">
              {u.role.replace('_', ' ')} - {u.department || 'System'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
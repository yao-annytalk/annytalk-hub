import React from 'react';
import { useAuth } from '../hooks/useAuth';

const Topbar = ({ title }) => {
  const { user } = useAuth();
  return (
    <div className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 sticky top-0 z-10">
      <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
      <div className="flex items-center gap-4">
        <div className="text-right">
          <p className="text-sm font-medium text-gray-900">Admin Staff</p>
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-[#cef1f9] flex items-center justify-center text-[#33c4e5] font-bold">
          {user?.email?.[0].toUpperCase()}
        </div>
      </div>
    </div>
  );
};
export default Topbar;
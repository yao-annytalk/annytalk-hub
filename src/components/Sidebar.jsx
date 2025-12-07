import React from 'react';
import { NavLink } from 'react-router-dom';
// ✅ FIXED: Added BookOpen to the imports below
import { Users, Calendar, ClipboardCheck, Settings, LogOut, CalendarX, Award, BookOpen } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const Sidebar = () => {
  const { logout } = useAuth();
  
  const navClass = ({ isActive }) => 
    `flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors rounded-lg ${
      isActive ? 'bg-[#cef1f9] text-[#33c4e5]' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
    }`;

  return (
    <div className="w-64 h-screen bg-white border-r border-gray-100 flex flex-col fixed left-0 top-0 z-20">
      <div className="p-6">
         <h1 className="text-2xl font-bold text-[#33c4e5]">AnnyTalk<span className="text-[#fcb625]">.</span></h1>
         <p className="text-xs text-gray-400 tracking-widest uppercase mt-1">Academy Hub</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
        <div className="mb-2 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Daily Ops</div>
        <NavLink to="/attendance" className={navClass}><ClipboardCheck size={18}/> Attendance</NavLink>
        <NavLink to="/schedule" className={navClass}><Calendar size={18}/> Schedule Center</NavLink>
        
        <div className="mt-4 mb-2 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Academic</div>
        <NavLink to="/curriculum" className={navClass}><BookOpen size={18}/> Curriculum</NavLink>
        <NavLink to="/students" className={navClass}><Users size={18}/> Student CRM</NavLink>
        
        <div className="mt-4 mb-2 px-4 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Management</div>
        <NavLink to="/makeup" className={navClass}><CalendarX size={18}/> Makeup Center</NavLink>
        <NavLink to="/scholarship" className={navClass}><Award size={18}/> Scholarships</NavLink>
        
        <div className="my-4 border-t border-gray-100"></div>
        
        <NavLink to="/admin" className={navClass}><Settings size={18}/> Admin & Import</NavLink>
      </nav>

      <div className="p-4 border-t border-gray-100">
        <button onClick={logout} className="flex items-center gap-3 px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-500 transition-colors w-full">
          <LogOut size={18} /> Logout
        </button>
      </div>
    </div>
  );
};
export default Sidebar;
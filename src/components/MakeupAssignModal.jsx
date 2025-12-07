import React, { useState, useMemo } from 'react';
import { X, Calendar, User, CheckCircle, AlertCircle, Search, Clock } from 'lucide-react';
import { useScheduleData } from '../hooks/useScheduleData';

const MakeupAssignModal = ({ isOpen, onClose, onConfirm, studentName, credit }) => {
  const { classes } = useScheduleData(); // Get real schedule data
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState(null);

  // --- 🧠 SMART FILTER LOGIC ---
  const availableClasses = useMemo(() => {
    if (!isOpen) return [];
    
    return classes.filter(cls => {
      // 1. Check Capacity
      const enrolledCount = cls.enrolledStudents?.length || 0;
      const isNotFull = enrolledCount < (cls.capacity || 8);
      
      // 2. Search Logic (Fuzzy Match)
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = 
        cls.name.toLowerCase().includes(searchLower) || 
        cls.coach.toLowerCase().includes(searchLower) ||
        cls.day.toLowerCase().includes(searchLower);

      // 3. Context Match (If no search typed, show similar classes)
      // e.g. If missed "Phonics", show other "Phonics" classes
      const matchesContext = searchTerm === '' 
        ? cls.name.toLowerCase().includes((credit?.missedClass || '').toLowerCase().split(' ')[0]) 
        : true;

      return isNotFull && matchesSearch && matchesContext;
    });
  }, [classes, searchTerm, credit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (!selectedClass) return;
    onConfirm({
      day: selectedClass.day,
      time: selectedClass.time,
      coach: selectedClass.coach,
      date: new Date().toISOString().split('T')[0], // Defaults to today, user can edit in specific logic if needed
      note: `Makeup in ${selectedClass.name}`
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="bg-[#1e293b] p-6 text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="font-bold text-lg flex items-center gap-2"><Calendar size={20}/> Assign Makeup Class</h3>
            <p className="text-white/60 text-xs mt-1">Student: <span className="text-white font-bold">{studentName}</span></p>
          </div>
          <button onClick={onClose} className="text-white/50 hover:text-white"><X size={24}/></button>
        </div>

        {/* Body */}
        <div className="p-6 flex-1 overflow-hidden flex flex-col">
          
          {/* Context Banner */}
          <div className="bg-orange-50 p-3 rounded-xl border border-orange-100 flex gap-3 items-center mb-4 shrink-0">
            <div className="bg-orange-100 p-2 rounded-lg text-orange-600"><AlertCircle size={20}/></div>
            <div>
              <div className="text-xs font-bold text-orange-800 uppercase">Missed Class</div>
              <div className="text-sm text-gray-700 font-medium">{credit?.missedClass || "Unknown Class"} • {credit?.missedCoach || "Unknown Coach"}</div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            <input 
              autoFocus
              type="text" 
              placeholder="Search available classes (Name, Coach, Day)..." 
              className="w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-[#33c4e5] bg-gray-50 focus:bg-white transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Class List (Smart Suggestions) */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase mb-2 sticky top-0 bg-white py-1">
              {searchTerm ? 'Search Results' : 'Recommended Classes'}
            </h4>
            
            {availableClasses.length > 0 ? availableClasses.map(cls => (
              <div 
                key={cls.id}
                onClick={() => setSelectedClass(cls)}
                className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${selectedClass?.id === cls.id ? 'border-[#33c4e5] bg-cyan-50 ring-1 ring-[#33c4e5]' : 'border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}
              >
                <div>
                  <div className="font-bold text-gray-800">{cls.name}</div>
                  <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                    <span className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-600 font-bold">{cls.day}</span>
                    <span className="flex items-center gap-1"><Clock size={10}/> {cls.time}</span>
                    <span className="flex items-center gap-1"><User size={10}/> {cls.coach}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                    {(cls.capacity || 8) - (cls.enrolledStudents?.length || 0)} Spots Left
                  </span>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                <p>No suitable classes found.</p>
                <p className="text-xs mt-1">Try changing your search terms.</p>
              </div>
            )}
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 shrink-0">
          <button onClick={onClose} className="px-6 py-2 border rounded-xl font-bold text-gray-500 hover:bg-gray-100">Cancel</button>
          <button 
            onClick={handleSubmit} 
            disabled={!selectedClass}
            className={`px-6 py-2 rounded-xl font-bold text-white flex items-center gap-2 transition-all ${selectedClass ? 'bg-[#33c4e5] hover:brightness-95' : 'bg-gray-300 cursor-not-allowed'}`}
          >
            <CheckCircle size={18}/> Confirm Assignment
          </button>
        </div>

      </div>
    </div>
  );
};

export default MakeupAssignModal;
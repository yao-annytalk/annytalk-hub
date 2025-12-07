import React, { useState, useMemo } from 'react';
import Topbar from '../components/Topbar';
import { useStudents } from '../hooks/useStudents';
// ✅ Imported Icons
import { CalendarX, Plus, Search, Calendar, CheckCircle, AlertCircle, Clock, User, Trash2, Edit3 } from 'lucide-react';
import MakeupAssignModal from '../components/MakeupAssignModal';

const MakeupPage = () => {
  // 1. Safe Destructuring
  const hookData = useStudents();
  const students = hookData?.students || []; 
  const addMakeupCredit = hookData?.addMakeupCredit;
  const assignMakeupClass = hookData?.assignMakeupClass;
  const redeemMakeup = hookData?.redeemMakeup;
  const deleteMakeupCredit = hookData?.deleteMakeupCredit; // 🔥 New function
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('available'); 
  
  // Modal State
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [selectedCredit, setSelectedCredit] = useState(null);

  // --- 1. FLATTEN DATA ---
  const allCredits = useMemo(() => {
    if (!students || !Array.isArray(students)) return [];

    let flatList = [];
    students.forEach(student => {
      if (student && Array.isArray(student.makeupCredits)) {
        student.makeupCredits.forEach(credit => {
          let status = 'available';
          if (credit.assignedClass) status = 'assigned';
          
          flatList.push({
            ...credit,
            studentId: student.id,
            studentName: student.studentName || "Unknown",
            currentStatus: status
          });
        });
      }
    });
    return flatList;
  }, [students]);

  // --- 2. FILTER DATA ---
  const filteredCredits = useMemo(() => {
    return allCredits.filter(c => {
      const sName = c.studentName || "";
      const matchesSearch = sName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = c.currentStatus === filterStatus;
      return matchesSearch && matchesStatus;
    }).sort((a, b) => new Date(a.expiry || 0) - new Date(b.expiry || 0));
  }, [allCredits, searchTerm, filterStatus]);

  // --- ACTIONS ---
  const handleManualAdd = () => {
    const name = prompt("Enter Student Name exactly to match:");
    if (!name) return;
    
    const student = students.find(s => (s.studentName || "").toLowerCase() === name.toLowerCase());
    if (!student) return alert("Student not found! Check spelling.");
    
    const coach = prompt("Missed Coach Name?");
    const cls = prompt("Missed Class Name?");
    if (coach && cls && addMakeupCredit) {
      addMakeupCredit(student.id, coach, cls);
      alert("Credit Added!");
    }
  };

  const handleAssignClick = (credit) => {
    setSelectedStudentId(credit.studentId);
    setSelectedCredit(credit);
    setIsAssignModalOpen(true);
  };

  // 🔥 DELETE ACTION
  const handleDelete = async (credit) => {
    if (confirm(`🗑️ Are you sure you want to delete this makeup credit for ${credit.studentName}?`)) {
      if (deleteMakeupCredit) {
        await deleteMakeupCredit(credit.studentId, credit);
      } else {
        alert("Delete function not loaded yet.");
      }
    }
  };

  const handleConfirmAssign = async (details) => {
    if (assignMakeupClass) {
      await assignMakeupClass(selectedStudentId, selectedCredit, details);
      setIsAssignModalOpen(false);
      alert("✅ Makeup Class Assigned Successfully!");
    } else {
      alert("Error: assignMakeupClass function missing.");
    }
  };

  const handleRedeem = async (credit) => {
    if (confirm(`Mark this credit for ${credit.studentName} as USED/COMPLETED?`)) {
      if (redeemMakeup) await redeemMakeup(credit.studentId, credit);
    }
  };

  const getDaysLeft = (expiryString) => {
    if (!expiryString) return 0;
    const today = new Date();
    const expiry = new Date(expiryString);
    const diffTime = expiry - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-10">
      <Topbar title="Makeup Center" />
      <div className="p-8 max-w-6xl mx-auto">
        
        {/* HEADER & CONTROLS */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="bg-white p-1 rounded-xl border border-gray-200 flex shadow-sm">
            {['available', 'assigned'].map(status => (
              <button 
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-6 py-2 rounded-lg text-sm font-bold capitalize transition-all ${filterStatus === status ? 'bg-[#33c4e5] text-white shadow-md' : 'text-gray-500 hover:text-gray-800'}`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
              <input 
                type="text" 
                placeholder="Search Student..." 
                className="w-full pl-10 pr-4 py-2 border rounded-xl focus:outline-[#33c4e5]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={handleManualAdd} className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-purple-700 shadow-sm whitespace-nowrap">
              <Plus size={18}/> Add Credit
            </button>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold border-b border-gray-100">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Missed Details</th>
                <th className="p-4">Expiry Status</th>
                <th className="p-4">Assignment</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCredits.length > 0 ? filteredCredits.map((credit, idx) => {
                const daysLeft = getDaysLeft(credit.expiry);
                const isUrgent = daysLeft < 7;

                return (
                  <tr key={`${credit.id}-${idx}`} className="hover:bg-purple-50/20 transition-colors">
                    <td className="p-4 font-bold text-gray-700">{credit.studentName}</td>
                    <td className="p-4">
                      <div className="font-bold text-gray-800">{credit.missedClass}</div>
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <User size={10}/> {credit.missedCoach}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className={`flex items-center gap-2 text-xs font-bold px-3 py-1 rounded-full w-fit border ${isUrgent ? 'bg-red-50 text-red-600 border-red-100' : 'bg-green-50 text-green-600 border-green-100'}`}>
                        {isUrgent ? <AlertCircle size={14}/> : <Clock size={14}/>}
                        {daysLeft} Days Left
                      </div>
                      <div className="text-[10px] text-gray-400 mt-1 pl-1">
                        Exp: {credit.expiry ? new Date(credit.expiry).toLocaleDateString() : "N/A"}
                      </div>
                    </td>
                    <td className="p-4">
                      {credit.assignedClass ? (
                        <div className="bg-blue-50 text-blue-700 px-3 py-2 rounded-lg text-xs border border-blue-100">
                          <div className="font-bold flex items-center gap-1">
                            <Calendar size={12}/> {credit.assignedClass.day} {credit.assignedClass.date}
                          </div>
                          <div className="mt-1 flex items-center gap-1"><Clock size={12}/> {credit.assignedClass.time}</div>
                          <div className="mt-1 opacity-80">Coach: {credit.assignedClass.coach}</div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm italic">- Not Assigned -</span>
                      )}
                    </td>
                    
                    {/* 🔥 UPDATED ACTION COLUMN */}
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {credit.currentStatus === 'available' ? (
                          <>
                            <button 
                              onClick={() => handleAssignClick(credit)}
                              className="bg-[#33c4e5] text-white px-4 py-1.5 rounded-lg text-xs font-bold hover:brightness-95 shadow-sm"
                            >
                              Assign
                            </button>
                            {/* Edit Icon (Re-opens Assign to edit details if needed, or acts as edit trigger) */}
                            <button onClick={() => handleAssignClick(credit)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                              <Edit3 size={16} />
                            </button>
                          </>
                        ) : (
                          <>
                            <button 
                              onClick={() => handleRedeem(credit)}
                              className="border border-green-500 text-green-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-green-50 flex items-center gap-1"
                            >
                              <CheckCircle size={14}/> Done
                            </button>
                            {/* Edit for Assigned = Re-Assign */}
                            <button onClick={() => handleAssignClick(credit)} className="p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                              <Edit3 size={16} />
                            </button>
                          </>
                        )}
                        
                        {/* Delete Button (Always visible) */}
                        <button onClick={() => handleDelete(credit)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan="5" className="p-10 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <CalendarX size={32} className="opacity-20"/>
                      <span>No {filterStatus} makeup credits found.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      <MakeupAssignModal 
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onConfirm={handleConfirmAssign}
        studentName={selectedCredit?.studentName}
        credit={selectedCredit}
      />
    </div>
  );
};

export default MakeupPage;
import React, { useState } from 'react';
import Topbar from '../components/Topbar';
import { useScheduleData } from '../hooks/useScheduleData';
import { useStudents } from '../hooks/useStudents';
import { useAttendance } from '../hooks/useAttendance';
import { CheckCircle, AlertCircle, Clock, Save, FileText, BarChart2, TrendingUp, AlertTriangle, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';

const AttendancePage = () => {
  const { classes, loading } = useScheduleData();
  // 🔥 FIXED: Added 'addMakeupCredit' to the import
  const { students, deductCredit, addMakeupCredit } = useStudents();
  const { saveAttendanceRecord, analytics } = useAttendance();
  
  const [activeTab, setActiveTab] = useState('checkin');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [marked, setMarked] = useState({}); 
  const [reasons, setReasons] = useState({}); 
  const [deductionAmount, setDeductionAmount] = useState(2);
  const [noteModal, setNoteModal] = useState(null); 

  // --- LOGIC ---
  const getDayName = (dateStr) => new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' });
  const currentDayName = getDayName(date);
  const todaysClasses = classes.filter(c => c.day === currentDayName);

  const timeSlots = {};
  todaysClasses.forEach(cls => {
    const timeKey = cls.time || "No Time";
    const coachKey = cls.coach || "No Coach";
    if (!timeSlots[timeKey]) timeSlots[timeKey] = {};
    if (!timeSlots[timeKey][coachKey]) timeSlots[timeKey][coachKey] = [];
    timeSlots[timeKey][coachKey].push(cls);
  });
  const sortedTimes = Object.keys(timeSlots).sort();

  const togglePresence = (classId, studentName) => {
    const key = `${classId}-${studentName}`;
    setMarked(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const saveReason = (e) => {
    e.preventDefault();
    const val = e.target.reason.value;
    const key = `${noteModal.classId}-${noteModal.studentName}`;
    setReasons(prev => ({ ...prev, [key]: val }));
    setNoteModal(null);
  };

  const handleSaveCoachGroup = async (time, coach, classesInGroup) => {
    if (!confirm(`Save Attendance for ${coach} at ${time}?\n\n• PRESENT: Deduct ${deductionAmount} Credits\n• ABSENT: Auto-Create Makeup`)) return;

    let creditCount = 0;
    let makeupCount = 0;

    for (const cls of classesInGroup) {
      if (!cls.enrolledStudents) continue;
      
      const studentRecords = [];
      
      for (const name of cls.enrolledStudents) {
        const isPresent = marked[`${cls.id}-${name}`];
        const reason = reasons[`${cls.id}-${name}`] || "";
        
        studentRecords.push({ studentName: name, status: isPresent ? 'present' : 'absent', reason: reason });

        const studentDoc = students.find(s => s.studentName === name);
        
        if (studentDoc) {
          if (isPresent) {
            // 1. PRESENT: Deduct Credit
            await deductCredit(studentDoc.id, deductionAmount);
            creditCount++;
          } else {
            // 2. ABSENT: Create Makeup (🔥 FIXED LOGIC)
            // Only create makeup if they are a Member
            if (studentDoc.memberStatus !== 'Not Member') {
              // We pass the Class Name and Coach Name so the Makeup Ticket has details
              await addMakeupCredit(studentDoc.id, cls.coach, cls.name);
              makeupCount++;
            }
          }
        }
      }
      // 3. Save History Record
      await saveAttendanceRecord(cls, date, studentRecords);
    }
    alert(`✅ Success!\n• Deducted: ${creditCount} students\n• Makeups Created: ${makeupCount} tickets`);
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Topbar title="Attendance System" />
      
      <div className="bg-white border-b border-gray-200 px-8 flex gap-6 sticky top-16 z-20">
        <button onClick={() => setActiveTab('checkin')} className={`py-4 font-medium text-sm flex items-center gap-2 ${activeTab === 'checkin' ? 'text-[#33c4e5] border-b-2 border-[#33c4e5]' : 'text-gray-500'}`}>
          <CheckCircle size={18}/> Daily Check-in
        </button>
        <button onClick={() => setActiveTab('analytics')} className={`py-4 font-medium text-sm flex items-center gap-2 ${activeTab === 'analytics' ? 'text-[#33c4e5] border-b-2 border-[#33c4e5]' : 'text-gray-500'}`}>
          <BarChart2 size={18}/> Analytics & Risks
        </button>
      </div>

      <div className="p-6 max-w-6xl mx-auto">
        
        {activeTab === 'checkin' && (
          <>
            <div className="bg-white p-4 rounded-xl border border-gray-100 flex flex-wrap items-center justify-between gap-4 mb-8 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  <span className="text-gray-500 text-sm font-bold">DATE:</span>
                  <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="bg-transparent font-bold text-gray-700 focus:outline-none cursor-pointer" />
                </div>
                <div className="text-[#33c4e5] font-bold text-2xl tracking-wide">{currentDayName}</div>
              </div>
              <div className="flex items-center gap-2 bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-100">
                <span className="text-xs font-bold text-yellow-700 uppercase">Deduct:</span>
                <select className="bg-transparent text-yellow-800 font-bold text-lg border-none cursor-pointer focus:ring-0" value={deductionAmount} onChange={(e) => setDeductionAmount(Number(e.target.value))}>
                  <option value="1">1 Hr</option>
                  <option value="2">2 Hrs</option>
                  <option value="3">3 Hrs</option>
                </select>
              </div>
            </div>

            {loading ? <p className="text-center text-gray-400 mt-10">Loading...</p> : (
              <div className="space-y-12">
                {sortedTimes.length === 0 && <div className="text-center py-20 text-gray-400">No classes scheduled for {currentDayName}</div>}
                
                {sortedTimes.map((time) => (
                  <div key={time} className="relative">
                    <div className="flex items-center gap-3 mb-4 sticky top-[140px] z-0">
                       <div className="bg-gray-800 text-white px-4 py-1 rounded-full font-bold shadow-md flex items-center gap-2"><Clock size={16} /> {time}</div>
                       <div className="h-px bg-gray-300 flex-1"></div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                      {Object.keys(timeSlots[time]).sort().map(coach => {
                        const classesInGroup = timeSlots[time][coach];
                        const uniqueClassNames = [...new Set(classesInGroup.map(c => c.name))];
                        const isSingleClass = uniqueClassNames.length === 1;
                        const groupTitle = isSingleClass ? uniqueClassNames[0] : `${classesInGroup.length} Mixed Classes`;

                        return (
                          <div key={`${time}-${coach}`} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-[#f8fcfd] px-5 py-3 border-b border-gray-100 flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-[#cef1f9] text-[#33c4e5] flex items-center justify-center font-bold text-lg shadow-inner">{coach.charAt(0)}</div>
                                <div>
                                  <h3 className="font-bold text-gray-800 text-lg">{coach}</h3>
                                  <p className={`text-xs flex items-center gap-1 ${isSingleClass ? 'text-[#33c4e5] font-bold' : 'text-gray-400'}`}>
                                    {isSingleClass && <BookOpen size={12}/>}
                                    {groupTitle}
                                  </p>
                                </div>
                              </div>
                              <button onClick={() => handleSaveCoachGroup(time, coach, classesInGroup)} className="flex items-center gap-2 bg-[#33c4e5] hover:bg-[#2bb0ce] text-white text-xs font-bold px-4 py-2 rounded-lg shadow-sm">
                                <Save size={16} /> SAVE
                              </button>
                            </div>

                            <div className="p-4 bg-white grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {classesInGroup.map(cls => (
                                <React.Fragment key={cls.id}>
                                  {cls.enrolledStudents?.map(studentName => {
                                    const isPresent = marked[`${cls.id}-${studentName}`];
                                    const hasReason = reasons[`${cls.id}-${studentName}`];
                                    const s = students.find(s => s.studentName === studentName);
                                    
                                    let creditDisplay;
                                    if (s?.scholarshipStatus === 'scholarship') creditDisplay = <span className="text-yellow-600 font-bold text-[10px] bg-yellow-100 px-2 py-0.5 rounded border border-yellow-200 flex items-center gap-1">FREE</span>;
                                    else if (s?.scholarshipStatus === 'special') creditDisplay = <span className="text-purple-600 font-bold text-[10px] bg-purple-100 px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1">STAFF</span>;
                                    else if (s?.scholarshipStatus === 'reward') {
                                      const remaining = (s.freeHoursTotal||0) - (s.freeHoursUsed||0);
                                      creditDisplay = <span className="text-blue-600 font-bold text-[10px]">{remaining} Free Hrs</span>;
                                    } else {
                                      creditDisplay = <span className="text-[10px] text-gray-400">Credit: {s?.credits || 0}</span>;
                                    }

                                    return (
                                      <div key={`${cls.id}-${studentName}`} onClick={() => togglePresence(cls.id, studentName)} className={`relative flex items-center justify-between p-3 rounded-xl cursor-pointer border transition-all ${isPresent ? 'border-green-400 bg-green-50/50' : 'border-gray-100 hover:bg-gray-50'}`}>
                                        <div className="flex items-center gap-3 overflow-hidden">
                                          <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${isPresent ? 'bg-green-200 text-green-700' : 'bg-gray-100 text-gray-400'}`}>{studentName.charAt(0)}</div>
                                          <div className="min-w-0">
                                            <div className="font-bold text-gray-700 text-sm truncate">{studentName}</div>
                                            <div className="flex items-center gap-2 mt-0.5">
                                              {creditDisplay}
                                              {!isSingleClass && <span className="text-[9px] bg-gray-100 border border-gray-200 px-1.5 rounded text-gray-500 truncate max-w-[80px]">{cls.name}</span>}
                                            </div>
                                            {hasReason && <div className="text-[10px] bg-yellow-100 text-yellow-700 px-1 rounded inline-block mt-1">{hasReason}</div>}
                                          </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <button onClick={(e) => { e.stopPropagation(); setNoteModal({ classId: cls.id, studentName }); }} className={`p-1.5 rounded-full hover:bg-gray-200 ${hasReason ? 'text-yellow-500' : 'text-gray-300'}`}>
                                            <FileText size={14} />
                                          </button>
                                          <div className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${isPresent ? 'bg-green-500 text-white' : 'border-2 border-gray-200 bg-white'}`}>
                                            {isPresent && <CheckCircle size={14} strokeWidth={4}/>}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </React.Fragment>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <div className="space-y-8 animate-in fade-in zoom-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100">
                <h3 className="font-bold text-red-600 flex items-center gap-2 mb-4"><AlertTriangle size={20}/> At-Risk Classes</h3>
                <div className="space-y-3">{analytics.atRisk.map((c, i) => <div key={i} className="flex justify-between items-center p-3 bg-red-50 rounded-lg"><span>{c.name}</span><span className="font-bold text-red-600">{c.absenceRate}% Abs</span></div>)}</div>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-100">
                <h3 className="font-bold text-green-600 flex items-center gap-2 mb-4"><TrendingUp size={20}/> Most Improved</h3>
                <div className="space-y-3">{analytics.mostImproved.map((c, i) => <div key={i} className="flex justify-between items-center p-3 bg-green-50 rounded-lg"><span>{c.name}</span><span className="font-bold text-green-600">{c.absenceRate}% Abs</span></div>)}</div>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-96">
              <h3 className="font-bold text-gray-700 mb-6">Attendance Rates</h3>
              <ResponsiveContainer width="100%" height="85%">
                <BarChart data={analytics.reportCard}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} interval={0} angle={-15} textAnchor="end"/>
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="absenceRate" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30}>
                    {analytics.reportCard.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.absenceRate > 20 ? '#ef4444' : '#33c4e5'} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

      </div>

      {noteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6">
            <h3 className="font-bold text-lg mb-2">Add Note</h3>
            <form onSubmit={saveReason}>
              <input name="reason" autoFocus placeholder="e.g. Sick" className="w-full border rounded-lg p-3 mb-4 outline-none focus:border-[#33c4e5]" />
              <div className="flex gap-2"><button type="button" onClick={() => setNoteModal(null)} className="flex-1 py-2 border rounded-lg font-bold text-gray-500">Cancel</button><button type="submit" className="flex-1 py-2 bg-[#33c4e5] text-white rounded-lg font-bold">Save</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendancePage;
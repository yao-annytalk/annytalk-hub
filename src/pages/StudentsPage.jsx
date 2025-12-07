import React, { useState, useMemo } from 'react';
import Topbar from '../components/Topbar';
import { useStudents } from '../hooks/useStudents';
import { useModal } from '../hooks/useModal';
// ✅ Import Gemini Service
import { analyzeStudentProfile, draftFollowUpMessage } from '../services/geminiService';
import { 
  Search, Phone, User, Edit3, X, Calendar, Clock, 
  CheckCircle, AlertCircle, DollarSign, Briefcase, Mail, Save, Award, Gift, Star, UserPlus, TrendingUp, Undo2, Trash2, Sparkles, MessageCircle
} from 'lucide-react';

const StudentsPage = () => {
  const { students, updateStudent, addStudent, deleteStudent } = useStudents();
  const modal = useModal();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  // Modals State
  const [selectedStudent, setSelectedStudent] = useState(null); 
  const [isEditing, setIsEditing] = useState(false); 
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // AI State
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [generatedMessage, setGeneratedMessage] = useState(null);
  const [isDrafting, setIsDrafting] = useState(false);

  // --- FILTERS ---
  const filtered = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (s.parentName && s.parentName.toLowerCase().includes(searchTerm.toLowerCase()));
      
      if (filterStatus === 'active') return s.status === 'active' && s.memberStatus !== 'Not Member' && matchesSearch;
      if (filterStatus === 'not-member') return s.memberStatus === 'Not Member' && matchesSearch;

      const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [students, searchTerm, filterStatus]);

  // --- STATS ---
  const stats = useMemo(() => {
    const members = students.filter(s => s.memberStatus !== 'Not Member');
    return {
      total: students.length,
      active: students.filter(s => s.status === 'active' && s.memberStatus !== 'Not Member').length,
      new: students.filter(s => s.status === 'new').length,
      notMember: students.filter(s => s.memberStatus === 'Not Member').length,
      drop: students.filter(s => s.status === 'drop').length,
      
      scholarship: students.filter(s => s.scholarshipStatus === 'scholarship').length,
      reward: students.filter(s => s.scholarshipStatus === 'reward').length,
      special: students.filter(s => s.scholarshipStatus === 'special').length,

      creditLow: members.filter(s => (s.credits || 0) <= 8).length,
      creditMed: members.filter(s => (s.credits || 0) > 8 && (s.credits || 0) <= 16).length,
      creditHigh: members.filter(s => (s.credits || 0) > 16).length,
      totalOutstanding: members.reduce((sum, s) => sum + (Number(s.credits) || 0), 0)
    };
  }, [students]);

  // --- ACTIONS ---
  const handleSaveChanges = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updates = {
      studentName: fd.get('studentName'),
      studentCode: fd.get('studentCode'),
      memberStatus: fd.get('memberStatus'),
      status: fd.get('status'),
      totalHours: Number(fd.get('totalHours')),
      usedHours: Number(fd.get('usedHours')),
      credits: Number(fd.get('credits')),
      scholarshipStatus: fd.get('scholarshipStatus'),
      scholarshipName: fd.get('scholarshipName'),
      freeHoursTotal: Number(fd.get('freeHoursTotal')),
      expiryDate: fd.get('expiryDate'),
      parentName: fd.get('parentName'),
      phone: fd.get('phone'),
      lineUserId: fd.get('lineUserId'),
      salesPerson: fd.get('salesPerson'),
      supportPerson: fd.get('supportPerson')
    };

    try {
      await updateStudent(selectedStudent.id, updates);
      setSelectedStudent({ ...selectedStudent, ...updates });
      setIsEditing(false);
      await modal.alert({ title: "Success", message: "✅ Saved Successfully!", type: "success" });
    } catch (err) { 
      modal.alert({ title: "Error", message: err.message, isDanger: true });
    }
  };

  const handleDeleteStudent = async () => {
    const confirmed = await modal.confirm({
      title: `Delete ${selectedStudent.studentName}?`,
      message: "⚠️ DANGER: This action cannot be undone. All credit history and logs will be permanently removed.",
      confirmText: "Delete Student",
      isDanger: true
    });

    if (confirmed) {
      try {
        await deleteStudent(selectedStudent.id);
        setSelectedStudent(null);
        await modal.alert({ title: "Deleted", message: "Student has been removed.", type: "success" });
      } catch (err) { 
        modal.alert({ title: "Error", message: err.message, isDanger: true });
      }
    }
  };

  const handleAddStudentSubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const newStudent = {
      studentName: fd.get('studentName'),
      studentCode: fd.get('studentCode'),
      parentName: fd.get('parentName'),
      phone: fd.get('phone'),
      status: 'active',
      memberStatus: 'Member',
      totalHours: Number(fd.get('packageHours')),
      credits: Number(fd.get('packageHours')),
      usedHours: 0,
      scholarshipStatus: 'none',
      createdAt: new Date().toISOString()
    };
    try {
      await addStudent(newStudent);
      setIsAddModalOpen(false);
      await modal.alert({ title: "Success", message: "✅ Student Added Successfully!", type: "success" });
    } catch (err) {
      modal.alert({ title: "Error", message: err.message, isDanger: true });
    }
  };

  // --- AI ACTIONS ---
  const handleAnalyzeStudent = async () => {
    setIsAnalyzing(true);
    try {
      const result = await analyzeStudentProfile(selectedStudent);
      setAiAnalysis(result);
    } catch (error) {
      modal.alert({ title: "AI Error", message: "Could not analyze student.", isDanger: true });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleDraftMessage = async (intent) => {
    setIsDrafting(true);
    try {
      const text = await draftFollowUpMessage(selectedStudent, intent);
      setGeneratedMessage(text);
    } catch (error) {
      modal.alert({ title: "AI Error", message: "Could not generate message.", isDanger: true });
    } finally {
      setIsDrafting(false);
    }
  };

  // --- HELPERS ---
  const getCreditColorText = (credits, memberStatus) => {
    if (memberStatus === 'Not Member') return 'text-gray-400';
    if (credits <= 8) return 'text-red-600';     
    if (credits <= 16) return 'text-yellow-600'; 
    return 'text-green-600';                     
  };

  const getCreditColorBg = (credits) => {
    if (credits <= 8) return 'bg-red-500';
    if (credits <= 16) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const StatusBadge = ({ s }) => {
    if (s.memberStatus === 'Not Member') return <span className="px-2 py-1 rounded text-xs font-bold border uppercase bg-gray-100 text-gray-500 border-gray-200">Not Member</span>;
    const styles = { active: "bg-green-100 text-green-700 border-green-200", new: "bg-blue-100 text-blue-700 border-blue-200", drop: "bg-red-100 text-red-700 border-red-200" };
    return <span className={`px-2 py-1 rounded text-xs font-bold border uppercase ${styles[s.status] || styles.active}`}>{s.status || 'Active'}</span>;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-10">
      <Topbar title="Student Directory (CRM)" />
      
      <div className="p-8 max-w-7xl mx-auto">
        
        {/* STATS ROW 1 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <div className="text-gray-400 text-xs font-bold uppercase">Total Students</div>
            <div className="text-2xl font-bold text-gray-800">{stats.total}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm">
            <div className="text-green-600 text-xs font-bold uppercase">Active Learners</div>
            <div className="text-2xl font-bold text-green-700">{stats.active}</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 shadow-sm">
            <div className="text-blue-600 text-xs font-bold uppercase">New Leads</div>
            <div className="text-2xl font-bold text-blue-700">{stats.new}</div>
          </div>
          <div className="bg-gray-100 p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-gray-500 text-xs font-bold uppercase">Not Member</div>
            <div className="text-2xl font-bold text-gray-600">{stats.notMember}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">
            <div className="text-red-600 text-xs font-bold uppercase">Dropped</div>
            <div className="text-2xl font-bold text-red-700">{stats.drop}</div>
          </div>
        </div>

        {/* STATS ROW 2 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">
            <div className="text-red-600 text-xs font-bold uppercase flex items-center gap-1"><AlertCircle size={12}/> Low (&le; 8 hrs)</div>
            <div className="text-2xl font-bold text-red-700">{stats.creditLow} Students</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 shadow-sm">
            <div className="text-yellow-600 text-xs font-bold uppercase flex items-center gap-1"><Clock size={12}/> Medium (9-16 hrs)</div>
            <div className="text-2xl font-bold text-yellow-700">{stats.creditMed} Students</div>
          </div>
          <div className="bg-green-50 p-4 rounded-xl border border-green-100 shadow-sm">
            <div className="text-green-600 text-xs font-bold uppercase flex items-center gap-1"><CheckCircle size={12}/> Healthy (&gt; 16 hrs)</div>
            <div className="text-2xl font-bold text-green-700">{stats.creditHigh} Students</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-sm">
            <div className="text-blue-500 text-xs font-bold uppercase flex items-center gap-1"><TrendingUp size={12}/> Total Outstanding</div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalOutstanding.toLocaleString()} hrs</div>
          </div>
        </div>

        {/* TOOLBAR */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
              <input 
                type="text" 
                placeholder="Search Name, Parent, ID..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:border-[#33c4e5]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button onClick={() => setIsAddModalOpen(true)} className="bg-[#33c4e5] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:brightness-95 shadow-sm whitespace-nowrap"><UserPlus size={18} /> Add Student</button>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 w-full md:w-auto">{['all', 'active', 'not-member', 'new', 'drop'].map(st => (<button key={st} onClick={() => setFilterStatus(st)} className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-colors whitespace-nowrap ${filterStatus === st ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 border hover:bg-gray-50'}`}>{st.replace('-', ' ')}</button>))}</div>
        </div>

        {/* TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-bold border-b border-gray-100"><tr><th className="p-4">Student</th><th className="p-4">Status</th><th className="p-4">Credits</th><th className="p-4">Course Info</th><th className="p-4">Contact</th><th className="p-4"></th></tr></thead>
            <tbody className="divide-y divide-gray-50">{filtered.map(s => (
              <tr key={s.id} onClick={() => { setSelectedStudent(s); setIsEditing(false); setAiAnalysis(null); setGeneratedMessage(null); }} className="hover:bg-blue-50/50 cursor-pointer transition-colors group">
                <td className="p-4"><div className="font-bold text-gray-800 text-base">{s.studentName}</div><div className="text-xs text-gray-400 font-mono">{s.studentCode || `ID: ${s.id.substr(0,6)}`}</div></td>
                <td className="p-4"><StatusBadge s={s} /></td>
                <td className="p-4"><div className="flex items-center gap-2"><span className={`font-bold text-lg ${getCreditColorText(s.credits, s.memberStatus)}`}>{s.credits}</span><span className="text-xs text-gray-400 uppercase">Hrs</span></div>{s.memberStatus !== 'Not Member' && <div className="w-20 h-1 bg-gray-100 rounded-full mt-1"><div className={`h-full rounded-full ${getCreditColorBg(s.credits)}`} style={{ width: `${Math.min(((s.credits || 0) / (s.totalHours || 20)) * 100, 100)}%` }}></div></div>}</td>
                <td className="p-4"><div className="text-xs text-gray-500"><span className="block"><span className="font-bold">Total:</span> {s.totalHours || 0} hrs</span><span className="block"><span className="font-bold">Used:</span> {s.usedHours || 0} hrs</span></div></td>
                <td className="p-4"><div className="text-sm font-medium text-gray-700">{s.parentName || '-'}</div><div className="text-xs text-gray-400">{s.phone}</div></td>
                <td className="p-4 text-right"><div className="text-gray-300 group-hover:text-[#33c4e5]"><Edit3 size={18} /></div></td>
              </tr>
            ))}</tbody>
          </table>
          {filtered.length === 0 && <div className="p-10 text-center text-gray-400">No students found.</div>}
        </div>
      </div>

      {/* ADD STUDENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-[#33c4e5] p-4 text-white flex justify-between items-center"><h3 className="font-bold text-lg flex items-center gap-2"><UserPlus size={20}/> Add New Student</h3><button onClick={() => setIsAddModalOpen(false)} className="text-white/70 hover:text-white"><X size={20}/></button></div>
            <form onSubmit={handleAddStudentSubmit} className="p-6 space-y-4">
              <div><label className="text-xs font-bold text-gray-500 mb-1 block">Full Name</label><input name="studentName" required className="w-full border rounded-lg p-2 text-sm focus:border-[#33c4e5] outline-none" placeholder="Student Name" /></div>
              <div><label className="text-xs font-bold text-gray-500 mb-1 block">Student Code (Optional)</label><input name="studentCode" className="w-full border rounded-lg p-2 text-sm focus:border-[#33c4e5] outline-none" placeholder="e.g. S001" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold text-gray-500 mb-1 block">Parent Name</label><input name="parentName" className="w-full border rounded-lg p-2 text-sm" placeholder="Parent Name" /></div>
                <div><label className="text-xs font-bold text-gray-500 mb-1 block">Phone</label><input name="phone" className="w-full border rounded-lg p-2 text-sm" placeholder="08x-xxx-xxxx" /></div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                <label className="text-xs font-bold text-yellow-700 mb-1 block flex items-center gap-1"><Clock size={12}/> Initial Package (Hours)</label>
                <input name="packageHours" type="number" defaultValue="20" className="w-full border border-yellow-300 rounded-lg p-2 text-lg font-bold text-yellow-800 focus:outline-none" />
                <p className="text-[10px] text-yellow-600 mt-1">Sets Total Hours and Credits.</p>
              </div>
              <button type="submit" className="w-full bg-[#33c4e5] text-white font-bold py-3 rounded-xl hover:brightness-95 shadow-md">Create Student</button>
            </form>
          </div>
        </div>
      )}

      {/* ✨ EDIT MODAL (WIDE) */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <form onSubmit={handleSaveChanges} className="flex flex-col h-full overflow-hidden">
              <div className="bg-[#1e293b] p-5 text-white flex justify-between items-start shrink-0 shadow-lg z-10">
                <div className="flex items-center gap-4 w-full">
                  <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-2xl font-bold text-[#33c4e5] border-2 border-white/20 shadow-inner">{selectedStudent.studentName.charAt(0)}</div>
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-1"><input name="studentName" defaultValue={selectedStudent.studentName} className="bg-white/10 border border-white/30 text-white font-bold text-lg rounded px-2 py-1 w-full focus:outline-none focus:border-[#33c4e5]" placeholder="Student Name"/><input name="studentCode" defaultValue={selectedStudent.studentCode} className="bg-white/10 border border-white/30 text-white/70 text-xs font-mono rounded px-2 py-1 w-1/2 focus:outline-none focus:border-[#33c4e5]" placeholder="Student ID"/></div>
                    ) : (
                      <><h2 className="text-xl font-bold tracking-tight">{selectedStudent.studentName}</h2><p className="text-white/60 text-xs font-mono mt-1 flex items-center gap-2"><span className="bg-white/10 px-2 py-0.5 rounded text-[10px] tracking-widest uppercase">ID</span>{selectedStudent.studentCode || selectedStudent.id}</p></>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   {/* ✨ AI Actions Button */}
                   {!isEditing && (
                    <button 
                      type="button"
                      onClick={handleAnalyzeStudent}
                      className="p-2 rounded-full bg-purple-600 text-white hover:bg-purple-700 shadow-md transition-all"
                      title="Analyze with AI"
                    >
                      <Sparkles size={18}/>
                    </button>
                   )}
                  <button type="button" onClick={() => setIsEditing(!isEditing)} className={`p-2 rounded-full transition-all duration-200 ${isEditing ? 'bg-red-500 text-white hover:bg-red-600 shadow-md' : 'bg-[#33c4e5] text-white hover:brightness-110 shadow-md'}`}>{isEditing ? <Undo2 size={18}/> : <Edit3 size={18}/>}</button>
                  <button type="button" onClick={() => setSelectedStudent(null)} className="text-white/50 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors"><X size={20} /></button>
                </div>
              </div>

              <div className="p-5 overflow-y-auto flex-1 bg-gray-50 space-y-5">
                
                {/* 🔥 AI Analysis Section */}
                {aiAnalysis && (
                   <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100 shadow-sm animate-in fade-in slide-in-from-top-2">
                     <div className="flex justify-between items-center mb-3">
                       <h3 className="text-sm font-bold text-indigo-800 flex items-center gap-2"><Sparkles size={16}/> AI Student Analysis</h3>
                       <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase border ${aiAnalysis.riskLevel === 'High' ? 'bg-red-100 text-red-600 border-red-200' : aiAnalysis.riskLevel === 'Medium' ? 'bg-yellow-100 text-yellow-600 border-yellow-200' : 'bg-green-100 text-green-600 border-green-200'}`}>Risk: {aiAnalysis.riskLevel}</span>
                     </div>
                     <p className="text-sm text-gray-700 mb-2"><strong>Summary:</strong> {aiAnalysis.summary}</p>
                     <p className="text-sm text-gray-700 mb-3"><strong>Action:</strong> {aiAnalysis.actionItem}</p>
                     <div className="bg-white/50 p-2 rounded border border-indigo-100">
                       <p className="text-xs font-bold text-indigo-400 uppercase mb-1">Talking Points</p>
                       <ul className="list-disc list-inside text-xs text-gray-600">
                         {aiAnalysis.talkingPoints?.map((tp, i) => <li key={i}>{tp}</li>)}
                       </ul>
                     </div>
                   </div>
                )}

                {/* 🔥 AI Message Drafter */}
                {isDrafting ? (
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center justify-center gap-2 text-blue-600 text-sm">
                    <Loader2 className="animate-spin" size={16}/> Drafting message...
                  </div>
                ) : generatedMessage ? (
                   <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm animate-in fade-in">
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="text-xs font-bold text-blue-600 uppercase flex items-center gap-2"><MessageCircle size={14}/> Drafted Message</h3>
                        <button onClick={() => {navigator.clipboard.writeText(generatedMessage); alert("Copied!");}} className="text-xs text-blue-500 hover:underline">Copy</button>
                      </div>
                      <textarea readOnly className="w-full text-sm text-gray-600 bg-gray-50 border rounded p-2 h-24 focus:outline-none resize-none" value={generatedMessage}></textarea>
                      <div className="flex gap-2 mt-2">
                         <button onClick={() => setGeneratedMessage(null)} className="flex-1 py-1 text-xs border rounded hover:bg-gray-50">Dismiss</button>
                         <button onClick={() => window.open(`https://line.me/R/ti/p/~${selectedStudent.lineUserId || ''}`, '_blank')} className="flex-1 py-1 text-xs bg-[#06c755] text-white rounded font-bold hover:brightness-105">Open LINE</button>
                      </div>
                   </div>
                ) : (
                   !isEditing && (
                     <div className="flex gap-2 overflow-x-auto pb-1">
                        <button onClick={() => handleDraftMessage("Credit Reminder")} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:text-blue-600 hover:border-blue-200 whitespace-nowrap flex items-center gap-1 transition-colors"><MessageCircle size={12}/> Draft: Credit Reminder</button>
                        <button onClick={() => handleDraftMessage("Absent Follow-up")} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:text-blue-600 hover:border-blue-200 whitespace-nowrap flex items-center gap-1 transition-colors"><MessageCircle size={12}/> Draft: Absent Check</button>
                        <button onClick={() => handleDraftMessage("Encouragement")} className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:text-blue-600 hover:border-blue-200 whitespace-nowrap flex items-center gap-1 transition-colors"><MessageCircle size={12}/> Draft: Encouragement</button>
                     </div>
                   )
                )}

                {/* ... EXISTING FORM SECTIONS (Status, Credits, Scholarship, Contact, Staff) ... */}
                {/* 1. STATUS & HOURS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#33c4e5]"></div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-1"><CheckCircle size={12}/> Membership</h3>
                    <div className="space-y-2">
                      <div><label className="text-[10px] text-gray-400 block mb-1 font-bold">Status</label>{isEditing ? <select name="status" defaultValue={selectedStudent.status || 'active'} className="w-full border rounded-lg p-1.5 text-sm bg-gray-50"><option value="active">Active</option><option value="new">New</option><option value="drop">Drop</option></select> : <span className="font-bold text-gray-800 text-sm capitalize">{selectedStudent.status}</span>}</div>
                      <div><label className="text-[10px] text-gray-400 block mb-1 font-bold">Type</label>{isEditing ? <select name="memberStatus" defaultValue={selectedStudent.memberStatus || 'Member'} className="w-full border rounded-lg p-1.5 text-sm bg-gray-50"><option value="Member">Member</option><option value="Not Member">Not Member</option></select> : <span className={`font-bold text-sm ${selectedStudent.memberStatus==='Not Member'?'text-gray-400':'text-blue-600'}`}>{selectedStudent.memberStatus}</span>}</div>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#fcb625]"></div>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-1"><Clock size={12}/> Credit Balance</h3>
                    <div className="grid grid-cols-3 gap-1 text-center">
                      <div><label className="text-[9px] text-gray-400 block uppercase font-bold">Total</label>{isEditing ? <input name="totalHours" type="number" defaultValue={selectedStudent.totalHours} className="w-full border rounded p-1 text-center font-bold text-gray-700 text-sm"/> : <div className="text-lg font-bold text-gray-700">{selectedStudent.totalHours || 0}</div>}</div>
                      <div><label className="text-[9px] text-gray-400 block uppercase font-bold">Used</label>{isEditing ? <input name="usedHours" type="number" defaultValue={selectedStudent.usedHours} className="w-full border rounded p-1 text-center font-bold text-gray-700 text-sm"/> : <div className="text-lg font-bold text-gray-700">{selectedStudent.usedHours || 0}</div>}</div>
                      <div><label className="text-[9px] text-gray-400 block uppercase font-bold">Left</label>{isEditing ? <input name="credits" type="number" defaultValue={selectedStudent.credits} className="w-full border rounded p-1 text-center font-bold text-yellow-600 text-sm"/> : <div className={`text-lg font-bold ${getCreditColorText(selectedStudent.credits, selectedStudent.memberStatus)}`}>{selectedStudent.credits || 0}</div>}</div>
                    </div>
                  </div>
                </div>

                {/* 2. SCHOLARSHIP CARD */}
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200 shadow-sm">
                  <h3 className="text-[10px] font-bold text-yellow-700 uppercase mb-3 flex items-center gap-1"><Award size={12}/> Scholarship</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[9px] text-yellow-600/70 block mb-1 uppercase font-bold">Type</label>{isEditing ? <select name="scholarshipStatus" defaultValue={selectedStudent.scholarshipStatus || 'none'} className="w-full border border-yellow-300 rounded p-1.5 text-sm"><option value="none">None</option><option value="scholarship">Full Scholarship</option><option value="reward">Reward (Free Hours)</option><option value="special">Special Case</option></select> : <span className="font-bold text-gray-800 uppercase text-xs">{selectedStudent.scholarshipStatus || 'None'}</span>}</div>
                    <div><label className="text-[9px] text-yellow-600/70 block mb-1 uppercase font-bold">Grant Name</label>{isEditing ? <input name="scholarshipName" defaultValue={selectedStudent.scholarshipName} className="w-full border border-yellow-300 rounded p-1.5 text-sm"/> : <span className="font-medium text-gray-800 text-xs">{selectedStudent.scholarshipName || '-'}</span>}</div>
                    <div><label className="text-[9px] text-yellow-600/70 block mb-1 uppercase font-bold">Free Hours</label>{isEditing ? <input name="freeHoursTotal" type="number" defaultValue={selectedStudent.freeHoursTotal} className="w-full border border-yellow-300 rounded p-1.5 text-sm"/> : <span className="font-bold text-gray-800 text-sm">{selectedStudent.freeHoursTotal || 0}</span>}</div>
                    <div><label className="text-[9px] text-yellow-600/70 block mb-1 uppercase font-bold">Expiry</label>{isEditing ? <input name="expiryDate" type="date" defaultValue={selectedStudent.expiryDate} className="w-full border border-yellow-300 rounded p-1.5 text-sm"/> : <span className="font-medium text-gray-800 text-xs">{selectedStudent.expiryDate || '-'}</span>}</div>
                  </div>
                </div>

                {/* 3. CONTACT & STAFF INFO */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-1"><User size={12}/> Contact</h3>
                    <div className="space-y-3">
                      <div><label className="text-[9px] text-gray-400 block mb-1 uppercase font-bold">Parent</label>{isEditing ? <input name="parentName" defaultValue={selectedStudent.parentName} className="w-full border rounded p-1.5 text-sm bg-gray-50 focus:bg-white" /> : <div className="font-medium text-gray-800 text-sm">{selectedStudent.parentName || "-"}</div>}</div>
                      <div><label className="text-[9px] text-gray-400 block mb-1 uppercase font-bold">Phone</label>{isEditing ? <input name="phone" defaultValue={selectedStudent.phone} className="w-full border rounded p-1.5 text-sm bg-gray-50 focus:bg-white" /> : <div className="font-medium text-gray-800 text-sm">{selectedStudent.phone || "-"}</div>}</div>
                      <div><label className="text-[9px] text-gray-400 block mb-1 uppercase font-bold">Line ID</label>{isEditing ? <input name="lineUserId" defaultValue={selectedStudent.lineUserId} className="w-full border rounded p-1.5 text-sm font-mono bg-gray-50 focus:bg-white" /> : <div className="font-medium text-gray-800 text-xs font-mono bg-gray-100 px-2 py-1 rounded inline-block">{selectedStudent.lineUserId || "-"}</div>}</div>
                    </div>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase mb-3 flex items-center gap-1"><Briefcase size={12}/> Internal</h3>
                    <div className="space-y-3">
                      <div><label className="text-[9px] text-gray-400 block mb-1 uppercase font-bold">Sales</label>{isEditing ? <input name="salesPerson" defaultValue={selectedStudent.salesPerson} className="w-full border rounded p-1.5 text-sm bg-gray-50 focus:bg-white" /> : <div className="font-medium text-gray-800 text-sm">{selectedStudent.salesPerson || "-"}</div>}</div>
                      <div><label className="text-[9px] text-gray-400 block mb-1 uppercase font-bold">Support</label>{isEditing ? <input name="supportPerson" defaultValue={selectedStudent.supportPerson} className="w-full border rounded p-1.5 text-sm bg-gray-50 focus:bg-white" /> : <div className="font-medium text-gray-800 text-sm">{selectedStudent.supportPerson || "-"}</div>}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div className="p-4 bg-white border-t border-gray-200 flex gap-3 shrink-0 justify-between items-center shadow-inner z-20">
                <button type="button" onClick={handleDeleteStudent} className="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors flex items-center gap-2">
                  <Trash2 size={18}/> <span className="text-[10px] font-bold uppercase hidden sm:inline">Delete Student</span>
                </button>
                <div className="flex gap-3">
                  {isEditing ? (
                    <>
                      <button type="button" onClick={() => setIsEditing(false)} className="px-5 py-2 border rounded-xl font-bold text-gray-500 text-sm hover:bg-gray-50 transition-colors">Cancel</button>
                      <button type="submit" className="px-5 py-2 bg-[#33c4e5] text-white rounded-xl font-bold text-sm hover:brightness-110 shadow-lg shadow-blue-200 flex items-center gap-2 transition-all transform active:scale-95"><Save size={16} /> Save</button>
                    </>
                  ) : (
                    <button type="button" onClick={() => setIsEditing(true)} className="px-5 py-2 bg-[#33c4e5] text-white rounded-xl font-bold text-sm hover:brightness-110 shadow-lg shadow-blue-200 flex items-center gap-2 transition-all transform active:scale-95"><Edit3 size={16} /> Edit Profile</button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentsPage;
import React, { useState, useMemo } from 'react';
import Topbar from '../components/Topbar';
import { useStudents } from '../hooks/useStudents';
import { 
  Award, Gift, Star, Clock, AlertCircle, CheckCircle, 
  Search, Filter, Edit3, X, Save 
} from 'lucide-react';

const ScholarshipPage = () => {
  const { students, updateStudent } = useStudents();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all'); // all, scholarship, reward, special
  const [editingStudent, setEditingStudent] = useState(null);

  // --- DATA PROCESSING ---
  const scholarshipStudents = useMemo(() => {
    return students.filter(s => {
      const hasPrivilege = s.scholarshipStatus && s.scholarshipStatus !== 'none';
      const matchesSearch = s.studentName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || s.scholarshipStatus === filterType;
      return hasPrivilege && matchesSearch && matchesType;
    });
  }, [students, searchTerm, filterType]);

  const stats = {
    scholarship: students.filter(s => s.scholarshipStatus === 'scholarship').length,
    reward: students.filter(s => s.scholarshipStatus === 'reward').length,
    special: students.filter(s => s.scholarshipStatus === 'special').length,
    totalFreeHours: students.reduce((acc, s) => {
      if (s.scholarshipStatus === 'reward') {
        return acc + Math.max(0, (s.freeHoursTotal || 0) - (s.freeHoursUsed || 0));
      }
      return acc;
    }, 0)
  };

  // --- ACTIONS ---
  const handleSave = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const updates = {
      scholarshipStatus: fd.get('type'),
      scholarshipName: fd.get('name'),
      freeHoursTotal: Number(fd.get('hours')),
      expiryDate: fd.get('expiry'),
      notes: fd.get('notes')
    };
    
    await updateStudent(editingStudent.id, updates);
    setEditingStudent(null);
    alert("✅ Scholarship Updated!");
  };

  const getDaysLeft = (expiry) => {
    if (!expiry) return 999;
    const diff = new Date(expiry) - new Date();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-10">
      <Topbar title="Scholarship & Rewards Center" />
      <div className="p-8 max-w-7xl mx-auto">
        
        {/* STATS CARDS */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-yellow-400 to-yellow-600 text-white p-4 rounded-xl shadow-lg">
            <div className="text-white/80 text-xs font-bold uppercase mb-1">Full Scholarships</div>
            <div className="text-3xl font-bold flex items-center gap-2"><Award/> {stats.scholarship}</div>
          </div>
          <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white p-4 rounded-xl shadow-lg">
            <div className="text-white/80 text-xs font-bold uppercase mb-1">Reward Students</div>
            <div className="text-3xl font-bold flex items-center gap-2"><Gift/> {stats.reward}</div>
          </div>
          <div className="bg-gradient-to-br from-purple-400 to-purple-600 text-white p-4 rounded-xl shadow-lg">
            <div className="text-white/80 text-xs font-bold uppercase mb-1">Special</div>
            <div className="text-3xl font-bold flex items-center gap-2"><Star/> {stats.special}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <div className="text-gray-400 text-xs font-bold uppercase mb-1">Total Free Hours Outstanding</div>
            <div className="text-3xl font-bold text-gray-700 flex items-center gap-2"><Clock className="text-blue-500"/> {stats.totalFreeHours}</div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-2">
            {['all', 'scholarship', 'reward', 'special'].map(t => (
              <button 
                key={t}
                onClick={() => setFilterType(t)}
                className={`px-4 py-2 rounded-lg font-bold capitalize text-sm transition-all ${filterType === t ? 'bg-gray-800 text-white' : 'bg-white border text-gray-500 hover:bg-gray-50'}`}
              >
                {t}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18}/>
            <input 
              type="text" 
              placeholder="Search Student..." 
              className="pl-10 pr-4 py-2 border rounded-xl w-64 focus:outline-none focus:border-blue-500"
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase border-b">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Privilege Type</th>
                <th className="p-4">Usage / Progress</th>
                <th className="p-4">Expiry Status</th>
                <th className="p-4 text-center">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {scholarshipStudents.map(s => {
                const daysLeft = getDaysLeft(s.expiryDate);
                const remaining = (s.freeHoursTotal || 0) - (s.freeHoursUsed || 0);
                const progress = s.freeHoursTotal > 0 ? (s.freeHoursUsed / s.freeHoursTotal) * 100 : 0;

                return (
                  <tr key={s.id} className="hover:bg-gray-50/50">
                    <td className="p-4 font-bold text-gray-700">{s.studentName}</td>
                    
                    <td className="p-4">
                      {s.scholarshipStatus === 'scholarship' && <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs font-bold border border-yellow-200 flex w-fit gap-1 items-center"><Award size={12}/> Scholarship</span>}
                      {s.scholarshipStatus === 'reward' && <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-200 flex w-fit gap-1 items-center"><Gift size={12}/> Reward</span>}
                      {s.scholarshipStatus === 'special' && <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded text-xs font-bold border border-purple-200 flex w-fit gap-1 items-center"><Star size={12}/> Special</span>}
                      <div className="text-[10px] text-gray-400 mt-1">{s.scholarshipName || "Unnamed Grant"}</div>
                    </td>

                    <td className="p-4">
                      {s.scholarshipStatus === 'reward' ? (
                        <div className="w-32">
                          <div className="flex justify-between text-xs mb-1 font-medium">
                            <span>{remaining} Left</span>
                            <span className="text-gray-400">{s.freeHoursUsed}/{s.freeHoursTotal} Used</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Unlimited Access</span>
                      )}
                    </td>

                    <td className="p-4">
                      {s.expiryDate ? (
                        <div className={`text-xs font-bold flex items-center gap-1 ${daysLeft < 7 ? 'text-red-600' : 'text-green-600'}`}>
                          {daysLeft < 7 ? <AlertCircle size={14}/> : <Clock size={14}/>}
                          {daysLeft < 0 ? 'EXPIRED' : `${daysLeft} Days Left`}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-xs">No Expiry</span>
                      )}
                    </td>

                    <td className="p-4 text-center">
                      <button onClick={() => setEditingStudent(s)} className="text-gray-400 hover:text-blue-500 transition-colors">
                        <Edit3 size={18}/>
                      </button>
                    </td>
                  </tr>
                );
              })}
              {scholarshipStudents.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-gray-400">No active scholarships found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden">
            <div className="bg-[#1e293b] p-4 text-white flex justify-between items-center">
              <h3 className="font-bold">Edit Privilege: {editingStudent.studentName}</h3>
              <button onClick={() => setEditingStudent(null)}><X size={20}/></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Privilege Type</label>
                <select name="type" defaultValue={editingStudent.scholarshipStatus} className="w-full border rounded-lg p-2 text-sm bg-gray-50">
                  <option value="none">None (Remove Privilege)</option>
                  <option value="scholarship">Full Scholarship (Free)</option>
                  <option value="reward">Reward (Free Hours)</option>
                  <option value="special">Special (Staff/CSR)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Grant Name / Reason</label>
                <input name="name" defaultValue={editingStudent.scholarshipName} placeholder="e.g. Competition Winner 2024" className="w-full border rounded-lg p-2 text-sm"/>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Total Free Hours</label>
                  <input name="hours" type="number" defaultValue={editingStudent.freeHoursTotal} className="w-full border rounded-lg p-2 text-sm"/>
                  <p className="text-[10px] text-gray-400 mt-1">Only for 'Reward' type</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Expiry Date</label>
                  <input name="expiry" type="date" defaultValue={editingStudent.expiryDate} className="w-full border rounded-lg p-2 text-sm"/>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Notes</label>
                <textarea name="notes" defaultValue={editingStudent.notes} className="w-full border rounded-lg p-2 text-sm" rows="2"></textarea>
              </div>

              <button type="submit" className="w-full bg-[#33c4e5] text-white py-2 rounded-lg font-bold hover:brightness-95 flex items-center justify-center gap-2">
                <Save size={18}/> Save Changes
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ScholarshipPage;
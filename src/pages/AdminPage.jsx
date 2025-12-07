import React, { useState, useMemo } from 'react';
import Topbar from '../components/Topbar';
import { useScheduleData } from '../hooks/useScheduleData';
import { useStudents } from '../hooks/useStudents';
import { useSettings } from '../hooks/useSettings';
import { 
  Trash2, Upload, Database, CheckCircle, AlertTriangle, Loader2, 
  BookOpen, BarChart2, Settings, Plus, X, Users, FileText, ToggleLeft, UserX
} from 'lucide-react';
import Papa from 'papaparse';
import { writeBatch, getDocs, collection } from 'firebase/firestore';
import { db } from '../firebase';
import { COACH_LIST, DAYS_OF_WEEK_DISPLAY, TIME_SLOTS, DAY_MAP } from '../utils/scheduleConstants';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// --- HELPER: Clean Messy Data ---
const cleanNumber = (val) => {
  if (!val) return 0;
  const cleanStr = val.toString().replace(/[^\d.-]/g, ''); 
  return Number(cleanStr) || 0;
};

const cleanString = (val) => {
  return val ? val.toString().trim() : "";
};

const AdminPage = () => {
  const { classes, addClass, deleteClass, importScheduleAndEnroll } = useScheduleData();
  const { students, importStudentsFromCRM, updateStudentLineID } = useStudents();
  const { settings, addCoach, removeCoach, addClassType, removeClassType } = useSettings();
  
  const [activeTab, setActiveTab] = useState('import'); 
  const [statusMsg, setStatusMsg] = useState(""); 
  const [statusType, setStatusType] = useState("neutral");
  const [isImporting, setIsImporting] = useState(false);
  
  // IMPORT MODE SWITCHER
  const [importMode, setImportMode] = useState('ATK'); 

  // --- WORKLOAD STATS ---
  const workloadStats = useMemo(() => {
    const coachList = settings.coaches && settings.coaches.length > 0 ? settings.coaches : Object.keys(COACH_LIST);
    return coachList.map(coach => {
      const coachClasses = classes.filter(c => c.coach === coach);
      const totalStudents = coachClasses.reduce((sum, c) => sum + (c.enrolledStudents?.length || 0), 0);
      const totalCap = coachClasses.reduce((sum, c) => sum + (c.capacity || 0), 0);
      return {
        name: coach,
        classes: coachClasses.length,
        students: totalStudents,
        capacity: totalCap,
        utilization: totalCap > 0 ? Math.round((totalStudents / totalCap) * 100) : 0
      };
    }).sort((a, b) => b.classes - a.classes);
  }, [classes, settings.coaches]);

  // --- FORM STATES ---
  const [newCoachName, setNewCoachName] = useState("");
  const [newTypeName, setNewTypeName] = useState("");
  const [formData, setFormData] = useState({
    name: '', day: 'Sat', time: TIME_SLOTS[0], duration: 120, capacity: 8, 
    coach: '', type: '' 
  });

  // --- ACTIONS ---
  const handleAddCoach = () => { if(newCoachName) { addCoach(newCoachName); setNewCoachName(""); } };
  const handleAddType = () => { if(newTypeName) { addClassType(newTypeName); setNewTypeName(""); } };

  const handleClassSubmit = async (e) => {
    e.preventDefault();
    const finalData = {
      ...formData,
      coach: formData.coach || settings.coaches?.[0] || Object.keys(COACH_LIST)[0],
      name: formData.name || `${formData.type || 'Class'} (${formData.day})` 
    };
    try {
      await addClass(finalData);
      setStatusType("success");
      setStatusMsg(`✅ Class Created!`);
      setFormData({ ...formData, name: '' });
    } catch (e) { setStatusType("error"); setStatusMsg(e.message); }
  };

  // --- IMPORT LOGIC ---
  const [crmPreview, setCrmPreview] = useState([]);
  const [schedulePreview, setSchedulePreview] = useState([]);

  const handleDeleteAllClasses = async () => {
    if(!confirm("⚠️ DANGER: This will delete ALL classes. Are you sure?")) return;
    setIsImporting(true);
    try {
      const snap = await getDocs(collection(db, 'classes'));
      const batch = writeBatch(db);
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
      setStatusType("success");
      setStatusMsg("✅ All classes deleted.");
    } catch(e) { alert(e.message); } 
    finally { setIsImporting(false); }
  };

  // 🔥 NEW: DELETE ALL STUDENTS
  const handleDeleteAllStudents = async () => {
    if(!confirm("⚠️ DANGER: This will delete ALL student records. This cannot be undone.\n\nAre you absolutely sure?")) return;
    setIsImporting(true);
    try {
      const snap = await getDocs(collection(db, 'students'));
      // Firebase batch limit is 500, so we might need to loop if many students
      // For simplicity in small apps, a single batch works for <500.
      // For safety, let's loop.
      const chunks = [];
      let batch = writeBatch(db);
      let count = 0;
      
      snap.docs.forEach((d, i) => {
        batch.delete(d.ref);
        count++;
        if (count >= 450) {
          chunks.push(batch);
          batch = writeBatch(db);
          count = 0;
        }
      });
      if (count > 0) chunks.push(batch);

      await Promise.all(chunks.map(b => b.commit()));
      
      setStatusType("success");
      setStatusMsg(`✅ All students deleted.`);
    } catch(e) { alert(e.message); } 
    finally { setIsImporting(false); }
  };

  // 1. CRM IMPORT (Student Data)
  const handleCRMUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatusMsg(`Reading CSV (${importMode} Mode)...`);

    Papa.parse(file, { 
      header: false, 
      skipEmptyLines: true, 
      complete: (res) => {
        const rows = res.data;
        const headerIdx = 1; // Row 2

        if (rows.length <= 2) {
          setStatusType("error");
          setStatusMsg("❌ Error: File too short.");
          return;
        }

        const dataRows = rows.slice(headerIdx + 1);
        
        const cleanData = dataRows.map(r => {
          if (importMode === 'ATK') {
            return {
              studentName: cleanString(r[0]),  
              studentId: cleanString(r[1]),    
              memberStatus: cleanString(r[4]), 
              salesPerson: cleanString(r[5]),  
              supportPerson: cleanString(r[6]),
              credits: cleanNumber(r[7]),      
              totalHours: cleanNumber(r[19]),  
              usedHours: cleanNumber(r[20])    
            };
          } else {
            return {
              studentName: cleanString(r[0]),  
              studentId: cleanString(r[1]),    
              memberStatus: cleanString(r[5]), 
              salesPerson: cleanString(r[6]),  
              supportPerson: cleanString(r[7]),
              credits: cleanNumber(r[8]),      
              totalHours: cleanNumber(r[19]),  
              usedHours: cleanNumber(r[20])    
            };
          }
        }).filter(r => r.studentName && r.studentName.length > 1);
        
        setCrmPreview(cleanData);
        setStatusType("neutral");
        setStatusMsg(`📄 Ready to import ${cleanData.length} students.`);
      }
    });
  };

  // 2. SCHEDULE IMPORT (Class Data)
  const handleScheduleUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatusMsg("Reading Schedule CSV...");

    Papa.parse(file, {
      header: false, 
      skipEmptyLines: true,
      complete: (res) => {
        const rows = res.data;
        const headerIdx = 0;
        
        if (rows.length < 1) {
            setStatusType("error");
            setStatusMsg("❌ Error: File appears empty.");
            return;
        }

        const headers = rows[headerIdx];
        const findCol = (keywords) => headers.findIndex(h => h && keywords.some(k => h.toString().toLowerCase().includes(k.toLowerCase())));

        const nameIdx = findCol(["Student", "Name"]);
        const courseIdx = findCol(["Course", "Subject"]);
        const dayIdx = findCol(["Day"]);
        const timeIdx = findCol(["Time"]);
        const coachIdx = findCol(["Coach", "Teacher"]);
        const userIdx = findCol(["User", "ID"]);
        const placeIdx = findCol(["Place", "Location"]);

        if (courseIdx === -1 || dayIdx === -1) {
           setStatusType("error");
           setStatusMsg("❌ Error: Missing 'Course' or 'Day' columns in first row.");
           return;
        }

        const processedData = [];
        const dataRows = rows.slice(headerIdx + 1);

        dataRows.forEach(row => {
          const studentName = nameIdx > -1 ? cleanString(row[nameIdx]) : "";
          const course = cleanString(row[courseIdx]);
          const rawDay = cleanString(row[dayIdx]);
          
          if (!course || !rawDay) return;

          const realDays = DAY_MAP[rawDay] || [rawDay]; 
          
          realDays.forEach(day => {
            processedData.push({ 
              studentName, 
              lineId: userIdx > -1 ? cleanString(row[userIdx]) : "", 
              course, 
              coach: coachIdx > -1 ? cleanString(row[coachIdx]) : "", 
              day, 
              time: timeIdx > -1 ? cleanString(row[timeIdx]) : "", 
              place: placeIdx > -1 ? cleanString(row[placeIdx]) : "" 
            });
          });
        });

        setSchedulePreview(processedData);
        setStatusType("neutral");
        setStatusMsg(`📄 Ready to import ${processedData.length} entries.`);
      }
    });
  };

  const executeCRMImport = async () => {
    if(!confirm(`Import ${crmPreview.length} students as ${importMode}?`)) return;
    setIsImporting(true);
    await importStudentsFromCRM(crmPreview);
    setIsImporting(false);
    setStatusType("success"); setStatusMsg("✅ Import Successful!"); setCrmPreview([]);
  };

  const executeScheduleImport = async () => {
    if(!confirm(`Import Schedule?`)) return;
    setIsImporting(true);
    
    try {
      // 🔥 CALL THE NEW FAST FUNCTION
      await importScheduleAndEnroll(schedulePreview);
      
      setIsImporting(false);
      setStatusType("success"); 
      setStatusMsg("✅ Schedule & Line IDs Imported Successfully!"); 
      setSchedulePreview([]);
    } catch (e) {
      setIsImporting(false);
      setStatusType("error");
      setStatusMsg("❌ Import Failed: " + e.message);
    }
  };
  const TabButton = ({ id, icon: Icon, label }) => (
    <button onClick={() => setActiveTab(id)} className={`flex items-center gap-2 px-6 py-4 font-bold text-sm border-b-2 transition-colors ${activeTab === id ? 'border-[#33c4e5] text-[#33c4e5]' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
      <Icon size={18} /> {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <Topbar title="System Administration" />
      
      {/* STATUS BAR */}
      <div className={`px-8 py-4 border-b flex justify-between items-center sticky top-16 z-20 ${statusType === 'success' ? 'bg-green-100 text-green-800' : statusType === 'error' ? 'bg-red-100 text-red-800' : 'bg-gray-50 text-gray-600'}`}>
        <div className="font-bold flex items-center gap-3">
          {isImporting ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle size={20}/>}
          {statusMsg || "Ready."}
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 flex px-8 overflow-x-auto">
        <TabButton id="import" icon={Database} label="Data Import" />
        <TabButton id="config" icon={Settings} label="Config & Staff" />
        <TabButton id="workload" icon={BarChart2} label="Workload & Stats" />
        <TabButton id="classes" icon={BookOpen} label="Class Manager" />
      </div>

      <div className="p-8 max-w-6xl mx-auto">
        
        {activeTab === 'import' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* STUDENT DATA IMPORT */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-purple-600 mb-4">Step 1: Student Data</h3>
              
              <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
                <button onClick={() => setImportMode('ATK')} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${importMode === 'ATK' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>ATK (Kids)</button>
                <button onClick={() => setImportMode('ATP')} className={`flex-1 py-2 rounded-md text-sm font-bold transition-all ${importMode === 'ATP' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>ATP (Pro)</button>
              </div>
              
              <p className="text-xs text-gray-400 mb-4">{importMode === 'ATK' ? 'Data starts Row 3. Mapping: Credit=H, Status=E' : 'Data starts Row 3. Mapping: Credit=I, Status=F'}</p>

              <input type="file" accept=".csv" onChange={handleCRMUpload} className="w-full mb-4 text-sm"/>
              
              {crmPreview.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-purple-50 p-3 rounded-lg text-xs border border-purple-100">
                     <strong>Preview First Student:</strong><br/>
                     Name: {crmPreview[0].studentName}<br/>
                     Credit: {crmPreview[0].credits}<br/>
                     Status: {crmPreview[0].memberStatus}
                  </div>
                  <button onClick={executeCRMImport} className="w-full bg-purple-600 text-white py-2 rounded font-bold hover:bg-purple-700">Import {crmPreview.length} Students ({importMode})</button>
                </div>
              )}
            </div>

            {/* SCHEDULE IMPORT */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-[#33c4e5] mb-4">Step 2: Class Schedule</h3>
              <input type="file" accept=".csv" onChange={handleScheduleUpload} className="w-full mb-4 text-sm"/>
              
              {schedulePreview.length > 0 && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-3 rounded-lg text-xs border border-blue-100">
                     <strong>Preview First Class:</strong><br/>
                     Course: {schedulePreview[0].course}<br/>
                     Student: {schedulePreview[0].studentName}<br/>
                     Day: {schedulePreview[0].day}
                  </div>
                  <button onClick={executeScheduleImport} className="w-full bg-[#33c4e5] text-white py-2 rounded font-bold hover:brightness-95">Import {schedulePreview.length} Entries</button>
                </div>
              )}
            </div>

            {/* DANGER ZONE */}
            <div className="md:col-span-2 bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col md:flex-row justify-between items-center gap-4">
              <div><h3 className="font-bold text-red-600 flex items-center gap-2"><AlertTriangle size={20}/> Danger Zone</h3><p className="text-xs text-red-400">Actions here are irreversible.</p></div>
              <div className="flex gap-3">
                <button onClick={handleDeleteAllStudents} className="bg-white border border-red-200 text-red-600 px-6 py-2 rounded-lg font-bold hover:bg-red-50 flex items-center gap-2"><UserX size={18}/> Delete All Students</button>
                <button onClick={handleDeleteAllClasses} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-red-700 flex items-center gap-2"><Trash2 size={18}/> Delete All Classes</button>
              </div>
            </div>
          </div>
        )}

        {/* CONFIG, WORKLOAD, CLASSES Tabs */}
        {activeTab === 'config' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-navy text-lg mb-4 flex items-center gap-2"><Users size={20}/> Manage Coaches</h3>
              <div className="flex gap-2 mb-6">
                <input value={newCoachName} onChange={e=>setNewCoachName(e.target.value)} placeholder="New Coach Name" className="flex-1 border rounded-lg px-3 py-2 outline-none focus:border-[#33c4e5]"/>
                <button onClick={handleAddCoach} className="bg-[#33c4e5] text-white px-4 rounded-lg hover:brightness-95"><Plus/></button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(settings.coaches || []).map(coach => (
                  <div key={coach} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg group">
                    <span className="font-medium text-gray-700">{coach}</span>
                    <button onClick={() => removeCoach(coach)} className="text-gray-300 hover:text-red-500"><X size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-navy text-lg mb-4 flex items-center gap-2"><BookOpen size={20}/> Class Types</h3>
              <div className="flex gap-2 mb-6">
                <input value={newTypeName} onChange={e=>setNewTypeName(e.target.value)} placeholder="New Class Type" className="flex-1 border rounded-lg px-3 py-2 outline-none focus:border-[#fcb625]"/>
                <button onClick={handleAddType} className="bg-[#fcb625] text-white px-4 rounded-lg hover:brightness-95"><Plus/></button>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(settings.classTypes || []).map(type => (
                  <div key={type} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg group">
                    <span className="font-medium text-gray-700">{type}</span>
                    <button onClick={() => removeClassType(type)} className="text-gray-300 hover:text-red-500"><X size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'workload' && (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-700 mb-6">Coach Workload Overview</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workloadStats}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip cursor={{fill: '#f3f4f6'}} />
                    <Bar dataKey="classes" fill="#33c4e5" radius={[4, 4, 0, 0]} barSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs text-gray-500 uppercase"><tr><th className="p-4">Coach</th><th className="p-4">Classes</th><th className="p-4">Students</th><th className="p-4">Capacity</th><th className="p-4">Utilization</th></tr></thead>
                <tbody className="divide-y">
                  {workloadStats.map(stat => (
                    <tr key={stat.name}>
                      <td className="p-4 font-bold text-gray-700">{stat.name}</td><td className="p-4">{stat.classes}</td><td className="p-4">{stat.students}</td><td className="p-4 text-gray-400">{stat.capacity}</td><td className="p-4"><span className="text-xs font-bold">{stat.utilization}%</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
              <h3 className="font-bold text-gray-800 mb-4">Add Class</h3>
              <form onSubmit={handleClassSubmit} className="space-y-4">
                <div><label className="text-xs font-bold text-gray-400 uppercase">Type</label><select className="w-full p-2 border rounded mb-2" onChange={e => setFormData({...formData, type: e.target.value, name: `${e.target.value} (${formData.day})`})}><option value="">Select...</option>{(settings.classTypes || []).map(t => <option key={t} value={t}>{t}</option>)}</select><input className="w-full p-2 border rounded text-sm" placeholder="Custom Name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                <div className="grid grid-cols-2 gap-3"><select className="border rounded p-2" value={formData.day} onChange={e=>setFormData({...formData, day: e.target.value})}>{DAYS_OF_WEEK_DISPLAY.map(d=><option key={d} value={d}>{d}</option>)}</select><select className="border rounded p-2" value={formData.time} onChange={e=>setFormData({...formData, time: e.target.value})}>{TIME_SLOTS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
                <div><label className="text-xs font-bold text-gray-400 uppercase">Coach</label><select className="w-full p-2 border rounded" value={formData.coach} onChange={e => setFormData({...formData, coach: e.target.value})}><option value="">Select...</option>{(settings.coaches || []).map(c => <option key={c} value={c}>{c}</option>)}</select></div>
                <button type="submit" className="w-full bg-[#33c4e5] text-white py-2 rounded font-bold">Create</button>
              </form>
            </div>
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-4">Active Classes ({classes.length})</h3>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {classes.map(cls => (
                  <div key={cls.id} className="flex justify-between items-center p-3 border rounded hover:bg-gray-50">
                    <div><span className="font-bold">{cls.name}</span> <span className="text-gray-500 text-sm">({cls.day} {cls.time})</span></div>
                    <button onClick={() => deleteClass(cls.id)} className="text-red-300 hover:text-red-500"><Trash2 size={16}/></button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminPage;
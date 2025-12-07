import React, { useState } from 'react';
import Topbar from '../components/Topbar';
import { useCurriculum } from '../hooks/useCurriculum';
import { BookOpen, Plus, Save, ChevronRight, Layers, Edit3 } from 'lucide-react';

const CurriculumPage = () => {
  const { curriculums, createCurriculum, updateLesson } = useCurriculum();
  const [selectedCurr, setSelectedCurr] = useState(null);
  
  // Create Modal State
  const [isCreating, setIsCreating] = useState(false);
  
  const handleCreate = (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    createCurriculum(fd.get('name'), fd.get('level'), Number(fd.get('weeks')));
    setIsCreating(false);
  };

  const handleTopicChange = (weekIndex, val) => {
    if (!selectedCurr) return;
    const newWeeks = [...selectedCurr.weeks];
    newWeeks[weekIndex].topic = val;
    setSelectedCurr({ ...selectedCurr, weeks: newWeeks });
  };

  const saveChanges = async () => {
    if (!selectedCurr) return;
    await updateLesson(selectedCurr.id, selectedCurr.weeks);
    alert("✅ Lesson Plan Saved!");
  };

  return (
    <div className="min-h-screen bg-gray-50/50 pb-10">
      <Topbar title="Curriculum & Lesson Plans" />
      <div className="p-8 max-w-7xl mx-auto flex gap-8">
        
        {/* SIDEBAR: LIST OF COURSES */}
        <div className="w-1/3 space-y-4">
          <button onClick={() => setIsCreating(true)} className="w-full bg-[#33c4e5] text-white py-3 rounded-xl font-bold shadow-md hover:brightness-110 flex justify-center items-center gap-2">
            <Plus size={20}/> New Course
          </button>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b bg-gray-50 text-xs font-bold text-gray-400 uppercase">Available Courses</div>
            <div className="divide-y">
              {curriculums.map(curr => (
                <div 
                  key={curr.id} 
                  onClick={() => setSelectedCurr(curr)}
                  className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors flex justify-between items-center ${selectedCurr?.id === curr.id ? 'bg-blue-50 border-l-4 border-[#33c4e5]' : ''}`}
                >
                  <div>
                    <div className="font-bold text-gray-800">{curr.name}</div>
                    <div className="text-xs text-gray-500">Level {curr.level} • {curr.weeks.length} Weeks</div>
                  </div>
                  <ChevronRight size={16} className="text-gray-300"/>
                </div>
              ))}
              {curriculums.length === 0 && <div className="p-6 text-center text-gray-400 text-sm">No courses yet.</div>}
            </div>
          </div>
        </div>

        {/* MAIN: LESSON EDITOR */}
        <div className="w-2/3">
          {selectedCurr ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-6 border-b pb-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedCurr.name} <span className="text-gray-400 font-normal">/ Level {selectedCurr.level}</span></h2>
                  <p className="text-sm text-gray-500">Edit weekly topics below</p>
                </div>
                <button onClick={saveChanges} className="bg-green-500 text-white px-6 py-2 rounded-lg font-bold shadow hover:bg-green-600 flex items-center gap-2">
                  <Save size={18}/> Save Plan
                </button>
              </div>

              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                {selectedCurr.weeks.map((week, idx) => (
                  <div key={idx} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="w-10 h-10 bg-white border rounded-full flex items-center justify-center font-bold text-gray-400 shadow-sm shrink-0">
                      {week.week}
                    </div>
                    <div className="flex-1">
                      <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Topic / Theme</label>
                      <input 
                        value={week.topic} 
                        onChange={(e) => handleTopicChange(idx, e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded px-3 py-2 text-sm font-bold text-gray-700 focus:outline-[#33c4e5]"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-300 border-2 border-dashed border-gray-200 rounded-xl">
              <Layers size={64} className="mb-4 opacity-50"/>
              <p>Select a course to edit curriculum</p>
            </div>
          )}
        </div>

      </div>

      {/* CREATE MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-6">
            <h3 className="font-bold text-lg mb-4">Define New Course</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Course Name</label>
                <input name="name" placeholder="e.g. Speaking" className="w-full border rounded-lg p-2" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Level</label>
                  <input name="level" placeholder="e.g. 1, 2, A, B" className="w-full border rounded-lg p-2" required />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">Total Weeks</label>
                  <input name="weeks" type="number" defaultValue="12" className="w-full border rounded-lg p-2" required />
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-2 border rounded-lg">Cancel</button>
                <button type="submit" className="flex-1 py-2 bg-[#33c4e5] text-white rounded-lg font-bold">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumPage;
import React, { useState } from 'react';
import Topbar from '../components/Topbar';
import { useLeads } from '../hooks/useLeads';
import { getStatusColor } from '../utils/crmUtils';
import { Search } from 'lucide-react';

const CRMPage = () => {
  const { leads, updateLeadStatus } = useLeads();
  const [filter, setFilter] = useState('');

  // Filter leads based on search text
  const filteredLeads = leads.filter(l => 
    l.studentName?.toLowerCase().includes(filter.toLowerCase()) || 
    l.parentName?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50/50 pb-10">
      <Topbar title="Lead Management (CRM)" />
      
      <div className="p-8 max-w-[1600px] mx-auto">
        {/* Actions Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search parent, student, or phone..." 
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-[#33c4e5]"
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
          <button className="bg-[#33c4e5] text-white px-6 py-2 rounded-lg font-medium shadow-sm hover:brightness-95">
            + New Lead
          </button>
        </div>

        {/* Spreadsheet Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                <th className="px-6 py-4">Parent</th>
                <th className="px-6 py-4">Student</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Prob %</th>
                <th className="px-6 py-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-blue-50/30 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{lead.parentName}</td>
                  <td className="px-6 py-4 text-gray-600">{lead.studentName} <span className="text-xs text-gray-400">({lead.studentAge}yo)</span></td>
                  <td className="px-6 py-4 font-mono text-sm text-gray-500">{lead.parentPhone}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-500 text-sm">{lead.source}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-[#fcb625]" style={{ width: `${lead.probability * 100}%` }}></div>
                      </div>
                      <span className="text-xs text-gray-500">{(lead.probability * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => updateLeadStatus(lead.id, 'Won')} className="text-xs text-green-600 hover:underline mr-3">Won</button>
                    <button onClick={() => updateLeadStatus(lead.id, 'Lost')} className="text-xs text-red-400 hover:underline">Lost</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredLeads.length === 0 && <div className="p-8 text-center text-gray-400">No leads found.</div>}
        </div>
      </div>
    </div>
  );
};
export default CRMPage;
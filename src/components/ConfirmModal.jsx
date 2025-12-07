import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Confirm", isDanger = false }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className={`p-6 flex items-start gap-4 ${isDanger ? 'bg-red-50' : 'bg-gray-50'}`}>
          <div className={`p-3 rounded-full shrink-0 ${isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className={`text-lg font-bold ${isDanger ? 'text-red-900' : 'text-gray-900'}`}>
              {title}
            </h3>
            <p className="text-sm text-gray-500 mt-2 leading-relaxed">
              {message}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-white border-t border-gray-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className={`px-6 py-2 rounded-xl font-bold text-white text-sm shadow-lg transition-transform active:scale-95 ${
              isDanger 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-200' 
                : 'bg-[#33c4e5] hover:brightness-110 shadow-blue-200'
            }`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ConfirmModal;
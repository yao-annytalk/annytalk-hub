import React, { createContext, useState, useContext, useCallback } from 'react';
// ✅ MOVED IMPORTS TO THE TOP (This was the cause of the crash)
import { X, AlertTriangle, CheckCircle, Info, HelpCircle } from 'lucide-react';

const ModalContext = createContext();

export const ModalProvider = ({ children }) => {
  const [modalConfig, setModalConfig] = useState(null);

  const openModal = useCallback((config) => {
    return new Promise((resolve) => {
      setModalConfig({
        ...config,
        onConfirm: (data) => {
          setModalConfig(null);
          resolve({ isConfirmed: true, value: data });
        },
        onCancel: () => {
          setModalConfig(null);
          resolve({ isConfirmed: false });
        }
      });
    });
  });

  // Expose global modal open function for non-React modules (modalService will use this)
  if (typeof window !== 'undefined') {
    // keep it stable reference
    window.__APP_OPEN_MODAL__ = openModal;
  }

  const close = () => setModalConfig(null);

  // Helper that modal consumer components will call
  const contextValue = {
    openModal,
    closeModal: close
  };

  return (
    <ModalContext.Provider value={contextValue}>
      {children}
      {modalConfig && (
        <ModalRenderer {...modalConfig} />
      )}
    </ModalContext.Provider>
  );
};

export const useModalContext = () => {
  return useContext(ModalContext);
};

/* ModalRenderer is the UI used by the project for all alert/confirm/prompt dialogs.
   I left the UI markup mostly unchanged but ensured it uses the brand colors and
   supports confirm/cancel handlers from the context.
*/

const ModalRenderer = (props) => {
  const {
    type = 'alert',
    title = '',
    message = '',
    confirmText = 'OK',
    cancelText = 'Cancel',
    inputPlaceholder = '',
    inputType = 'text',
    onConfirm,
    onCancel,
    isDanger = false
  } = props;

  const [inputValue, setInputValue] = useState('');

  const handleConfirm = () => {
    if (type === 'prompt') {
      onConfirm && onConfirm(inputValue);
    } else {
      onConfirm && onConfirm();
    }
  };

  const handleCancel = () => {
    onCancel && onCancel();
  };

  // Icon selection
  let Icon = Info;
  let iconColor = 'text-blue-600 bg-blue-50';
  
  if (isDanger) {
    Icon = AlertTriangle;
    iconColor = 'text-red-600 bg-red-50';
  } else if (type === 'success') {
    Icon = CheckCircle;
    iconColor = 'text-green-600 bg-green-50';
  } else if (type === 'prompt') {
    Icon = HelpCircle;
    iconColor = 'text-purple-600 bg-purple-50';
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCancel} />
      <div className="relative w-full max-w-lg p-6 rounded-2xl shadow-2xl bg-white/80 glassmorphism">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${iconColor}`}>
            <Icon size={22} />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-gray-700">{message}</p>

            {type === 'prompt' && (
              <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={inputPlaceholder}
                type={inputType}
                className="mt-3 w-full rounded-md border px-3 py-2"
              />
            )}
          </div>

          <button
            onClick={handleCancel}
            aria-label="close"
            className="ml-3 p-2 rounded-lg hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          {type !== 'alert' && (
            <button
              onClick={handleCancel}
              className="px-4 py-2 rounded-xl border hover:brightness-95 text-sm"
            >
              {cancelText}
            </button>
          )}
          
          <button 
            onClick={handleConfirm}
            className={`px-6 py-2 rounded-xl font-bold text-white text-sm shadow-lg transition-all transform active:scale-95 ${
              isDanger 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-200' 
                : 'bg-[#33c4e5] hover:brightness-110 shadow-cyan-200'
            }`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};

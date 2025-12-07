// src/ui/UIProvider.jsx
import React, { createContext, useContext, useCallback } from "react";
import "./ui.css";

const ToastContext = React.createContext(null);

export function UIProvider({ children }) {
  // simple DOM-based toast manager (no need for heavy React state)
  const toast = {
    success: (msg) => window.__UI_BRIDGE__?.toast(msg, "success"),
    error: (msg) => window.__UI_BRIDGE__?.toast(msg, "error"),
    info: (msg) => window.__UI_BRIDGE__?.toast(msg, "info"),
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

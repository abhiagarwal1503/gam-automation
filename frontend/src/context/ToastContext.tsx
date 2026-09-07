import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Info, X, Sparkles, Bell } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  showToast: (type: ToastType, title: string, message: string, duration?: number) => void;
  success: (title: string, message: string) => void;
  error: (title: string, message: string) => void;
  warning: (title: string, message: string) => void;
  info: (title: string, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((type: ToastType, title: string, message: string, duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { id, type, title, message, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const success = useCallback((title: string, message: string) => showToast('success', title, message), [showToast]);
  const error = useCallback((title: string, message: string) => showToast('error', title, message, 6000), [showToast]);
  const warning = useCallback((title: string, message: string) => showToast('warning', title, message), [showToast]);
  const info = useCallback((title: string, message: string) => showToast('info', title, message), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info }}>
      {children}

      {/* Floating Ambient Toast Popup Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full pointer-events-none px-4 sm:px-0">
        {toasts.map((toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';

          return (
            <div
              key={toast.id}
              className={`pointer-events-auto p-4 rounded-2xl shadow-2xl backdrop-blur-xl border transition-all duration-300 animate-fade-in flex items-start gap-3.5 relative overflow-hidden ${
                isSuccess
                  ? 'bg-emerald-950/90 border-emerald-500/30 text-emerald-100 shadow-emerald-950/40'
                  : isError
                  ? 'bg-rose-950/90 border-rose-500/30 text-rose-100 shadow-rose-950/40'
                  : isWarning
                  ? 'bg-amber-950/90 border-amber-500/30 text-amber-100 shadow-amber-950/40'
                  : 'bg-slate-900/90 border-slate-700/60 text-slate-100 shadow-slate-950/40'
              }`}
            >
              {/* Left Color Accent Glow Bar */}
              <div
                className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                  isSuccess
                    ? 'bg-gradient-to-b from-emerald-400 to-teal-500'
                    : isError
                    ? 'bg-gradient-to-b from-rose-400 to-red-600'
                    : isWarning
                    ? 'bg-gradient-to-b from-amber-400 to-orange-500'
                    : 'bg-gradient-to-b from-blue-400 to-indigo-500'
                }`}
              />

              {/* Status Icon with Glowing Backdrop */}
              <div
                className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  isSuccess
                    ? 'bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/40'
                    : isError
                    ? 'bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40'
                    : isWarning
                    ? 'bg-amber-500/20 text-amber-400 ring-1 ring-amber-500/40'
                    : 'bg-blue-500/20 text-blue-400 ring-1 ring-blue-500/40'
                }`}
              >
                {isSuccess && <CheckCircle2 className="w-5 h-5" />}
                {isError && <XCircle className="w-5 h-5" />}
                {isWarning && <AlertTriangle className="w-5 h-5" />}
                {!isSuccess && !isError && !isWarning && <Sparkles className="w-5 h-5" />}
              </div>

              {/* Content Body */}
              <div className="flex-1 pr-2">
                <h4 className="text-sm font-bold text-white tracking-tight leading-snug flex items-center gap-1.5">
                  {toast.title}
                </h4>
                <p className="text-xs text-slate-300/90 mt-1 leading-relaxed font-normal">
                  {toast.message}
                </p>
              </div>

              {/* Dismiss Button */}
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-white/10 transition shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

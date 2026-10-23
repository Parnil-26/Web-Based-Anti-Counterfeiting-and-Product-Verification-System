import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function Toast({ toast, onClose }) {
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isInfo = toast.type === 'info';

  return (
    <div className="fixed bottom-5 right-5 z-70 animate-in slide-in-from-bottom-5 fade-in duration-200">
      <div className={`p-4 rounded-2xl shadow-xl border flex items-center space-x-3 min-w-[300px] max-w-md ${
        isError
          ? 'bg-rose-50 text-rose-900 border-rose-200'
          : isInfo
          ? 'bg-blue-50 text-blue-900 border-blue-200'
          : 'bg-emerald-950 text-white border-emerald-800'
      }`}>
        <div className="shrink-0">
          {isError ? (
            <AlertCircle className="w-5 h-5 text-rose-600" />
          ) : isInfo ? (
            <Info className="w-5 h-5 text-blue-600" />
          ) : (
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          )}
        </div>
        <div className="flex-1 text-xs">
          <p className="font-bold">{toast.title || 'Notification'}</p>
          <p className={`mt-0.5 ${isError ? 'text-rose-700' : isInfo ? 'text-blue-700' : 'text-emerald-200'}`}>
            {toast.message}
          </p>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 transition shrink-0 p-1"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

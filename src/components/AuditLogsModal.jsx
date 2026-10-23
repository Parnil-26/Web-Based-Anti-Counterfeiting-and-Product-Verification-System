import React, { useEffect, useState } from 'react';
import { X, History, ShieldCheck, UserCheck, RefreshCw } from 'lucide-react';
import { api } from '../utils/api';

export function AuditLogsModal({ isOpen, onClose }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = () => {
    setLoading(true);
    api.getAuditLogs()
      .then((res) => {
        setLogs(res.logs || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  };

  useEffect(() => {
    if (isOpen) fetchLogs();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[88vh] flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-slate-50 rounded-t-3xl">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
              <History className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900">System Activity Audit Trail</h3>
              <p className="text-xs text-slate-500">Immutable ledger of batch creations, modifications & token mints</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchLogs}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
              title="Refresh logs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Logs List */}
        <div className="overflow-y-auto p-6 space-y-3">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-7 h-7 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs text-slate-500">Retrieving audit ledger...</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No audit logs recorded yet.
            </div>
          ) : (
            logs.map((log) => (
              <div
                key={log.id}
                className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs flex items-start space-x-3 hover:bg-slate-100/70 transition"
              >
                <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-900 truncate">
                      {log.details}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-500 mt-1">
                    <span className="font-semibold text-slate-700">{log.user}</span>
                    <span>•</span>
                    <span className="px-1.5 py-0.2 rounded bg-slate-200 text-slate-700 text-[9px] font-bold">
                      {log.role}
                    </span>
                    <span>•</span>
                    <span className="text-[10px] text-slate-400">{new Date(log.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

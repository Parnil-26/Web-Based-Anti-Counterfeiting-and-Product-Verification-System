import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, UserCheck, LogOut, LogIn, History, Sparkles, RefreshCw, Layers } from 'lucide-react';

export function Navbar({ onOpenAuditLogs, onOpenLogin }) {
  const { currentUser, isManager, isSupervisor, logout, switchPresetRole } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  return (
    <header className="no-print bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Brand Logo & Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-farm-600 to-emerald-700 flex items-center justify-center text-white shadow-md shadow-farm-600/20">
              <ShieldCheck className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-lg tracking-tight text-slate-900">VeriDairy</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  Traceability OS
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Module 1 — Artisanal Batch & Token Management</p>
            </div>
          </div>

          {/* Right Action Bar */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Audit Logs button */}
            <button
              onClick={onOpenAuditLogs}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
              title="View system activity audit trail"
            >
              <History className="w-3.5 h-3.5 mr-1.5 text-slate-500" />
              <span className="hidden sm:inline">Audit Trail</span>
            </button>

            {/* User Profile & Role Switcher */}
            {currentUser ? (
              <div className="relative">
                <div className="flex items-center space-x-3 pl-3 border-l border-slate-200">
                  <div className="flex flex-col text-right hidden sm:block">
                    <span className="text-sm font-semibold text-slate-800 flex items-center justify-end space-x-1.5">
                      <span>{currentUser.name}</span>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        isManager ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-blue-100 text-blue-800 border border-blue-300'
                      }`}>
                        {currentUser.role}
                      </span>
                    </span>
                    <span className="text-xs text-slate-500">{currentUser.title}</span>
                  </div>

                  <button
                    onClick={() => setShowRoleMenu(!showRoleMenu)}
                    className="relative group p-0.5 rounded-full ring-2 ring-emerald-500/30 hover:ring-emerald-500 transition focus:outline-none"
                    title="Click to switch role or view account"
                  >
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-9 h-9 rounded-full object-cover"
                    />
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                  </button>
                </div>

                {/* Dropdown Menu */}
                {showRoleMenu && (
                  <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-100 py-2 z-50">
                    <div className="px-4 py-2 border-b border-slate-100">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900">{currentUser.name}</p>
                      <p className="text-xs text-slate-500">{currentUser.email}</p>
                      <div className="mt-1 flex items-center space-x-1.5">
                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-mono">
                          Badge: {currentUser.badgeId}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md font-medium">
                          {currentUser.department}
                        </span>
                      </div>
                    </div>

                    <div className="p-2">
                      <p className="text-[11px] font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                        Quick Role Switcher (Testing)
                      </p>
                      <button
                        onClick={() => {
                          switchPresetRole('manager');
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition ${
                          isManager ? 'bg-amber-50 text-amber-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                          <span>Manager (Eleanor Vance)</span>
                        </div>
                        {isManager && <span className="text-[10px] bg-amber-200 text-amber-800 px-1.5 py-0.5 rounded">Active</span>}
                      </button>

                      <button
                        onClick={() => {
                          switchPresetRole('supervisor');
                          setShowRoleMenu(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition mt-1 ${
                          isSupervisor ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                          <span>Supervisor (Marcus Thorne)</span>
                        </div>
                        {isSupervisor && <span className="text-[10px] bg-blue-200 text-blue-800 px-1.5 py-0.5 rounded">Active</span>}
                      </button>
                    </div>

                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          logout();
                          setShowRoleMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center space-x-2 transition"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center px-4 py-2 rounded-lg bg-farm-600 hover:bg-farm-700 text-white text-xs font-bold transition shadow-sm"
              >
                <LogIn className="w-4 h-4 mr-1.5" />
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

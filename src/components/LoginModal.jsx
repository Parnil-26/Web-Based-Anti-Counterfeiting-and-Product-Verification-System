import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Mail, CheckCircle2, User, Key, AlertCircle } from 'lucide-react';

export function LoginModal({ isOpen, onClose }) {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const res = await login(email, password);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error || 'Failed to authenticate');
    }
  };

  const handleSelectPreset = async (presetEmail, presetPass) => {
    setEmail(presetEmail);
    setPassword(presetPass);
    setError('');
    setLoading(true);
    const res = await login(presetEmail, presetPass);
    setLoading(false);
    if (res.success) {
      onClose();
    } else {
      setError(res.error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-farm-600 to-emerald-500 mx-auto flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">VeriDairy Traceability</h2>
          <p className="text-sm text-slate-500 mt-1">Manager & Supervisor Portal Access</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@veridairy.com"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 px-4 bg-farm-600 hover:bg-farm-700 text-white rounded-xl text-sm font-bold shadow-md shadow-farm-600/25 transition disabled:opacity-50"
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        {/* 1-Click Fast Presets */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center">
            One-Click Demo Test Accounts
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleSelectPreset('manager@veridairy.com', 'manager123')}
              className="p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl text-left transition group"
            >
              <div className="flex items-center space-x-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span className="text-xs font-bold text-amber-900">Manager</span>
              </div>
              <p className="text-[11px] text-amber-700 truncate">Eleanor Vance</p>
              <p className="text-[10px] text-amber-600/80 font-mono mt-0.5">manager123</p>
            </button>

            <button
              onClick={() => handleSelectPreset('supervisor@veridairy.com', 'super123')}
              className="p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl text-left transition group"
            >
              <div className="flex items-center space-x-1.5 mb-1">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                <span className="text-xs font-bold text-blue-900">Supervisor</span>
              </div>
              <p className="text-[11px] text-blue-700 truncate">Marcus Thorne</p>
              <p className="text-[10px] text-blue-600/80 font-mono mt-0.5">super123</p>
            </button>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-4 w-full text-center text-xs text-slate-400 hover:text-slate-600 py-1"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

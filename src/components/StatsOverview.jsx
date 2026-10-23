import React from 'react';
import { Layers, QrCode, AlertTriangle, Users, HeartHandshake, Sparkles, CheckCircle2 } from 'lucide-react';

export function StatsOverview({ stats, onNewBatchClick }) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Total Batches Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Batches</span>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.totalBatches}</span>
          <span className="text-xs font-semibold text-emerald-600 flex items-center">
            <Sparkles className="w-3 h-3 mr-0.5" /> 100% Traceable
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Recorded with cow IDs & artisan attribution</p>
      </div>

      {/* Verification Tokens Generated */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Issued QR Tokens</span>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <QrCode className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.totalTokens}</span>
          <span className="text-xs font-medium text-slate-500">
            ({stats.verifiedTokens} Scanned)
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Unique cryptographic batch serials</p>
      </div>

      {/* Expiry Alert */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Expiring in 30 Days</span>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            stats.expiringSoon > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'
          }`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className={`text-3xl font-extrabold tracking-tight ${
            stats.expiringSoon > 0 ? 'text-amber-600' : 'text-slate-900'
          }`}>{stats.expiringSoon}</span>
          <span className="text-xs font-medium text-slate-500">Batches flagged</span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Automated shelf life monitoring</p>
      </div>

      {/* Active Artisans */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Artisans</span>
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>
        <div className="mt-3 flex items-baseline space-x-2">
          <span className="text-3xl font-extrabold text-slate-900 tracking-tight">{stats.activeArtisans}</span>
          <span className="text-xs font-semibold text-purple-600 flex items-center">
            <CheckCircle2 className="w-3 h-3 mr-0.5" /> Certified
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">Master Vedic & cheese craftsmen</p>
      </div>
    </div>
  );
}

import React from 'react';
import { Milk, QrCode, FileText, Download, Printer, Calendar, Users, Eye, Edit3, ShieldAlert, Sparkles } from 'lucide-react';

export function BatchCard({
  batch,
  onViewDetails,
  onEditBatch,
  onOpenGenerateTokens,
  onOpenPrintLabels,
  onDownloadCsv,
  onDownloadZip,
  isManager
}) {
  // Check if expiring soon (less than 30 days) or expired
  const now = new Date();
  const exp = new Date(batch.expiryDate);
  const diffDays = Math.ceil((exp - now) / (1000 * 60 * 60 * 24));
  const isExpiringSoon = diffDays > 0 && diffDays <= 30;
  const isExpired = diffDays <= 0;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Quality Approved':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Tokens Generated':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'In Production':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Dispatched':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-lg hover:border-slate-300 transition-all duration-200 flex flex-col justify-between overflow-hidden group">
      
      {/* Top Banner / Badge Area */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 font-mono">
              {batch.batchNumber}
            </span>
            <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${getStatusBadge(batch.status)}`}>
              {batch.status}
            </span>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => onEditBatch(batch)}
              className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
              title="Edit Batch"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Product Title */}
        <h3
          onClick={() => onViewDetails(batch.id)}
          className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition cursor-pointer leading-snug line-clamp-1"
          title={batch.productName}
        >
          {batch.productName}
        </h3>
        
        <p className="text-xs text-slate-500 mt-0.5">
          Type: <span className="font-semibold text-slate-700">{batch.productType}</span> • {batch.unit || `${batch.quantity} units`}
        </p>

        {/* Artisan Info */}
        <div className="mt-3.5 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-[10px] shrink-0">
              {batch.artisanName[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-800 truncate">{batch.artisanName}</p>
              <p className="text-[10px] text-slate-400 truncate">{batch.artisanFacility}</p>
            </div>
          </div>
        </div>

        {/* Source Cows Tags */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1">
            <span>Source Cows ({batch.sourceCowIds.length})</span>
            <span className="text-[10px] text-emerald-700 font-semibold">100% Gir / Sahiwal</span>
          </div>
          <div className="flex flex-wrap gap-1">
            {batch.sourceCowIds.slice(0, 4).map((cid) => (
              <span
                key={cid}
                className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-100"
              >
                {cid}
              </span>
            ))}
            {batch.sourceCowIds.length > 4 && (
              <span className="text-[10px] font-mono font-medium px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600">
                +{batch.sourceCowIds.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Manufacturing & Expiry Timeline */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
          <div>
            <span className="text-slate-400 block text-[10px]">Mfg Date</span>
            <span className="font-mono font-semibold text-slate-700">{batch.manufacturingDate}</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">Expiry Date</span>
            <span className={`font-mono font-bold ${
              isExpired ? 'text-rose-600' : isExpiringSoon ? 'text-amber-600' : 'text-slate-700'
            }`}>
              {batch.expiryDate}
            </span>
          </div>
        </div>

        {/* Expiry Alert Warning if within 30 days */}
        {isExpiringSoon && (
          <div className="mt-2 p-1.5 bg-amber-50 rounded-lg text-[10px] font-semibold text-amber-800 flex items-center space-x-1">
            <ShieldAlert className="w-3 h-3 text-amber-600 shrink-0" />
            <span>Expiring in {diffDays} days!</span>
          </div>
        )}
      </div>

      {/* Footer & Actions */}
      <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex items-center justify-between">
        <div className="flex items-center space-x-1.5">
          <QrCode className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-mono font-bold text-slate-900">
            {batch.tokenCount || 0}
          </span>
          <span className="text-[10px] text-slate-400">tokens</span>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => onOpenGenerateTokens(batch)}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition shadow-2xs flex items-center space-x-1"
            title="Generate Verification Tokens"
          >
            <QrCode className="w-3 h-3" />
            <span>Mint</span>
          </button>

          <button
            onClick={() => onDownloadCsv(batch)}
            className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition"
            title="Download CSV for printing"
          >
            <FileText className="w-3.5 h-3.5 text-emerald-600" />
          </button>

          <button
            onClick={() => onDownloadZip(batch)}
            className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition"
            title="Download QR Codes ZIP"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
          </button>

          <button
            onClick={() => onViewDetails(batch.id)}
            className="p-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition"
            title="View Full Batch Dossier"
          >
            <Eye className="w-3.5 h-3.5 text-slate-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

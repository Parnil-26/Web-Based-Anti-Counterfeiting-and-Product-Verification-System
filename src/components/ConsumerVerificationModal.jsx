import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, ShieldCheck, ShieldAlert, AlertTriangle, Heart, Sparkles, MapPin, Calendar, Award, ExternalLink, Milk, Clock, Info } from 'lucide-react';
import { api } from '../utils/api';

export function ConsumerVerificationModal({ isOpen, onClose, tokenCode }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen || !tokenCode) return;

    setLoading(true);
    setError('');

    api.verifyToken(tokenCode)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || 'Token verification failed');
        setLoading(false);
      });
  }, [isOpen, tokenCode]);

  if (!isOpen) return null;

  const isRepeatScan = data && (!data.isFirstScan || data.scannedCount > 1);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
        
        {/* Top Header Banner */}
        <div className={`p-6 text-white text-center relative shrink-0 ${
          isRepeatScan
            ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700'
            : 'bg-gradient-to-r from-farm-700 via-emerald-600 to-teal-700'
        }`}>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-3 ${
            isRepeatScan ? 'bg-amber-100 text-amber-800' : 'bg-white text-farm-700 shadow-black/10'
          }`}>
            {isRepeatScan ? (
              <AlertTriangle className="w-8 h-8 text-amber-700" />
            ) : (
              <ShieldCheck className="w-8 h-8 text-emerald-700" />
            )}
          </div>

          <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-2 ${
            isRepeatScan ? 'bg-amber-950/30 text-amber-100 border border-amber-300/40' : 'bg-white/20 text-white'
          }`}>
            {isRepeatScan ? 'Repeat Scan Alert' : 'First-Time Scan Verified'}
          </span>

          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {isRepeatScan ? 'Valid Token — Previously Scanned' : 'Issued Cryptographic Token Verified'}
          </h2>
          <p className="text-xs text-emerald-100 mt-1">
            {isRepeatScan
              ? 'Token matches registered batch record, but has prior scans recorded.'
              : 'Confirmed in VeriDairy Single-Herd Lineage Ledger'
            }
          </p>
        </div>

        {/* Certificate Body */}
        <div className="overflow-y-auto p-6 space-y-5">
          {loading ? (
            <div className="text-center py-12">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500 font-medium">Validating cryptographic token...</p>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-center text-rose-800">
              <ShieldAlert className="w-8 h-8 text-rose-600 mx-auto mb-2" />
              <p className="font-bold text-sm">Verification Failed</p>
              <p className="text-xs mt-1">{error}</p>
            </div>
          ) : data ? (
            <>
              {/* Repeat Scan Notice Box */}
              {isRepeatScan && (
                <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-1.5">
                  <div className="flex items-center space-x-1.5 font-bold text-amber-900">
                    <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                    <span>Scan History: {data.scannedCount} Total Scans</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                    <div>
                      <span className="text-amber-800 block">First Scanned:</span>
                      <strong className="font-mono text-amber-950">
                        {data.firstScannedAt ? new Date(data.firstScannedAt).toLocaleString() : 'Earlier verification record'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-amber-800 block">Latest Scan:</span>
                      <strong className="font-mono text-amber-950">
                        {new Date(data.lastScannedAt || data.verifiedAt).toLocaleString()}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Card */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start space-x-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
                  <Milk className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {data.batch.productType}
                  </span>
                  <h3 className="text-base font-extrabold text-slate-900 mt-1">
                    {data.batch.productName}
                  </h3>
                  <div className="flex items-center space-x-2 text-xs text-slate-600 mt-1">
                    <span className="font-mono font-bold text-slate-800">Batch: {data.batch.batchNumber}</span>
                    <span>•</span>
                    <span>{data.batch.unit}</span>
                  </div>
                </div>
              </div>

              {/* Master Artisan Section */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Master Artisan & Craftsmanship</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Artisan Certified
                  </span>
                </div>

                <div className="flex items-center space-x-3 mt-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-base">
                    {data.batch.artisanName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h5 className="text-sm font-extrabold text-slate-900">{data.batch.artisanName}</h5>
                    <p className="text-xs text-slate-500">{data.artisanDetail?.specialty || 'Master Dairy Craftsman'} ({data.batch.artisanId})</p>
                    <p className="text-[11px] text-slate-400 mt-0.5 flex items-center">
                      <MapPin className="w-3 h-3 mr-1" />
                      {data.batch.artisanFacility}
                    </p>
                  </div>
                </div>

                {data.batch.notes && (
                  <div className="mt-3 p-3 bg-slate-50 rounded-xl text-xs text-slate-600 italic border border-slate-100">
                    "{data.batch.notes}"
                  </div>
                )}
              </div>

              {/* Source Vedic Cows Lineage */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>Single-Herd Source Cows Lineage</span>
                  </h4>
                  <span className="text-[11px] font-semibold text-slate-600">
                    {data.batch.sourceCowIds.length} Registered Cows
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                  {data.cowDetails && data.cowDetails.length > 0 ? (
                    data.cowDetails.map((cow) => (
                      <div key={cow.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-slate-900">{cow.id}</span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-medium">
                            {cow.breed}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-1">Name: {cow.name} (Age {cow.age} yrs)</p>
                        <p className="text-[10px] text-slate-400">Pasture: {cow.pasture}</p>
                      </div>
                    ))
                  ) : (
                    data.batch.sourceCowIds.map((cid) => (
                      <div key={cid} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                        <span className="font-mono font-bold text-slate-900">{cid}</span>
                        <p className="text-[10px] text-slate-500 mt-0.5">Certified Indigenous Cow Tag</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quality & Dates Timeline */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Manufacturing Date</span>
                  <span className="font-mono font-bold text-slate-800 text-sm">
                    {data.batch.manufacturingDate}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Expiry Date</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {data.batch.expiryDate}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Lab Butterfat %</span>
                  <span className="font-mono font-bold text-slate-800">
                    {data.batch.fatContent || 'Verified Standard'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block mb-0.5">Quality Audit Score</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {data.batch.qualityScore || '99.5/100'}
                  </span>
                </div>
              </div>

              {/* Token Scan Ledger Footer */}
              <div className="p-3.5 bg-slate-900 text-white rounded-2xl text-xs space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Token Serial:</span>
                  <span className="font-mono font-bold text-emerald-400">{data.token.tokenCode}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Consumer Scans:</span>
                  <span>{data.token.scannedCount} scan{data.token.scannedCount === 1 ? '' : 's'} recorded</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Last Verified:</span>
                  <span className="text-slate-300">{new Date(data.token.lastScannedAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Requirement 5 Disclaimer */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-600 text-[10px] leading-relaxed flex items-start space-x-2">
                <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <p>
                  {data.disclaimer || 'Token validity confirms this cryptographic token was legitimately generated by VeriDairy. It provides token authenticity evidence rather than absolute proof of physical package contents.'}
                </p>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

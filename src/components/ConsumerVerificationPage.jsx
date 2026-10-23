import React, { useEffect, useState } from 'react';
import {
  ShieldCheck, ShieldAlert, AlertTriangle, Milk, Sparkles, MapPin,
  Calendar, Heart, RefreshCw, ArrowLeft, Clock, CheckCircle2, Award, Info
} from 'lucide-react';
import { api } from '../utils/api';

export function ConsumerVerificationPage({ tokenCode, onGoToAdmin }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorType, setErrorType] = useState(null); // 'invalid' | 'server_error' | null
  const [errorMessage, setErrorMessage] = useState('');

  const verifyToken = () => {
    if (!tokenCode) return;
    setLoading(true);
    setErrorType(null);
    setErrorMessage('');

    api.verifyToken(tokenCode)
      .then((res) => {
        if (!res.valid) {
          setErrorType('invalid');
          setErrorMessage(res.message || 'Token not found in authenticity ledger');
        } else {
          setData(res);
        }
        setLoading(false);
      })
      .catch((err) => {
        // If HTTP 404, it is an invalid token
        if (err.message && (err.message.includes('404') || err.message.toLowerCase().includes('not found') || err.message.toLowerCase().includes('invalid'))) {
          setErrorType('invalid');
          setErrorMessage(err.message);
        } else {
          setErrorType('server_error');
          setErrorMessage(err.message || 'Unable to connect to verification server');
        }
        setLoading(false);
      });
  };

  useEffect(() => {
    verifyToken();
  }, [tokenCode]);

  const isRepeatScan = data && (!data.isFirstScan || data.scannedCount > 1);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-slate-50 to-slate-100 flex flex-col justify-between text-slate-800">
      
      {/* Top Brand Bar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900">VeriDairy</span>
              <span className="ml-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                Provenance OS
              </span>
            </div>
          </div>

          {onGoToAdmin && (
            <button
              onClick={onGoToAdmin}
              className="text-xs font-semibold text-slate-500 hover:text-slate-900 flex items-center space-x-1 py-1 px-2.5 rounded-lg hover:bg-slate-100 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Admin Portal</span>
            </button>
          )}
        </div>
      </header>

      {/* Main Verification Container */}
      <main className="max-w-2xl mx-auto px-4 py-6 w-full flex-1">
        
        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-3xl p-8 sm:p-12 shadow-xl border border-slate-200/80 text-center animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4">
              <RefreshCw className="w-8 h-8 animate-spin text-emerald-600" />
            </div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Validating Cryptographic Token</h2>
            <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto font-mono">
              Querying immutable provenance ledger for token code:
            </p>
            <p className="text-xs font-mono font-bold text-emerald-700 mt-1 bg-emerald-50 py-1 px-3 rounded-full inline-block">
              {tokenCode}
            </p>
          </div>
        )}

        {/* Server Error State */}
        {!loading && errorType === 'server_error' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-rose-200 text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-rose-100 text-rose-800 px-3 py-1 rounded-full inline-block mb-2">
              Connection Notice
            </span>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Service Temporarily Unavailable</h2>
            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
              We were unable to reach the VeriDairy verification backend. Please check your internet connection and retry.
            </p>
            <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-500 font-mono">
              {errorMessage}
            </div>
            <button
              onClick={verifyToken}
              className="mt-6 inline-flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition shadow-md"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry Verification</span>
            </button>
          </div>
        )}

        {/* Invalid Token State */}
        {!loading && errorType === 'invalid' && (
          <div className="bg-white rounded-3xl p-6 sm:p-10 shadow-xl border border-rose-200 text-center animate-in fade-in zoom-in-95">
            <div className="w-16 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-rose-600/20">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest bg-rose-100 text-rose-900 px-3 py-1 rounded-full inline-block mb-2">
              Unverified Label
            </span>
            <h2 className="text-2xl font-black text-rose-950 tracking-tight">Token Not Found in Ledger</h2>
            <p className="text-sm text-slate-600 mt-2 max-w-md mx-auto">
              This token was not issued by our certified traceability platform, or the QR code has been altered or damaged.
            </p>

            <div className="mt-5 p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Scanned Token Code:</span>
                <span className="font-mono font-bold text-slate-900">{tokenCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="font-mono text-slate-700">{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Verification Outcome:</span>
                <span className="font-bold text-rose-700">TOKEN_NOT_FOUND</span>
              </div>
            </div>

            {/* Evidentiary Notice */}
            <div className="mt-6 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-left text-xs text-amber-900 flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Counterfeit Precaution:</strong>
                <p className="mt-0.5 text-[11px] leading-relaxed text-amber-800">
                  Genuine VeriDairy products always carry unique cryptographic serials registered in our database. If this product was purchased as authentic, please report the retailer and batch information to VeriDairy quality assurance.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Valid Token: First Scan vs Repeat Scan */}
        {!loading && data && data.valid && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Header Banner - Differentiated by First Scan vs Repeat Scan */}
            <div className={`p-6 sm:p-7 text-white text-center relative ${
              isRepeatScan
                ? 'bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700'
                : 'bg-gradient-to-r from-farm-700 via-emerald-600 to-teal-700'
            }`}>
              <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center shadow-lg mb-3 ${
                isRepeatScan ? 'bg-amber-100 text-amber-800 shadow-amber-900/20' : 'bg-white text-farm-700 shadow-black/10'
              }`}>
                {isRepeatScan ? (
                  <AlertTriangle className="w-8 h-8 text-amber-700" />
                ) : (
                  <ShieldCheck className="w-8 h-8 text-emerald-700" />
                )}
              </div>

              {/* Status Badge */}
              <span className={`text-[10px] font-extrabold uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-2 ${
                isRepeatScan ? 'bg-amber-950/30 text-amber-100 border border-amber-300/40' : 'bg-white/20 text-white'
              }`}>
                {isRepeatScan ? 'Repeat Scan Alert' : 'First-Time Scan Verified'}
              </span>

              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                {isRepeatScan ? 'Valid Token — Previously Scanned' : 'Issued Cryptographic Token Verified'}
              </h1>
              
              <p className="text-xs text-emerald-100 mt-1 max-w-md mx-auto">
                {isRepeatScan
                  ? 'This token code matches a genuine production batch, but has already been scanned previously.'
                  : 'Genuine batch token confirmed in VeriDairy single-herd lineage registry.'
                }
              </p>
            </div>

            {/* Repeat Scan Warning Box */}
            {isRepeatScan && (
              <div className="mx-5 sm:mx-7 mt-5 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-950 space-y-2">
                <div className="flex items-center space-x-2 font-bold text-amber-900">
                  <Clock className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>Scan History Audit: {data.scannedCount} Total Scans</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-amber-200/60">
                  <div>
                    <span className="text-amber-800 font-semibold block">Original First Scan:</span>
                    <span className="font-mono font-bold text-amber-950">
                      {data.firstScannedAt ? new Date(data.firstScannedAt).toLocaleString() : 'Earlier verification record'}
                    </span>
                  </div>
                  <div>
                    <span className="text-amber-800 font-semibold block">Most Recent Scan:</span>
                    <span className="font-mono font-bold text-amber-950">
                      {new Date(data.lastScannedAt || data.verifiedAt).toLocaleString()}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-amber-800 pt-1 leading-relaxed">
                  <strong>Notice for Consumers:</strong> If you are scanning an unopened product for the first time, a prior scan timestamp may indicate an unauthorized label reproduction or resealed container.
                </p>
              </div>
            )}

            {/* Certificate Details */}
            <div className="p-5 sm:p-7 space-y-6">
              
              {/* Product Header Card */}
              <div className="p-4 bg-emerald-50/70 border border-emerald-200/80 rounded-2xl flex items-start space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Milk className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-900 bg-white px-2 py-0.5 rounded border border-emerald-200">
                    {data.batch.productType}
                  </span>
                  <h2 className="text-lg font-black text-slate-900 mt-1 truncate">
                    {data.batch.productName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600 mt-1 font-mono">
                    <span className="font-bold text-slate-800">Batch: {data.batch.batchNumber}</span>
                    <span>•</span>
                    <span>{data.batch.unit}</span>
                  </div>
                </div>
              </div>

              {/* Master Artisan Section */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Master Artisan & Provenance</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                    Artisan Certified
                  </span>
                </div>

                <div className="flex items-center space-x-3 mt-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold text-base">
                    {data.batch.artisanName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-sm font-extrabold text-slate-900">{data.batch.artisanName}</h4>
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

              {/* Single-Herd Vedic Cow Lineage */}
              <div className="border border-slate-200 rounded-2xl p-4 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1.5">
                    <Heart className="w-3.5 h-3.5 text-rose-500" />
                    <span>Single-Herd Source Lineage</span>
                  </h3>
                  <span className="text-[11px] font-semibold text-slate-600">
                    {data.batch.sourceCowIds.length} Verified Cows
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Mfg Date</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {data.batch.manufacturingDate}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Expiry Date</span>
                  <span className="font-mono font-bold text-emerald-700 text-xs">
                    {data.batch.expiryDate}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">Butterfat %</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">
                    {data.batch.fatContent || 'Standard'}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px] uppercase font-bold mb-0.5">QA Score</span>
                  <span className="font-mono font-bold text-emerald-700 text-xs">
                    {data.batch.qualityScore || '99.5/100'}
                  </span>
                </div>
              </div>

              {/* Cryptographic Ledger Proof */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs space-y-1.5 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Cryptographic Serial:</span>
                  <span className="font-mono font-bold text-emerald-400 text-xs">{data.token.tokenCode}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Scanned Count:</span>
                  <span className="font-bold">{data.token.scannedCount} scan{data.token.scannedCount === 1 ? '' : 's'}</span>
                </div>
                {data.token.tokenHash && (
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">SHA-256 Digest:</span>
                    <span className="font-mono text-slate-300 truncate max-w-[200px]" title={data.token.tokenHash}>
                      {data.token.tokenHash.slice(0, 16)}...
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400">Verified Timestamp:</span>
                  <span className="text-slate-300">{new Date(data.token.lastScannedAt).toLocaleString()}</span>
                </div>
              </div>

              {/* Requirement 5: Clear Evidentiary Disclaimer (No unconditional 100% genuine claims) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-600 text-[11px] leading-relaxed">
                <div className="flex items-start space-x-2">
                  <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-800 font-bold block mb-0.5">Token Evidence Disclaimer:</strong>
                    <p>
                      {data.disclaimer || 'Successful verification proves this cryptographic token was legitimately generated by VeriDairy and recorded in the database. Token validity provides cryptographic evidence about the token itself, but does not independently test or inspect the physical package contents.'}
                    </p>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-400">
        <div className="max-w-2xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-1 text-[11px]">
          <p>© 2026 VeriDairy Provenance OS — Consumer Verification Portal</p>
          <span>Single-Herd Vedic Lineage Attributed</span>
        </div>
      </footer>

    </div>
  );
}

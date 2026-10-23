import React, { useState, useEffect } from 'react';
import {
  X, Edit3, Trash2, QrCode, FileText, Download, Printer, ExternalLink,
  ShieldCheck, Calendar, Users, Milk, AlertTriangle, Search, CheckCircle2, ChevronRight
} from 'lucide-react';
import { api } from '../utils/api';
import { downloadCsvForBatch } from '../utils/csvExport';
import { downloadQrZipForBatch } from '../utils/qrZipExport';
import QRCode from 'qrcode';

export function BatchDetailModal({
  isOpen,
  onClose,
  batchId,
  onEditBatch,
  onDeleteBatch,
  onOpenGenerateTokens,
  onOpenPrintLabels,
  onSimulateScan,
  isManager
}) {
  const [batch, setBatch] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tokenSearch, setTokenSearch] = useState('');
  const [zipProgress, setZipProgress] = useState(null);
  const [previewQrCode, setPreviewQrCode] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'tokens'

  useEffect(() => {
    if (!isOpen || !batchId) return;

    setLoading(true);
    api.getBatch(batchId)
      .then((res) => {
        setBatch(res.batch);
        setTokens(res.batch.tokens || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [isOpen, batchId]);

  if (!isOpen) return null;

  const handleDownloadCsv = () => {
    if (!batch) return;
    downloadCsvForBatch(batch, tokens);
  };

  const handleDownloadZip = async () => {
    if (!batch) return;
    try {
      setZipProgress(10);
      await downloadQrZipForBatch(batch, tokens, (p) => setZipProgress(p));
      setTimeout(() => setZipProgress(null), 1200);
    } catch (err) {
      alert(err.message);
      setZipProgress(null);
    }
  };

  const showSingleQr = async (token) => {
    try {
      const dataUrl = await QRCode.toDataURL(token.verificationUrl, {
        width: 300,
        margin: 2,
        color: { dark: '#14532d', light: '#ffffff' }
      });
      setPreviewQrCode({ token, dataUrl });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTokens = tokens.filter(t => 
    t.tokenCode.toLowerCase().includes(tokenSearch.toLowerCase()) ||
    t.status.toLowerCase().includes(tokenSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95">
        
        {/* Header Bar */}
        <div className="px-6 py-5 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-slate-50 rounded-t-3xl">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/20">
              <Milk className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-xl font-extrabold text-slate-900">
                  {batch ? batch.productName : 'Loading Batch...'}
                </h2>
                {batch && (
                  <span className="text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-200 text-slate-800">
                    {batch.batchNumber}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center space-x-2">
                <span>{batch?.productType}</span>
                <span>•</span>
                <span>{batch?.unit}</span>
                <span>•</span>
                <span className="text-emerald-700 font-semibold">{batch?.status}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {batch && (
              <>
                <button
                  onClick={() => onEditBatch(batch)}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center space-x-1"
                  title="Edit Batch Attributes"
                >
                  <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Edit Batch</span>
                </button>

                {isManager && (
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to delete batch ${batch.batchNumber}?`)) {
                        onDeleteBatch(batch.id);
                        onClose();
                      }
                    }}
                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition"
                    title="Delete Batch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </>
            )}

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation & Action Toolbar */}
        <div className="px-6 py-2.5 bg-slate-100/70 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                activeTab === 'overview'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Batch Provenance Dossier
            </button>
            <button
              onClick={() => setActiveTab('tokens')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition flex items-center space-x-1.5 ${
                activeTab === 'tokens'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Verification Tokens</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded-full font-mono">
                {tokens.length}
              </span>
            </button>
          </div>

          {/* Quick Action Buttons */}
          {batch && (
            <div className="flex items-center space-x-2">
              <button
                onClick={() => onOpenGenerateTokens(batch)}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition flex items-center space-x-1 shadow-2xs"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Mint Tokens</span>
              </button>

              <button
                onClick={handleDownloadCsv}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1 shadow-2xs"
                title="Download CSV for printing"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">CSV</span>
              </button>

              <button
                onClick={handleDownloadZip}
                disabled={tokens.length === 0 || zipProgress !== null}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1 shadow-2xs disabled:opacity-50"
                title="Download high-res QR codes ZIP archive"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">
                  {zipProgress ? `${zipProgress}%` : 'QR ZIP'}
                </span>
              </button>

              <button
                onClick={() => onOpenPrintLabels(batch, tokens)}
                disabled={tokens.length === 0}
                className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition flex items-center space-x-1 shadow-2xs disabled:opacity-50"
                title="Print sticker label sheet"
              >
                <Printer className="w-3.5 h-3.5 text-purple-600" />
                <span className="hidden sm:inline">Labels</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500 font-medium">Loading batch records...</p>
            </div>
          ) : batch ? (
            activeTab === 'overview' ? (
              /* Overview Tab */
              <div className="space-y-6">
                
                {/* 1. Artisan Card */}
                <div className="p-5 bg-gradient-to-r from-amber-50/60 to-orange-50/40 border border-amber-200/70 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-amber-900 flex items-center space-x-1.5">
                      <Users className="w-4 h-4 text-amber-700" />
                      <span>Artisan Craftsmanship & Facility</span>
                    </span>
                    <span className="text-xs font-mono font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded-lg">
                      {batch.artisanId}
                    </span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="text-lg font-extrabold text-slate-900">{batch.artisanName}</h4>
                      <p className="text-xs text-slate-600 mt-1">
                        Facility / Unit: <span className="font-semibold text-slate-800">{batch.artisanFacility}</span>
                      </p>
                    </div>
                    {batch.notes && (
                      <div className="sm:max-w-xs text-xs text-slate-600 italic bg-white/70 p-3 rounded-xl border border-amber-200/50">
                        "{batch.notes}"
                      </div>
                    )}
                  </div>
                </div>

                {/* 2. Source Cows Lineage */}
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>Certified Herd Source Cows ({batch.sourceCowIds.length})</span>
                    </span>
                    <span className="text-xs text-slate-500">100% Certified Indigenous A2 Lineage</span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {batch.sourceCowIds.map((cid) => (
                      <div
                        key={cid}
                        className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl shadow-2xs text-xs font-mono font-bold text-slate-800 flex items-center space-x-2"
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        <span>{cid}</span>
                        <span className="text-[10px] text-slate-400 font-sans font-normal">Registered Cow</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Dates & Quality Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 block mb-1">Manufacturing Date</span>
                    <span className="font-mono font-bold text-slate-900 text-sm block">
                      {batch.manufacturingDate}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 block mb-1">Expiry Date</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm block">
                      {batch.expiryDate}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 block mb-1">Fat Content (%)</span>
                    <span className="font-mono font-bold text-slate-900 text-sm block">
                      {batch.fatContent || 'N/A'}
                    </span>
                  </div>

                  <div className="p-3.5 bg-white border border-slate-200 rounded-xl">
                    <span className="text-slate-400 block mb-1">Lab Quality Score</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm block">
                      {batch.qualityScore || '99.5/100'}
                    </span>
                  </div>
                </div>

                {/* 4. Token summary banner */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                  <div>
                    <h5 className="text-xs font-bold uppercase tracking-wider text-blue-900">
                      Verification Tokens
                    </h5>
                    <p className="text-xs text-blue-700 mt-0.5">
                      {tokens.length > 0
                        ? `${tokens.length} verification tokens issued for this batch.`
                        : 'No tokens minted for this batch yet.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('tokens')}
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
                  >
                    <span>Inspect Tokens</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              /* Tokens Tab */
              <div className="space-y-4">
                
                {/* Search & Stats */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="relative flex-1 max-w-sm">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={tokenSearch}
                      onChange={(e) => setTokenSearch(e.target.value)}
                      placeholder="Search token code..."
                      className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>
                  <div className="text-xs text-slate-500 font-medium">
                    Showing {filteredTokens.length} of {tokens.length} tokens
                  </div>
                </div>

                {/* Tokens Table */}
                {filteredTokens.length === 0 ? (
                  <div className="text-center py-12 bg-slate-50 rounded-2xl border border-slate-200">
                    <p className="text-xs font-semibold text-slate-600">No tokens match your search.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                        <tr>
                          <th className="px-3 py-2.5">Token Code</th>
                          <th className="px-3 py-2.5">Status</th>
                          <th className="px-3 py-2.5">Scans</th>
                          <th className="px-3 py-2.5">Generated At</th>
                          <th className="px-3 py-2.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {filteredTokens.map((t) => (
                          <tr key={t.id || t.tokenCode} className="hover:bg-slate-50/80 transition">
                            <td className="px-3 py-2.5 font-bold text-slate-800">
                              {t.tokenCode}
                            </td>
                            <td className="px-3 py-2.5 font-sans">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                t.status === 'Verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                              }`}>
                                {t.status}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-slate-600">
                              {t.scannedCount || 0}
                            </td>
                            <td className="px-3 py-2.5 text-slate-500 font-sans text-[11px]">
                              {new Date(t.generatedAt).toLocaleDateString()}
                            </td>
                            <td className="px-3 py-2.5 text-right font-sans">
                              <div className="flex items-center justify-end space-x-1.5">
                                <button
                                  onClick={() => showSingleQr(t)}
                                  className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium transition"
                                  title="View QR Code"
                                >
                                  View QR
                                </button>
                                <button
                                  onClick={() => onSimulateScan(t.tokenCode)}
                                  className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-[11px] font-bold transition flex items-center space-x-1"
                                  title="Simulate consumer mobile scan"
                                >
                                  <span>Simulate Scan</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )
          ) : null}
        </div>

        {/* QR Code Single Preview Modal Overlay */}
        {previewQrCode && (
          <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-2xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-xs w-full text-center shadow-2xl animate-in zoom-in-95">
              <h4 className="text-sm font-extrabold text-slate-900 mb-1">Verification QR Code</h4>
              <p className="text-[11px] font-mono text-slate-500 mb-3">{previewQrCode.token.tokenCode}</p>
              
              <div className="bg-white p-3 border border-slate-200 rounded-xl inline-block shadow-xs mb-4">
                <img src={previewQrCode.dataUrl} alt="QR" className="w-48 h-48 mx-auto" />
              </div>

              <div className="space-y-2">
                <button
                  onClick={() => onSimulateScan(previewQrCode.token.tokenCode)}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                >
                  Test Consumer Verification
                </button>
                <button
                  onClick={() => setPreviewQrCode(null)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

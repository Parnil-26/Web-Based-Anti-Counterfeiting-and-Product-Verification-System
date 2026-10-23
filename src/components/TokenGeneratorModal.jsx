import React, { useState } from 'react';
import { QrCode, FileText, Download, Printer, Sparkles, CheckCircle2, ShieldCheck, X, AlertCircle } from 'lucide-react';
import { downloadCsvForBatch } from '../utils/csvExport';
import { downloadQrZipForBatch } from '../utils/qrZipExport';

export function TokenGeneratorModal({
  isOpen,
  onClose,
  batch,
  onTokensGenerated,
  onOpenPrintLabels
}) {
  const [tokenCount, setTokenCount] = useState(25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedResult, setGeneratedResult] = useState(null);
  const [zipProgress, setZipProgress] = useState(null);

  if (!isOpen || !batch) return null;

  const handleGenerate = async () => {
    setError('');
    const count = parseInt(tokenCount, 10);
    if (!count || count < 1 || count > 1000) {
      setError('Please specify a token quantity between 1 and 1,000.');
      return;
    }

    setLoading(true);
    try {
      const res = await onTokensGenerated(batch.id, count);
      setGeneratedResult(res);
    } catch (err) {
      setError(err.message || 'Failed to generate tokens');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCsv = () => {
    const tokens = generatedResult?.tokens || batch.tokens || [];
    downloadCsvForBatch(batch, tokens);
  };

  const handleDownloadZip = async () => {
    const tokens = generatedResult?.tokens || batch.tokens || [];
    try {
      setZipProgress(10);
      await downloadQrZipForBatch(batch, tokens, (p) => setZipProgress(p));
      setTimeout(() => setZipProgress(null), 1200);
    } catch (err) {
      setError(err.message);
      setZipProgress(null);
    }
  };

  const resetState = () => {
    setGeneratedResult(null);
    setError('');
    setZipProgress(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900">Generate Verification Tokens</h3>
              <p className="text-xs text-slate-500 font-mono">{batch.batchNumber}</p>
            </div>
          </div>
          <button
            onClick={resetState}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {!generatedResult ? (
          <div className="mt-5 space-y-5">
            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Batch summary card */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Product:</span>
                <span className="font-semibold text-slate-800">{batch.productName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Artisan:</span>
                <span className="font-semibold text-slate-800">{batch.artisanName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Currently Issued:</span>
                <span className="font-mono font-bold text-emerald-700">{batch.tokenCount || 0} tokens</span>
              </div>
            </div>

            {/* Token Count Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Specify Token Count to Generate
              </label>

              {/* Quick count chips */}
              <div className="flex items-center gap-2 mb-3">
                {[10, 25, 50, 100, 250].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTokenCount(num)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                      tokenCount === num
                        ? 'bg-blue-600 text-white border-blue-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    +{num}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={tokenCount}
                  onChange={(e) => setTokenCount(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="Enter custom count (e.g. 75)"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-medium">
                  unique QR codes
                </span>
              </div>

              <p className="text-[11px] text-slate-400 mt-2 flex items-center">
                <ShieldCheck className="w-3.5 h-3.5 mr-1 text-emerald-600 shrink-0" />
                Each token is cryptographically seeded and maps to a tamper-proof verification URL.
              </p>
            </div>

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-3">
              <button
                type="button"
                onClick={resetState}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-600/25 transition disabled:opacity-50 flex items-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>{loading ? 'Minting Tokens...' : `Mint ${tokenCount} Unique Tokens`}</span>
              </button>
            </div>
          </div>
        ) : (
          /* Result & Download Options */
          <div className="mt-5 space-y-5 animate-in fade-in">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500 text-white mx-auto flex items-center justify-center mb-2 shadow-md shadow-emerald-500/20">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h4 className="text-base font-extrabold text-emerald-950">Tokens Minted Successfully!</h4>
              <p className="text-xs text-emerald-800 mt-0.5">
                Generated <span className="font-bold">{generatedResult.count}</span> high-entropy verification tokens for batch{' '}
                <span className="font-mono font-bold">{batch.batchNumber}</span>.
              </p>
            </div>

            {/* Direct Download Options */}
            <div className="space-y-2.5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Download & Print Options
              </p>

              {/* Download CSV */}
              <button
                onClick={handleDownloadCsv}
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">
                      Download CSV File
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Formatted for industrial Zebra / Sato label printers & spreadsheet audits
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
              </button>

              {/* Download QR ZIP */}
              <button
                onClick={handleDownloadZip}
                disabled={zipProgress !== null}
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition flex items-center justify-between group disabled:opacity-60"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-blue-700 transition">
                      {zipProgress !== null ? `Packaging ZIP (${zipProgress}%)...` : 'Download QR Codes (ZIP Archive)'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      High-resolution 600 DPI PNG images bundled with print manifest
                    </p>
                  </div>
                </div>
                <Download className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
              </button>

              {/* Print Labels Sheet */}
              <button
                onClick={() => {
                  onClose();
                  onOpenPrintLabels(batch, generatedResult.tokens);
                }}
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition flex items-center justify-between group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Printer className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 group-hover:text-purple-700 transition">
                      Open Printable Sticker Sheet
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Ready-to-print grid layout with QR codes, batch number & artisan credit
                    </p>
                  </div>
                </div>
                <Printer className="w-4 h-4 text-slate-400 group-hover:text-slate-700 transition" />
              </button>
            </div>

            <button
              onClick={resetState}
              className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
            >
              Done & Return to Batches
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

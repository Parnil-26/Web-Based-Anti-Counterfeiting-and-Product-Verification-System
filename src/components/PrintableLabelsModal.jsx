import React, { useEffect, useState } from 'react';
import { X, Printer, Download, Sparkles, ShieldCheck, Check } from 'lucide-react';
import QRCode from 'qrcode';

export function PrintableLabelsModal({ isOpen, onClose, batch, tokens = [] }) {
  const [qrMap, setQrMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [labelsPerPage, setLabelsPerPage] = useState(24); // standard 3x8 grid

  useEffect(() => {
    if (!isOpen || !tokens || tokens.length === 0) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let isCancelled = false;

    async function generateQrs() {
      const map = {};
      // Take up to 48 tokens for preview/print
      const subset = tokens.slice(0, 48);
      for (const t of subset) {
        try {
          const url = await QRCode.toDataURL(t.verificationUrl, {
            margin: 1,
            width: 180,
            errorCorrectionLevel: 'M',
            color: {
              dark: '#0f172a',
              light: '#ffffff'
            }
          });
          map[t.tokenCode] = url;
        } catch (err) {
          console.error(err);
        }
      }
      if (!isCancelled) {
        setQrMap(map);
        setLoading(false);
      }
    }

    generateQrs();

    return () => {
      isCancelled = true;
    };
  }, [isOpen, tokens]);

  if (!isOpen || !batch) return null;

  const handlePrint = () => {
    window.print();
  };

  const displayTokens = tokens.slice(0, labelsPerPage);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[95vh] flex flex-col shadow-2xl border border-slate-100 print:shadow-none print:border-none print:max-w-none print:max-h-none print:w-full">
        
        {/* Modal Controls - Hidden when printing */}
        <div className="no-print px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-slate-50 rounded-t-2xl">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
              <Printer className="w-5 h-5 text-purple-600" />
              <span>Printable Adhesive Label Sheet Preview</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              High-resolution print layout for batch <span className="font-mono font-bold">{batch.batchNumber}</span>.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Labels Now</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Content Area */}
        <div className="overflow-y-auto p-6 bg-slate-100/60 print:bg-white print:p-0">
          {loading ? (
            <div className="text-center py-16">
              <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-xs text-slate-500 font-medium">Rendering print-grade QR vector labels...</p>
            </div>
          ) : displayTokens.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <p className="text-sm font-semibold text-slate-700">No tokens found for printing.</p>
              <p className="text-xs text-slate-400 mt-1">Generate tokens for this batch first.</p>
            </div>
          ) : (
            <div className="printable-sheet bg-white p-6 rounded-xl shadow-xs border border-slate-200 print:border-none print:shadow-none print:p-0 max-w-4xl mx-auto">
              
              {/* Printable Grid of Labels */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 print:grid-cols-3 print:gap-3">
                {displayTokens.map((t) => (
                  <div
                    key={t.id || t.tokenCode}
                    className="label-card border border-slate-300 rounded-lg p-2.5 flex items-center space-x-2.5 bg-white shadow-2xs print:border-slate-800"
                  >
                    {/* QR Code */}
                    <div className="shrink-0 w-16 h-16 bg-white p-0.5 border border-slate-200 rounded">
                      {qrMap[t.tokenCode] ? (
                        <img
                          src={qrMap[t.tokenCode]}
                          alt="QR"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 animate-pulse" />
                      )}
                    </div>

                    {/* Label Details */}
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center space-x-1">
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-1 py-0.2 rounded border border-emerald-200">
                          {batch.productType}
                        </span>
                        <span className="text-[8px] font-mono text-slate-500 truncate">
                          {batch.batchNumber}
                        </span>
                      </div>

                      <p className="text-[10px] font-extrabold text-slate-900 truncate leading-tight mt-0.5" title={batch.productName}>
                        {batch.productName}
                      </p>

                      <p className="text-[8px] text-slate-600 truncate mt-0.5">
                        Artisan: <span className="font-medium text-slate-800">{batch.artisanName}</span>
                      </p>

                      <div className="flex items-center justify-between text-[7px] text-slate-500 mt-0.5 font-mono">
                        <span>M: {batch.manufacturingDate}</span>
                        <span>E: {batch.expiryDate}</span>
                      </div>

                      <div className="mt-1 pt-0.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[7px] font-mono text-slate-700 font-bold truncate max-w-[110px]">
                          {t.tokenCode}
                        </span>
                        <span className="text-[6.5px] uppercase font-bold text-emerald-700">VERIFIED</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Sheet Footer Info */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 no-print">
                <span>Displaying {displayTokens.length} printable labels ({tokens.length} total generated)</span>
                <span>Standard Avery Sheet Template (3 x 8 / 2.62" x 1")</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

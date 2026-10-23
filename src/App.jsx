import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { StatsOverview } from './components/StatsOverview';
import { BatchList } from './components/BatchList';
import { BatchFormModal } from './components/BatchFormModal';
import { BatchDetailModal } from './components/BatchDetailModal';
import { TokenGeneratorModal } from './components/TokenGeneratorModal';
import { PrintableLabelsModal } from './components/PrintableLabelsModal';
import { ConsumerVerificationModal } from './components/ConsumerVerificationModal';
import { ConsumerVerificationPage } from './components/ConsumerVerificationPage';
import { AuditLogsModal } from './components/AuditLogsModal';
import { LoginModal } from './components/LoginModal';
import { Toast } from './components/Toast';
import { api } from './utils/api';
import { downloadCsvForBatch } from './utils/csvExport';
import { downloadQrZipForBatch } from './utils/qrZipExport';

export function App() {
  const { currentUser, isManager, isSupervisor, isAuthenticated } = useAuth();

  // URL-driven Consumer Verification Route (/v/:tokenCode or /verify/:tokenCode)
  const [consumerPageToken, setConsumerPageToken] = useState(() => {
    if (typeof window === 'undefined') return null;
    const path = window.location.pathname;
    const match = path.match(/^\/(?:v|verify)\/([A-Za-z0-9_-]+)/);
    return match ? match[1] : null;
  });

  useEffect(() => {
    const onPopState = () => {
      const match = window.location.pathname.match(/^\/(?:v|verify)\/([A-Za-z0-9_-]+)/);
      setConsumerPageToken(match ? match[1] : null);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Data states
  const [batches, setBatches] = useState([]);
  const [stats, setStats] = useState(null);
  const [registeredCows, setRegisteredCows] = useState([]);
  const [registeredArtisans, setRegisteredArtisans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isBatchFormOpen, setIsBatchFormOpen] = useState(false);
  const [editingBatch, setEditingBatch] = useState(null);

  const [selectedBatchId, setSelectedBatchId] = useState(null);
  const [tokenGeneratorBatch, setTokenGeneratorBatch] = useState(null);
  const [printableLabelsData, setPrintableLabelsData] = useState(null);
  const [consumerVerificationCode, setConsumerVerificationCode] = useState(null);
  const [isAuditLogsOpen, setIsAuditLogsOpen] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (title, message, type = 'success') => {
    setToast({ title, message, type });
  };

  // Fetch batches & meta
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [batchesRes, statsRes, cowsRes, artisansRes] = await Promise.all([
        api.getBatches(),
        api.getStats(),
        api.getCows(),
        api.getArtisans()
      ]);

      setBatches(batchesRes.batches || []);
      setStats(statsRes);
      setRegisteredCows(cowsRes.cows || []);
      setRegisteredArtisans(artisansRes.artisans || []);
    } catch (err) {
      console.error('Failed loading data:', err);
      showToast('Connection Notice', 'Connecting to traceability store...', 'info');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!consumerPageToken) {
      loadData();
    }
  }, [loadData, consumerPageToken]);

  // If opened directly at consumer route /v/:tokenCode, render dedicated consumer page
  if (consumerPageToken) {
    return (
      <ConsumerVerificationPage
        tokenCode={consumerPageToken}
        onGoToAdmin={() => {
          window.history.pushState({}, '', '/');
          setConsumerPageToken(null);
        }}
      />
    );
  }

  // Handlers
  const handleOpenCreateBatch = () => {
    setEditingBatch(null);
    setIsBatchFormOpen(true);
  };

  const handleEditBatch = (batch) => {
    setEditingBatch(batch);
    setIsBatchFormOpen(true);
  };

  const handleSaveBatch = async (formData, isEdit) => {
    try {
      if (isEdit && editingBatch) {
        await api.updateBatch(editingBatch.id, formData);
        showToast('Batch Updated', `Successfully updated batch ${formData.batchNumber}`);
      } else {
        await api.createBatch(formData);
        showToast('Batch Created', `Batch ${formData.batchNumber} logged to traceability ledger`);
      }
      await loadData();
    } catch (err) {
      showToast('Error', err.message, 'error');
      throw err;
    }
  };

  const handleDeleteBatch = async (batchId) => {
    try {
      await api.deleteBatch(batchId);
      showToast('Batch Deleted', 'Batch record and tokens removed from active ledger', 'info');
      await loadData();
    } catch (err) {
      showToast('Delete Failed', err.message, 'error');
    }
  };

  const handleTokensGenerated = async (batchId, count) => {
    try {
      const res = await api.generateTokens(batchId, count);
      showToast('Tokens Generated', `Minted ${res.count} unique verification QR tokens!`);
      await loadData();
      return res;
    } catch (err) {
      showToast('Token Generation Failed', err.message, 'error');
      throw err;
    }
  };

  const handleDownloadCsv = async (batch) => {
    try {
      const res = await api.getTokens(batch.id);
      downloadCsvForBatch(batch, res.tokens || []);
      showToast('CSV Exported', `Downloaded verification tokens for ${batch.batchNumber}`);
    } catch (err) {
      showToast('Export Error', err.message, 'error');
    }
  };

  const handleDownloadZip = async (batch) => {
    try {
      const res = await api.getTokens(batch.id);
      if (!res.tokens || res.tokens.length === 0) {
        showToast('No Tokens', 'Please generate tokens for this batch first before downloading QR codes.', 'info');
        setTokenGeneratorBatch(batch);
        return;
      }
      await downloadQrZipForBatch(batch, res.tokens);
      showToast('QR ZIP Downloaded', `Exported high-res QR codes for ${batch.batchNumber}`);
    } catch (err) {
      showToast('ZIP Export Error', err.message, 'error');
    }
  };

  const handleOpenPrintLabels = (batch, tokens) => {
    setPrintableLabelsData({ batch, tokens });
  };

  const handleSimulateScan = (tokenCode) => {
    setConsumerVerificationCode(tokenCode);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        onOpenAuditLogs={() => setIsAuditLogsOpen(true)}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full flex-1">
        {/* Page Title & Intro */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Traceability Admin Dashboard
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                Artisanal dairy batch logging, single-herd cow lineage attribution & tamper-proof QR verification tokens.
              </p>
            </div>

            {/* Manager / Supervisor indicator badge */}
            <div className="flex items-center space-x-2 text-xs text-slate-600 bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-2xs self-start sm:self-auto">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Logged as: <strong className="text-slate-900">{currentUser?.name || 'Guest'}</strong></span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                isManager ? 'bg-amber-100 text-amber-900' : 'bg-blue-100 text-blue-900'
              }`}>
                {currentUser?.role || 'Viewer'}
              </span>
            </div>
          </div>
        </div>

        {/* Overview Stats Cards */}
        <StatsOverview
          stats={stats}
          onNewBatchClick={handleOpenCreateBatch}
        />

        {/* Batches Management Section */}
        <BatchList
          batches={batches}
          loading={loading}
          onViewDetails={(id) => setSelectedBatchId(id)}
          onEditBatch={handleEditBatch}
          onDeleteBatch={handleDeleteBatch}
          onOpenCreateBatch={handleOpenCreateBatch}
          onOpenGenerateTokens={(batch) => setTokenGeneratorBatch(batch)}
          onOpenPrintLabels={(batch, tokens) => handleOpenPrintLabels(batch, tokens)}
          onDownloadCsv={handleDownloadCsv}
          onDownloadZip={handleDownloadZip}
          isManager={isManager}
        />
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 VeriDairy Traceability OS — Module 1 Admin Verification Platform</p>
          <div className="flex items-center space-x-4">
            <span>Vedic Cow Herd Certified</span>
            <span>•</span>
            <span>Cryptographic Proof</span>
            <span>•</span>
            <button
              onClick={() => setIsAuditLogsOpen(true)}
              className="hover:text-slate-700 underline"
            >
              System Logs
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <BatchFormModal
        isOpen={isBatchFormOpen}
        onClose={() => setIsBatchFormOpen(false)}
        onSave={handleSaveBatch}
        editingBatch={editingBatch}
        registeredCows={registeredCows}
        registeredArtisans={registeredArtisans}
      />

      <BatchDetailModal
        isOpen={!!selectedBatchId}
        onClose={() => setSelectedBatchId(null)}
        batchId={selectedBatchId}
        onEditBatch={(b) => {
          setSelectedBatchId(null);
          handleEditBatch(b);
        }}
        onDeleteBatch={handleDeleteBatch}
        onOpenGenerateTokens={(b) => setTokenGeneratorBatch(b)}
        onOpenPrintLabels={(b, toks) => handleOpenPrintLabels(b, toks)}
        onSimulateScan={handleSimulateScan}
        isManager={isManager}
      />

      <TokenGeneratorModal
        isOpen={!!tokenGeneratorBatch}
        onClose={() => setTokenGeneratorBatch(null)}
        batch={tokenGeneratorBatch}
        onTokensGenerated={handleTokensGenerated}
        onOpenPrintLabels={(b, toks) => handleOpenPrintLabels(b, toks)}
      />

      <PrintableLabelsModal
        isOpen={!!printableLabelsData}
        onClose={() => setPrintableLabelsData(null)}
        batch={printableLabelsData?.batch}
        tokens={printableLabelsData?.tokens}
      />

      <ConsumerVerificationModal
        isOpen={!!consumerVerificationCode}
        onClose={() => setConsumerVerificationCode(null)}
        tokenCode={consumerVerificationCode}
      />

      <AuditLogsModal
        isOpen={isAuditLogsOpen}
        onClose={() => setIsAuditLogsOpen(false)}
      />

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      {/* Toast Notification */}
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}

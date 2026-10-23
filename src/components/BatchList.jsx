import React, { useState } from 'react';
import { BatchCard } from './BatchCard';
import {
  Search, Filter, Plus, LayoutGrid, Table, ArrowUpDown, Milk,
  Download, FileText, Printer, QrCode, Eye, Edit3, Trash2
} from 'lucide-react';

export function BatchList({
  batches = [],
  loading,
  onViewDetails,
  onEditBatch,
  onDeleteBatch,
  onOpenCreateBatch,
  onOpenGenerateTokens,
  onOpenPrintLabels,
  onDownloadCsv,
  onDownloadZip,
  isManager
}) {
  const [search, setSearch] = useState('');
  const [productType, setProductType] = useState('All');
  const [status, setStatus] = useState('All');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Filter & Search Batches
  const filteredBatches = batches.filter((b) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !search ||
      b.batchNumber.toLowerCase().includes(q) ||
      b.productName.toLowerCase().includes(q) ||
      b.artisanName.toLowerCase().includes(q) ||
      (Array.isArray(b.sourceCowIds) && b.sourceCowIds.some(cid => cid.toLowerCase().includes(q)));

    const matchesType = productType === 'All' || b.productType.toLowerCase() === productType.toLowerCase();
    const matchesStatus = status === 'All' || b.status.toLowerCase() === status.toLowerCase();

    return matchesSearch && matchesType && matchesStatus;
  });

  // Sort
  filteredBatches.sort((a, b) => {
    let valA = a[sortBy] || '';
    let valB = b[sortBy] || '';
    if (sortBy === 'tokenCount' || sortBy === 'quantity') {
      valA = Number(valA) || 0;
      valB = Number(valB) || 0;
    }
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-6">
      
      {/* Top Filter & Action Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        
        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by batch #, product, artisan, or cow ID..."
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-slate-50/50"
            />
          </div>

          {/* Product Type Filter */}
          <select
            value={productType}
            onChange={(e) => setProductType(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-700 font-medium"
          >
            <option value="All">All Types</option>
            <option value="Ghee">Ghee</option>
            <option value="Milk">Milk</option>
            <option value="Cheese">Cheese</option>
            <option value="Butter">Butter</option>
            <option value="Paneer">Paneer</option>
            <option value="Yogurt">Yogurt</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-700 font-medium"
          >
            <option value="All">All Statuses</option>
            <option value="In Production">In Production</option>
            <option value="Quality Approved">Quality Approved</option>
            <option value="Tokens Generated">Tokens Generated</option>
            <option value="Dispatched">Dispatched</option>
          </select>
        </div>

        {/* View Mode & Create Action */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* Grid vs Table View Switch */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'grid' ? 'bg-white shadow-2xs text-emerald-800' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition ${
                viewMode === 'table' ? 'bg-white shadow-2xs text-emerald-800' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>

          {/* Create Batch Button */}
          <button
            onClick={onOpenCreateBatch}
            className="px-4 py-2.5 bg-farm-600 hover:bg-farm-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-farm-600/25 transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Product Batch</span>
          </button>
        </div>
      </div>

      {/* Batches Content */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p className="text-sm text-slate-500 font-medium">Synchronizing batch traceability ledger...</p>
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center mb-4">
            <Milk className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-slate-900">No Batches Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {search || productType !== 'All' || status !== 'All'
              ? 'Try modifying your search keywords or filter settings.'
              : 'Start by creating your first artisanal product batch with cow IDs and artisan details.'}
          </p>
          <button
            onClick={onOpenCreateBatch}
            className="mt-5 px-4 py-2 bg-farm-600 hover:bg-farm-700 text-white rounded-xl text-xs font-bold transition shadow-sm inline-flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Batch</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBatches.map((batch) => (
            <BatchCard
              key={batch.id}
              batch={batch}
              onViewDetails={onViewDetails}
              onEditBatch={onEditBatch}
              onOpenGenerateTokens={onOpenGenerateTokens}
              onOpenPrintLabels={onOpenPrintLabels}
              onDownloadCsv={onDownloadCsv}
              onDownloadZip={onDownloadZip}
              isManager={isManager}
            />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-4 py-3">Batch #</th>
                  <th className="px-4 py-3">Product Name</th>
                  <th className="px-4 py-3">Artisan</th>
                  <th className="px-4 py-3">Source Cows</th>
                  <th className="px-4 py-3">Mfg Date</th>
                  <th className="px-4 py-3">Expiry Date</th>
                  <th className="px-4 py-3">Tokens</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map((batch) => (
                  <tr key={batch.id} className="hover:bg-slate-50/80 transition group">
                    <td className="px-4 py-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                      {batch.batchNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p
                        onClick={() => onViewDetails(batch.id)}
                        className="font-bold text-slate-900 hover:text-emerald-700 cursor-pointer"
                      >
                        {batch.productName}
                      </p>
                      <span className="text-[10px] text-slate-400">{batch.productType}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-slate-800">{batch.artisanName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{batch.artisanId}</p>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <div className="flex flex-wrap gap-1 max-w-[160px]">
                        {batch.sourceCowIds.slice(0, 3).map((cid) => (
                          <span
                            key={cid}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-100"
                          >
                            {cid}
                          </span>
                        ))}
                        {batch.sourceCowIds.length > 3 && (
                          <span className="text-[9px] text-slate-400">+{batch.sourceCowIds.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-600 whitespace-nowrap">
                      {batch.manufacturingDate}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {batch.expiryDate}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-slate-800">
                      {batch.tokenCount || 0}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {batch.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onOpenGenerateTokens(batch)}
                          className="p-1.5 hover:bg-slate-100 rounded text-blue-600"
                          title="Generate Tokens"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDownloadCsv(batch)}
                          className="p-1.5 hover:bg-slate-100 rounded text-emerald-600"
                          title="Download CSV"
                        >
                          <FileText className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDownloadZip(batch)}
                          className="p-1.5 hover:bg-slate-100 rounded text-blue-600"
                          title="Download QR ZIP"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditBatch(batch)}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                          title="Edit Batch"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onViewDetails(batch.id)}
                          className="p-1.5 hover:bg-slate-100 rounded text-slate-600"
                          title="View Details"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

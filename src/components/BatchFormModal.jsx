import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Plus, Tag, UserCheck, Milk, ShieldCheck, Sparkles, Check } from 'lucide-react';

const PRODUCT_SUGGESTIONS = [
  { name: 'A2 Organic Cultured Bilona Ghee', type: 'Ghee', unit: 'Jars (500ml)', defaultFat: '99.8%' },
  { name: 'Pure Gir Cow Fresh Whole A2 Milk', type: 'Milk', unit: 'Glass Bottles (1000ml)', defaultFat: '4.8%' },
  { name: 'Farmstead Raw Milk Aged Clothbound Cheddar', type: 'Cheese', unit: 'Wheels (1.2kg)', defaultFat: '34.0%' },
  { name: 'Cultured Probiotic Pasture Butter (Unsalted)', type: 'Butter', unit: 'Blocks (250g)', defaultFat: '84.0%' },
  { name: 'Traditional Organic Fresh Malai Paneer', type: 'Paneer', unit: 'Packs (400g)', defaultFat: '25.0%' },
  { name: 'Artisanal Probiotic Vedic Dahi (Clay Pot)', type: 'Yogurt', unit: 'Clay Pots (500g)', defaultFat: '5.2%' },
];

const PRODUCT_TYPES = ['Ghee', 'Milk', 'Cheese', 'Butter', 'Paneer', 'Yogurt', 'Whey', 'Cream', 'Other'];

export function BatchFormModal({ isOpen, onClose, onSave, editingBatch, registeredCows = [], registeredArtisans = [] }) {
  const [formData, setFormData] = useState({
    batchNumber: '',
    productName: '',
    productType: 'Ghee',
    artisanName: '',
    artisanId: '',
    artisanFacility: '',
    sourceCowIds: [],
    manufacturingDate: '',
    expiryDate: '',
    quantity: 100,
    unit: 'Jars (500ml)',
    status: 'Quality Approved',
    notes: '',
    qualityScore: '99.2/100',
    fatContent: '99.8%',
    moistureContent: '0.15%'
  });

  const [customCowInput, setCustomCowInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize form when opening or editing
  useEffect(() => {
    if (editingBatch) {
      setFormData({
        ...editingBatch,
        sourceCowIds: Array.isArray(editingBatch.sourceCowIds)
          ? [...editingBatch.sourceCowIds]
          : (editingBatch.sourceCowIds ? editingBatch.sourceCowIds.split(',').map(s => s.trim()) : [])
      });
    } else {
      const today = new Date().toISOString().split('T')[0];
      const nextYear = new Date();
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      const oneYearAhead = nextYear.toISOString().split('T')[0];
      const randomSeq = Math.floor(1000 + Math.random() * 9000);

      // Default artisan
      const defaultArtisan = registeredArtisans[0] || { name: 'Ramesh Patel', id: 'ART-101', facility: 'Hearth Chamber #2' };

      setFormData({
        batchNumber: `BATCH-${new Date().getFullYear()}-${randomSeq}`,
        productName: 'A2 Organic Cultured Bilona Ghee',
        productType: 'Ghee',
        artisanName: defaultArtisan.name,
        artisanId: defaultArtisan.id,
        artisanFacility: defaultArtisan.facility || 'Artisanal Facility Unit',
        sourceCowIds: registeredCows.slice(0, 3).map(c => c.id),
        manufacturingDate: today,
        expiryDate: oneYearAhead,
        quantity: 250,
        unit: 'Jars (500ml)',
        status: 'In Production',
        notes: 'Hand-crafted bilona churned slow at dawn, wood-fire clarified.',
        qualityScore: '99.5/100',
        fatContent: '99.8%',
        moistureContent: '0.15%'
      });
    }
    setError('');
  }, [editingBatch, isOpen, registeredArtisans, registeredCows]);

  if (!isOpen) return null;

  const handleProductSuggestion = (item) => {
    setFormData(prev => ({
      ...prev,
      productName: item.name,
      productType: item.type,
      unit: item.unit,
      fatContent: item.defaultFat
    }));
  };

  const handleArtisanChange = (artisanName) => {
    const found = registeredArtisans.find(a => a.name === artisanName);
    if (found) {
      setFormData(prev => ({
        ...prev,
        artisanName: found.name,
        artisanId: found.id,
        artisanFacility: found.facility
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        artisanName,
      }));
    }
  };

  const toggleCowId = (cowId) => {
    setFormData(prev => {
      const exists = prev.sourceCowIds.includes(cowId);
      if (exists) {
        return { ...prev, sourceCowIds: prev.sourceCowIds.filter(c => c !== cowId) };
      } else {
        return { ...prev, sourceCowIds: [...prev.sourceCowIds, cowId] };
      }
    });
  };

  const addCustomCowId = (e) => {
    e.preventDefault();
    const tag = customCowInput.trim().toUpperCase();
    if (tag && !formData.sourceCowIds.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        sourceCowIds: [...prev.sourceCowIds, tag]
      }));
      setCustomCowInput('');
    }
  };

  const removeCowId = (cowId) => {
    setFormData(prev => ({
      ...prev,
      sourceCowIds: prev.sourceCowIds.filter(c => c !== cowId)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validations
    if (!formData.productName.trim()) {
      setError('Product name is required.');
      return;
    }
    if (!formData.artisanName.trim()) {
      setError('Artisan name is required.');
      return;
    }
    if (!formData.sourceCowIds || formData.sourceCowIds.length === 0) {
      setError('Please select or enter at least one source cow ID.');
      return;
    }
    if (!formData.manufacturingDate) {
      setError('Manufacturing date is required.');
      return;
    }
    if (!formData.expiryDate) {
      setError('Expiry date is required.');
      return;
    }

    const mfg = new Date(formData.manufacturingDate);
    const exp = new Date(formData.expiryDate);
    if (exp <= mfg) {
      setError('Validation Error: Expiry date must strictly be after manufacturing date.');
      return;
    }

    setLoading(true);
    try {
      await onSave(formData, !!editingBatch);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save batch');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200/80 flex items-center justify-between shrink-0 bg-slate-50/50 rounded-t-2xl">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center space-x-2">
              <Milk className="w-5 h-5 text-emerald-600" />
              <span>{editingBatch ? 'Edit Product Batch' : 'Create New Product Batch'}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enter batch provenance: artisan craftsmanship, registered source cows, and verification parameters.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Quick Suggestions Chips (only in create mode) */}
          {!editingBatch && (
            <div className="bg-emerald-50/50 border border-emerald-100 rounded-xl p-3">
              <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-900 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>Quick-Fill Artisanal Product Presets:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRODUCT_SUGGESTIONS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleProductSuggestion(item)}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-600 hover:text-white transition font-medium shadow-2xs"
                  >
                    + {item.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Section 1: Product Basics */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">1. Batch & Product Specification</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Batch Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.batchNumber}
                  onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
                  placeholder="BATCH-2026-001"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.productName}
                  onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                  placeholder="e.g. A2 Organic Cultured Bilona Ghee"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Type <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.productType}
                  onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  {PRODUCT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quantity / Pack Size
                </label>
                <input
                  type="text"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  placeholder="e.g. Jars (500ml)"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Production Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                >
                  <option value="Draft">Draft</option>
                  <option value="In Production">In Production</option>
                  <option value="Quality Approved">Quality Approved</option>
                  <option value="Tokens Generated">Tokens Generated</option>
                  <option value="Dispatched">Dispatched</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Artisan Details */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">2. Artisan & Craftsmanship Details</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Certified Artisan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.artisanName}
                  onChange={(e) => handleArtisanChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white font-medium"
                >
                  <option value="">-- Choose Artisan --</option>
                  {registeredArtisans.map(art => (
                    <option key={art.id} value={art.name}>
                      {art.name} ({art.specialty})
                    </option>
                  ))}
                  <option value="Custom">Custom Artisan Name...</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Artisan Name / Title
                </label>
                <input
                  type="text"
                  required
                  value={formData.artisanName}
                  onChange={(e) => setFormData({ ...formData, artisanName: e.target.value })}
                  placeholder="Master Craftsman Name"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Artisan ID / Code
                </label>
                <input
                  type="text"
                  value={formData.artisanId}
                  onChange={(e) => setFormData({ ...formData, artisanId: e.target.value })}
                  placeholder="ART-101"
                  className="w-full px-3 py-2 text-sm font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Production Facility / Chamber Location
                </label>
                <input
                  type="text"
                  value={formData.artisanFacility}
                  onChange={(e) => setFormData({ ...formData, artisanFacility: e.target.value })}
                  placeholder="e.g. Hearth Chamber #2 (Slow clay-pot simmering over sacred wood fire)"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Source Cow IDs */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                3. Source Cow IDs (Herd Lineage Traceability) <span className="text-rose-500">*</span>
              </h3>
              <span className="text-[11px] text-slate-500">
                {formData.sourceCowIds.length} cows assigned
              </span>
            </div>

            {/* Clickable Certified Cows */}
            <p className="text-xs text-slate-500 mb-2">
              Click registered Vedic cows to toggle for this batch, or type custom tags below:
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {registeredCows.map(cow => {
                const isSelected = formData.sourceCowIds.includes(cow.id);
                return (
                  <button
                    key={cow.id}
                    type="button"
                    onClick={() => toggleCowId(cow.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition border ${
                      isSelected
                        ? 'bg-farm-600 text-white border-farm-700 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {isSelected ? <Check className="w-3.5 h-3.5 text-white" /> : <Tag className="w-3.5 h-3.5 text-slate-400" />}
                    <span>{cow.id}</span>
                    <span className={`text-[10px] font-normal ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                      ({cow.breed})
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Custom Tag Input */}
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={customCowInput}
                onChange={(e) => setCustomCowInput(e.target.value)}
                placeholder="Type custom cow ID (e.g. COW-312) and press Add"
                className="flex-1 px-3 py-1.5 text-xs font-mono border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustomCowId(e);
                  }
                }}
              />
              <button
                type="button"
                onClick={addCustomCowId}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Tag</span>
              </button>
            </div>

            {/* Current Active Tags */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {formData.sourceCowIds.map(cid => (
                <span
                  key={cid}
                  className="inline-flex items-center px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-mono font-bold"
                >
                  <span>{cid}</span>
                  <button
                    type="button"
                    onClick={() => removeCowId(cid)}
                    className="ml-1.5 text-emerald-600 hover:text-emerald-900 focus:outline-none"
                    title="Remove tag"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Section 4: Manufacturing Date & Expiry Date */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">4. Dates & Shelf Life Validation</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Manufacturing Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    required
                    value={formData.manufacturingDate}
                    onChange={(e) => setFormData({ ...formData, manufacturingDate: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Expiry Date <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="date"
                    required
                    value={formData.expiryDate}
                    onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Must strictly follow Manufacturing Date</p>
              </div>
            </div>
          </div>

          {/* Section 5: Lab & Quality Details */}
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">5. Lab Quality Metrics & Notes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fat Content (%)
                </label>
                <input
                  type="text"
                  value={formData.fatContent}
                  onChange={(e) => setFormData({ ...formData, fatContent: e.target.value })}
                  placeholder="e.g. 99.8%"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Moisture Content
                </label>
                <input
                  type="text"
                  value={formData.moistureContent}
                  onChange={(e) => setFormData({ ...formData, moistureContent: e.target.value })}
                  placeholder="e.g. 0.15%"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Quality Audit Score
                </label>
                <input
                  type="text"
                  value={formData.qualityScore}
                  onChange={(e) => setFormData({ ...formData, qualityScore: e.target.value })}
                  placeholder="e.g. 99.5/100"
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-semibold text-emerald-700"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Artisan Craftsmanship & Production Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Describe the traditional preparation technique, culture strains, wood fire simmering details..."
                  className="w-full px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-farm-600 hover:bg-farm-700 text-white text-xs font-bold rounded-xl shadow-md shadow-farm-600/25 transition disabled:opacity-50 flex items-center space-x-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{loading ? 'Saving...' : (editingBatch ? 'Save Batch Changes' : 'Create Product Batch')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

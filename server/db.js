import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import { getInitialData, generateTokenCode } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class Database {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf8');
        this.data = JSON.parse(raw);
      } catch (err) {
        console.error('Failed reading DB file, reinitializing with seed data:', err);
        this.data = getInitialData();
        this.save();
      }
    } else {
      this.data = getInitialData();
      this.save();
    }
  }

  save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (err) {
      console.error('Failed saving database to file:', err);
    }
  }

  // Users & Auth
  findUserByEmail(email) {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  authenticate(email, password) {
    const user = this.findUserByEmail(email);
    if (user && user.password === password) {
      // Return safe user object (omit password)
      const { password: _, ...safeUser } = user;
      return safeUser;
    }
    return null;
  }

  getUserById(id) {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    const { password: _, ...safeUser } = user;
    return safeUser;
  }

  // Batches
  getBatches({ search = '', productType = '', status = '', sortBy = 'createdAt', sortOrder = 'desc' } = {}) {
    let result = [...this.data.batches];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(b => 
        b.batchNumber.toLowerCase().includes(q) ||
        b.productName.toLowerCase().includes(q) ||
        b.artisanName.toLowerCase().includes(q) ||
        b.sourceCowIds.some(cid => cid.toLowerCase().includes(q))
      );
    }

    if (productType && productType !== 'All') {
      result = result.filter(b => b.productType.toLowerCase() === productType.toLowerCase());
    }

    if (status && status !== 'All') {
      result = result.filter(b => b.status.toLowerCase() === status.toLowerCase());
    }

    result.sort((a, b) => {
      let valA = a[sortBy] || '';
      let valB = b[sortBy] || '';
      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }

  getBatchById(id) {
    const batch = this.data.batches.find(b => b.id === id || b.batchNumber === id);
    if (!batch) return null;
    const tokens = this.data.tokens.filter(t => t.batchId === batch.id);
    return { ...batch, tokens, tokenCount: tokens.length };
  }

  createBatch(batchData, user) {
    const id = `b-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newBatch = {
      id,
      batchNumber: batchData.batchNumber || `BATCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      productName: batchData.productName,
      productType: batchData.productType,
      artisanName: batchData.artisanName,
      artisanId: batchData.artisanId || `ART-${Math.floor(100 + Math.random() * 900)}`,
      artisanFacility: batchData.artisanFacility || 'Artisanal Production Room',
      sourceCowIds: Array.isArray(batchData.sourceCowIds) ? batchData.sourceCowIds : (batchData.sourceCowIds ? batchData.sourceCowIds.split(',').map(s => s.trim()) : []),
      manufacturingDate: batchData.manufacturingDate,
      expiryDate: batchData.expiryDate,
      quantity: Number(batchData.quantity) || 100,
      unit: batchData.unit || 'Units',
      status: batchData.status || 'Active',
      notes: batchData.notes || '',
      qualityScore: batchData.qualityScore || '99.0/100',
      fatContent: batchData.fatContent || 'N/A',
      moistureContent: batchData.moistureContent || 'N/A',
      createdAt: new Date().toISOString(),
      createdBy: user ? user.name : 'System',
      tokenCount: 0
    };

    this.data.batches.unshift(newBatch);
    this.addAuditLog({
      user: user ? user.name : 'System',
      role: user ? user.role : 'Manager',
      action: 'BATCH_CREATED',
      details: `Created batch ${newBatch.batchNumber} (${newBatch.productName})`
    });

    this.save();
    return newBatch;
  }

  updateBatch(id, updates, user) {
    const index = this.data.batches.findIndex(b => b.id === id);
    if (index === -1) return null;

    const existing = this.data.batches[index];
    const updated = {
      ...existing,
      ...updates,
      id: existing.id, // prevent id alteration
      updatedAt: new Date().toISOString(),
      updatedBy: user ? user.name : 'System'
    };

    if (updates.sourceCowIds && typeof updates.sourceCowIds === 'string') {
      updated.sourceCowIds = updates.sourceCowIds.split(',').map(s => s.trim()).filter(Boolean);
    }

    this.data.batches[index] = updated;

    this.addAuditLog({
      user: user ? user.name : 'System',
      role: user ? user.role : 'Manager',
      action: 'BATCH_UPDATED',
      details: `Updated details for batch ${existing.batchNumber}`
    });

    this.save();
    return updated;
  }

  deleteBatch(id, user) {
    const index = this.data.batches.findIndex(b => b.id === id);
    if (index === -1) return false;

    const [deleted] = this.data.batches.splice(index, 1);
    // Remove associated tokens
    this.data.tokens = this.data.tokens.filter(t => t.batchId !== id);

    this.addAuditLog({
      user: user ? user.name : 'System',
      role: user ? user.role : 'Manager',
      action: 'BATCH_DELETED',
      details: `Deleted batch ${deleted.batchNumber} and its verification tokens`
    });

    this.save();
    return true;
  }

  // Token Generation
  generateTokens(batchId, count, user) {
    const batch = this.data.batches.find(b => b.id === batchId);
    if (!batch) throw new Error('Batch not found');

    const numTokens = Math.max(1, Math.min(Number(count) || 1, 1000));
    const newTokens = [];
    const currentTokenCount = this.data.tokens.filter(t => t.batchId === batchId).length;

    for (let i = 1; i <= numTokens; i++) {
      const tokenIndex = currentTokenCount + i;
      const tokenCode = generateTokenCode(batch.batchNumber, tokenIndex);
      const tokenObj = {
        id: `tok-${batch.id}-${tokenIndex}-${crypto.randomBytes(2).toString('hex')}`,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        tokenCode,
        verificationUrl: `https://verify.veridairy.farm/v/${tokenCode}`,
        status: 'Active',
        scannedCount: 0,
        lastScannedAt: null,
        generatedAt: new Date().toISOString(),
        generatedBy: user ? user.name : 'Supervisor'
      };
      newTokens.push(tokenObj);
    }

    this.data.tokens.push(...newTokens);
    batch.tokenCount = (batch.tokenCount || 0) + numTokens;
    if (batch.status === 'Draft' || batch.status === 'In Production') {
      batch.status = 'Tokens Generated';
    }

    this.addAuditLog({
      user: user ? user.name : 'Supervisor',
      role: user ? user.role : 'Supervisor',
      action: 'TOKENS_GENERATED',
      details: `Generated ${numTokens} unique verification tokens for ${batch.batchNumber}`
    });

    this.save();
    return newTokens;
  }

  getTokensForBatch(batchId) {
    return this.data.tokens.filter(t => t.batchId === batchId);
  }

  verifyToken(tokenCode) {
    const token = this.data.tokens.find(t => t.tokenCode.toUpperCase() === tokenCode.toUpperCase());
    if (!token) return { valid: false, message: 'Invalid or unknown verification token' };

    const batch = this.data.batches.find(b => b.id === token.batchId);
    if (!batch) return { valid: false, message: 'Batch record missing for this token' };

    // Record scan
    token.scannedCount = (token.scannedCount || 0) + 1;
    token.lastScannedAt = new Date().toISOString();
    token.status = 'Verified';

    // Get matched cow details
    const cowDetails = this.data.registeredCows.filter(c => batch.sourceCowIds.includes(c.id));
    const artisanDetail = this.data.registeredArtisans.find(a => a.id === batch.artisanId || a.name === batch.artisanName);

    this.addAuditLog({
      user: 'Consumer',
      role: 'Public Verification',
      action: 'TOKEN_SCANNED',
      details: `Token ${token.tokenCode} scanned for verification (Scan count: ${token.scannedCount})`
    });

    this.save();

    return {
      valid: true,
      token,
      batch,
      cowDetails,
      artisanDetail,
      verifiedAt: token.lastScannedAt
    };
  }

  getCows() {
    return this.data.registeredCows;
  }

  getArtisans() {
    return this.data.registeredArtisans;
  }

  getAuditLogs() {
    return (this.data.auditLogs || []).slice(-50).reverse();
  }

  addAuditLog(entry) {
    if (!this.data.auditLogs) this.data.auditLogs = [];
    this.data.auditLogs.push({
      id: `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: new Date().toISOString(),
      ...entry
    });
  }

  getStats() {
    const totalBatches = this.data.batches.length;
    const totalTokens = this.data.tokens.length;
    const verifiedTokens = this.data.tokens.filter(t => t.scannedCount > 0).length;
    
    // Count batches expiring in next 30 days
    const now = new Date();
    const thirtyDaysAhead = new Date();
    thirtyDaysAhead.setDate(now.getDate() + 30);
    
    const expiringSoon = this.data.batches.filter(b => {
      const exp = new Date(b.expiryDate);
      return exp >= now && exp <= thirtyDaysAhead;
    }).length;

    const activeArtisans = new Set(this.data.batches.map(b => b.artisanName)).size;

    return {
      totalBatches,
      totalTokens,
      verifiedTokens,
      expiringSoon,
      activeArtisans
    };
  }
}

export const db = new Database();

import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env files
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const JWT_SECRET = process.env.JWT_SECRET || 'veridairy-secret-jwt-key-2026-production';
const connectionString = process.env.DATABASE_URL;

export const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000
});

async function getClientWithRetry(maxRetries = 3) {
  let attempt = 0;
  while (true) {
    try {
      return await pool.connect();
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries || !['ENOTFOUND', 'ECONNRESET', 'ETIMEDOUT'].includes(err.code)) {
        throw err;
      }
      await new Promise(r => setTimeout(r, 200 * attempt));
    }
  }
}

// Helper to format batch row from snake_case to camelCase
function formatBatch(row) {
  if (!row) return null;
  return {
    id: row.id,
    batchNumber: row.batch_number,
    productName: row.product_name,
    productType: row.product_type,
    artisanName: row.artisan_name,
    artisanId: row.artisan_id,
    artisanFacility: row.artisan_facility,
    sourceCowIds: Array.isArray(row.source_cow_ids) ? row.source_cow_ids : [],
    manufacturingDate: row.manufacturing_date ? new Date(row.manufacturing_date).toISOString().split('T')[0] : '',
    expiryDate: row.expiry_date ? new Date(row.expiry_date).toISOString().split('T')[0] : '',
    quantity: Number(row.quantity),
    unit: row.unit,
    status: row.status,
    notes: row.notes || '',
    qualityScore: row.quality_score,
    fatContent: row.fat_content,
    moistureContent: row.moisture_content,
    tokenCount: Number(row.token_count),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : new Date().toISOString(),
    createdBy: row.created_by,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : undefined,
    updatedBy: row.updated_by || undefined
  };
}

// Helper to format token row from snake_case to camelCase
export function getVerificationBaseUrl() {
  const url = process.env.APP_URL || `http://localhost:${process.env.PORT || 5000}`;
  return url.replace(/\/+$/, '');
}

function formatToken(row) {
  if (!row) return null;
  const baseUrl = getVerificationBaseUrl();
  let verificationUrl = row.verification_url;
  if (!verificationUrl || verificationUrl.includes('verify.veridairy.farm')) {
    verificationUrl = `${baseUrl}/v/${row.token_code}`;
  }
  return {
    id: row.id,
    batchId: row.batch_id,
    batchNumber: row.batch_number,
    tokenCode: row.token_code,
    tokenHash: row.token_hash,
    verificationUrl,
    status: row.status,
    scannedCount: Number(row.scanned_count) || 0,
    firstScannedAt: row.first_scanned_at ? new Date(row.first_scanned_at).toISOString() : null,
    lastScannedAt: row.last_scanned_at ? new Date(row.last_scanned_at).toISOString() : null,
    generatedAt: row.generated_at ? new Date(row.generated_at).toISOString() : new Date().toISOString(),
    generatedBy: row.generated_by
  };
}

// Helper to format cow row
function formatCow(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    breed: row.breed,
    age: Number(row.age),
    yield: row.yield,
    butterfat: row.butterfat,
    pasture: row.pasture,
    organicCertified: Boolean(row.organic_certified)
  };
}

// Helper to format artisan row
function formatArtisan(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    experience: row.experience,
    specialty: row.specialty,
    facility: row.facility,
    contact: row.contact
  };
}

// Helper to format audit log row
function formatAuditLog(row) {
  if (!row) return null;
  return {
    id: row.id,
    timestamp: row.timestamp ? new Date(row.timestamp).toISOString() : new Date().toISOString(),
    user: row.user_name,
    role: row.role,
    action: row.action,
    details: row.details
  };
}

export function generateTokenCode(batchNumber, index) {
  const hash = crypto.randomBytes(4).toString('hex').toUpperCase();
  const cleanBatch = batchNumber.replace(/[^A-Za-z0-9]/g, '').slice(-6);
  return `VD-${cleanBatch}-${hash}-${String(index).padStart(4, '0')}`;
}

class NeonDatabase {
  // Users & Auth
  async findUserByEmail(email) {
    const res = await pool.query('SELECT * FROM users WHERE LOWER(email) = LOWER($1)', [email]);
    return res.rows[0] || null;
  }

  async authenticate(email, password) {
    const user = await this.findUserByEmail(email);
    if (!user) return null;

    // Support both bcrypt password hashes and fallback for legacy plain-text during transition
    let isValid = false;
    if (user.password.startsWith('$2')) {
      isValid = bcrypt.compareSync(password, user.password);
    } else {
      isValid = (user.password === password);
      // Upgrade plain text to bcrypt on the fly
      if (isValid) {
        const hashed = bcrypt.hashSync(password, 10);
        await pool.query('UPDATE users SET password = $1 WHERE id = $2', [hashed, user.id]);
      }
    }

    if (!isValid) return null;

    const safeUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      title: user.title,
      avatar: user.avatar,
      department: user.department,
      badgeId: user.badge_id
    };

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return { token, user: safeUser };
  }

  async getUserById(id) {
    const res = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = res.rows[0];
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      title: user.title,
      avatar: user.avatar,
      department: user.department,
      badgeId: user.badge_id
    };
  }

  verifyJwt(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch {
      return null;
    }
  }

  // Batches
  async getBatches({ search = '', productType = '', status = '', sortBy = 'createdAt', sortOrder = 'desc' } = {}) {
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
      params.push(`%${search.toLowerCase()}%`);
      conditions.push(`(
        LOWER(batch_number) LIKE $${paramIndex} OR
        LOWER(product_name) LIKE $${paramIndex} OR
        LOWER(artisan_name) LIKE $${paramIndex} OR
        array_to_string(source_cow_ids, ',') ILIKE $${paramIndex}
      )`);
      paramIndex++;
    }

    if (productType && productType !== 'All') {
      params.push(productType.toLowerCase());
      conditions.push(`LOWER(product_type) = $${paramIndex}`);
      paramIndex++;
    }

    if (status && status !== 'All') {
      params.push(status.toLowerCase());
      conditions.push(`LOWER(status) = $${paramIndex}`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Map frontend sortBy keys to SQL column names
    const columnMap = {
      createdAt: 'created_at',
      batchNumber: 'batch_number',
      productName: 'product_name',
      productType: 'product_type',
      quantity: 'quantity',
      tokenCount: 'token_count',
      manufacturingDate: 'manufacturing_date',
      expiryDate: 'expiry_date',
      status: 'status'
    };

    const sortColumn = columnMap[sortBy] || 'created_at';
    const direction = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    const query = `SELECT * FROM batches ${whereClause} ORDER BY ${sortColumn} ${direction}`;
    const res = await pool.query(query, params);
    return res.rows.map(formatBatch);
  }

  async getBatchById(id) {
    const res = await pool.query(
      'SELECT * FROM batches WHERE id = $1 OR batch_number = $1',
      [id]
    );
    const row = res.rows[0];
    if (!row) return null;

    const batch = formatBatch(row);
    const tokensRes = await pool.query(
      'SELECT * FROM verification_tokens WHERE batch_id = $1 ORDER BY id ASC',
      [batch.id]
    );

    const tokens = tokensRes.rows.map(formatToken);
    return {
      ...batch,
      tokens,
      tokenCount: tokens.length
    };
  }

  async createBatch(batchData, user) {
    const id = `b-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const batchNumber = batchData.batchNumber || `BATCH-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const artisanId = batchData.artisanId || `ART-${Math.floor(100 + Math.random() * 900)}`;
    const artisanFacility = batchData.artisanFacility || 'Artisanal Production Room';
    const sourceCowIds = Array.isArray(batchData.sourceCowIds)
      ? batchData.sourceCowIds
      : (batchData.sourceCowIds ? batchData.sourceCowIds.split(',').map(s => s.trim()) : []);

    const quantity = Number(batchData.quantity) || 100;
    const unit = batchData.unit || 'Units';
    const status = batchData.status || 'Active';
    const notes = batchData.notes || '';
    const qualityScore = batchData.qualityScore || '99.0/100';
    const fatContent = batchData.fatContent || 'N/A';
    const moistureContent = batchData.moistureContent || 'N/A';
    const createdBy = user ? user.name : 'System';

    const insertSql = `
      INSERT INTO batches (
        id, batch_number, product_name, product_type, artisan_name, artisan_id, artisan_facility,
        source_cow_ids, manufacturing_date, expiry_date, quantity, unit, status, notes,
        quality_score, fat_content, moisture_content, token_count, created_at, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 0, NOW(), $18)
      RETURNING *
    `;

    const res = await pool.query(insertSql, [
      id,
      batchNumber,
      batchData.productName,
      batchData.productType,
      batchData.artisanName,
      artisanId,
      artisanFacility,
      sourceCowIds,
      batchData.manufacturingDate,
      batchData.expiryDate,
      quantity,
      unit,
      status,
      notes,
      qualityScore,
      fatContent,
      moistureContent,
      createdBy
    ]);

    await this.addAuditLog({
      user: user ? user.name : 'System',
      role: user ? user.role : 'Manager',
      action: 'BATCH_CREATED',
      details: `Created batch ${batchNumber} (${batchData.productName})`
    });

    return formatBatch(res.rows[0]);
  }

  async updateBatch(id, updates, user) {
    const existingRes = await pool.query('SELECT * FROM batches WHERE id = $1', [id]);
    const existing = existingRes.rows[0];
    if (!existing) return null;

    const sourceCowIds = updates.sourceCowIds !== undefined
      ? (Array.isArray(updates.sourceCowIds) ? updates.sourceCowIds : (updates.sourceCowIds ? updates.sourceCowIds.split(',').map(s => s.trim()) : []))
      : existing.source_cow_ids;

    const updateSql = `
      UPDATE batches SET
        product_name = COALESCE($1, product_name),
        product_type = COALESCE($2, product_type),
        artisan_name = COALESCE($3, artisan_name),
        artisan_id = COALESCE($4, artisan_id),
        artisan_facility = COALESCE($5, artisan_facility),
        source_cow_ids = $6,
        manufacturing_date = COALESCE($7, manufacturing_date),
        expiry_date = COALESCE($8, expiry_date),
        quantity = COALESCE($9, quantity),
        unit = COALESCE($10, unit),
        status = COALESCE($11, status),
        notes = COALESCE($12, notes),
        quality_score = COALESCE($13, quality_score),
        fat_content = COALESCE($14, fat_content),
        moisture_content = COALESCE($15, moisture_content),
        updated_at = NOW(),
        updated_by = $16
      WHERE id = $17
      RETURNING *
    `;

    const res = await pool.query(updateSql, [
      updates.productName || null,
      updates.productType || null,
      updates.artisanName || null,
      updates.artisanId || null,
      updates.artisanFacility || null,
      sourceCowIds,
      updates.manufacturingDate || null,
      updates.expiryDate || null,
      updates.quantity !== undefined ? Number(updates.quantity) : null,
      updates.unit || null,
      updates.status || null,
      updates.notes !== undefined ? updates.notes : null,
      updates.qualityScore || null,
      updates.fatContent || null,
      updates.moistureContent || null,
      user ? user.name : 'System',
      id
    ]);

    await this.addAuditLog({
      user: user ? user.name : 'System',
      role: user ? user.role : 'Manager',
      action: 'BATCH_UPDATED',
      details: `Updated details for batch ${existing.batch_number}`
    });

    return formatBatch(res.rows[0]);
  }

  async deleteBatch(id, user) {
    const existingRes = await pool.query('SELECT * FROM batches WHERE id = $1', [id]);
    const existing = existingRes.rows[0];
    if (!existing) return false;

    // Delete cascading to verification_tokens
    await pool.query('DELETE FROM batches WHERE id = $1', [id]);

    await this.addAuditLog({
      user: user ? user.name : 'System',
      role: user ? user.role : 'Manager',
      action: 'BATCH_DELETED',
      details: `Deleted batch ${existing.batch_number} and its verification tokens`
    });

    return true;
  }

  // Token Generation
  async generateTokens(batchId, count, user) {
    const batchRes = await pool.query('SELECT * FROM batches WHERE id = $1', [batchId]);
    const batch = batchRes.rows[0];
    if (!batch) throw new Error('Batch not found');

    const numTokens = Math.max(1, Math.min(Number(count) || 1, 1000));
    const tokenCountRes = await pool.query('SELECT count(*) FROM verification_tokens WHERE batch_id = $1', [batchId]);
    const currentTokenCount = Number(tokenCountRes.rows[0].count);

    const client = await getClientWithRetry();
    try {
      await client.query('BEGIN');

      const newTokens = [];
      const insertValues = [];
      const valuePlaceholders = [];
      let pIdx = 1;
      const baseUrl = getVerificationBaseUrl();

      for (let i = 1; i <= numTokens; i++) {
        const tokenIndex = currentTokenCount + i;
        const tokenCode = generateTokenCode(batch.batch_number, tokenIndex);
        const tokenHash = crypto.createHash('sha256').update(tokenCode).digest('hex');
        const verificationUrl = `${baseUrl}/v/${tokenCode}`;
        const tokenId = `tok-${batch.id}-${tokenIndex}-${crypto.randomBytes(2).toString('hex')}`;
        const generatedBy = user ? user.name : 'Supervisor';

        valuePlaceholders.push(`($${pIdx}, $${pIdx + 1}, $${pIdx + 2}, $${pIdx + 3}, $${pIdx + 4}, $${pIdx + 5}, 'Active', 0, NOW(), $${pIdx + 6})`);
        insertValues.push(tokenId, batch.id, batch.batch_number, tokenCode, tokenHash, verificationUrl, generatedBy);
        pIdx += 7;
      }

      const bulkInsertSql = `
        INSERT INTO verification_tokens (
          id, batch_id, batch_number, token_code, token_hash, verification_url,
          status, scanned_count, generated_at, generated_by
        ) VALUES ${valuePlaceholders.join(', ')}
        RETURNING *
      `;

      const tokenRes = await client.query(bulkInsertSql, insertValues);
      newTokens.push(...tokenRes.rows.map(formatToken));

      // Update batch token count and status
      const newStatus = (batch.status === 'Draft' || batch.status === 'In Production')
        ? 'Tokens Generated'
        : batch.status;

      await client.query(
        `UPDATE batches SET
           token_count = token_count + $1,
           status = $2,
           updated_at = NOW()
         WHERE id = $3`,
        [numTokens, newStatus, batch.id]
      );

      // Audit log
      const logId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await client.query(
        `INSERT INTO audit_logs (id, timestamp, user_name, role, action, details)
         VALUES ($1, NOW(), $2, $3, 'TOKENS_GENERATED', $4)`,
        [
          logId,
          user ? user.name : 'Supervisor',
          user ? user.role : 'Supervisor',
          `Generated ${numTokens} unique verification tokens for ${batch.batch_number}`
        ]
      );

      await client.query('COMMIT');
      return newTokens;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getTokensForBatch(batchId) {
    const res = await pool.query(
      'SELECT * FROM verification_tokens WHERE batch_id = $1 ORDER BY id ASC',
      [batchId]
    );
    return res.rows.map(formatToken);
  }

  // Consumer Verification with Atomic Scan Handling & Evidence Disclaimer
  async verifyToken(tokenCode, meta = {}) {
    const client = await getClientWithRetry();
    const disclaimer = 'Cryptographic token verification confirms this QR token is genuine, collision-free, and was issued by VeriDairy. It provides token authenticity evidence rather than absolute proof of physical package contents.';

    try {
      await client.query('BEGIN');

      // 1. Row-level lock on verification_token to prevent race conditions during simultaneous scans
      const selectSql = `
        SELECT * FROM verification_tokens
        WHERE UPPER(token_code) = UPPER($1)
        FOR UPDATE
      `;
      const tokenRes = await client.query(selectSql, [tokenCode]);
      const tokenRow = tokenRes.rows[0];

      if (!tokenRow) {
        // Record failed scan attempt in verification_logs
        await client.query(
          `INSERT INTO verification_logs (token_code, status, scanned_at, ip_address, user_agent, disclaimer)
           VALUES ($1, 'TOKEN_NOT_FOUND', NOW(), $2, $3, $4)`,
          [tokenCode, meta.ip || null, meta.userAgent || null, disclaimer]
        );
        await client.query('COMMIT');
        return {
          valid: false,
          message: 'Invalid or unknown verification token',
          disclaimer
        };
      }

      const isFirstScan = (Number(tokenRow.scanned_count) === 0);
      const newScanCount = Number(tokenRow.scanned_count) + 1;

      // 2. Atomic update of token: track first scan timestamp and repeat scan timestamp
      const updateTokenSql = `
        UPDATE verification_tokens SET
          scanned_count = scanned_count + 1,
          last_scanned_at = NOW(),
          first_scanned_at = COALESCE(first_scanned_at, NOW()),
          status = 'Verified'
        WHERE id = $1
        RETURNING *
      `;
      const updatedRes = await client.query(updateTokenSql, [tokenRow.id]);
      const updatedToken = formatToken(updatedRes.rows[0]);

      // 3. Record scan attempt in verification_logs
      await client.query(
        `INSERT INTO verification_logs (
           token_code, batch_id, scanned_at, is_first_scan, scan_number, ip_address, user_agent, status, disclaimer
         ) VALUES ($1, $2, NOW(), $3, $4, $5, $6, 'SUCCESS', $7)`,
        [
          tokenRow.token_code,
          tokenRow.batch_id,
          isFirstScan,
          newScanCount,
          meta.ip || null,
          meta.userAgent || null,
          disclaimer
        ]
      );

      // 4. Fetch associated batch
      const batchRes = await client.query('SELECT * FROM batches WHERE id = $1', [tokenRow.batch_id]);
      const batch = formatBatch(batchRes.rows[0]);

      // 5. Fetch associated cow details
      let cowDetails = [];
      if (batch && batch.sourceCowIds && batch.sourceCowIds.length > 0) {
        const cowRes = await client.query('SELECT * FROM registered_cows WHERE id = ANY($1)', [batch.sourceCowIds]);
        cowDetails = cowRes.rows.map(formatCow);
      }

      // 6. Fetch artisan detail
      let artisanDetail = null;
      if (batch) {
        const artisanRes = await client.query(
          'SELECT * FROM registered_artisans WHERE id = $1 OR name = $2',
          [batch.artisanId, batch.artisanName]
        );
        artisanDetail = formatArtisan(artisanRes.rows[0]) || null;
      }

      // 7. Record system audit log
      const logId = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await client.query(
        `INSERT INTO audit_logs (id, timestamp, user_name, role, action, details)
         VALUES ($1, NOW(), 'Consumer', 'Public Verification', 'TOKEN_SCANNED', $2)`,
        [
          logId,
          `Token ${updatedToken.tokenCode} scanned for verification (Scan count: ${updatedToken.scannedCount})`
        ]
      );

      await client.query('COMMIT');

      return {
        valid: true,
        isFirstScan,
        firstScannedAt: updatedToken.firstScannedAt,
        lastScannedAt: updatedToken.lastScannedAt,
        scannedCount: updatedToken.scannedCount,
        token: updatedToken,
        batch,
        cowDetails,
        artisanDetail,
        verifiedAt: updatedToken.lastScannedAt,
        disclaimer
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  async getCows() {
    const res = await pool.query('SELECT * FROM registered_cows ORDER BY id ASC');
    return res.rows.map(formatCow);
  }

  async getArtisans() {
    const res = await pool.query('SELECT * FROM registered_artisans ORDER BY id ASC');
    return res.rows.map(formatArtisan);
  }

  async getAuditLogs() {
    const res = await pool.query('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT 50');
    return res.rows.map(formatAuditLog);
  }

  async addAuditLog(entry) {
    const id = `log-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    await pool.query(
      `INSERT INTO audit_logs (id, timestamp, user_name, role, action, details)
       VALUES ($1, NOW(), $2, $3, $4, $5)`,
      [
        id,
        entry.user || 'System',
        entry.role || 'Manager',
        entry.action,
        entry.details
      ]
    );
  }

  async getStats() {
    const batchesRes = await pool.query('SELECT count(*) FROM batches');
    const totalBatches = Number(batchesRes.rows[0].count);

    const tokensRes = await pool.query('SELECT count(*) FROM verification_tokens');
    const totalTokens = Number(tokensRes.rows[0].count);

    const verifiedRes = await pool.query('SELECT count(*) FROM verification_tokens WHERE scanned_count > 0');
    const verifiedTokens = Number(verifiedRes.rows[0].count);

    const expiringRes = await pool.query(
      `SELECT count(*) FROM batches
       WHERE expiry_date >= CURRENT_DATE AND expiry_date <= CURRENT_DATE + INTERVAL '30 days'`
    );
    const expiringSoon = Number(expiringRes.rows[0].count);

    const artisansRes = await pool.query('SELECT count(DISTINCT artisan_name) FROM batches');
    const activeArtisans = Number(artisansRes.rows[0].count);

    return {
      totalBatches,
      totalTokens,
      verifiedTokens,
      expiringSoon,
      activeArtisans
    };
  }
}

export const db = new NeonDatabase();

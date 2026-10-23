import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import pg from 'pg';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env files
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('[Migration] Error: DATABASE_URL is not set.');
  process.exit(1);
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

export async function runMigration() {
  console.log('[Migration] Starting Neon PostgreSQL schema migration and data seeding...');
  const client = await pool.connect();

  try {
    // 1. Run schema.sql
    console.log('[Migration] Applying SQL schema...');
    const schemaSql = fs.readFileSync(path.join(__dirname, 'sql', 'schema.sql'), 'utf8');
    await client.query(schemaSql);
    console.log('[Migration] Schema created/verified successfully.');

    // 2. Read backup or current db.json
    const dbFile = path.join(__dirname, 'data', 'db.json.backup');
    const fallbackDbFile = path.join(__dirname, 'data', 'db.json');
    const sourceFile = fs.existsSync(dbFile) ? dbFile : fallbackDbFile;

    if (!fs.existsSync(sourceFile)) {
      console.log('[Migration] No JSON database file found to migrate. Migration complete.');
      return;
    }

    const raw = fs.readFileSync(sourceFile, 'utf8');
    const data = JSON.parse(raw);

    // 3. Migrate Users
    console.log(`[Migration] Migrating ${data.users?.length || 0} users...`);
    for (const u of data.users || []) {
      // If password is plain text, hash it with bcrypt
      const isAlreadyHashed = u.password && u.password.startsWith('$2');
      const hashedPassword = isAlreadyHashed ? u.password : bcrypt.hashSync(u.password, 10);

      await client.query(
        `INSERT INTO users (id, email, password, name, role, title, avatar, department, badge_id, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
         ON CONFLICT (id) DO UPDATE SET
           email = EXCLUDED.email,
           password = EXCLUDED.password,
           name = EXCLUDED.name,
           role = EXCLUDED.role,
           title = EXCLUDED.title,
           avatar = EXCLUDED.avatar,
           department = EXCLUDED.department,
           badge_id = EXCLUDED.badge_id`,
        [u.id, u.email, hashedPassword, u.name, u.role, u.title, u.avatar, u.department, u.badgeId]
      );
    }

    // 4. Migrate Registered Cows
    console.log(`[Migration] Migrating ${data.registeredCows?.length || 0} cows...`);
    for (const c of data.registeredCows || []) {
      await client.query(
        `INSERT INTO registered_cows (id, name, breed, age, yield, butterfat, pasture, organic_certified)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           breed = EXCLUDED.breed,
           age = EXCLUDED.age,
           yield = EXCLUDED.yield,
           butterfat = EXCLUDED.butterfat,
           pasture = EXCLUDED.pasture,
           organic_certified = EXCLUDED.organic_certified`,
        [c.id, c.name, c.breed, c.age, c.yield, c.butterfat, c.pasture, c.organicCertified !== false]
      );
    }

    // 5. Migrate Registered Artisans
    console.log(`[Migration] Migrating ${data.registeredArtisans?.length || 0} artisans...`);
    for (const a of data.registeredArtisans || []) {
      await client.query(
        `INSERT INTO registered_artisans (id, name, experience, specialty, facility, contact)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET
           name = EXCLUDED.name,
           experience = EXCLUDED.experience,
           specialty = EXCLUDED.specialty,
           facility = EXCLUDED.facility,
           contact = EXCLUDED.contact`,
        [a.id, a.name, a.experience, a.specialty, a.facility, a.contact]
      );
    }

    // 6. Migrate Batches
    console.log(`[Migration] Migrating ${data.batches?.length || 0} batches...`);
    for (const b of data.batches || []) {
      const cowIds = Array.isArray(b.sourceCowIds)
        ? b.sourceCowIds
        : (b.sourceCowIds ? b.sourceCowIds.split(',').map(s => s.trim()) : []);

      await client.query(
        `INSERT INTO batches (
           id, batch_number, product_name, product_type, artisan_name, artisan_id, artisan_facility,
           source_cow_ids, manufacturing_date, expiry_date, quantity, unit, status, notes,
           quality_score, fat_content, moisture_content, token_count, created_at, created_by,
           updated_at, updated_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
         ON CONFLICT (id) DO UPDATE SET
           batch_number = EXCLUDED.batch_number,
           product_name = EXCLUDED.product_name,
           product_type = EXCLUDED.product_type,
           artisan_name = EXCLUDED.artisan_name,
           artisan_id = EXCLUDED.artisan_id,
           artisan_facility = EXCLUDED.artisan_facility,
           source_cow_ids = EXCLUDED.source_cow_ids,
           manufacturing_date = EXCLUDED.manufacturing_date,
           expiry_date = EXCLUDED.expiry_date,
           quantity = EXCLUDED.quantity,
           unit = EXCLUDED.unit,
           status = EXCLUDED.status,
           notes = EXCLUDED.notes,
           quality_score = EXCLUDED.quality_score,
           fat_content = EXCLUDED.fat_content,
           moisture_content = EXCLUDED.moisture_content,
           token_count = EXCLUDED.token_count,
           updated_at = EXCLUDED.updated_at,
           updated_by = EXCLUDED.updated_by`,
        [
          b.id,
          b.batchNumber,
          b.productName,
          b.productType,
          b.artisanName,
          b.artisanId,
          b.artisanFacility,
          cowIds,
          b.manufacturingDate,
          b.expiryDate,
          Number(b.quantity) || 100,
          b.unit || 'Units',
          b.status || 'Active',
          b.notes || '',
          b.qualityScore || '99.0/100',
          b.fatContent || 'N/A',
          b.moistureContent || 'N/A',
          Number(b.tokenCount) || 0,
          b.createdAt || new Date().toISOString(),
          b.createdBy || 'System',
          b.updatedAt || null,
          b.updatedBy || null
        ]
      );
    }

    // 7. Migrate Tokens
    console.log(`[Migration] Migrating ${data.tokens?.length || 0} tokens...`);
    for (const t of data.tokens || []) {
      const tokenHash = crypto.createHash('sha256').update(t.tokenCode).digest('hex');
      await client.query(
        `INSERT INTO verification_tokens (
           id, batch_id, batch_number, token_code, token_hash, verification_url, status,
           scanned_count, first_scanned_at, last_scanned_at, generated_at, generated_by
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
         ON CONFLICT (id) DO UPDATE SET
           batch_id = EXCLUDED.batch_id,
           batch_number = EXCLUDED.batch_number,
           token_code = EXCLUDED.token_code,
           token_hash = EXCLUDED.token_hash,
           verification_url = EXCLUDED.verification_url,
           status = EXCLUDED.status,
           scanned_count = EXCLUDED.scanned_count,
           first_scanned_at = EXCLUDED.first_scanned_at,
           last_scanned_at = EXCLUDED.last_scanned_at`,
        [
          t.id,
          t.batchId,
          t.batchNumber,
          t.tokenCode,
          tokenHash,
          t.verificationUrl,
          t.status || 'Active',
          Number(t.scannedCount) || 0,
          t.lastScannedAt || null,
          t.lastScannedAt || null,
          t.generatedAt || new Date().toISOString(),
          t.generatedBy || 'Supervisor'
        ]
      );
    }

    // 8. Migrate Audit Logs
    console.log(`[Migration] Migrating ${data.auditLogs?.length || 0} audit logs...`);
    for (const l of data.auditLogs || []) {
      await client.query(
        `INSERT INTO audit_logs (id, timestamp, user_name, role, action, details)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO NOTHING`,
        [l.id, l.timestamp || new Date().toISOString(), l.user, l.role, l.action, l.details]
      );
    }

    console.log('[Migration] All sample data successfully migrated to Neon PostgreSQL!');
  } catch (err) {
    console.error('[Migration] Migration error:', err);
    throw err;
  } finally {
    client.release();
  }
}

// Allow direct CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runMigration()
    .then(() => {
      console.log('[Migration] Done.');
      pool.end();
      process.exit(0);
    })
    .catch((err) => {
      console.error('[Migration] Fatal error:', err);
      pool.end();
      process.exit(1);
    });
}

import assert from 'assert';
import { db } from '../server/db.js';
import QRCode from 'qrcode';

console.log('--- Starting Integration Test Suite ---');

// 1. Test Seed Data & Auth
console.log('1. Testing Authentication...');
const manager = db.authenticate('manager@veridairy.com', 'manager123');
assert(manager, 'Manager auth should succeed');
assert.strictEqual(manager.role, 'Manager');
assert.strictEqual(manager.name, 'Eleanor Vance');

const supervisor = db.authenticate('supervisor@veridairy.com', 'super123');
assert(supervisor, 'Supervisor auth should succeed');
assert.strictEqual(supervisor.role, 'Supervisor');

const invalid = db.authenticate('manager@veridairy.com', 'wrongpassword');
assert.strictEqual(invalid, null, 'Invalid password should fail');
console.log('✓ Authentication verified.');

// 2. Test Batches Querying & Filtering
console.log('2. Testing Batches Retrieval & Filter...');
const allBatches = db.getBatches();
assert(allBatches.length >= 4, 'Should have initial seed batches');
console.log(`✓ Fetched ${allBatches.length} batches.`);

const gheeBatches = db.getBatches({ productType: 'Ghee' });
assert(gheeBatches.length >= 1, 'Should filter by Ghee');
assert(gheeBatches.every(b => b.productType === 'Ghee'));
console.log('✓ Filter by Product Type verified.');

// 3. Test Batch Creation
console.log('3. Testing Batch Creation...');
const newBatchData = {
  batchNumber: 'BATCH-2026-TEST01',
  productName: 'Organic Cultured Bilona Ghee (Test Batch)',
  productType: 'Ghee',
  artisanName: 'Ramesh Patel',
  artisanId: 'ART-101',
  artisanFacility: 'Hearth Chamber #2',
  sourceCowIds: ['COW-101', 'COW-104', 'COW-209'],
  manufacturingDate: '2026-10-24',
  expiryDate: '2027-10-24',
  quantity: 200,
  unit: 'Jars (500ml)',
  status: 'In Production',
  notes: 'Slow simmered test ghee batch'
};

const created = db.createBatch(newBatchData, manager);
assert(created.id, 'Batch should have ID');
assert.strictEqual(created.batchNumber, 'BATCH-2026-TEST01');
assert.deepStrictEqual(created.sourceCowIds, ['COW-101', 'COW-104', 'COW-209']);
console.log(`✓ Created batch: ${created.batchNumber}`);

// 4. Test Batch Editing
console.log('4. Testing Batch Editing...');
const updated = db.updateBatch(created.id, {
  status: 'Quality Approved',
  qualityScore: '99.8/100',
  notes: 'Updated QA certified'
}, manager);
assert.strictEqual(updated.status, 'Quality Approved');
assert.strictEqual(updated.qualityScore, '99.8/100');
console.log('✓ Batch updated successfully.');

// 5. Test Token Generation
console.log('5. Testing Unique Verification Token Generation...');
const tokens = db.generateTokens(created.id, 50, supervisor);
assert.strictEqual(tokens.length, 50, 'Should generate exactly 50 tokens');

// Ensure all tokens are unique
const tokenCodes = tokens.map(t => t.tokenCode);
const uniqueCodes = new Set(tokenCodes);
assert.strictEqual(tokenCodes.length, uniqueCodes.size, 'All generated token codes must be unique');
assert(tokenCodes[0].startsWith('VD-'), 'Token format must have VD- prefix');
console.log(`✓ Generated ${tokens.length} collision-free tokens. Sample: ${tokenCodes[0]}`);

// 6. Test Consumer Verification
console.log('6. Testing Consumer Token Verification...');
const sampleToken = tokenCodes[0];
const verifyResult = db.verifyToken(sampleToken);
assert.strictEqual(verifyResult.valid, true, 'Token must be valid');
assert.strictEqual(verifyResult.batch.id, created.id);
assert.strictEqual(verifyResult.token.scannedCount, 1);
assert.strictEqual(verifyResult.token.status, 'Verified');
assert(verifyResult.cowDetails.length > 0, 'Should return matched cow details');
console.log(`✓ Token verified: Product="${verifyResult.batch.productName}", Cows=${verifyResult.cowDetails.map(c => c.name).join(', ')}`);

// 7. Test QR Code Generation
console.log('7. Testing QR Code Rendering...');
const qrDataUrl = await QRCode.toDataURL(tokens[0].verificationUrl, { width: 300 });
assert(qrDataUrl.startsWith('data:image/png;base64,'), 'QR Data URL must be valid PNG');
console.log('✓ QR code successfully generated as PNG data URL.');

// 8. Test Stats & Audit Logs
console.log('8. Testing Stats & Audit Logs...');
const stats = db.getStats();
assert(stats.totalBatches >= 5);
assert(stats.totalTokens >= 50);

const logs = db.getAuditLogs();
assert(logs.length >= 3);
assert(logs.some(l => l.action === 'TOKENS_GENERATED'));
console.log(`✓ Audit log verified (${logs.length} logged entries).`);

// Clean up test batch
db.deleteBatch(created.id, manager);
console.log('✓ Cleaned up test batch.');

console.log('--- ALL INTEGRATION TESTS PASSED PERFECTLY! ---');

import assert from 'assert';
import { db, pool } from '../server/db.js';
import QRCode from 'qrcode';

console.log('--- Starting Integration Test Suite (Neon PostgreSQL) ---');

try {
  // 1. Test Seed Data & Auth
  console.log('1. Testing Authentication...');
  const managerAuth = await db.authenticate('manager@veridairy.com', 'manager123');
  assert(managerAuth, 'Manager auth should succeed');
  assert(managerAuth.token, 'Auth should return signed JWT token');
  assert.strictEqual(managerAuth.user.role, 'Manager');
  assert.strictEqual(managerAuth.user.name, 'Eleanor Vance');

  const supervisorAuth = await db.authenticate('supervisor@veridairy.com', 'super123');
  assert(supervisorAuth, 'Supervisor auth should succeed');
  assert.strictEqual(supervisorAuth.user.role, 'Supervisor');

  const invalid = await db.authenticate('manager@veridairy.com', 'wrongpassword');
  assert.strictEqual(invalid, null, 'Invalid password should fail');
  console.log('✓ Authentication verified with secure password hashing and JWT.');

  // 2. Test Batches Querying & Filtering
  console.log('2. Testing Batches Retrieval & Filter...');
  const allBatches = await db.getBatches();
  assert(allBatches.length >= 4, 'Should have initial seed batches');
  console.log(`✓ Fetched ${allBatches.length} batches.`);

  const gheeBatches = await db.getBatches({ productType: 'Ghee' });
  assert(gheeBatches.length >= 1, 'Should filter by Ghee');
  assert(gheeBatches.every(b => b.productType === 'Ghee'));
  console.log('✓ Filter by Product Type verified.');

  // 3. Test Batch Creation
  console.log('3. Testing Batch Creation...');
  // Ensure previous test artifacts are cleared
  await pool.query('DELETE FROM batches WHERE batch_number LIKE $1', ['BATCH-2026-TEST%']);

  const testBatchNumber = `BATCH-2026-TEST-${Date.now()}`;
  const newBatchData = {
    batchNumber: testBatchNumber,
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

  const created = await db.createBatch(newBatchData, managerAuth.user);
  assert(created.id, 'Batch should have ID');
  assert.strictEqual(created.batchNumber, testBatchNumber);
  assert.deepStrictEqual(created.sourceCowIds, ['COW-101', 'COW-104', 'COW-209']);
  console.log(`✓ Created batch: ${created.batchNumber}`);

  // 4. Test Batch Editing
  console.log('4. Testing Batch Editing...');
  const updated = await db.updateBatch(created.id, {
    status: 'Quality Approved',
    qualityScore: '99.8/100',
    notes: 'Updated QA certified'
  }, managerAuth.user);
  assert.strictEqual(updated.status, 'Quality Approved');
  assert.strictEqual(updated.qualityScore, '99.8/100');
  console.log('✓ Batch updated successfully.');

  // 5. Test Token Generation
  console.log('5. Testing Unique Verification Token Generation...');
  const tokens = await db.generateTokens(created.id, 50, supervisorAuth.user);
  assert.strictEqual(tokens.length, 50, 'Should generate exactly 50 tokens');

  // Ensure all tokens are unique
  const tokenCodes = tokens.map(t => t.tokenCode);
  const uniqueCodes = new Set(tokenCodes);
  assert.strictEqual(tokenCodes.length, uniqueCodes.size, 'All generated token codes must be unique');
  assert(tokenCodes[0].startsWith('VD-'), 'Token format must have VD- prefix');
  assert(tokens[0].tokenHash, 'Token must have SHA-256 hash stored');
  console.log(`✓ Generated ${tokens.length} collision-free tokens. Sample: ${tokenCodes[0]}`);

  // 6. Test Consumer Verification (First Scan)
  console.log('6. Testing Consumer Token Verification (First Scan)...');
  const sampleToken = tokenCodes[0];
  const firstScanResult = await db.verifyToken(sampleToken, { ip: '127.0.0.1', userAgent: 'TestRunner/1.0' });
  assert.strictEqual(firstScanResult.valid, true, 'Token must be valid');
  assert.strictEqual(firstScanResult.isFirstScan, true, 'First scan must be identified as first scan');
  assert.strictEqual(firstScanResult.batch.id, created.id);
  assert.strictEqual(firstScanResult.token.scannedCount, 1);
  assert.strictEqual(firstScanResult.token.status, 'Verified');
  assert(firstScanResult.disclaimer, 'Response must include evidence disclaimer');
  assert(firstScanResult.cowDetails.length > 0, 'Should return matched cow details');
  console.log(`✓ First token scan verified: Product="${firstScanResult.batch.productName}", Cows=${firstScanResult.cowDetails.map(c => c.name).join(', ')}`);

  // 6b. Test Repeat Scan (Shows original first verification time)
  console.log('6b. Testing Repeat Verification Scan...');
  const repeatScanResult = await db.verifyToken(sampleToken, { ip: '127.0.0.1', userAgent: 'TestRunner/1.0' });
  assert.strictEqual(repeatScanResult.valid, true);
  assert.strictEqual(repeatScanResult.isFirstScan, false, 'Second scan should not be marked as first scan');
  assert.strictEqual(repeatScanResult.scannedCount, 2);
  assert.strictEqual(repeatScanResult.firstScannedAt, firstScanResult.firstScannedAt, 'Original first scanned time must be preserved');
  console.log(`✓ Repeat verification verified (Scan count: ${repeatScanResult.scannedCount}, Original First Scan: ${repeatScanResult.firstScannedAt})`);

  // 6c. Test Invalid Token
  console.log('6c. Testing Invalid Token Verification...');
  const invalidScanResult = await db.verifyToken('VD-INVALID-TOKEN-9999');
  assert.strictEqual(invalidScanResult.valid, false, 'Invalid token must return valid: false');
  assert(invalidScanResult.disclaimer, 'Invalid token response must still include evidence disclaimer');
  console.log('✓ Invalid token rejection verified.');

  // 6d. Test Concurrent Scans
  console.log('6d. Testing Concurrent Verification Requests...');
  const concurrentToken = tokenCodes[1];
  const concurrentPromises = [
    db.verifyToken(concurrentToken, { ip: '10.0.0.1' }),
    db.verifyToken(concurrentToken, { ip: '10.0.0.2' }),
    db.verifyToken(concurrentToken, { ip: '10.0.0.3' })
  ];
  const concurrentResults = await Promise.all(concurrentPromises);
  assert(concurrentResults.every(r => r.valid === true));
  const latestToken = await db.verifyToken(concurrentToken, { ip: '10.0.0.4' });
  assert.strictEqual(latestToken.scannedCount, 4, 'Atomic locks must ensure all 4 scans are counted accurately without race conditions');
  console.log('✓ Concurrent verification race-condition safety verified.');

  // 7. Test QR Code Generation
  console.log('7. Testing QR Code Rendering...');
  const qrDataUrl = await QRCode.toDataURL(tokens[0].verificationUrl, { width: 300 });
  assert(qrDataUrl.startsWith('data:image/png;base64,'), 'QR Data URL must be valid PNG');
  console.log('✓ QR code successfully generated as PNG data URL.');

  // 8. Test Stats & Audit Logs
  console.log('8. Testing Stats & Audit Logs...');
  const stats = await db.getStats();
  assert(stats.totalBatches >= 5);
  assert(stats.totalTokens >= 50);

  const logs = await db.getAuditLogs();
  assert(logs.length >= 3);
  assert(logs.some(l => l.action === 'TOKENS_GENERATED'));
  console.log(`✓ Audit log verified (${logs.length} logged entries).`);

  // Clean up test batch
  await db.deleteBatch(created.id, managerAuth.user);
  console.log('✓ Cleaned up test batch.');

  console.log('--- ALL INTEGRATION TESTS PASSED PERFECTLY ON NEON POSTGRESQL! ---');
} catch (err) {
  console.error('Integration test failed:', err);
  process.exit(1);
} finally {
  await pool.end();
}

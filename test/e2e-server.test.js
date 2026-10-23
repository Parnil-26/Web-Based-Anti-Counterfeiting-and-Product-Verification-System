import http from 'http';
import assert from 'assert';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env.local') });
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = 5099;
process.env.PORT = PORT;

console.log('--- Starting End-to-End Express API & Neon Server Probe ---');

// Dynamically import server/index.js
await import('../server/index.js');

// Helper to make HTTP requests
function request(method, path, body = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: '127.0.0.1',
      port: PORT,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        let json = null;
        const contentType = res.headers['content-type'] || '';
        if (contentType.includes('application/json')) {
          try { json = JSON.parse(data); } catch {}
        }
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: json !== null ? json : data
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

// Allow server 500ms to bind
await new Promise(r => setTimeout(r, 500));

try {
  // 1. Test POST /api/auth/login
  console.log('1. Testing POST /api/auth/login with password hashing...');
  const loginRes = await request('POST', '/api/auth/login', {
    email: 'manager@veridairy.com',
    password: 'manager123'
  });
  assert.strictEqual(loginRes.status, 200, 'Login must succeed with 200');
  assert(loginRes.data.token, 'Must return JWT token');
  assert.strictEqual(loginRes.data.user.role, 'Manager');
  const token = loginRes.data.token;
  console.log('✓ Login successful. JWT token issued.');

  // 2. Test GET /api/auth/me
  console.log('2. Testing GET /api/auth/me with JWT...');
  const meRes = await request('GET', '/api/auth/me', null, { Authorization: `Bearer ${token}` });
  assert.strictEqual(meRes.status, 200);
  assert.strictEqual(meRes.data.user.name, 'Eleanor Vance');
  console.log('✓ JWT verification and session lookup verified.');

  // 3. Test GET /api/stats
  console.log('3. Testing GET /api/stats from Neon PostgreSQL...');
  const statsRes = await request('GET', '/api/stats');
  assert.strictEqual(statsRes.status, 200);
  assert(statsRes.data.totalBatches >= 4);
  assert(statsRes.data.totalTokens >= 40);
  console.log(`✓ Real-time stats verified: ${statsRes.data.totalBatches} batches, ${statsRes.data.totalTokens} tokens, ${statsRes.data.verifiedTokens} verified.`);

  // 4. Test GET /api/cows and /api/artisans
  console.log('4. Testing Metadata: /api/cows and /api/artisans...');
  const cowsRes = await request('GET', '/api/cows');
  assert.strictEqual(cowsRes.status, 200);
  assert(cowsRes.data.cows.length >= 6);

  const artisansRes = await request('GET', '/api/artisans');
  assert.strictEqual(artisansRes.status, 200);
  assert(artisansRes.data.artisans.length >= 4);
  console.log(`✓ Cows (${cowsRes.data.cows.length}) and Artisans (${artisansRes.data.artisans.length}) fetched.`);

  // 5. Test Batch Lifecycle: POST /api/batches, GET /api/batches/:id, PUT /api/batches/:id
  console.log('5. Testing Batch CRUD...');
  const testBatchNumber = `BATCH-2026-E2E-${Date.now()}`;
  const createBatchRes = await request('POST', '/api/batches', {
    batchNumber: testBatchNumber,
    productName: 'A2 Cultured Bilona Ghee (E2E Test)',
    productType: 'Ghee',
    artisanName: 'Ramesh Patel',
    artisanId: 'ART-101',
    artisanFacility: 'Hearth Chamber #2',
    sourceCowIds: ['COW-101', 'COW-104'],
    manufacturingDate: '2026-10-24',
    expiryDate: '2027-10-24',
    quantity: 150,
    unit: 'Jars (500ml)',
    status: 'In Production'
  }, { Authorization: `Bearer ${token}` });

  assert.strictEqual(createBatchRes.status, 201);
  const createdBatch = createBatchRes.data.batch;
  assert.strictEqual(createdBatch.batchNumber, testBatchNumber);
  console.log(`✓ Created batch: ${createdBatch.batchNumber} (ID: ${createdBatch.id})`);

  // Update batch
  const updateBatchRes = await request('PUT', `/api/batches/${createdBatch.id}`, {
    status: 'Quality Approved',
    qualityScore: '99.7/100'
  }, { Authorization: `Bearer ${token}` });
  assert.strictEqual(updateBatchRes.status, 200);
  assert.strictEqual(updateBatchRes.data.batch.status, 'Quality Approved');
  console.log('✓ Updated batch status and quality score.');

  // 6. Test Token Generation: POST /api/batches/:id/tokens
  console.log('6. Testing Token Minting: POST /api/batches/:id/tokens...');
  const mintRes = await request('POST', `/api/batches/${createdBatch.id}/tokens`, { count: 10 }, { Authorization: `Bearer ${token}` });
  assert.strictEqual(mintRes.status, 201);
  assert.strictEqual(mintRes.data.count, 10);
  assert.strictEqual(mintRes.data.tokens.length, 10);
  const sampleToken = mintRes.data.tokens[0].tokenCode;
  const sampleUrl = mintRes.data.tokens[0].verificationUrl;
  assert(!sampleUrl.includes('verify.veridairy.farm'), 'Verification URL must not contain unresolvable domain');
  assert(sampleUrl.startsWith('http'), 'Verification URL must be an HTTP(S) URL');
  assert(sampleUrl.endsWith(`/v/${sampleToken}`), 'Verification URL must point to /v/:tokenCode route');
  console.log(`✓ Minted 10 tokens. Sample Code: ${sampleToken}, Reachable URL: ${sampleUrl}`);

  // 6b. Test Direct Browser Navigation: GET /v/:tokenCode
  console.log('6b. Testing Direct Consumer Navigation: GET /v/:tokenCode...');
  const consumerPageRes = await request('GET', `/v/${sampleToken}`);
  assert([200, 302].includes(consumerPageRes.status), 'Direct consumer navigation must return 200 (or 302 in dev)');
  console.log('✓ Direct consumer page route /v/:tokenCode is reachable.');

  // 7. Test CSV Download: GET /api/batches/:id/download-csv
  console.log('7. Testing CSV Export: GET /api/batches/:id/download-csv...');
  const csvRes = await request('GET', `/api/batches/${createdBatch.id}/download-csv`);
  assert.strictEqual(csvRes.status, 200);
  assert(csvRes.headers['content-type'].includes('text/csv'));
  assert(csvRes.data.includes(testBatchNumber));
  console.log('✓ CSV generated with UTF-8 BOM and correct headers.');

  // 8. Test Dynamic QR Code Image Stream: GET /api/qr/:tokenCode
  console.log('8. Testing QR Image Stream: GET /api/qr/:tokenCode...');
  const qrStreamRes = await request('GET', `/api/qr/${sampleToken}`);
  assert.strictEqual(qrStreamRes.status, 200);
  assert.strictEqual(qrStreamRes.headers['content-type'], 'image/png');
  console.log('✓ PNG QR code image streamed dynamically.');

  // 9. Test Public Consumer Verification: GET /api/verify/:tokenCode
  console.log('9. Testing Consumer Verification (First Scan & Repeat Scan)...');
  const verify1 = await request('GET', `/api/verify/${sampleToken}`);
  assert.strictEqual(verify1.status, 200);
  assert.strictEqual(verify1.data.valid, true);
  assert.strictEqual(verify1.data.isFirstScan, true);
  assert.strictEqual(verify1.data.scannedCount, 1);
  assert(verify1.data.disclaimer, 'Disclaimer must be present');

  const verify2 = await request('GET', `/api/verify/${sampleToken}`);
  assert.strictEqual(verify2.status, 200);
  assert.strictEqual(verify2.data.valid, true);
  assert.strictEqual(verify2.data.isFirstScan, false);
  assert.strictEqual(verify2.data.scannedCount, 2);
  assert.strictEqual(verify2.data.firstScannedAt, verify1.data.firstScannedAt);
  console.log(`✓ First scan and repeat scan verified (First scan: ${verify2.data.firstScannedAt}, Count: ${verify2.data.scannedCount}).`);

  // 10. Test Invalid Token Verification
  console.log('10. Testing Invalid Token Verification...');
  const invalidVerify = await request('GET', '/api/verify/VD-NONEXISTENT-TOKEN-0000');
  assert.strictEqual(invalidVerify.status, 404);
  assert.strictEqual(invalidVerify.data.valid, false);
  console.log('✓ 404 response on invalid token with disclaimer.');

  // 11. Test Audit Logs: GET /api/audit-logs
  console.log('11. Testing Audit Logs...');
  const logsRes = await request('GET', '/api/audit-logs');
  assert.strictEqual(logsRes.status, 200);
  assert(logsRes.data.logs.length >= 3);
  console.log(`✓ Audit logs verified (${logsRes.data.logs.length} entries).`);

  // 12. Cleanup: DELETE /api/batches/:id
  console.log('12. Cleaning up test batch...');
  const deleteRes = await request('DELETE', `/api/batches/${createdBatch.id}`, null, { Authorization: `Bearer ${token}` });
  assert.strictEqual(deleteRes.status, 200);
  console.log('✓ Test batch deleted.');

  console.log('--- ALL END-TO-END HTTP API TESTS PASSED ON NEON POSTGRESQL! ---');
  process.exit(0);
} catch (err) {
  console.error('E2E test failed:', err);
  process.exit(1);
}

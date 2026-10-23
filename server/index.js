import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import QRCode from 'qrcode';
import { db } from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Helper middleware for mock auth
function getAuthUser(req) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const userId = authHeader.substring(7);
    return db.getUserById(userId);
  }
  return null;
}

// -----------------------------------------------------------------------------
// Auth Endpoints
// -----------------------------------------------------------------------------
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = db.authenticate(email, password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Token is user.id for simple mock session
  res.json({
    token: user.id,
    user
  });
});

app.get('/api/auth/me', (req, res) => {
  const user = getAuthUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  res.json({ user });
});

// -----------------------------------------------------------------------------
// Batches Endpoints
// -----------------------------------------------------------------------------
app.get('/api/batches', (req, res) => {
  const { search, productType, status, sortBy, sortOrder } = req.query;
  const batches = db.getBatches({ search, productType, status, sortBy, sortOrder });
  res.json({ batches });
});

app.get('/api/batches/:id', (req, res) => {
  const batch = db.getBatchById(req.params.id);
  if (!batch) {
    return res.status(404).json({ error: 'Batch not found' });
  }
  res.json({ batch });
});

app.post('/api/batches', (req, res) => {
  const user = getAuthUser(req);
  const {
    productName,
    productType,
    artisanName,
    sourceCowIds,
    manufacturingDate,
    expiryDate
  } = req.body;

  // Validation
  if (!productName || !productType || !artisanName || !manufacturingDate || !expiryDate) {
    return res.status(400).json({
      error: 'Product name, product type, artisan details, manufacturing date, and expiry date are required.'
    });
  }

  const mfg = new Date(manufacturingDate);
  const exp = new Date(expiryDate);
  if (isNaN(mfg.getTime()) || isNaN(exp.getTime())) {
    return res.status(400).json({ error: 'Invalid date format provided.' });
  }

  if (exp <= mfg) {
    return res.status(400).json({ error: 'Expiry date must be after manufacturing date.' });
  }

  try {
    const newBatch = db.createBatch(req.body, user);
    res.status(201).json({ batch: newBatch, message: 'Product batch created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to create batch' });
  }
});

app.put('/api/batches/:id', (req, res) => {
  const user = getAuthUser(req);
  const { manufacturingDate, expiryDate } = req.body;

  if (manufacturingDate && expiryDate) {
    const mfg = new Date(manufacturingDate);
    const exp = new Date(expiryDate);
    if (exp <= mfg) {
      return res.status(400).json({ error: 'Expiry date must be after manufacturing date.' });
    }
  }

  const updated = db.updateBatch(req.params.id, req.body, user);
  if (!updated) {
    return res.status(404).json({ error: 'Batch not found' });
  }

  res.json({ batch: updated, message: 'Batch updated successfully' });
});

app.delete('/api/batches/:id', (req, res) => {
  const user = getAuthUser(req);
  const success = db.deleteBatch(req.params.id, user);
  if (!success) {
    return res.status(404).json({ error: 'Batch not found' });
  }
  res.json({ message: 'Batch deleted successfully' });
});

// -----------------------------------------------------------------------------
// Verification Token Generation & Management
// -----------------------------------------------------------------------------
app.post('/api/batches/:id/tokens', (req, res) => {
  const user = getAuthUser(req);
  const { count } = req.body;
  const numTokens = parseInt(count, 10);

  if (!numTokens || numTokens < 1 || numTokens > 1000) {
    return res.status(400).json({ error: 'Token count must be a number between 1 and 1000.' });
  }

  try {
    const tokens = db.generateTokens(req.params.id, numTokens, user);
    res.status(201).json({
      message: `Successfully generated ${tokens.length} verification tokens`,
      count: tokens.length,
      tokens
    });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

app.get('/api/batches/:id/tokens', (req, res) => {
  const tokens = db.getTokensForBatch(req.params.id);
  res.json({ count: tokens.length, tokens });
});

// -----------------------------------------------------------------------------
// CSV Download Endpoint
// -----------------------------------------------------------------------------
app.get('/api/batches/:id/download-csv', (req, res) => {
  const batch = db.getBatchById(req.params.id);
  if (!batch) {
    return res.status(404).send('Batch not found');
  }

  const tokens = db.getTokensForBatch(batch.id);
  
  // Format as CSV
  const headers = [
    'Token Code',
    'Batch Number',
    'Product Name',
    'Product Type',
    'Artisan Name',
    'Artisan ID',
    'Artisan Facility',
    'Source Cow IDs',
    'Manufacturing Date',
    'Expiry Date',
    'Net Weight/Unit',
    'Status',
    'Verification URL',
    'Generated At',
    'Generated By'
  ];

  const rows = tokens.length > 0 ? tokens.map(t => [
    `"${t.tokenCode}"`,
    `"${batch.batchNumber}"`,
    `"${batch.productName.replace(/"/g, '""')}"`,
    `"${batch.productType}"`,
    `"${batch.artisanName.replace(/"/g, '""')}"`,
    `"${batch.artisanId}"`,
    `"${batch.artisanFacility.replace(/"/g, '""')}"`,
    `"${batch.sourceCowIds.join('; ')}"`,
    `"${batch.manufacturingDate}"`,
    `"${batch.expiryDate}"`,
    `"${batch.unit || ''}"`,
    `"${t.status}"`,
    `"${t.verificationUrl}"`,
    `"${t.generatedAt}"`,
    `"${t.generatedBy}"`
  ]) : [
    // If no tokens yet, output batch metadata row
    [
      `"NO_TOKENS_YET"`,
      `"${batch.batchNumber}"`,
      `"${batch.productName.replace(/"/g, '""')}"`,
      `"${batch.productType}"`,
      `"${batch.artisanName.replace(/"/g, '""')}"`,
      `"${batch.artisanId}"`,
      `"${batch.artisanFacility.replace(/"/g, '""')}"`,
      `"${batch.sourceCowIds.join('; ')}"`,
      `"${batch.manufacturingDate}"`,
      `"${batch.expiryDate}"`,
      `"${batch.unit || ''}"`,
      `"${batch.status}"`,
      `"N/A"`,
      `"${batch.createdAt}"`,
      `"${batch.createdBy}"`
    ]
  ];

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const filename = `${batch.batchNumber}-Verification-Tokens.csv`;

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.status(200).send(csvContent);
});

// -----------------------------------------------------------------------------
// QR Data Payload (for client or server QR generation)
// -----------------------------------------------------------------------------
app.get('/api/batches/:id/qr-bundle', async (req, res) => {
  const batch = db.getBatchById(req.params.id);
  if (!batch) {
    return res.status(404).json({ error: 'Batch not found' });
  }

  const tokens = db.getTokensForBatch(batch.id);
  try {
    // Generate data URLs for each token
    const bundle = await Promise.all(tokens.map(async (t) => {
      const qrDataUrl = await QRCode.toDataURL(t.verificationUrl, {
        errorCorrectionLevel: 'H',
        margin: 2,
        width: 400,
        color: {
          dark: '#14532d',
          light: '#ffffff'
        }
      });
      return {
        tokenCode: t.tokenCode,
        verificationUrl: t.verificationUrl,
        qrDataUrl
      };
    }));

    res.json({
      batchNumber: batch.batchNumber,
      productName: batch.productName,
      count: bundle.length,
      qrItems: bundle
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate QR codes: ' + err.message });
  }
});

// Single QR Image stream endpoint
app.get('/api/qr/:tokenCode', async (req, res) => {
  const token = db.verifyToken(req.params.tokenCode);
  const targetUrl = token.valid ? token.token.verificationUrl : `https://verify.veridairy.farm/v/${req.params.tokenCode}`;
  
  try {
    res.setHeader('Content-Type', 'image/png');
    await QRCode.toFileStream(res, targetUrl, {
      width: 500,
      margin: 2,
      color: {
        dark: '#14532d',
        light: '#ffffff'
      }
    });
  } catch (err) {
    res.status(500).send('QR generation error');
  }
});

// -----------------------------------------------------------------------------
// Consumer Verification Public API
// -----------------------------------------------------------------------------
app.get('/api/verify/:tokenCode', (req, res) => {
  const result = db.verifyToken(req.params.tokenCode);
  if (!result.valid) {
    return res.status(404).json(result);
  }
  res.json(result);
});

// -----------------------------------------------------------------------------
// Ancillary Metadata & Overview Endpoints
// -----------------------------------------------------------------------------
app.get('/api/stats', (req, res) => {
  res.json(db.getStats());
});

app.get('/api/cows', (req, res) => {
  res.json({ cows: db.getCows() });
});

app.get('/api/artisans', (req, res) => {
  res.json({ artisans: db.getArtisans() });
});

app.get('/api/audit-logs', (req, res) => {
  res.json({ logs: db.getAuditLogs() });
});

// Serve static frontend build if present
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  const indexPath = path.join(distPath, 'index.html');
  if (path.extname(req.path)) {
    return res.status(404).end();
  }
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).send('API Server is running on port ' + PORT);
    }
  });
});

app.listen(PORT, () => {
  console.log(`[VeriDairy] Traceability Backend Server running on http://localhost:${PORT}`);
});

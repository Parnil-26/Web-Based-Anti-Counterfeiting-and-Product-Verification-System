import QRCode from 'qrcode';
import JSZip from 'jszip';

export async function downloadQrZipForBatch(batch, tokens, onProgress) {
  if (!tokens || tokens.length === 0) {
    throw new Error('This batch has no verification tokens generated yet. Generate tokens first!');
  }

  const zip = new JSZip();
  const folder = zip.folder(`QR_Codes_${batch.batchNumber}`);
  const total = tokens.length;

  for (let i = 0; i < total; i++) {
    const token = tokens[i];
    // Generate QR as PNG data URL
    const dataUrl = await QRCode.toDataURL(token.verificationUrl, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      margin: 2,
      width: 600,
      color: {
        dark: '#14532d',
        light: '#ffffff'
      }
    });

    // Remove the data URI scheme prefix
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, '');
    folder.file(`${batch.batchNumber}_${token.tokenCode}.png`, base64Data, { base64: true });

    if (onProgress) {
      onProgress(Math.round(((i + 1) / total) * 80)); // 0-80% for generation
    }
  }

  // Add README manifest
  const manifest = `=====================================================
VERIDAIRY TRACEABILITY QR CODE EXPORT
=====================================================
Batch Number:       ${batch.batchNumber}
Product Name:       ${batch.productName}
Product Type:       ${batch.productType}
Artisan:            ${batch.artisanName} (${batch.artisanId})
Source Cows:        ${Array.isArray(batch.sourceCowIds) ? batch.sourceCowIds.join(', ') : batch.sourceCowIds}
Manufacturing Date: ${batch.manufacturingDate}
Expiry Date:        ${batch.expiryDate}
Total Tokens in ZIP:${total}
Exported At:        ${new Date().toISOString()}

PRINTING GUIDELINES:
1. Recommended Label Size: 38mm x 38mm (1.5" x 1.5") minimum for reliable mobile camera scanning.
2. Resolution: 300 DPI or higher.
3. Keep the quiet zone (white border margin) intact.
4. Each QR points to the cryptographic consumer verification page.
`;

  folder.file('README_MANIFEST.txt', manifest);

  if (onProgress) onProgress(90);

  const zipBlob = await zip.generateAsync({ type: 'blob' }, (metadata) => {
    if (onProgress) {
      onProgress(80 + Math.round(metadata.percent * 0.2));
    }
  });

  // Trigger download
  const downloadUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = `${batch.batchNumber}-QRCodes-${total}Count.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);

  if (onProgress) onProgress(100);
}

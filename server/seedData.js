import crypto from 'crypto';

export function generateTokenCode(batchNumber, index) {
  const hash = crypto.randomBytes(4).toString('hex').toUpperCase();
  const cleanBatch = batchNumber.replace(/[^A-Za-z0-9]/g, '').slice(-6);
  return `VD-${cleanBatch}-${hash}-${String(index).padStart(4, '0')}`;
}

export function getInitialData() {
  const users = [
    {
      id: "usr-01",
      email: "manager@veridairy.com",
      password: "manager123",
      name: "Eleanor Vance",
      role: "Manager",
      title: "Operations & Dairy Plant Manager",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
      department: "Production Leadership",
      badgeId: "MGR-0042"
    },
    {
      id: "usr-02",
      email: "supervisor@veridairy.com",
      password: "super123",
      name: "Marcus Thorne",
      role: "Supervisor",
      title: "Floor Quality & Packaging Supervisor",
      avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80",
      department: "Packaging & QA Assurance",
      badgeId: "SUP-0118"
    }
  ];

  const registeredCows = [
    { id: "COW-101", name: "Surabhi", breed: "Gir", age: 4, yield: "13 L/day", butterfat: "4.8%", pasture: "North Meadow Alpha", organicCertified: true },
    { id: "COW-104", name: "Kamadhenu", breed: "Gir", age: 5, yield: "15 L/day", butterfat: "5.1%", pasture: "North Meadow Alpha", organicCertified: true },
    { id: "COW-108", name: "Gauri", breed: "Sahiwal", age: 4, yield: "14 L/day", butterfat: "4.6%", pasture: "Clover Ridge", organicCertified: true },
    { id: "COW-115", name: "Nandini", breed: "Red Sindhi", age: 6, yield: "12 L/day", butterfat: "5.3%", pasture: "Sunburst Hills", organicCertified: true },
    { id: "COW-204", name: "Lakshmi", breed: "Tharparkar", age: 4, yield: "11 L/day", butterfat: "4.7%", pasture: "Herb Garden Paddock", organicCertified: true },
    { id: "COW-209", name: "Amrita", breed: "Gir", age: 5, yield: "16 L/day", butterfat: "5.0%", pasture: "North Meadow Alpha", organicCertified: true }
  ];

  const registeredArtisans = [
    { id: "ART-101", name: "Ramesh Patel", experience: "18 Years", specialty: "Vedic Bilona Churning", facility: "Hearth Chamber #2", contact: "r.patel@auraveridairy.internal" },
    { id: "ART-102", name: "Elena Rossi", experience: "14 Years", specialty: "Aged Raw Farmstead Cheese", facility: "Cellar Aging Vault A", contact: "e.rossi@auraveridairy.internal" },
    { id: "ART-103", name: "Priya Sharma", experience: "11 Years", specialty: "Pure A2 Fresh Dairy & Testing", facility: "Cold Pasteurization Lab", contact: "p.sharma@auraveridairy.internal" },
    { id: "ART-104", name: "Devendra Singh", experience: "22 Years", specialty: "Grass-fed Cultured Butter", facility: "Churn House #1", contact: "d.singh@auraveridairy.internal" }
  ];

  const batches = [
    {
      id: "b-01",
      batchNumber: "BATCH-2026-GH01",
      productName: "A2 Organic Cultured Bilona Ghee",
      productType: "Ghee",
      artisanName: "Ramesh Patel",
      artisanId: "ART-101",
      artisanFacility: "Hearth Chamber #2 (Clay Pot Simmering)",
      sourceCowIds: ["COW-101", "COW-104", "COW-209"],
      manufacturingDate: "2026-10-15",
      expiryDate: "2027-10-15",
      quantity: 250,
      unit: "Jars (500ml)",
      status: "Quality Approved",
      notes: "Traditional curd preparation from whole A2 milk, bilona churned at sunrise, slow simmered over medicinal wood fire.",
      qualityScore: "99.4/100",
      fatContent: "99.8%",
      moistureContent: "0.14%",
      createdAt: "2026-10-15T09:30:00Z",
      createdBy: "Eleanor Vance",
      tokenCount: 15
    },
    {
      id: "b-02",
      batchNumber: "BATCH-2026-CH02",
      productName: "Farmstead Raw Milk Aged Clothbound Cheddar",
      productType: "Cheese",
      artisanName: "Elena Rossi",
      artisanId: "ART-102",
      artisanFacility: "Cellar Aging Vault A",
      sourceCowIds: ["COW-108", "COW-115"],
      manufacturingDate: "2026-08-10",
      expiryDate: "2027-04-10",
      quantity: 120,
      unit: "Wheels (1.2kg)",
      status: "In Production",
      notes: "Clothbound aged for 60 days minimum. Natural microbial cultures with Himalayan pink crystal salt.",
      qualityScore: "98.8/100",
      fatContent: "34.2%",
      moistureContent: "36.5%",
      createdAt: "2026-08-10T08:00:00Z",
      createdBy: "Marcus Thorne",
      tokenCount: 10
    },
    {
      id: "b-03",
      batchNumber: "BATCH-2026-MK03",
      productName: "Single-Herd Pure Gir Cow A2 Whole Milk",
      productType: "Milk",
      artisanName: "Priya Sharma",
      artisanId: "ART-103",
      artisanFacility: "Cold Pasteurization Lab (Gentle 63°C)",
      sourceCowIds: ["COW-101", "COW-104", "COW-108", "COW-204"],
      manufacturingDate: "2026-10-23",
      expiryDate: "2026-10-28",
      quantity: 500,
      unit: "Glass Bottles (1000ml)",
      status: "Active",
      notes: "Non-homogenized natural cream top. Tested 100% negative for A1 beta-casein.",
      qualityScore: "99.9/100",
      fatContent: "4.85%",
      moistureContent: "87.2%",
      createdAt: "2026-10-23T06:15:00Z",
      createdBy: "Eleanor Vance",
      tokenCount: 20
    },
    {
      id: "b-04",
      batchNumber: "BATCH-2026-BT04",
      productName: "Cultured Probiotic Pasture Butter (Unsalted)",
      productType: "Butter",
      artisanName: "Devendra Singh",
      artisanId: "ART-104",
      artisanFacility: "Churn House #1",
      sourceCowIds: ["COW-115", "COW-209"],
      manufacturingDate: "2026-10-20",
      expiryDate: "2027-01-20",
      quantity: 180,
      unit: "Blocks (250g)",
      status: "Quality Approved",
      notes: "Cultured with heirloom mesophilic cultures for 24 hours prior to slow churning.",
      qualityScore: "99.1/100",
      fatContent: "84.5%",
      moistureContent: "15.0%",
      createdAt: "2026-10-20T11:00:00Z",
      createdBy: "Marcus Thorne",
      tokenCount: 12
    }
  ];

  // Pre-generate tokens for seed batches
  const tokens = [];
  batches.forEach(batch => {
    for (let i = 1; i <= batch.tokenCount; i++) {
      const code = generateTokenCode(batch.batchNumber, i);
      tokens.push({
        id: `tok-${batch.id}-${i}`,
        batchId: batch.id,
        batchNumber: batch.batchNumber,
        tokenCode: code,
        verificationUrl: `https://verify.veridairy.farm/v/${code}`,
        status: i === 1 ? "Verified" : "Active",
        scannedCount: i === 1 ? 2 : 0,
        lastScannedAt: i === 1 ? "2026-10-23T14:22:10Z" : null,
        generatedAt: batch.createdAt,
        generatedBy: batch.createdBy
      });
    }
  });

  const auditLogs = [
    {
      id: "log-1",
      timestamp: "2026-10-23T06:15:00Z",
      user: "Eleanor Vance",
      role: "Manager",
      action: "BATCH_CREATED",
      details: "Created Batch BATCH-2026-MK03 (Pure Gir Cow Fresh Milk)"
    },
    {
      id: "log-2",
      timestamp: "2026-10-23T06:20:00Z",
      user: "Eleanor Vance",
      role: "Manager",
      action: "TOKENS_GENERATED",
      details: "Generated 20 unique verification tokens for Batch BATCH-2026-MK03"
    },
    {
      id: "log-3",
      timestamp: "2026-10-23T14:22:10Z",
      user: "System / Consumer QR Scan",
      role: "System",
      action: "TOKEN_VERIFIED",
      details: "Consumer scan verified for token in Batch BATCH-2026-MK03"
    }
  ];

  return { users, registeredCows, registeredArtisans, batches, tokens, auditLogs };
}

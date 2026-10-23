# Web-Based Anti-Counterfeiting and Product Verification System

A web-based product traceability and authenticity verification platform for cow-based organic products.

## Modules Overview

- **Module 1**: Admin Dashboard and Batch Management (Implemented)
- **Module 2**: Secure QR Token Generation & Industrial Label Printing (Implemented)
- **Module 3**: Factory & Quality-Control Operations
- **Module 4**: Consumer Product Verification (Simulated & Implemented)
- **Module 5**: Scan History and Counterfeit Alerts

---

# Module 1 — Admin Dashboard & Batch Traceability System

An enterprise-grade, full-stack traceability system built for artisanal dairy farms (A2 Bilona Ghee, Raw Milk Aged Cheese, Single-Herd A2 Milk, Cultured Probiotic Butter, and Farmstead Paneer).

Module 1 empowers **Managers** and **Supervisors** to maintain provenance records, configure single-herd cow lineage attribution, mint cryptographic verification tokens, and export high-resolution QR codes and CSV files for labeling and packaging.

---

## 🌟 Key Features (Module 1 Requirements)

### 1. Manager & Supervisor Authentication (RBAC)
- **Role-Based Portals**:
  - **Manager** (`Eleanor Vance`): Full production permissions to create, edit, and archive batches, configure facility parameters, and manage audit logs.
  - **Supervisor** (`Marcus Thorne`): Packaging & QA permissions to inspect quality reports, mint verification tokens, download CSVs, and print label sheets.
- **One-Click Demo Switcher**: Pre-configured login presets and on-the-fly role toggle from the navigation bar.

### 2. Batch Lifecycle Management (Create, Edit & View)
- Comprehensive batch dossier with real-time status indicators (`In Production`, `Quality Approved`, `Tokens Generated`, `Dispatched`).
- Table view and Responsive Card Grid view with search, multi-factor filtering (Product Type, Status), and sorting.
- Automated shelf-life tracker alerting managers when batches reach 30 days before expiry.

### 3. Detailed Provenance & Traceability Fields
- **Product Name**: e.g., *A2 Organic Cultured Bilona Ghee*, *Clothbound Aged Farmstead Cheddar*.
- **Product Type**: Ghee, Milk, Cheese, Butter, Paneer, Yogurt/Curd, etc.
- **Artisan Details**: Master Artisan Name, Artisan Employee ID, Facility Chamber (e.g., *Hearth Chamber #2*, *Cellar Vault A*), and craftsmanship notes.
- **Source Cow IDs**: Single-herd cow attribution chips with certified indigenous breed tags (*Gir*, *Sahiwal*, *Red Sindhi*, *Tharparkar*). Interactive tag picker + custom tag creator.
- **Manufacturing Date & Expiry Date**: Integrated date pickers with automatic shelf-life validation (Expiry Date must strictly succeed Manufacturing Date).
- **Lab & Quality Metrics**: Lab Butterfat %, Moisture %, and Quality Audit Score.

### 4. Cryptographic Verification Token Minting
- Mint custom batch quantities of collision-free, high-entropy unique tokens (e.g., `VD-BATCHNO-XXXX-XXXX-XXXX`).
- Real-time token ledger with inspection of individual QR codes and scan audit history.
- **Consumer Verification Simulator**: One-click test to preview exactly what a customer sees upon scanning the QR code on a dairy jar or bottle.

### 5. High-Precision QR Codes & CSV Export for Printing
- **Industrial CSV Export**: UTF-8 BOM encoded CSV format ready for Zebra, Sato, and Brother industrial label printers or spreadsheet analysis.
- **High-Res QR Code ZIP Archive**: Packages 600 DPI PNG images for all batch tokens with a print manifest and instructions.
- **Direct Adhesive Label Sheet Printing**: In-browser print view styled with `@media print` for standard Avery label templates (3x8 / 2x4 grid) featuring scannable QR codes, batch serials, product name, and artisan credit.

---

## 🚀 Quick Start Guide

### 1. Install & Build
```bash
npm install
npm run build
```

### 2. Run the Application
```bash
npm start
```
The server will start at:
👉 **http://localhost:5000**

*(Optional) For hot-reloading development:*
```bash
# Terminal 1: Backend API
npm run dev:server

# Terminal 2: Vite Dev Frontend
npm run dev:client
```

---

## 🔐 Default Test Accounts

| Role | Email | Password | Badge ID |
| :--- | :--- | :--- | :--- |
| **Manager** | `manager@veridairy.com` | `manager123` | `MGR-0042` |
| **Supervisor** | `supervisor@veridairy.com` | `super123` | `SUP-0118` |

*(You can also use the **Quick Role Switcher** dropdown in the top-right corner to instantly toggle accounts during demos!)*

---

## 🛠️ Tech Stack
- **Frontend**: React 18, Tailwind CSS, Lucide React, JSZip, QRCode.js
- **Backend**: Node.js, Express.js REST API
- **Persistence**: File-backed JSON database with persistent atomic writes
- **Build Tool**: Vite 6

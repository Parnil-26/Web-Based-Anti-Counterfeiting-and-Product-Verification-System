-- VeriDairy PostgreSQL Schema v1.0
-- anti-counterfeiting & traceability system

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(64) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  avatar TEXT,
  department VARCHAR(255),
  badge_id VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registered_cows (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  breed VARCHAR(100) NOT NULL,
  age INT NOT NULL,
  yield VARCHAR(50) NOT NULL,
  butterfat VARCHAR(50) NOT NULL,
  pasture VARCHAR(255) NOT NULL,
  organic_certified BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS registered_artisans (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  experience VARCHAR(100),
  specialty VARCHAR(255),
  facility VARCHAR(255),
  contact VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS batches (
  id VARCHAR(64) PRIMARY KEY,
  batch_number VARCHAR(100) UNIQUE NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_type VARCHAR(100) NOT NULL,
  artisan_name VARCHAR(255) NOT NULL,
  artisan_id VARCHAR(64),
  artisan_facility VARCHAR(255),
  source_cow_ids TEXT[] NOT NULL DEFAULT '{}',
  manufacturing_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  quantity INT DEFAULT 100,
  unit VARCHAR(100) DEFAULT 'Units',
  status VARCHAR(50) DEFAULT 'Active',
  notes TEXT,
  quality_score VARCHAR(50) DEFAULT '99.0/100',
  fat_content VARCHAR(50) DEFAULT 'N/A',
  moisture_content VARCHAR(50) DEFAULT 'N/A',
  token_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by VARCHAR(255) DEFAULT 'System',
  updated_at TIMESTAMPTZ,
  updated_by VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS verification_tokens (
  id VARCHAR(128) PRIMARY KEY,
  batch_id VARCHAR(64) REFERENCES batches(id) ON DELETE CASCADE,
  batch_number VARCHAR(100) NOT NULL,
  token_code VARCHAR(128) UNIQUE NOT NULL,
  token_hash VARCHAR(64) NOT NULL,
  verification_url TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'Active',
  scanned_count INT DEFAULT 0,
  first_scanned_at TIMESTAMPTZ,
  last_scanned_at TIMESTAMPTZ,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by VARCHAR(255) DEFAULT 'Supervisor'
);

CREATE TABLE IF NOT EXISTS verification_logs (
  id SERIAL PRIMARY KEY,
  token_code VARCHAR(128) NOT NULL,
  batch_id VARCHAR(64),
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  is_first_scan BOOLEAN DEFAULT FALSE,
  scan_number INT DEFAULT 1,
  ip_address VARCHAR(100),
  user_agent TEXT,
  status VARCHAR(50) NOT NULL,
  disclaimer TEXT DEFAULT 'Cryptographic token validation confirms issuance by VeriDairy. It provides token authenticity evidence rather than absolute physical substance proof.'
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  user_name VARCHAR(255),
  role VARCHAR(100),
  action VARCHAR(100) NOT NULL,
  details TEXT
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_product_type ON batches(product_type);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_batch_id ON verification_tokens(batch_id);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token_code ON verification_tokens(token_code);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token_hash ON verification_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_verification_logs_token_code ON verification_logs(token_code);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

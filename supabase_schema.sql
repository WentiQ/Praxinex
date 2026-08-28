-- =================================================================
-- PRAXINEX AI REVENUE RECOVERY AGENT - DATABASE SCHEMA (SUPABASE / POSTGRESQL)
-- =================================================================
-- Paste this entire script into your Supabase project's SQL Editor and click "Run".
-- =================================================================

-- 1. Merchant Settings & API Credentials
CREATE TABLE IF NOT EXISTS merchant_settings (
  id TEXT PRIMARY KEY DEFAULT 'default_merchant',
  profile JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Recovery Cases
CREATE TABLE IF NOT EXISTS recovery_cases (
  id TEXT PRIMARY KEY,
  customer_name TEXT,
  amount NUMERIC,
  status TEXT DEFAULT 'In progress',
  case_data JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recovery_cases_status ON recovery_cases(status);
CREATE INDEX IF NOT EXISTS idx_recovery_cases_customer ON recovery_cases(customer_name);

-- 3. Activity Audit Trail
CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  case_id TEXT,
  event_title TEXT NOT NULL,
  amount NUMERIC DEFAULT 0,
  result_status TEXT DEFAULT 'info',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  activity_data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_case ON activity_logs(case_id);

-- 4. Payments Ledger
CREATE TABLE IF NOT EXISTS payments_ledger (
  id TEXT PRIMARY KEY,
  razorpay_payment_id TEXT,
  customer_name TEXT,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'succeeded',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  payment_data JSONB NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_payments_ledger_timestamp ON payments_ledger(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_payments_razorpay_id ON payments_ledger(razorpay_payment_id);

-- Enable Row Level Security (RLS) but allow service role & public app operations
-- Enable Row Level Security (RLS) but allow full access for app operations
ALTER TABLE merchant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE recovery_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments_ledger ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public full access on merchant_settings" ON merchant_settings;
DROP POLICY IF EXISTS "Allow public full access on recovery_cases" ON recovery_cases;
DROP POLICY IF EXISTS "Allow public full access on activity_logs" ON activity_logs;
DROP POLICY IF EXISTS "Allow public full access on payments_ledger" ON payments_ledger;

CREATE POLICY "Allow public full access on merchant_settings" ON merchant_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on recovery_cases" ON recovery_cases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on activity_logs" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on payments_ledger" ON payments_ledger FOR ALL USING (true) WITH CHECK (true);

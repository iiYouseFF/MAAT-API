-- ============================================================
-- MAAT Admin Dashboard Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add role column to users
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'role') THEN
    ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'manager'));
  END IF;
END $$;

-- 2. Ensure nfc_cards has registered_by column
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'nfc_cards' AND column_name = 'registered_by') THEN
    ALTER TABLE nfc_cards ADD COLUMN registered_by UUID REFERENCES users(id);
  END IF;
END $$;

-- 3. Ensure nfc_cards user_id is nullable (for unassigned tags)
-- (It should already be nullable from the original schema, but let's be safe)
ALTER TABLE nfc_cards ALTER COLUMN user_id DROP NOT NULL;

-- 4. Create admin_top_up_logs table to track admin top-ups
CREATE TABLE IF NOT EXISTS admin_top_up_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES users(id),
    user_id UUID NOT NULL REFERENCES users(id),
    amount FLOAT NOT NULL,
    payment_method TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_topup_logs_admin ON admin_top_up_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_topup_logs_user ON admin_top_up_logs(user_id);

-- Add tier_history table for tracking admin tier changes
-- Migration: 20240805194000_add_tier_history_table

CREATE TABLE tier_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  from_tier INTEGER NOT NULL,
  to_tier INTEGER NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('upgrade', 'downgrade')),
  reason TEXT,
  performed_by TEXT,
  performed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tier_history_user ON tier_history(user_id);
CREATE INDEX idx_tier_history_performed_at ON tier_history(performed_at);

-- Update tier_upgrades table to include manual_review and denied status
ALTER TABLE tier_upgrades
  ADD COLUMN manual_review TEXT,
  ADD COLUMN denied_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN denied_by TEXT,
  ADD COLUMN downgrade_reason TEXT;

-- Update CHECK constraint for tier_upgrades payment_status
ALTER TABLE tier_upgrades
  DROP CONSTRAINT IF EXISTS tier_upgrades_payment_status_check,
  ADD CONSTRAINT tier_upgrades_payment_status_check
  CHECK (payment_status IN ('pending', 'completed', 'failed', 'expired', 'manual_review', 'denied'));
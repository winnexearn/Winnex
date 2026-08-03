-- Migration: Add 'expired' to tier_upgrades payment_status CHECK constraint
-- Run this in Supabase SQL Editor

ALTER TABLE tier_upgrades DROP CONSTRAINT IF EXISTS tier_upgrades_payment_status_check;

ALTER TABLE tier_upgrades ADD CONSTRAINT tier_upgrades_payment_status_check
  CHECK (payment_status IN ('pending', 'completed', 'failed', 'expired'));

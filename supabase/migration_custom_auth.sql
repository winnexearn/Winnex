-- Winnex Earn Migration: custom auth (no Supabase Auth)
-- Run this in Supabase SQL Editor

-- Add password_hash column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Enforce RLS is bypassed for service role is automatic.
-- The app now uses the service role key server-side only,
-- so existing RLS policies that reference auth.uid() are harmless.
-- Drop them to avoid confusion (optional, service role bypasses RLS anyway):
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Users can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can view own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can insert own withdrawals" ON withdrawals;
DROP POLICY IF EXISTS "Users can view own referrals" ON referrals;
DROP POLICY IF EXISTS "Users can view own upgrades" ON tier_upgrades;
DROP POLICY IF EXISTS "Users can insert own upgrades" ON tier_upgrades;

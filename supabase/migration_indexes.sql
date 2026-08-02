-- Migration: Performance indexes for 50K daily users
-- Run this in Supabase SQL Editor

-- Tasks: unique constraint prevents duplicate completions (race condition safety)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_user_url_unique ON tasks(user_id, content_url) WHERE status = 'completed';

-- Tasks: index for content endpoint (recent completed tasks per user)
CREATE INDEX IF NOT EXISTS idx_tasks_user_completed_recent ON tasks(user_id, status, created_at DESC);

-- Content pool: active videos only (small table, but still benefits)
CREATE INDEX IF NOT EXISTS idx_content_pool_active_type ON content_pool(is_active, content_type);

-- Users: index for login by email (already unique, but explicit)
-- users_email_idx already exists via UNIQUE constraint

-- Withdrawals: admin queries by status
CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON withdrawals(status);

-- Tier upgrades: webhook lookups by squad_ref
CREATE INDEX IF NOT EXISTS idx_tier_upgrades_squad_ref ON tier_upgrades(squad_ref);

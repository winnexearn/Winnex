-- Migration: Add indexes and unique constraint for performance
-- Run this in Supabase SQL Editor

-- Unique constraint: one completed task per user per URL (prevents duplicates from race conditions)
CREATE UNIQUE INDEX IF NOT EXISTS idx_tasks_user_url_unique ON tasks(user_id, content_url) WHERE status = 'completed';

-- Composite index for daily task counting
CREATE INDEX IF NOT EXISTS idx_tasks_user_date_status ON tasks(user_id, created_at, status);

-- Content pool: active videos only
CREATE INDEX IF NOT EXISTS idx_content_pool_active_type ON content_pool(is_active, content_type);

-- Migration: Add squad_ref to tier_upgrades for SquadCo payment tracking
-- Run this in Supabase SQL Editor

ALTER TABLE tier_upgrades ADD COLUMN IF NOT EXISTS squad_ref TEXT;
CREATE INDEX IF NOT EXISTS idx_tier_upgrades_squad_ref ON tier_upgrades(squad_ref);

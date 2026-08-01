-- Winnex Earn Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT UNIQUE NOT NULL,
  account_number TEXT NOT NULL,
  bank_name TEXT DEFAULT 'Nigerian Bank',
  tier INTEGER DEFAULT 1 CHECK (tier IN (1, 2, 3)),
  balance DECIMAL(10,2) DEFAULT 0,
  commission_balance DECIMAL(10,2) DEFAULT 0,
  total_earned DECIMAL(10,2) DEFAULT 0,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES users(id),
  tasks_completed_today INTEGER DEFAULT 0,
  last_task_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  task_type TEXT NOT NULL CHECK (task_type IN ('tiktok_video', 'ad_view')),
  content_url TEXT NOT NULL,
  content_title TEXT,
  reward_amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdrawals table
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  account_number TEXT NOT NULL,
  bank_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tier upgrades table
CREATE TABLE tier_upgrades (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  from_tier INTEGER NOT NULL,
  to_tier INTEGER NOT NULL,
  amount_paid DECIMAL(10,2) NOT NULL,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referrals table
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID REFERENCES users(id) ON DELETE CASCADE,
  referred_id UUID REFERENCES users(id) ON DELETE CASCADE,
  reward_amount DECIMAL(10,2) DEFAULT 500,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Content pool table (for random TikTok videos and ads)
CREATE TABLE content_pool (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL CHECK (content_type IN ('tiktok_video', 'ad')),
  url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily tasks configuration
CREATE TABLE daily_task_limits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tier INTEGER UNIQUE NOT NULL,
  max_tasks INTEGER NOT NULL,
  max_videos INTEGER NOT NULL,
  max_ads INTEGER NOT NULL,
  video_reward DECIMAL(10,2) NOT NULL,
  ad_reward DECIMAL(10,2) NOT NULL
);

-- Insert default tier limits
INSERT INTO daily_task_limits (tier, max_tasks, max_videos, max_ads, video_reward, ad_reward) VALUES
(1, 5, 3, 2, 100, 50),
(2, 8, 6, 2, 200, 100),
(3, 10, 8, 2, 300, 150);

-- Create indexes
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_phone ON users(phone_number);
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_withdrawals_user_id ON withdrawals(user_id);
CREATE INDEX idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX idx_content_pool_type ON content_pool(content_type);
CREATE INDEX idx_content_pool_active ON content_pool(is_active);

-- RLS policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE tier_upgrades ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_pool ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks" ON tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON tasks
  FOR UPDATE USING (auth.uid() = user_id);

-- Withdrawals policies
CREATE POLICY "Users can view own withdrawals" ON withdrawals
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawals" ON withdrawals
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Referrals policies
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Content pool - everyone can read active content
CREATE POLICY "Anyone can view active content" ON content_pool
  FOR SELECT USING (is_active = TRUE);

-- Tier upgrades
CREATE POLICY "Users can view own upgrades" ON tier_upgrades
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own upgrades" ON tier_upgrades
  FOR INSERT WITH CHECK (auth.uid() = user_id);

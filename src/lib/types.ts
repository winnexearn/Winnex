export interface User {
  id: string
  email: string
  full_name: string
  phone_number: string
  account_number: string
  bank_name: string
  tier: 1 | 2 | 3
  balance: number
  commission_balance: number
  total_earned: number
  referral_code: string
  referred_by: string | null
  tasks_completed_today: number
  last_task_date: string | null
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  user_id: string
  task_type: 'tiktok_video'
  content_url: string
  content_title: string | null
  reward_amount: number
  status: 'pending' | 'completed' | 'expired'
  completed_at: string | null
  created_at: string
}

export interface Withdrawal {
  id: string
  user_id: string
  amount: number
  account_number: string
  bank_name: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  processed_at: string | null
  created_at: string
}

export interface TierUpgrade {
  id: string
  user_id: string
  from_tier: number
  to_tier: number
  amount_paid: number
  payment_status: 'pending' | 'completed' | 'failed'
  created_at: string
}

export interface Referral {
  id: string
  referrer_id: string
  referred_id: string
  reward_amount: number
  status: 'pending' | 'completed'
  created_at: string
  referred?: User
}

export interface ContentPool {
  id: string
  content_type: 'tiktok_video'
  url: string
  title: string | null
  description: string | null
  is_active: boolean
  created_at: string
}

export interface TierConfig {
  tier: number
  maxTasks: number
  maxVideos: number
  videoReward: number
  upgradePrice: number
}

export const TIER_CONFIGS: Record<number, TierConfig> = {
  1: {
    tier: 1,
    maxTasks: 5,
    maxVideos: 3,
    videoReward: 100,
    upgradePrice: 0,
  },
  2: {
    tier: 2,
    maxTasks: 8,
    maxVideos: 6,
    videoReward: 200,
    upgradePrice: 1000,
  },
  3: {
    tier: 3,
    maxTasks: 10,
    maxVideos: 8,
    videoReward: 300,
    upgradePrice: 2000,
  },
}

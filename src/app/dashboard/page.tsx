'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { User, Task, TIER_CONFIGS } from '@/lib/types'
import { formatNaira, formatDate } from '@/lib/utils'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const [meRes, tasksRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/tasks'),
    ])

    if (meRes.ok) {
      const me = await meRes.json()
      setUser(me)
    }

    if (tasksRes.ok) {
      const tasks = await tasksRes.json()
      setTodayTasks(tasks)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const tierConfig = user ? TIER_CONFIGS[user.tier] : TIER_CONFIGS[1]
  const videosCompleted = todayTasks.filter(t => t.task_type === 'tiktok_video' && t.status === 'completed').length
  const todayEarnings = todayTasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.reward_amount, 0)

  const dailyEarnings = (tier: 1 | 2 | 3) =>
    TIER_CONFIGS[tier].maxTasks * TIER_CONFIGS[tier].videoReward

  const monthlyEarnings = (tier: 1 | 2 | 3) => dailyEarnings(tier) * 30

  const nextTier = user?.tier === 1 ? 2 : user?.tier === 2 ? 3 : null

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.full_name?.split(' ')[0]}!</h1>

      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-emerald-100 text-sm">Your Balance</p>
            <div className="text-3xl font-bold">{formatNaira(user?.balance || 0)}</div>
          </div>
          <div className="text-right">
            <p className="text-emerald-100 text-sm">Tier {user?.tier}</p>
            <p className="text-emerald-200 text-xs">Keep earning to level up!</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Today&apos;s Earnings</div>
          <div className="text-xl font-bold text-gray-900">{formatNaira(todayEarnings)}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Tasks Done</div>
          <div className="text-xl font-bold text-gray-900">{todayTasks.filter(t => t.status === 'completed').length}/{tierConfig.maxTasks}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Total Earned</div>
          <div className="text-xl font-bold text-gray-900">{formatNaira(user?.total_earned || 0)}</div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Progress</h2>

          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">TikTok Videos</span>
                <span className="font-medium">{videosCompleted}/{tierConfig.maxTasks}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all"
                  style={{ width: `${(videosCompleted / tierConfig.maxTasks) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Total Tasks</span>
                <span className="font-medium">{videosCompleted}/{tierConfig.maxTasks}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all"
                  style={{ width: `${(videosCompleted / tierConfig.maxTasks) * 100}%` }}
                />
              </div>
            </div>
          </div>

          <a
            href="/dashboard/tasks"
            className="mt-6 block w-full py-3 text-center bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition"
          >
            Start Earning
          </a>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Tier</h2>

          <div className={`p-6 rounded-xl text-white mb-4 ${
            user?.tier === 1 ? 'bg-gradient-to-br from-emerald-500 to-green-600' :
            user?.tier === 2 ? 'bg-gradient-to-br from-amber-500 to-orange-600' :
            'bg-gradient-to-br from-purple-500 to-indigo-600'
          }`}>
            <div className="text-sm opacity-80 mb-1">Tier {user?.tier}</div>
            <div className="text-2xl font-bold mb-4">
              {user?.tier === 1 ? 'Starter' : user?.tier === 2 ? 'Professional' : 'Legend'}
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="opacity-80">Video Reward</div>
                <div className="font-semibold">{formatNaira(tierConfig.videoReward)}</div>
              </div>
              <div>
                <div className="opacity-80">Daily Income</div>
                <div className="font-semibold">{formatNaira(dailyEarnings(user?.tier as 1 | 2 | 3 || 1))}</div>
              </div>
            </div>
          </div>

          {user?.tier && user.tier < 3 && nextTier && (
            <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-100">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <div className="font-semibold text-gray-900">Level up to Tier {nextTier}</div>
                  <div className="text-sm text-gray-600">
                    Earn up to {formatNaira(dailyEarnings(nextTier))}/day • {formatNaira(monthlyEarnings(nextTier))}/month
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-lg font-bold text-emerald-600">{formatNaira(TIER_CONFIGS[nextTier].upgradePrice)}</div>
                  <div className="text-xs text-gray-500">one-time</div>
                </div>
              </div>
              <a
                href="/dashboard/settings"
                className="block w-full py-3 text-center bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition"
              >
                Upgrade Now
              </a>
            </div>
          )}

          <Link href="/dashboard/settings" className="mt-4 block bg-amber-50 border border-amber-200 rounded-xl p-3 text-center hover:bg-amber-100 transition">
            <span className="text-amber-700 font-medium text-sm">Verify Payment</span>
          </Link>
        </div>
      </div>

      {/* Level Up Comparison */}
      {user?.tier && user.tier < 3 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Grow Your Earnings</h2>
            <p className="text-gray-600">Higher tiers = more tasks, bigger rewards, and much higher daily income.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map((t) => {
              const cfg = TIER_CONFIGS[t as 1 | 2 | 3]
              const isCurrent = user.tier === t
              const isHigher = t > (user.tier || 1)
              const isPopular = t === 2
              return (
                <div
                  key={t}
                  className={`relative rounded-2xl p-6 border-2 transition ${
                    isCurrent
                      ? 'border-emerald-500 bg-emerald-50'
                      : isPopular && isHigher
                        ? 'border-amber-400 bg-amber-50'
                        : 'border-gray-200'
                  }`}
                >
                  {isCurrent && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white px-4 py-1 rounded-full text-xs font-semibold">
                      YOUR TIER
                    </div>
                  )}
                  {isPopular && isHigher && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-4 py-1 rounded-full text-xs font-semibold">
                      MOST POPULAR
                    </div>
                  )}
                  <div className="text-sm font-medium text-gray-500 mb-1">Tier {t}</div>
                  <div className="text-xl font-bold text-gray-900 mb-4">
                    {t === 1 ? 'Starter' : t === 2 ? 'Professional' : 'Legend'}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Tasks/day</span>
                      <span className="font-medium">{cfg.maxTasks}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Video reward</span>
                      <span className="font-medium">{formatNaira(cfg.videoReward)}</span>
                    </div>
                    <div className="flex justify-between border-t border-gray-200 pt-2">
                      <span className="text-gray-600">Daily income</span>
                      <span className="font-bold text-emerald-600">{formatNaira(dailyEarnings(t as 1 | 2 | 3))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly income</span>
                      <span className="font-bold text-gray-900">{formatNaira(monthlyEarnings(t as 1 | 2 | 3))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Upgrade cost</span>
                      <span className="font-medium">{t === 1 ? 'Free' : formatNaira(cfg.upgradePrice)}</span>
                    </div>
                  </div>
                  {!isCurrent && isHigher && (
                    <a
                      href="/dashboard/settings"
                      className={`mt-5 block w-full py-3 text-center rounded-xl font-semibold transition ${
                        isPopular
                          ? 'bg-amber-500 text-white hover:bg-amber-600'
                          : 'bg-purple-600 text-white hover:bg-purple-700'
                      }`}
                    >
                      Upgrade to Tier {t}
                    </a>
                  )}
                </div>
              )
            })}
          </div>

          {nextTier && (
            <div className="mt-6 bg-gray-50 rounded-xl p-4 text-center text-sm text-gray-600">
              <span className="font-semibold text-gray-900">Smart move:</span> Tier {nextTier} costs just{' '}
              {formatNaira(TIER_CONFIGS[nextTier].upgradePrice)} one-time but pays{' '}
              {formatNaira(dailyEarnings(nextTier) - dailyEarnings(user.tier))} more per day — it pays for itself within{' '}
              {Math.ceil(TIER_CONFIGS[nextTier].upgradePrice / (dailyEarnings(nextTier) - dailyEarnings(user.tier)))} day
              {Math.ceil(TIER_CONFIGS[nextTier].upgradePrice / (dailyEarnings(nextTier) - dailyEarnings(user.tier))) === 1 ? '' : 's'}.
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>

        {todayTasks.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p>No tasks completed yet today.</p>
            <a href="/dashboard/tasks" className="text-emerald-600 font-medium hover:text-emerald-700">
              Start your first task →
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {todayTasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48v-7.08a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-.81-.07 4.8 4.8 0 01-.38-.04z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">TikTok Video</div>
                    <div className="text-sm text-gray-500">{formatDate(task.created_at)}</div>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                  task.status === 'completed'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {task.status === 'completed' ? `+${formatNaira(task.reward_amount)}` : 'Pending'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

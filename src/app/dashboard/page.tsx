'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { User, Task, TIER_CONFIGS } from '@/lib/types'
import { formatNaira, formatDate } from '@/lib/utils'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showUpgradePopup, setShowUpgradePopup] = useState(false)
  const [dismissed, setDismissed] = useState(false)

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

  useEffect(() => {
    if (user && user.tier < 3 && !dismissed) {
      const hasSeenPopup = sessionStorage.getItem('upgrade_popup_seen')
      if (!hasSeenPopup) {
        setShowUpgradePopup(true)
        sessionStorage.setItem('upgrade_popup_seen', '1')
      }
    }
  }, [user, dismissed])

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

  return (
    <>
      {/* Upgrade Popup */}
      {showUpgradePopup && user && user.tier < 3 && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <div className="text-center mb-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Upgrade Your Tier</h3>
              <p className="text-gray-600 text-sm mt-2">
                Earn up to <span className="font-bold text-emerald-600">{formatNaira(TIER_CONFIGS[user.tier === 1 ? 2 : 3].maxTasks * TIER_CONFIGS[user.tier === 1 ? 2 : 3].videoReward)}</span> per day with Tier {user.tier === 1 ? 2 : 3}!
              </p>
            </div>
            <div className="space-y-3">
              <Link
                href="/dashboard/tiers"
                onClick={() => setShowUpgradePopup(false)}
                className="block w-full py-3 bg-emerald-600 text-white text-center rounded-xl font-semibold hover:bg-emerald-700 transition"
              >
                View Upgrade Options
              </Link>
              <button
                onClick={() => { setShowUpgradePopup(false); setDismissed(true) }}
                className="block w-full py-3 text-gray-500 text-center rounded-xl font-medium hover:bg-gray-100 transition"
              >
                Maybe Later
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Welcome back, {user?.full_name?.split(' ')[0]}!</h1>
          <a href="https://stake.com" target="_blank" rel="noopener noreferrer">
            <img src="/stake-logo.png" alt="Stake.com" className="h-5 opacity-50 hover:opacity-100 transition" />
          </a>
        </div>

        <div className="bg-emerald-600 rounded-2xl p-6 text-white">
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
            <div className="text-xl font-bold text-gray-900">{videosCompleted}/{tierConfig.maxTasks}</div>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="text-sm text-gray-500 mb-1">Total Earned</div>
            <div className="text-xl font-bold text-gray-900">{formatNaira(user?.total_earned || 0)}</div>
          </div>
        </div>

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
          </div>
          <a
            href="/dashboard/tasks"
            className="mt-6 block w-full py-3 text-center bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition"
          >
            Start Earning
          </a>
        </div>

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
    </>
  )
}

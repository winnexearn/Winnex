'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User, Task, TIER_CONFIGS } from '@/lib/types'
import { formatNaira, formatDate } from '@/lib/utils'

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      setUser(userData)

      const today = new Date().toISOString().split('T')[0]
      const { data: tasks } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', today)
        .order('created_at', { ascending: false })

      setTodayTasks(tasks || [])
      setLoading(false)
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const tierConfig = user ? TIER_CONFIGS[user.tier] : TIER_CONFIGS[1]
  const videosCompleted = todayTasks.filter(t => t.task_type === 'tiktok_video' && t.status === 'completed').length
  const adsCompleted = todayTasks.filter(t => t.task_type === 'ad_view' && t.status === 'completed').length
  const todayEarnings = todayTasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.reward_amount, 0)

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back, {user?.full_name?.split(' ')[0]}!</h1>
        <p className="text-emerald-100">You&apos;re on Tier {user?.tier}. Keep earning to level up!</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-500">Balance</div>
              <div className="text-xl font-bold text-gray-900">{formatNaira(user?.balance || 0)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-500">Today&apos;s Earnings</div>
              <div className="text-xl font-bold text-gray-900">{formatNaira(todayEarnings)}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-500">Tasks Done</div>
              <div className="text-xl font-bold text-gray-900">{todayTasks.filter(t => t.status === 'completed').length}/{tierConfig.maxTasks}</div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
              </svg>
            </div>
            <div>
              <div className="text-sm text-gray-500">Total Earned</div>
              <div className="text-xl font-bold text-gray-900">{formatNaira(user?.total_earned || 0)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Task Progress */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Progress</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">TikTok Videos</span>
                <span className="font-medium">{videosCompleted}/{tierConfig.maxVideos}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-pink-500 to-rose-500 rounded-full transition-all"
                  style={{ width: `${(videosCompleted / tierConfig.maxVideos) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Ad Views</span>
                <span className="font-medium">{adsCompleted}/{tierConfig.maxAds}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all"
                  style={{ width: `${(adsCompleted / tierConfig.maxAds) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Total Tasks</span>
                <span className="font-medium">{videosCompleted + adsCompleted}/{tierConfig.maxTasks}</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all"
                  style={{ width: `${((videosCompleted + adsCompleted) / tierConfig.maxTasks) * 100}%` }}
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

        {/* Current Tier */}
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
                <div className="opacity-80">Ad Reward</div>
                <div className="font-semibold">{formatNaira(tierConfig.adReward)}</div>
              </div>
            </div>
          </div>

          {user?.tier && user.tier < 3 && (
            <a 
              href="/dashboard/settings" 
              className="block w-full py-3 text-center border-2 border-emerald-600 text-emerald-600 rounded-xl font-semibold hover:bg-emerald-50 transition"
            >
              Upgrade to Tier {user.tier + 1} - {formatNaira(TIER_CONFIGS[user.tier + 1].upgradePrice)}
            </a>
          )}
        </div>
      </div>

      {/* Recent Activity */}
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
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    task.task_type === 'tiktok_video' ? 'bg-pink-100' : 'bg-blue-100'
                  }`}>
                    {task.task_type === 'tiktok_video' ? (
                      <svg className="w-5 h-5 text-pink-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48v-7.08a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-.81-.07 4.8 4.8 0 01-.38-.04z"/>
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">
                      {task.task_type === 'tiktok_video' ? 'TikTok Video' : 'Ad View'}
                    </div>
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

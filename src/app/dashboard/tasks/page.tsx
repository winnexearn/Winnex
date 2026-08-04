'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, Task, TIER_CONFIGS } from '@/lib/types'
import { formatNaira } from '@/lib/utils'

interface ContentItem {
  id: string
  content_type: 'tiktok_video'
  url: string
  title: string | null
}

export default function TasksPage() {
  const [user, setUser] = useState<User | null>(null)
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [videos, setVideos] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    const [meRes, tasksRes, contentRes] = await Promise.all([
      fetch('/api/auth/me'),
      fetch('/api/tasks'),
      fetch('/api/content'),
    ])

    if (meRes.ok) {
      setUser(await meRes.json())
    }

    if (tasksRes.ok) {
      setTodayTasks(await tasksRes.json())
    }

    if (contentRes.ok) {
      const content = await contentRes.json()
      setVideos(content.videos || [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const showToast = (message: string) => {
    setToast(message)
    setTimeout(() => setToast(null), 4000)
  }

  const handleClaim = async () => {
    if (!user || claiming || videos.length === 0) return

    const currentTask = videos[0]
    const tierConfig = TIER_CONFIGS[user.tier]
    const videosCompleted = todayTasks.filter(t => t.task_type === 'tiktok_video' && t.status === 'completed').length

    if (videosCompleted >= tierConfig.maxTasks) {
      showToast('You have reached your daily task limit!')
      return
    }

    setClaiming(true)

    try {
      const res = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: 'tiktok_video',
          content_url: currentTask.url,
          content_title: currentTask.title,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || 'Error completing task. Please try again.')
        return
      }

      showToast(`+${formatNaira(data.reward)} earned! Keep going.`)
      await fetchData()

      window.location.href = currentTask.url
    } catch (err) {
      console.error('Error completing task:', err)
      showToast('Error completing task. Please try again.')
    } finally {
      setClaiming(false)
    }
  }

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

  const limitReached = videosCompleted >= tierConfig.maxTasks
  const currentTask = videos[0] || null
  const remaining = tierConfig.maxTasks - videosCompleted

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-gray-900 text-white rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-emerald-600 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Complete Tasks & Earn</h1>
        <p className="text-emerald-100">
          Tap the button, it opens on TikTok, and your reward is credited instantly.
        </p>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Done</div>
          <div className="text-2xl font-bold text-gray-900">{videosCompleted}<span className="text-gray-400 text-lg">/{tierConfig.maxTasks}</span></div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Left</div>
          <div className="text-2xl font-bold text-emerald-600">{remaining}</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Earned</div>
          <div className="text-2xl font-bold text-emerald-600">{formatNaira(todayEarnings)}</div>
        </div>
      </div>

      {/* Current Task */}
      {limitReached ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily limit reached!</h3>
          <p className="text-gray-500">Come back tomorrow for more tasks.</p>
        </div>
      ) : !currentTask ? (
        <div className="bg-white rounded-2xl p-8 text-center">
          <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No new videos right now</h3>
          <p className="text-gray-500">Check back later — new videos are added regularly.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="text-center mb-4">
            <div className="text-sm text-gray-500 mb-1">Task {videosCompleted + 1} of {tierConfig.maxTasks}</div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all"
                style={{ width: `${(videosCompleted / tierConfig.maxTasks) * 100}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shrink-0">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48v-7.08a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-.81-.07 4.8 4.8 0 01-.38-.04z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">{currentTask.title || 'TikTok Video'}</h3>
              <p className="text-sm text-gray-500">Like this video on TikTok</p>
              <div className="text-emerald-600 font-bold mt-1">+{formatNaira(tierConfig.videoReward)}</div>
            </div>
          </div>

          <button
            onClick={handleClaim}
            disabled={claiming}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold text-lg hover:bg-emerald-700 transition disabled:opacity-50"
          >
            {claiming ? 'Earning...' : `Watch & Earn ${formatNaira(tierConfig.videoReward)}`}
          </button>
        </div>
      )}
    </div>
  )
}

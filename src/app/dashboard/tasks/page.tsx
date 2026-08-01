'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, Task, TIER_CONFIGS } from '@/lib/types'
import { formatNaira } from '@/lib/utils'

interface ContentItem {
  id: string
  content_type: 'tiktok_video' | 'ad'
  url: string
  title: string | null
}

export default function TasksPage() {
  const [user, setUser] = useState<User | null>(null)
  const [todayTasks, setTodayTasks] = useState<Task[]>([])
  const [videos, setVideos] = useState<ContentItem[]>([])
  const [ads, setAds] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'videos' | 'ads'>('videos')
  const [claiming, setClaiming] = useState<string | null>(null)
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
      setAds(content.ads || [])
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

  const handleClaim = async (content: ContentItem) => {
    if (!user || claiming) return

    const tierConfig = TIER_CONFIGS[user.tier]
    const videosCompleted = todayTasks.filter(t => t.task_type === 'tiktok_video' && t.status === 'completed').length
    const adsCompleted = todayTasks.filter(t => t.task_type === 'ad_view' && t.status === 'completed').length
    const totalCompleted = videosCompleted + adsCompleted

    if (content.content_type === 'tiktok_video' && videosCompleted >= tierConfig.maxVideos) {
      showToast('You have reached your daily video limit!')
      return
    }

    if (content.content_type === 'ad' && adsCompleted >= tierConfig.maxAds) {
      showToast('You have reached your daily ad limit!')
      return
    }

    if (totalCompleted >= tierConfig.maxTasks) {
      showToast('You have reached your daily task limit!')
      return
    }

    setClaiming(content.id)

    try {
      const res = await fetch('/api/tasks/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          task_type: content.content_type === 'tiktok_video' ? 'tiktok_video' : 'ad_view',
          content_url: content.url,
          content_title: content.title,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        showToast(data.error || 'Error completing task. Please try again.')
        return
      }

      window.open(content.url, '_blank')
      showToast(`+${formatNaira(data.reward)} earned! Keep going.`)
      await fetchData()
    } catch (err) {
      console.error('Error completing task:', err)
      showToast('Error completing task. Please try again.')
    } finally {
      setClaiming(null)
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
  const adsCompleted = todayTasks.filter(t => t.task_type === 'ad_view' && t.status === 'completed').length
  const todayEarnings = todayTasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.reward_amount, 0)

  const videosLimitReached = videosCompleted >= tierConfig.maxVideos
  const adsLimitReached = adsCompleted >= tierConfig.maxAds

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-gray-900 text-white rounded-xl shadow-lg text-sm font-medium">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Complete Tasks & Earn</h1>
        <p className="text-emerald-100">
          Tap a task, it opens on TikTok, and your reward is credited instantly.
        </p>
      </div>

      {/* Progress Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Videos Done</div>
          <div className="text-2xl font-bold text-gray-900">{videosCompleted}<span className="text-gray-400 text-lg">/{tierConfig.maxVideos}</span></div>
          <div className="text-xs text-emerald-600">{formatNaira(tierConfig.videoReward)}/video</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Ads Done</div>
          <div className="text-2xl font-bold text-gray-900">{adsCompleted}<span className="text-gray-400 text-lg">/{tierConfig.maxAds}</span></div>
          <div className="text-xs text-blue-600">{formatNaira(tierConfig.adReward)}/ad</div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Total Tasks</div>
          <div className="text-2xl font-bold text-gray-900">{videosCompleted + adsCompleted}<span className="text-gray-400 text-lg">/{tierConfig.maxTasks}</span></div>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="text-sm text-gray-500 mb-1">Today&apos;s Earnings</div>
          <div className="text-2xl font-bold text-emerald-600">{formatNaira(todayEarnings)}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
        <button
          className={`flex-1 py-3 rounded-lg font-medium transition ${
            activeTab === 'videos'
              ? 'bg-white text-emerald-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('videos')}
        >
          TikTok Videos ({tierConfig.maxVideos - videosCompleted} left)
        </button>
        <button
          className={`flex-1 py-3 rounded-lg font-medium transition ${
            activeTab === 'ads'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('ads')}
        >
          Ad Views ({tierConfig.maxAds - adsCompleted} left)
        </button>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {activeTab === 'videos' ? (
          videosLimitReached ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily video limit reached!</h3>
              <p className="text-gray-500">Come back tomorrow for more tasks.</p>
            </div>
          ) : videos.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No new videos right now</h3>
              <p className="text-gray-500">Check back later — new videos are added regularly.</p>
            </div>
          ) : (
            videos.map((content, index) => (
              <div key={content.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{content.title || 'TikTok Video'}</h3>
                    <p className="text-sm text-gray-500">Like this video on TikTok</p>
                    <div className="text-emerald-600 font-medium mt-1">+{formatNaira(tierConfig.videoReward)}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleClaim(content)}
                  disabled={claiming === content.id}
                  className="mt-3 w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition disabled:opacity-50"
                >
                  {claiming === content.id ? 'Earning...' : `Watch & Earn ${formatNaira(tierConfig.videoReward)}`}
                </button>
              </div>
            ))
          )
        ) : (
          adsLimitReached ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-blue-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Daily ad limit reached!</h3>
              <p className="text-gray-500">Come back tomorrow for more tasks.</p>
            </div>
          ) : ads.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No new ads right now</h3>
              <p className="text-gray-500">Check back later — new ads are added regularly.</p>
            </div>
          ) : (
            ads.map((content, index) => (
              <div key={content.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{content.title || 'Sponsored Ad'}</h3>
                    <p className="text-sm text-gray-500">View this ad</p>
                    <div className="text-blue-600 font-medium mt-1">+{formatNaira(tierConfig.adReward)}</div>
                  </div>
                </div>
                <button
                  onClick={() => handleClaim(content)}
                  disabled={claiming === content.id}
                  className="mt-3 w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {claiming === content.id ? 'Earning...' : `View & Earn ${formatNaira(tierConfig.adReward)}`}
                </button>
              </div>
            ))
          )
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
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
  const [availableContent, setAvailableContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'videos' | 'ads'>('videos')
  const [completing, setCompleting] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
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

    // Fetch random content
    const { data: videos } = await supabase
      .from('content_pool')
      .select('*')
      .eq('content_type', 'tiktok_video')
      .eq('is_active', true)
      .order('id')
      .limit(20)

    const { data: ads } = await supabase
      .from('content_pool')
      .select('*')
      .eq('content_type', 'ad')
      .eq('is_active', true)
      .order('id')
      .limit(20)

    // Shuffle and combine
    const shuffledVideos = (videos || []).sort(() => Math.random() - 0.5)
    const shuffledAds = (ads || []).sort(() => Math.random() - 0.5)
    setAvailableContent([...shuffledVideos, ...shuffledAds])
    
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleCompleteTask = async (content: ContentItem) => {
    if (!user) return
    
    const tierConfig = TIER_CONFIGS[user.tier]
    const videosCompleted = todayTasks.filter(t => t.task_type === 'tiktok_video' && t.status === 'completed').length
    const adsCompleted = todayTasks.filter(t => t.task_type === 'ad_view' && t.status === 'completed').length
    const totalCompleted = videosCompleted + adsCompleted

    if (content.content_type === 'tiktok_video' && videosCompleted >= tierConfig.maxVideos) {
      alert('You have reached your daily video limit!')
      return
    }

    if (content.content_type === 'ad' && adsCompleted >= tierConfig.maxAds) {
      alert('You have reached your daily ad limit!')
      return
    }

    if (totalCompleted >= tierConfig.maxTasks) {
      alert('You have reached your daily task limit!')
      return
    }

    setCompleting(content.id)

    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const rewardAmount = content.content_type === 'tiktok_video' 
        ? tierConfig.videoReward 
        : tierConfig.adReward

      // Create task record
      const { error: taskError } = await supabase
        .from('tasks')
        .insert({
          user_id: session.user.id,
          task_type: content.content_type === 'tiktok_video' ? 'tiktok_video' : 'ad_view',
          content_url: content.url,
          content_title: content.title,
          reward_amount: rewardAmount,
          status: 'completed',
          completed_at: new Date().toISOString(),
        })

      if (taskError) throw taskError

      // Update user balance
      const { error: balanceError } = await supabase
        .from('users')
        .update({
          balance: user.balance + rewardAmount,
          total_earned: user.total_earned + rewardAmount,
          tasks_completed_today: totalCompleted + 1,
        })
        .eq('id', session.user.id)

      if (balanceError) throw balanceError

      // Refresh data
      await fetchData()
    } catch (err) {
      console.error('Error completing task:', err)
      alert('Error completing task. Please try again.')
    } finally {
      setCompleting(null)
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
  const videos = availableContent.filter(c => c.content_type === 'tiktok_video')
  const ads = availableContent.filter(c => c.content_type === 'ad')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 rounded-2xl p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Complete Tasks & Earn</h1>
        <p className="text-emerald-100">Watch videos and view ads to earn rewards</p>
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
          <div className="text-2xl font-bold text-emerald-600">
            {formatNaira(todayTasks.filter(t => t.status === 'completed').reduce((sum, t) => sum + t.reward_amount, 0))}
          </div>
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
          videos.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No videos available</h3>
              <p className="text-gray-500">Check back later for new videos to like</p>
            </div>
          ) : (
            videos.slice(0, tierConfig.maxVideos).map((content, index) => {
              const isCompleted = todayTasks.some(
                t => t.content_url === content.url && t.status === 'completed'
              )
              return (
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
                    <div>
                      {isCompleted ? (
                        <div className="px-4 py-2 bg-green-100 text-green-700 rounded-xl font-medium">
                          ✓ Done
                        </div>
                      ) : (
                        <button
                          onClick={() => window.open(content.url, '_blank')}
                          className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 transition disabled:opacity-50"
                          disabled={videosCompleted >= tierConfig.maxVideos}
                        >
                          Watch
                        </button>
                      )}
                    </div>
                  </div>
                  {isCompleted && (
                    <button
                      onClick={() => handleCompleteTask(content)}
                      className="mt-3 w-full py-2 bg-emerald-100 text-emerald-700 rounded-xl font-medium hover:bg-emerald-200 transition"
                      disabled={completing === content.id}
                    >
                      {completing === content.id ? 'Verifying...' : 'Verify & Claim Reward'}
                    </button>
                  )}
                </div>
              )
            })
          )
        ) : (
          ads.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No ads available</h3>
              <p className="text-gray-500">Check back later for new ads to view</p>
            </div>
          ) : (
            ads.slice(0, tierConfig.maxAds).map((content, index) => {
              const isCompleted = todayTasks.some(
                t => t.content_url === content.url && t.status === 'completed'
              )
              return (
                <div key={content.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center text-white text-2xl font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{content.title || 'Sponsored Ad'}</h3>
                      <p className="text-sm text-gray-500">View this ad for {Math.floor(Math.random() * 10) + 15} seconds</p>
                      <div className="text-blue-600 font-medium mt-1">+{formatNaira(tierConfig.adReward)}</div>
                    </div>
                    <div>
                      {isCompleted ? (
                        <div className="px-4 py-2 bg-green-100 text-green-700 rounded-xl font-medium">
                          ✓ Done
                        </div>
                      ) : (
                        <button
                          onClick={() => window.open(content.url, '_blank')}
                          className="px-4 py-2 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50"
                          disabled={adsCompleted >= tierConfig.maxAds}
                        >
                          View
                        </button>
                      )}
                    </div>
                  </div>
                  {isCompleted && (
                    <button
                      onClick={() => handleCompleteTask(content)}
                      className="mt-3 w-full py-2 bg-blue-100 text-blue-700 rounded-xl font-medium hover:bg-blue-200 transition"
                      disabled={completing === content.id}
                    >
                      {completing === content.id ? 'Verifying...' : 'Verify & Claim Reward'}
                    </button>
                  )}
                </div>
              )
            })
          )
        )}
      </div>
    </div>
  )
}

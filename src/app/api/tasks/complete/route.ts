import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const TIER_LIMITS: Record<number, { maxTasks: number; maxVideos: number; maxAds: number; videoReward: number; adReward: number }> = {
  1: { maxTasks: 5, maxVideos: 3, maxAds: 2, videoReward: 100, adReward: 50 },
  2: { maxTasks: 8, maxVideos: 6, maxAds: 2, videoReward: 200, adReward: 100 },
  3: { maxTasks: 10, maxVideos: 8, maxAds: 2, videoReward: 300, adReward: 150 },
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { task_type, content_url, content_title } = body
  if (!task_type || !content_url) {
    return NextResponse.json({ error: 'Missing task details' }, { status: 400 })
  }

  const limits = TIER_LIMITS[user.tier] || TIER_LIMITS[1]

  const admin = createAdminClient()

  const poolType = task_type === 'tiktok_video' ? 'tiktok_video' : 'ad'

  const { data: poolItem } = await admin
    .from('content_pool')
    .select('id')
    .eq('url', content_url)
    .eq('content_type', poolType)
    .eq('is_active', true)
    .maybeSingle()

  if (!poolItem) {
    return NextResponse.json({ error: 'This task is no longer available' }, { status: 400 })
  }

  const { data: alreadyDone } = await admin
    .from('tasks')
    .select('id')
    .eq('user_id', user.id)
    .eq('content_url', content_url)
    .eq('status', 'completed')
    .maybeSingle()

  if (alreadyDone) {
    return NextResponse.json({ error: 'You have already completed this task' }, { status: 400 })
  }

  const today = new Date().toISOString().split('T')[0]
  const todayKey = new Date().toISOString().split('T')[0]

  if (user.last_task_date !== todayKey) {
    await admin
      .from('users')
      .update({ tasks_completed_today: 0, last_task_date: today })
      .eq('id', user.id)
  }

  const { data: todayTasks } = await admin
    .from('tasks')
    .select('*')
    .eq('user_id', user.id)
    .gte('created_at', today)

  const completedTasks = todayTasks?.filter((t) => t.status === 'completed') || []
  const videosCompleted = completedTasks.filter((t) => t.task_type === 'tiktok_video').length
  const adsCompleted = completedTasks.filter((t) => t.task_type === 'ad_view').length
  const totalCompleted = videosCompleted + adsCompleted

  if (totalCompleted >= limits.maxTasks) {
    return NextResponse.json({ error: 'You have reached your daily task limit' }, { status: 400 })
  }

  if (task_type === 'tiktok_video' && videosCompleted >= limits.maxVideos) {
    return NextResponse.json({ error: 'You have reached your daily video limit' }, { status: 400 })
  }

  if (task_type === 'ad_view' && adsCompleted >= limits.maxAds) {
    return NextResponse.json({ error: 'You have reached your daily ad limit' }, { status: 400 })
  }

  const reward = task_type === 'tiktok_video' ? limits.videoReward : limits.adReward

  const { error: taskError } = await admin.from('tasks').insert({
    user_id: user.id,
    task_type,
    content_url,
    content_title: content_title || null,
    reward_amount: reward,
    status: 'completed',
    completed_at: new Date().toISOString(),
  })

  if (taskError) {
    return NextResponse.json({ error: taskError.message }, { status: 500 })
  }

  const { error: balanceError } = await admin
    .from('users')
    .update({
      balance: user.balance + reward,
      total_earned: user.total_earned + reward,
      tasks_completed_today: totalCompleted + 1,
      last_task_date: today,
    })
    .eq('id', user.id)

  if (balanceError) {
    return NextResponse.json({ error: balanceError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, reward, new_balance: user.balance + reward })
}

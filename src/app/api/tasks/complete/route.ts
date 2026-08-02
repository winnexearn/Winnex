import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const TIER_LIMITS: Record<number, { maxTasks: number; videoReward: number }> = {
  1: { maxTasks: 5, videoReward: 100 },
  2: { maxTasks: 8, videoReward: 200 },
  3: { maxTasks: 10, videoReward: 300 },
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

  const { data: poolItem } = await admin
    .from('content_pool')
    .select('id')
    .eq('url', content_url)
    .eq('content_type', 'tiktok_video')
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

  if (user.last_task_date !== today) {
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
  const totalCompleted = completedTasks.length

  if (totalCompleted >= limits.maxTasks) {
    return NextResponse.json({ error: 'You have reached your daily task limit' }, { status: 400 })
  }

  const reward = limits.videoReward

  const { error: taskError } = await admin.from('tasks').insert({
    user_id: user.id,
    task_type: 'tiktok_video',
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

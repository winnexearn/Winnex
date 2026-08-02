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

  const { content_url, content_title } = body
  if (!content_url) {
    return NextResponse.json({ error: 'Missing task details' }, { status: 400 })
  }

  const limits = TIER_LIMITS[user.tier] || TIER_LIMITS[1]
  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  if (user.last_task_date !== today) {
    await admin
      .from('users')
      .update({ tasks_completed_today: 0, last_task_date: today })
      .eq('id', user.id)
  }

  const { count } = await admin
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'completed')
    .gte('created_at', today)

  if ((count || 0) >= limits.maxTasks) {
    return NextResponse.json({ error: 'You have reached your daily task limit' }, { status: 400 })
  }

  const { error: taskError } = await admin.from('tasks').insert({
    user_id: user.id,
    task_type: 'tiktok_video',
    content_url,
    content_title: content_title || null,
    reward_amount: limits.videoReward,
    status: 'completed',
    completed_at: new Date().toISOString(),
  })

  if (taskError) {
    if (taskError.code === '23505') {
      return NextResponse.json({ error: 'You have already completed this task' }, { status: 400 })
    }
    return NextResponse.json({ error: taskError.message }, { status: 500 })
  }

  const newCount = (count || 0) + 1
  const newBalance = user.balance + limits.videoReward

  const { error: balanceError } = await admin
    .from('users')
    .update({
      balance: newBalance,
      total_earned: user.total_earned + limits.videoReward,
      tasks_completed_today: newCount,
      last_task_date: today,
    })
    .eq('id', user.id)

  if (balanceError) {
    return NextResponse.json({ error: balanceError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, reward: limits.videoReward, new_balance: newBalance })
}

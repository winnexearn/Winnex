import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content_id, task_type, content_url, content_title, reward_amount } = body

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError) throw userError

    // Check daily limits
    const today = new Date().toISOString().split('T')[0]
    const { data: todayTasks } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', today)

    const tierLimits: Record<number, { maxTasks: number; maxVideos: number; maxAds: number }> = {
      1: { maxTasks: 5, maxVideos: 3, maxAds: 2 },
      2: { maxTasks: 8, maxVideos: 6, maxAds: 2 },
      3: { maxTasks: 10, maxVideos: 8, maxAds: 2 },
    }

    const limits = tierLimits[userData.tier]
    const completedTasks = todayTasks?.filter(t => t.status === 'completed') || []
    const videosCompleted = completedTasks.filter(t => t.task_type === 'tiktok_video').length
    const adsCompleted = completedTasks.filter(t => t.task_type === 'ad_view').length
    const totalCompleted = videosCompleted + adsCompleted

    if (totalCompleted >= limits.maxTasks) {
      return NextResponse.json({ error: 'Daily task limit reached' }, { status: 400 })
    }

    if (task_type === 'tiktok_video' && videosCompleted >= limits.maxVideos) {
      return NextResponse.json({ error: 'Daily video limit reached' }, { status: 400 })
    }

    if (task_type === 'ad_view' && adsCompleted >= limits.maxAds) {
      return NextResponse.json({ error: 'Daily ad limit reached' }, { status: 400 })
    }

    // Create task
    const { error: taskError } = await supabase
      .from('tasks')
      .insert({
        user_id: user.id,
        task_type,
        content_url,
        content_title,
        reward_amount,
        status: 'completed',
        completed_at: new Date().toISOString(),
      })

    if (taskError) throw taskError

    // Update user balance
    const { error: balanceError } = await supabase
      .from('users')
      .update({
        balance: userData.balance + reward_amount,
        total_earned: userData.total_earned + reward_amount,
        tasks_completed_today: totalCompleted + 1,
      })
      .eq('id', user.id)

    if (balanceError) throw balanceError

    return NextResponse.json({ success: true, new_balance: userData.balance + reward_amount })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

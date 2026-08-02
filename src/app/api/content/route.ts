import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { seededShuffle, getDayKey, hashString } from '@/lib/rotation'

export async function GET(request: Request) {
  const userId = await getCurrentUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: doneTasks } = await admin
    .from('tasks')
    .select('content_url')
    .eq('user_id', userId)
    .eq('status', 'completed')

  const seenUrls = doneTasks?.map((t) => t.content_url) || []

  const { data: videos } = await admin
    .from('content_pool')
    .select('*')
    .eq('content_type', 'tiktok_video')
    .eq('is_active', true)
    .order('id')

  const unseenVideos = (videos || []).filter((v) => !seenUrls.includes(v.url))

  const dayKey = getDayKey()
  const rotate = (n: number, items: unknown[]): unknown[] => {
    if (n === 0 || items.length === 0) return items
    const offset = n % items.length
    return [...items.slice(offset), ...items.slice(0, offset)]
  }

  const videoSeed = hashString(`${dayKey}::${userId}`)
  const dayOffset = hashString(dayKey)

  const shuffledVideos = rotate(dayOffset, seededShuffle(unseenVideos, videoSeed))

  return NextResponse.json({ videos: shuffledVideos })
}

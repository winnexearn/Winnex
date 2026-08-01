import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

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

  const { data: ads } = await admin
    .from('content_pool')
    .select('*')
    .eq('content_type', 'ad')
    .eq('is_active', true)
    .order('id')

  const unseenVideos = (videos || []).filter((v) => !seenUrls.includes(v.url))
  const unseenAds = (ads || []).filter((a) => !seenUrls.includes(a.url))

  const shuffledVideos = unseenVideos.sort(() => Math.random() - 0.5)
  const shuffledAds = unseenAds.sort(() => Math.random() - 0.5)

  return NextResponse.json({ videos: shuffledVideos, ads: shuffledAds })
}

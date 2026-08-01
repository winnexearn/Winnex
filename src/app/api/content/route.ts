import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const userId = await getCurrentUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: videos } = await admin
    .from('content_pool')
    .select('*')
    .eq('content_type', 'tiktok_video')
    .eq('is_active', true)
    .order('id')
    .limit(20)

  const { data: ads } = await admin
    .from('content_pool')
    .select('*')
    .eq('content_type', 'ad')
    .eq('is_active', true)
    .order('id')
    .limit(20)

  const shuffledVideos = (videos || []).sort(() => Math.random() - 0.5)
  const shuffledAds = (ads || []).sort(() => Math.random() - 0.5)

  return NextResponse.json({ videos: shuffledVideos, ads: shuffledAds })
}

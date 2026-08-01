import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get random content
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

    // Shuffle
    const shuffledVideos = (videos || []).sort(() => Math.random() - 0.5)
    const shuffledAds = (ads || []).sort(() => Math.random() - 0.5)

    return NextResponse.json({
      videos: shuffledVideos,
      ads: shuffledAds,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

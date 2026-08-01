import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const userId = await getCurrentUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: referrals, error } = await admin
    .from('referrals')
    .select('*')
    .eq('referrer_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json(referrals)
}

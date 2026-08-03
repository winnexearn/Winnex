import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const toTier = Number(body?.to_tier)

  if (toTier !== 2 && toTier !== 3) {
    return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })
  }

  if (toTier <= user.tier) {
    return NextResponse.json({ error: 'You already have this tier or higher' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Check for existing manual review request for this tier
  const { data: existing } = await admin
    .from('tier_upgrades')
    .select('id, payment_status')
    .eq('user_id', user.id)
    .eq('to_tier', toTier)
    .eq('payment_status', 'manual_review')
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'You already have a pending verification for this tier. Please wait for admin review.' }, { status: 400 })
  }

  // Expire old pending records
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  await admin
    .from('tier_upgrades')
    .update({ payment_status: 'expired' })
    .eq('user_id', user.id)
    .eq('payment_status', 'pending')
    .lt('created_at', thirtyMinAgo)

  const TIER_PRICES: Record<number, number> = { 2: 1000, 3: 3000 }

  const { error } = await admin.from('tier_upgrades').insert({
    user_id: user.id,
    from_tier: user.tier,
    to_tier: toTier,
    amount_paid: TIER_PRICES[toTier],
    payment_status: 'manual_review',
    squad_ref: `MANUAL-${user.id.slice(0, 8)}-${Date.now()}`,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }

  return NextResponse.json({ success: true, message: 'Verification request submitted. Admin will review your payment shortly.' })
}

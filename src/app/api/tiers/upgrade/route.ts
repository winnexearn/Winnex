import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const TIER_PRICES: Record<number, number> = { 1: 0, 2: 1000, 3: 2000 }

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const toTier = Number(body.to_tier)
  const price = TIER_PRICES[toTier]

  if (!price || toTier <= user.tier) {
    return NextResponse.json({ error: 'Invalid tier upgrade' }, { status: 400 })
  }

  if (user.balance < price) {
    return NextResponse.json({ error: 'Insufficient balance. Keep earning to upgrade.' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error: upgradeError } = await admin.from('tier_upgrades').insert({
    user_id: user.id,
    from_tier: user.tier,
    to_tier: toTier,
    amount_paid: price,
    payment_status: 'completed',
  })

  if (upgradeError) {
    return NextResponse.json({ error: upgradeError.message }, { status: 500 })
  }

  const { error: userError } = await admin
    .from('users')
    .update({ tier: toTier, balance: user.balance - price })
    .eq('id', user.id)

  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, tier: toTier, new_balance: user.balance - price })
}

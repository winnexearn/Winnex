import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const TIER_PRICES: Record<number, number> = { 1: 0, 2: 1000, 3: 3000 }

const TIER_PAYMENT_LINKS: Record<number, string> = {
  2: 'https://pay.squadco.com/winnextier2',
  3: 'https://pay.squadco.com/winnextier3',
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

  const toTier = Number(body.to_tier)
  const price = TIER_PRICES[toTier]

  if (!price || toTier <= user.tier) {
    return NextResponse.json({ error: 'Invalid tier upgrade' }, { status: 400 })
  }

  const paymentLink = TIER_PAYMENT_LINKS[toTier]
  if (!paymentLink) {
    return NextResponse.json({ error: 'Payment link not configured for this tier' }, { status: 500 })
  }

  const admin = createAdminClient()

  const { data: pending } = await admin
    .from('tier_upgrades')
    .select('id')
    .eq('user_id', user.id)
    .eq('payment_status', 'pending')
    .maybeSingle()

  if (pending) {
    return NextResponse.json({ error: 'You already have a pending upgrade. Complete or wait for it to expire.' }, { status: 400 })
  }

  const squadRef = `WINNEX-${user.id.slice(0, 8)}-${Date.now()}`

  const { error: insertError } = await admin.from('tier_upgrades').insert({
    user_id: user.id,
    from_tier: user.tier,
    to_tier: toTier,
    amount_paid: price,
    payment_status: 'pending',
    squad_ref: squadRef,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const separator = paymentLink.includes('?') ? '&' : '?'
  const checkoutUrl = `${paymentLink}${separator}reference=${squadRef}&email=${encodeURIComponent(user.email)}`

  return NextResponse.json({
    success: true,
    checkout_url: checkoutUrl,
    ref: squadRef,
  })
}

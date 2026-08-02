import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const TIER_PRICES: Record<number, number> = { 1: 0, 2: 1000, 3: 2000 }
const TIER_NAMES: Record<number, string> = { 1: 'Starter', 2: 'Professional', 3: 'Legend' }

const SQUAD_BASE = process.env.SQUAD_SECRET_KEY?.includes('sandbox')
  ? 'https://sandbox-api-d.squadco.com'
  : 'https://api-d.squadco.com'

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

  const secretKey = process.env.SQUAD_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'Payment system not configured' }, { status: 500 })
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

  const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/tiers/verify?ref=${squadRef}`

  try {
    const res = await fetch(`${SQUAD_BASE}/transaction/initiate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: price * 100,
        currency: 'NGN',
        initiate_type: 'inline',
        transaction_ref: squadRef,
        callback_url: callbackUrl,
        customer_name: user.full_name,
        metadata: {
          user_id: user.id,
          to_tier: toTier,
          from_tier: user.tier,
          purpose: 'tier_upgrade',
        },
        payment_channels: ['card', 'bank', 'transfer', 'ussd'],
      }),
    })

    const data = await res.json()

    if (data.status !== 200 || !data.data?.checkout_url) {
      await admin
        .from('tier_upgrades')
        .update({ payment_status: 'failed' })
        .eq('squad_ref', squadRef)

      return NextResponse.json({ error: data.message || 'Failed to initialize payment' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      checkout_url: data.data.checkout_url,
      ref: squadRef,
      tier: toTier,
      tier_name: TIER_NAMES[toTier],
      amount: price,
    })
  } catch {
    await admin
      .from('tier_upgrades')
      .update({ payment_status: 'failed' })
      .eq('squad_ref', squadRef)

    return NextResponse.json({ error: 'Network error. Please try again.' }, { status: 500 })
  }
}

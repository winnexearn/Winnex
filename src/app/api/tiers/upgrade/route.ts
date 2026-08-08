import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const SQUAD_API = 'https://api-d.squadco.com'

const TIER_PRICES: Record<number, number> = { 1: 0, 2: 100000, 3: 300000 }

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
  const amountKobo = TIER_PRICES[toTier]

  if (!amountKobo || toTier <= user.tier) {
    return NextResponse.json({ error: 'Invalid tier upgrade' }, { status: 400 })
  }

  const admin = createAdminClient()

  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString()
  await admin
    .from('tier_upgrades')
    .update({ payment_status: 'expired' })
    .eq('user_id', user.id)
    .eq('payment_status', 'pending')
    .lt('created_at', thirtyMinAgo)

  const { data: pending } = await admin
    .from('tier_upgrades')
    .select('id')
    .eq('user_id', user.id)
    .eq('payment_status', 'pending')
    .maybeSingle()

  if (pending) {
    return NextResponse.json({ error: 'You already have a pending upgrade. Complete or wait for it to expire.' }, { status: 400 })
  }

  const transactionRef = `WINNEX-${user.id.slice(0, 8)}-${Date.now()}`

  const { error: insertError } = await admin.from('tier_upgrades').insert({
    user_id: user.id,
    from_tier: user.tier,
    to_tier: toTier,
    amount_paid: amountKobo / 100,
    payment_status: 'pending',
    squad_ref: transactionRef,
  })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://winnexearn.site'

  const squadResponse = await fetch(`${SQUAD_API}/transaction/initiate`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.SQUAD_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: user.email,
      amount: amountKobo,
      currency: 'NGN',
      initiate_type: 'inline',
      transaction_ref: transactionRef,
      callback_url: `${siteUrl}/api/tiers/verify`,
      key: process.env.SQUAD_PUBLIC_KEY,
    }),
  })

  const squadData = await squadResponse.json()

  if (!squadResponse.ok || !squadData.data?.checkout_url) {
    console.error('SquadCo initiate error:', JSON.stringify(squadData))
    await admin
      .from('tier_upgrades')
      .update({ payment_status: 'failed' })
      .eq('squad_ref', transactionRef)

    return NextResponse.json({ error: 'Failed to initialize payment. Please try again.', details: squadData.message || squadData }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    checkout_url: squadData.data.checkout_url,
    ref: transactionRef,
  })
}

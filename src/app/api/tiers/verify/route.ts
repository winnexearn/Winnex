import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const SQUAD_BASE = process.env.SQUAD_SECRET_KEY?.includes('sandbox')
  ? 'https://sandbox-api-d.squadco.com'
  : 'https://api-d.squadco.com'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const ref = searchParams.get('ref')

  if (!ref) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=no_ref', request.url))
  }

  const secretKey = process.env.SQUAD_SECRET_KEY
  if (!secretKey) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=payment_misconfigured', request.url))
  }

  const admin = createAdminClient()

  const { data: record } = await admin
    .from('tier_upgrades')
    .select('*')
    .eq('squad_ref', ref)
    .maybeSingle()

  if (!record) {
    return NextResponse.redirect(new URL('/dashboard/settings?error=unknown_ref', request.url))
  }

  if (record.payment_status === 'completed') {
    return NextResponse.redirect(new URL('/dashboard/settings?upgrade=success', request.url))
  }

  if (record.payment_status === 'failed') {
    return NextResponse.redirect(new URL('/dashboard/settings?error=payment_failed', request.url))
  }

  try {
    const res = await fetch(`${SQUAD_BASE}/transaction/verify/${ref}`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${secretKey}` },
    })

    const data = await res.json()

    if (data.status === 200 && data.data?.status === 'success') {
      const { error: upgradeError } = await admin
        .from('tier_upgrades')
        .update({ payment_status: 'completed' })
        .eq('squad_ref', ref)
        .eq('payment_status', 'pending')

      if (upgradeError) {
        return NextResponse.redirect(new URL('/dashboard/settings?error=upgrade_failed', request.url))
      }

      const { error: userError } = await admin
        .from('users')
        .update({ tier: record.to_tier })
        .eq('id', record.user_id)

      if (userError) {
        return NextResponse.redirect(new URL('/dashboard/settings?error=tier_update_failed', request.url))
      }

      return NextResponse.redirect(new URL('/dashboard/settings?upgrade=success', request.url))
    }

    await admin
      .from('tier_upgrades')
      .update({ payment_status: 'failed' })
      .eq('squad_ref', ref)
      .eq('payment_status', 'pending')

    return NextResponse.redirect(new URL('/dashboard/settings?error=payment_not_verified', request.url))
  } catch {
    return NextResponse.redirect(new URL('/dashboard/settings?error=network_error', request.url))
  }
}

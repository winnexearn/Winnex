import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const SQUAD_API = 'https://api.squadco.com'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const admin = createAdminClient()

  const { data: pending } = await admin
    .from('tier_upgrades')
    .select('*')
    .eq('user_id', user.id)
    .eq('payment_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!pending) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  const createdAt = new Date(pending.created_at).getTime()
  const thirtyMinAgo = Date.now() - 30 * 60 * 1000

  if (createdAt < thirtyMinAgo) {
    await admin
      .from('tier_upgrades')
      .update({ payment_status: 'expired' })
      .eq('id', pending.id)

    return NextResponse.redirect(new URL('/dashboard?upgrade=expired', request.url))
  }

  const secretKey = process.env.SQUAD_SECRET_KEY
  if (!secretKey) {
    return NextResponse.redirect(new URL('/dashboard?error=payment_misconfigured', request.url))
  }

  try {
    const squadRes = await fetch(`${SQUAD_API}/transaction/verify/${pending.squad_ref}`, {
      headers: { 'Authorization': `Bearer ${secretKey}` },
    })

    const squadData = await squadRes.json()

    if (squadRes.ok && squadData.data?.transaction_status === 'Success') {
      await admin
        .from('tier_upgrades')
        .update({ payment_status: 'completed' })
        .eq('id', pending.id)

      await admin
        .from('users')
        .update({ tier: pending.to_tier })
        .eq('id', user.id)

      return NextResponse.redirect(new URL('/dashboard?upgrade=success', request.url))
    }

    return NextResponse.redirect(new URL('/dashboard?upgrade=processing', request.url))
  } catch {
    return NextResponse.redirect(new URL('/dashboard?upgrade=processing', request.url))
  }
}

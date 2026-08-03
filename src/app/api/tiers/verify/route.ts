import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const admin = createAdminClient()

  // Find any pending upgrades for this user
  const { data: pending } = await admin
    .from('tier_upgrades')
    .select('*')
    .eq('user_id', user.id)
    .eq('payment_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (pending) {
    // Auto-expire if older than 30 minutes
    const createdAt = new Date(pending.created_at).getTime()
    const thirtyMinAgo = Date.now() - 30 * 60 * 1000

    if (createdAt < thirtyMinAgo) {
      await admin
        .from('tier_upgrades')
        .update({ payment_status: 'expired' })
        .eq('id', pending.id)

      return NextResponse.redirect(
        new URL('/dashboard/settings?upgrade=expired', request.url)
      )
    }

    // Still within 30 min — mark as completed (webhook may have failed)
    await admin
      .from('tier_upgrades')
      .update({ payment_status: 'completed' })
      .eq('id', pending.id)

    await admin
      .from('users')
      .update({ tier: pending.to_tier })
      .eq('id', user.id)

    return NextResponse.redirect(
      new URL('/dashboard/settings?upgrade=success', request.url)
    )
  }

  // No pending upgrade found — just go to settings
  return NextResponse.redirect(
    new URL('/dashboard/settings', request.url)
  )
}

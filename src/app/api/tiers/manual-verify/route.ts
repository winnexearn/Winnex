import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.transaction_id) {
    return NextResponse.json({ error: 'Transaction ID required' }, { status: 400 })
  }

  const transactionId = body.transaction_id.trim()
  const admin = createAdminClient()

  // Check if this transaction was already used
  const { data: existing } = await admin
    .from('tier_upgrades')
    .select('id, payment_status')
    .eq('squad_ref', transactionId)
    .maybeSingle()

  if (existing && existing.payment_status === 'completed') {
    return NextResponse.json({ error: 'This transaction was already processed.' }, { status: 400 })
  }

  // Find any pending upgrade for this user
  const { data: pending } = await admin
    .from('tier_upgrades')
    .select('*')
    .eq('user_id', user.id)
    .eq('payment_status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!pending) {
    return NextResponse.json({ error: 'No pending upgrade found. Please try upgrading again.' }, { status: 400 })
  }

  // Auto-expire if older than 30 minutes
  const createdAt = new Date(pending.created_at).getTime()
  const thirtyMinAgo = Date.now() - 30 * 60 * 1000
  if (createdAt < thirtyMinAgo) {
    await admin.from('tier_upgrades').update({ payment_status: 'expired' }).eq('id', pending.id)
    return NextResponse.json({ error: 'Pending upgrade expired. Please try again.' }, { status: 400 })
  }

  // Mark as completed and upgrade tier
  await admin
    .from('tier_upgrades')
    .update({ payment_status: 'completed', squad_ref: transactionId })
    .eq('id', pending.id)

  await admin
    .from('users')
    .update({ tier: pending.to_tier })
    .eq('id', user.id)

  return NextResponse.json({ success: true, tier: pending.to_tier })
}

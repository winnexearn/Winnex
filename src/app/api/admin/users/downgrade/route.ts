import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'winnex_admin_2024'

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('x-admin-password')

  if (authHeader !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body || !body.userId || !body.newTier) {
    return NextResponse.json({ error: 'Missing userId or newTier' }, { status: 400 })
  }

  const { userId, newTier, fromTier, reason = 'downgraded by admin' } = body

  const admin = createAdminClient()

  const { data: user, error: userError } = await admin
    .from('users')
    .select('id, full_name, email, tier')
    .eq('id', userId)
    .single()

  if (userError || !user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  if (user.tier <= newTier) {
    return NextResponse.json({ error: 'Can only downgrade to lower tiers' }, { status: 400 })
  }

  const { error: updateError } = await admin
    .from('users')
    .update({ tier: newTier })
    .eq('id', userId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  const { error: logError } = await admin
    .from('tier_history')
    .insert({
      user_id: userId,
      from_tier: user.tier,
      to_tier: newTier,
      action: 'downgraded',
      reason,
      performed_by: 'admin'
    })

  if (logError) {
    console.error('Log error:', logError)
  }

  return NextResponse.json({
    success: true,
    user: { ...user, tier: newTier },
    message: `User downgraded from Tier ${user.tier} to Tier ${newTier}`
  })
}

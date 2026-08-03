import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

function checkAdmin(request: NextRequest): boolean {
  const password = request.headers.get('x-admin-password')
  return password === (process.env.ADMIN_PASSWORD || 'winnex_admin_2024')
}

export async function GET(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: requests, error } = await admin
    .from('tier_upgrades')
    .select('*, user:users(full_name, email)')
    .eq('payment_status', 'manual_review')
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requests })
}

export async function POST(request: NextRequest) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { id, action, user_id, to_tier } = body

  if (!id || !action) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const admin = createAdminClient()

  if (action === 'approve') {
    const { error: updateError } = await admin
      .from('tier_upgrades')
      .update({ payment_status: 'completed' })
      .eq('id', id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    if (user_id && to_tier) {
      await admin
        .from('users')
        .update({ tier: to_tier })
        .eq('id', user_id)
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'deny') {
    const { error } = await admin
      .from('tier_upgrades')
      .update({ payment_status: 'denied' })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

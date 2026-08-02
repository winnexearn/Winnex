import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.email) {
    return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: user } = await admin
    .from('users')
    .select('id')
    .eq('email', body.email)
    .maybeSingle()

  if (!user) {
    return NextResponse.json({ success: true, message: 'If an account exists, a reset token has been generated.' })
  }

  await admin
    .from('password_resets')
    .update({ used: true })
    .eq('user_id', user.id)
    .eq('used', false)

  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString()

  const { error } = await admin.from('password_resets').insert({
    user_id: user.id,
    token,
    expires_at: expiresAt,
  })

  if (error) {
    return NextResponse.json({ error: 'Failed to generate reset token' }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    message: 'Reset token generated. Use it to reset your password.',
    token,
    expires_in: '1 hour',
  })
}

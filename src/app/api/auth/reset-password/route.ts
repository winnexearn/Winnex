import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.token || !body?.password) {
    return NextResponse.json({ error: 'Token and new password are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: resetRecord } = await admin
    .from('password_resets')
    .select('*')
    .eq('token', body.token)
    .eq('used', false)
    .maybeSingle()

  if (!resetRecord) {
    return NextResponse.json({ error: 'Invalid or already used reset token' }, { status: 400 })
  }

  if (new Date(resetRecord.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Reset token has expired. Please request a new one.' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(body.password, 12)

  const { error: updateError } = await admin
    .from('users')
    .update({ password_hash: passwordHash })
    .eq('id', resetRecord.user_id)

  if (updateError) {
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 })
  }

  await admin
    .from('password_resets')
    .update({ used: true })
    .eq('id', resetRecord.id)

  return NextResponse.json({ success: true, message: 'Password reset successful. You can now sign in.' })
}

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { createSessionToken, setSessionCookie, sanitizeUser } from '@/lib/auth'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { email, password, remember } = body

  if (!email || !password) {
    return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: user, error } = await admin
    .from('users')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (error || !user) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const valid = await bcrypt.compare(password, user.password_hash || '')
  if (!valid) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const token = await createSessionToken(user.id)
  const response = NextResponse.json({ user: sanitizeUser(user) })
  setSessionCookie(response, token, remember !== false)
  return response
}

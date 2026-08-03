import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createAdminClient } from '@/lib/supabase/admin'
import { createSessionToken, setSessionCookie, sanitizeUser } from '@/lib/auth'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { full_name, email, phone_number, account_number, bank_name, password, referral_code } = body

  if (!full_name || !email || !phone_number || !account_number || !password) {
    return NextResponse.json({ error: 'All fields are required' }, { status: 400 })
  }

  if (phone_number.length < 11) {
    return NextResponse.json({ error: 'Please enter a valid phone number' }, { status: 400 })
  }

  if (account_number.length < 10) {
    return NextResponse.json({ error: 'Please enter a valid account number' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: byEmail } = await admin
    .from('users')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  const { data: byPhone } = await admin
    .from('users')
    .select('id')
    .eq('phone_number', phone_number)
    .maybeSingle()

  if (byEmail || byPhone) {
    return NextResponse.json(
      { error: 'An account with this email or phone number already exists' },
      { status: 409 }
    )
  }

  const password_hash = await bcrypt.hash(password, 10)
  const newReferralCode = Math.random().toString(36).substring(2, 10).toUpperCase()

  let referredBy: string | null = null
  if (referral_code) {
    const { data: referrer } = await admin
      .from('users')
      .select('id')
      .eq('referral_code', referral_code.toUpperCase())
      .maybeSingle()
    if (referrer) referredBy = referrer.id
  }

  const { data: newUser, error } = await admin
    .from('users')
    .insert({
      email,
      full_name,
      phone_number,
      account_number,
      bank_name: bank_name || 'Nigerian Bank',
      password_hash,
      tier: 1,
      balance: 0,
      commission_balance: 0,
      total_earned: 0,
      referral_code: newReferralCode,
      referred_by: referredBy,
      tasks_completed_today: 0,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (referredBy) {
    await admin.from('referrals').insert({
      referrer_id: referredBy,
      referred_id: newUser.id,
      reward_amount: 200,
      status: 'completed',
    })

    const { data: referrerData } = await admin
      .from('users')
      .select('balance, total_earned')
      .eq('id', referredBy)
      .single()

    await admin
      .from('users')
      .update({
        balance: (referrerData?.balance || 0) + 200,
        total_earned: (referrerData?.total_earned || 0) + 200,
      })
      .eq('id', referredBy)
  }

  const token = await createSessionToken(newUser.id)
  const response = NextResponse.json({ user: sanitizeUser(newUser) }, { status: 201 })
  setSessionCookie(response, token)
  return response
}

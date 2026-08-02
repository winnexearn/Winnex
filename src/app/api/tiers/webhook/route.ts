import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

function verifySquadSignature(body: string, signature: string, secretKey: string): boolean {
  const hash = crypto.createHmac('sha512', secretKey).update(body).digest('hex').toUpperCase()
  return hash === signature
}

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-squad-encrypted-body') || ''

  const secretKey = process.env.SQUAD_SECRET_KEY
  if (!secretKey) {
    return NextResponse.json({ error: 'SQUAD_SECRET_KEY not configured' }, { status: 500 })
  }

  if (!verifySquadSignature(rawBody, signature, secretKey)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const event = payload.Event
  if (event !== 'charge_successful') {
    return NextResponse.json({ received: true })
  }

  const body = payload.Body as Record<string, unknown> | undefined
  if (!body) {
    return NextResponse.json({ error: 'No body' }, { status: 400 })
  }

  const transactionRef = body.transaction_ref as string
  if (!transactionRef) {
    return NextResponse.json({ error: 'No transaction_ref' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: record } = await admin
    .from('tier_upgrades')
    .select('*')
    .eq('squad_ref', transactionRef)
    .maybeSingle()

  if (!record) {
    return NextResponse.json({ received: true })
  }

  if (record.payment_status === 'completed') {
    return NextResponse.json({ received: true })
  }

  await admin
    .from('tier_upgrades')
    .update({ payment_status: 'completed' })
    .eq('squad_ref', transactionRef)

  await admin
    .from('users')
    .update({ tier: record.to_tier })
    .eq('id', record.user_id)

  return NextResponse.json({ received: true })
}

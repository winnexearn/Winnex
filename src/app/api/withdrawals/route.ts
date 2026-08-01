import { NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { isWithdrawalDay } from '@/lib/utils'

export async function GET(request: Request) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: withdrawals, error } = await admin
    .from('withdrawals')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json(withdrawals)
}

export async function POST(request: Request) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const amount = Number(body.amount)
  if (!amount || amount < 1000) {
    return NextResponse.json({ error: 'Minimum withdrawal is ₦1,000' }, { status: 400 })
  }

  if (!isWithdrawalDay()) {
    return NextResponse.json(
      { error: 'Withdrawals are only available on the 1st of every month. Please come back on the 1st.' },
      { status: 400 }
    )
  }

  if (amount > user.balance) {
    return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error: withdrawalError } = await admin.from('withdrawals').insert({
    user_id: user.id,
    amount,
    account_number: user.account_number,
    bank_name: user.bank_name,
    status: 'pending',
  })

  if (withdrawalError) {
    return NextResponse.json({ error: withdrawalError.message }, { status: 500 })
  }

  const { error: balanceError } = await admin
    .from('users')
    .update({ balance: user.balance - amount })
    .eq('id', user.id)

  if (balanceError) {
    return NextResponse.json({ error: balanceError.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, new_balance: user.balance - amount })
}

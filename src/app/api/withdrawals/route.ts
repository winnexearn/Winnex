import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { amount } = body

    if (amount < 1000) {
      return NextResponse.json({ error: 'Minimum withdrawal is ₦1,000' }, { status: 400 })
    }

    // Get user data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (userError) throw userError

    if (amount > userData.balance) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 })
    }

    // Create withdrawal
    const { error: withdrawalError } = await supabase
      .from('withdrawals')
      .insert({
        user_id: user.id,
        amount,
        account_number: userData.account_number,
        bank_name: userData.bank_name,
        status: 'pending',
      })

    if (withdrawalError) throw withdrawalError

    // Update balance
    const { error: balanceError } = await supabase
      .from('users')
      .update({
        balance: userData.balance - amount,
      })
      .eq('id', user.id)

    if (balanceError) throw balanceError

    return NextResponse.json({ success: true, new_balance: userData.balance - amount })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (withdrawalsError) throw withdrawalsError

    return NextResponse.json(withdrawals)
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

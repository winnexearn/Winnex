import { NextRequest, NextResponse } from 'next/server'
import { getSessionUser } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

const NIGERIAN_BANKS = [
  'Access Bank', 'Citibank Nigeria', 'Ecobank Nigeria', 'Fidelity Bank',
  'First Bank of Nigeria', 'First City Monument Bank', 'Globus Bank',
  'Guaranty Trust Bank', 'Heritage Bank', 'Keystone Bank', 'Kuda Bank',
  'Opay', 'Palmpay', 'Polaris Bank', 'Providus Bank', 'Stanbic IBTC Bank',
  'Standard Chartered Bank', 'Sterling Bank', 'SunTrust Bank', 'Titan Trust Bank',
  'Union Bank of Nigeria', 'United Bank for Africa', 'Unity Bank', 'VBank',
  'Wema Bank', 'Zenith Bank',
]

export async function PUT(request: NextRequest) {
  const user = await getSessionUser(request)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { bank_name, account_number } = body

  if (!bank_name || !account_number) {
    return NextResponse.json({ error: 'Bank name and account number are required' }, { status: 400 })
  }

  if (!NIGERIAN_BANKS.includes(bank_name)) {
    return NextResponse.json({ error: 'Invalid bank name' }, { status: 400 })
  }

  if (!/^\d{10}$/.test(account_number)) {
    return NextResponse.json({ error: 'Account number must be exactly 10 digits' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('users')
    .update({ bank_name, account_number, updated_at: new Date().toISOString() })
    .eq('id', user.id)

  if (error) {
    return NextResponse.json({ error: 'Failed to update bank details' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'winnex_admin_2024'

export async function GET(request: Request) {
  const authHeader = request.headers.get('x-admin-password')

  if (authHeader !== ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { count: totalUsers } = await admin
    .from('users')
    .select('*', { count: 'exact', head: true })

  const { data: balanceData } = await admin
    .from('users')
    .select('balance')

  const totalBalance = balanceData?.reduce((sum: number, u: { balance: number }) => sum + u.balance, 0) || 0

  const { count: pendingWithdrawals } = await admin
    .from('withdrawals')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  const { data: withdrawalData } = await admin
    .from('withdrawals')
    .select('amount')
    .eq('status', 'completed')

  const totalWithdrawals = withdrawalData?.reduce((sum: number, w: { amount: number }) => sum + w.amount, 0) || 0

  return NextResponse.json({
    totalUsers: totalUsers || 0,
    totalBalance,
    totalWithdrawals,
    pendingWithdrawals: pendingWithdrawals || 0,
  })
}

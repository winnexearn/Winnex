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
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ requests })
}

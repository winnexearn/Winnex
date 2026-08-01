import { NextResponse } from 'next/server'
import { getCurrentUserId } from '@/lib/auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: Request) {
  const userId = await getCurrentUserId(request)
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const today = new Date().toISOString().split('T')[0]

  const { data: tasks, error } = await admin
    .from('tasks')
    .select('*')
    .eq('user_id', userId)
    .gte('created_at', today)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  return NextResponse.json(tasks)
}

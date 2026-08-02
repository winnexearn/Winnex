import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'winnex_admin_2024'

function isAuthed(request: Request): boolean {
  return request.headers.get('x-admin-password') === ADMIN_PASSWORD
}

export async function GET(request: Request) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  const { data: content, error } = await admin
    .from('content_pool')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)

  if (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }

  const videos = content?.length || 0

  return NextResponse.json({ content: content || [], counts: { videos } })
}

export async function POST(request: Request) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { content_type, urls, title } = body

  if (content_type !== 'tiktok_video') {
    return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
  }

  if (!Array.isArray(urls) || urls.length === 0) {
    return NextResponse.json({ error: 'No URLs provided' }, { status: 400 })
  }

  const cleanUrls = urls
    .map((u: unknown) => String(u).trim())
    .filter((u: string) => u.length > 0)

  const validUrls = cleanUrls.filter((u: string) => /^https?:\/\//i.test(u))

  if (validUrls.length === 0) {
    return NextResponse.json({ error: 'No valid URLs (must start with http:// or https://)' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { data: existing } = await admin
    .from('content_pool')
    .select('url')
    .in('url', validUrls)

  const existingSet = new Set(existing?.map((e) => e.url) || [])

  const toInsert = validUrls
    .filter((u: string) => !existingSet.has(u))
    .map((u: string) => ({
      content_type: 'tiktok_video' as const,
      url: u,
      title: title || null,
      description: null,
      is_active: true,
    }))

  let added = 0
  let error: { message?: string } | null = null

  if (toInsert.length > 0) {
    const { error: insertError } = await admin.from('content_pool').insert(toInsert)
    error = insertError
    added = toInsert.length
  }

  const duplicates = validUrls.length - toInsert.length

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, added, duplicates })
}

export async function DELETE(request: Request) {
  if (!isAuthed(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  const admin = createAdminClient()

  const { error } = await admin.from('content_pool').delete().eq('id', body.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}

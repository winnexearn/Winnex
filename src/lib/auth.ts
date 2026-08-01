import { createAdminClient } from '@/lib/supabase/admin'

export const SESSION_COOKIE = 'winnex_session'

const SESSION_SECRET = process.env.SESSION_SECRET || 'winnex-earn-session-secret'

function secretKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(SESSION_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function createSessionToken(userId: string): Promise<string> {
  const key = await secretKey()
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(userId))
  return `${userId}.${toHex(sig)}`
}

export async function verifySessionToken(token: string | undefined | null): Promise<string | null> {
  if (!token) return null
  const idx = token.lastIndexOf('.')
  if (idx <= 0 || idx === token.length - 1) return null
  const userId = token.slice(0, idx)
  const sig = token.slice(idx + 1)
  try {
    const key = await secretKey()
    const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(userId))
    const expectedHex = toHex(sigBuf)
    if (sig.length !== expectedHex.length) return null
    let diff = 0
    for (let i = 0; i < sig.length; i++) {
      diff |= sig.charCodeAt(i) ^ expectedHex.charCodeAt(i)
    }
    return diff === 0 ? userId : null
  } catch {
    return null
  }
}

export function getCookie(cookieHeader: string | null | undefined, name: string): string | null {
  if (!cookieHeader) return null
  for (const part of cookieHeader.split(';')) {
    const i = part.indexOf('=')
    if (i === -1) continue
    if (part.slice(0, i).trim() === name) {
      return decodeURIComponent(part.slice(i + 1).trim())
    }
  }
  return null
}

export async function getCurrentUserId(request: Request): Promise<string | null> {
  return verifySessionToken(getCookie(request.headers.get('cookie'), SESSION_COOKIE))
}

export async function getSessionUser(request: Request) {
  const userId = await getCurrentUserId(request)
  if (!userId) return null

  const admin = createAdminClient()
  const { data, error } = await admin.from('users').select('*').eq('id', userId).single()
  if (error || !data) return null
  return data
}

export function sanitizeUser(user: Record<string, unknown> | null | undefined) {
  if (!user) return user
  const rest: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(user)) {
    if (key !== 'password_hash') rest[key] = value
  }
  return rest
}

export function setSessionCookie(response: { cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void } }, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })
}

export function clearSessionCookie(response: { cookies: { set: (name: string, value: string, options: Record<string, unknown>) => void } }) {
  response.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  })
}

import { type NextRequest, NextResponse } from 'next/server'
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected =
    pathname === '/dashboard' || pathname.startsWith('/dashboard/')

  if (!isProtected) {
    return NextResponse.next()
  }

  const cookie = request.cookies.get(SESSION_COOKIE)
  const userId = cookie ? await verifySessionToken(cookie.value) : null

  if (!userId) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}

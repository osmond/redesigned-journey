import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { checkRateLimit } from '@/lib/rateLimit'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api')) {
    const ok = checkRateLimit(req.ip ?? 'unknown')
    if (!ok) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
    return NextResponse.next()
  }

  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session && !pathname.startsWith('/login')) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = '/login'
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico|api|login).*)']
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/api')) {
    const ok = checkRateLimit(req.ip ?? 'unknown')
    if (!ok) return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next/static|_next/image|favicon.ico|api|login).*)']
}


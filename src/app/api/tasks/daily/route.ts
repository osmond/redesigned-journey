import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { computeTaskLists } from '@/lib/tasks'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

async function getUserId() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  )
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user.id ?? null
}

export const dynamic = 'force-dynamic'

// Endpoint for Vercel Cron (~7 AM) to compute daily task lists
export async function GET(request: NextRequest) {
  let userId = await getUserId()

  if (!userId) {
    const serviceKey = request.headers.get('x-service-key')
    if (serviceKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userParam = request.nextUrl.searchParams.get('userId')
    if (!userParam) {
      return NextResponse.json({ error: 'Missing userId' }, { status: 400 })
    }
    userId = userParam
  }

  const plants = await prisma.plant.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  const lists = computeTaskLists(plants)
  return NextResponse.json(lists)
}

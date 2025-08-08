import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { subDays } from 'date-fns'
import { getUsageTimeline, getOverdueStats } from '@/lib/stats'

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

export async function GET(req: Request) {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const days = Number(searchParams.get('days')) || 30
  const from = subDays(new Date(), days)
  const usage = await getUsageTimeline(userId, from)
  const overdue = await getOverdueStats(userId)
  return NextResponse.json({ usage, overdue })
}

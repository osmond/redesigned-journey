import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { computeTaskLists } from '@/lib/tasks'
import { sendTaskDigest } from '@/lib/email'
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

export const runtime = 'nodejs'

export const dynamic = 'force-dynamic'

// Vercel Cron to email daily task digest
export async function GET() {
  const userId = await getUserId()
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const plants = await prisma.plant.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })
  const { today } = computeTaskLists(plants)
  if (today.length > 0) {
    await sendTaskDigest(today)
  }
  return NextResponse.json({ sent: today.length })
}

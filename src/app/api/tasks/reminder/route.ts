import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { computeTaskLists } from '@/lib/tasks'
import { sendTaskDigest } from '@/lib/email'
import { getSessionUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Vercel Cron to email daily task digest
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const plants = await prisma.plant.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  })
  const { today } = computeTaskLists(plants)
  if (today.length > 0) {
    await sendTaskDigest(today)
  }
  return NextResponse.json({ sent: today.length })
}

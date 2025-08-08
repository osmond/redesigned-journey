import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { computeTaskLists } from '@/lib/tasks'
import { getUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

// Endpoint for Vercel Cron (~7 AM) to compute daily task lists
export async function GET() {
  const user = await getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const plants = await prisma.plant.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } })
  const lists = computeTaskLists(plants)
  return NextResponse.json(lists)
}

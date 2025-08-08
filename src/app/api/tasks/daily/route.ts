import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

const userId = 'seed-user'
import { computeTaskLists } from '@/lib/tasks'

export const dynamic = 'force-dynamic'

// Endpoint for Vercel Cron (~7 AM) to compute daily task lists
export async function GET() {
  const plants = await prisma.plant.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } })
  const lists = computeTaskLists(plants)
  return NextResponse.json(lists)
}

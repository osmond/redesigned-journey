import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { computeTaskLists } from '@/lib/tasks'
import { sendTaskDigest } from '@/lib/email'

export const dynamic = 'force-dynamic'

// Vercel Cron to email daily task digest
export async function GET() {
  const plants = await prisma.plant.findMany({ orderBy: { createdAt: 'desc' } })
  const { today } = computeTaskLists(plants)
  if (today.length > 0) {
    await sendTaskDigest(today)
  }
  return NextResponse.json({ sent: today.length })
}

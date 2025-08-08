// @ts-nocheck
import fs from 'node:fs'
import cron from 'node-cron'
import PDFDocument from 'pdfkit'
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns'
import { prisma } from '../src/lib/db'
import { getUsageTimeline, getOverdueStats } from '../src/lib/stats'

async function generate(userId: string) {
  const start = startOfMonth(subMonths(new Date(), 1))
  const end = endOfMonth(subMonths(new Date(), 1))
  const usage = await getUsageTimeline(userId, start, end)
  const overdue = await getOverdueStats(userId)
  const month = format(start, 'yyyy-MM')

  const csvLines = ['date,waterMl,fertilizerMl']
  const days = Array.from(new Set([...Object.keys(usage.water), ...Object.keys(usage.fertilizer)])).sort()
  for (const d of days) {
    csvLines.push(`${d},${usage.water[d] || 0},${usage.fertilizer[d] || 0}`)
  }
  fs.writeFileSync(`monthly-report-${month}.csv`, csvLines.join('\n'))

  const doc = new PDFDocument()
  doc.pipe(fs.createWriteStream(`monthly-report-${month}.pdf`))
  doc.fontSize(18).text('Monthly Plant Care Summary', { align: 'center' })
  doc.moveDown()
  doc.fontSize(12).text(`Period: ${format(start, 'yyyy-MM-dd')} - ${format(end, 'yyyy-MM-dd')}`)
  const totalWater = Object.values(usage.water).reduce((a, b) => a + b, 0)
  const totalFert = Object.values(usage.fertilizer).reduce((a, b) => a + b, 0)
  doc.text(`Total water used: ${totalWater} mL`)
  doc.text(`Total fertilizer used: ${totalFert} mL`)
  doc.text(`Overdue watering rate: ${(overdue.overdueWaterRate * 100).toFixed(1)}%`)
  doc.text(`Overdue fertilizing rate: ${(overdue.overdueFertilizerRate * 100).toFixed(1)}%`)
  doc.text(`Plants at risk: ${overdue.plantsAtRisk.length}`)
  doc.end()
}

const userId = process.argv[2]
if (!userId) {
  console.error('Usage: npm run report:monthly -- <userId> [--schedule]')
  process.exit(1)
}

if (process.argv.includes('--schedule')) {
  cron.schedule('0 0 1 * *', () => {
    generate(userId).catch((e) => console.error(e))
  })
} else {
  generate(userId)
    .catch((e) => console.error(e))
    .finally(() => prisma.$disconnect())
}

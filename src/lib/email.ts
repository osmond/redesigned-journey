import nodemailer from 'nodemailer'
import { format } from 'date-fns'
import type { Task } from './tasks'

export async function sendTaskDigest(tasks: Task[]) {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS || !process.env.EMAIL_TO) {
    console.warn('SMTP not configured; skipping digest email')
    return
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  })

  const lines = tasks.map((t) => `${t.kind}: ${t.plant.name} (due ${format(t.due, 'PPP')})`)
  const text = lines.join('\n')

  await transporter.sendMail({
    from: process.env.EMAIL_FROM ?? process.env.SMTP_USER,
    to: process.env.EMAIL_TO,
    subject: `Today's plant care tasks`,
    text,
  })
}

import './globals.css'
import type { Metadata } from 'next'
import { Analytics } from '@vercel/analytics/next'

import ServiceWorkerRegistration from '../components/ServiceWorkerRegistration'

import { SupabaseProvider } from '@/components/supabase-provider'
import AuthButton from '@/components/auth-button'
import { supabaseServer } from '@/lib/supabaseServer'


export const metadata: Metadata = {
  title: 'Plant Care (Local Dev)',
  description: 'No-cloud local dev build',
  manifest: '/manifest.json',
  themeColor: '#16a34a',
  icons: {
    icon: '/icon-192x192.png',
    apple: '/icon-192x192.png'
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const supabase = supabaseServer()
  const {
    data: { session }
  } = await supabase.auth.getSession()

  return (
    <html lang="en">
      <body>

        <header className="border-b border-slate-200 dark:border-slate-800">
          <div className="container py-4 flex items-center justify-between">
            <h1 className="text-xl font-semibold">🌿 Plant Care (Local)</h1>
            <nav className="flex items-center gap-4 text-sm">
              <a className="hover:underline" href="/">Today</a>
              <a className="hover:underline" href="/plants">My Plants</a>
              <a className="hover:underline" href="/rooms">Rooms</a>
            </nav>
          </div>
        </header>
        <main className="container py-6">{children}</main>
        <ServiceWorkerRegistration />

        <SupabaseProvider initialSession={session}>
          <header className="border-b border-slate-200 dark:border-slate-800">
            <div className="container py-4 flex items-center justify-between">
              <h1 className="text-xl font-semibold">🌿 Plant Care (Local)</h1>
              <nav className="flex items-center gap-4 text-sm">
                <a className="hover:underline" href="/">Today</a>
                <a className="hover:underline" href="/plants">My Plants</a>
                <a className="hover:underline" href="/feed">Feed</a>
                <a className="hover:underline" href="/rooms">Rooms</a>
                <AuthButton />
              </nav>
            </div>
          </header>
          <main className="container py-6">{children}</main>
        </SupabaseProvider>

        {process.env.NODE_ENV === 'production' && <Analytics />}

      </body>
    </html>
  )
}

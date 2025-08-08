import { prisma } from '@/lib/db'
import TaskRow from '@/components/TaskRow'
import { format } from 'date-fns'
import { computeTaskLists } from '@/lib/tasks'
import TaskCalendar from '@/components/TaskCalendar'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export default async function Page() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    }
  )
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session) redirect('/login')
  const userId = session.user.id

  const plants = await prisma.plant.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  })

  const { today: due, grouped: groups, groupKeys } = computeTaskLists(plants, 30)

  const upcoming = Object.values(groups).flat()

  return (
    <div className="space-y-6">
      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Due today & overdue</h2>
        {due.length === 0 ? (
          <p>Nothing due today. Your plants are happy 🌞</p>
        ) : (
          <ul className="divide-y divide-slate-200 dark:divide-slate-800">
              {due.map((t) => (
                <TaskRow key={`${t.kind}-${t.plant.id}`} task={t} />
              ))}
          </ul>
        )}
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Calendar</h2>
        <TaskCalendar groups={groups} />
      </section>

      <section className="card">
        <h2 className="text-lg font-semibold mb-3">Upcoming (next 30 days)</h2>
        {upcoming.length === 0 ? (
          <p>No upcoming tasks in the next month.</p>
        ) : (
          <div className="space-y-4">
            {groupKeys.map((k) => (
              <div key={k} className="space-y-2">
                <div className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                  {format(new Date(k), 'EEE, MMM d')}
                </div>
                <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                  {groups[k].map((t) => (
                      <TaskRow key={`${k}-${t.kind}-${t.plant.id}`} task={t} />
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

import { cookies, headers } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export async function getUser() {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    { cookies, headers }
  )
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session?.user ?? null
}

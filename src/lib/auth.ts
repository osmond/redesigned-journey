import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let supabaseAdmin: SupabaseClient | null = null
function getAdminClient() {
  if (!supabaseAdmin) {
    const url = process.env.SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase env vars missing')
    supabaseAdmin = createClient(url, key)
  }
  return supabaseAdmin
}

export async function getUserFromRequest(req: Request) {
  const auth = req.headers.get('authorization')
  const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return null
  const { data, error } = await getAdminClient().auth.getUser(token)
  if (error) return null
  return data.user
}

export async function getUserFromCookies() {
  const { cookies } = await import('next/headers')
  const token = cookies().get('sb-access-token')?.value
  if (!token) return null
  const { data, error } = await getAdminClient().auth.getUser(token)
  if (error) return null
  return data.user
}

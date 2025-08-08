import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function getSessionUser() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
      },
    }
  );
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user ?? null;
}

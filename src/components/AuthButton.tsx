'use client'

import Link from 'next/link'
import { supabaseClient } from '@/lib/supabaseClient'
import { useSupabase } from '@/app/supabase-provider'

export default function AuthButton() {
  const { session } = useSupabase()

  const handleLogout = async () => {
    await supabaseClient.auth.signOut()
  }

  if (session) {
    return (
      <button onClick={handleLogout} className="hover:underline">
        Logout
      </button>
    )
  }

  return (
    <Link className="hover:underline" href="/login">
      Login
    </Link>
  )
}

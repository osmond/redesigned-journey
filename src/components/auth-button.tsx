'use client'

import Link from 'next/link'
import { useSupabase } from './supabase-provider'

export default function AuthButton() {
  const { supabase, session } = useSupabase()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    location.reload()
  }

  if (session) {
    return (
      <button className="hover:underline" onClick={handleLogout}>
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

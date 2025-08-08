'use client'

import { FormEvent, useState } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'
import { useSupabase } from '@/app/supabase-provider'

export default function LoginPage() {
  const { session } = useSupabase()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    const { error } = await supabaseClient.auth.signInWithOtp({ email })
    if (error) setMessage(error.message)
    else setMessage('Check your email for the magic link.')
  }

  const handleLogout = async () => {
    await supabaseClient.auth.signOut()
  }

  if (session) {
    return (
      <div className="container py-6">
        <h1 className="text-xl mb-4">You are logged in</h1>
        <button onClick={handleLogout} className="bg-green-600 text-white px-4 py-2 rounded">
          Logout
        </button>
      </div>
    )
  }

  return (
    <div className="container py-6">
      <h1 className="text-xl mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2 max-w-sm">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="border p-2"
        />
        <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
          Send Magic Link
        </button>
      </form>
      {message && <p className="mt-4">{message}</p>}
    </div>
  )
}

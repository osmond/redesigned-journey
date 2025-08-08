'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabaseClient } from '@/lib/supabaseClient'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const router = useRouter()
  const [supabase] = useState(() => supabaseClient())

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setErrorMessage(error.message)
      return
    }
    router.push('/')
    router.refresh()
  }

  const handleSignUp = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    setErrorMessage(null)
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) {
      setErrorMessage(error.message)
      return
    }
    router.push('/')
    router.refresh()
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Login</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          className="border p-2"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border p-2"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {errorMessage && <p className="text-red-500">{errorMessage}</p>}
        <button className="border p-2" type="submit">
          Sign In
        </button>
        <button className="border p-2" type="button" onClick={handleSignUp}>
          Sign Up
        </button>
      </form>
    </div>
  )
}

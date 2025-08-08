'use client'

import { Session, SupabaseClient } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useState } from 'react'
import { supabaseClient } from '@/lib/supabaseClient'

type SupabaseContext = {
  supabase: SupabaseClient
  session: Session | null
}

const Context = createContext<SupabaseContext | undefined>(undefined)

export function SupabaseProvider({ children, initialSession }: { children: React.ReactNode; initialSession: Session | null }) {
  const [supabase] = useState(() => supabaseClient())
  const [session, setSession] = useState<Session | null>(initialSession)

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => setSession(session))
    return () => subscription.unsubscribe()
  }, [supabase])

  return <Context.Provider value={{ supabase, session }}>{children}</Context.Provider>
}

export function useSupabase() {
  const context = useContext(Context)
  if (!context) throw new Error('useSupabase must be used inside SupabaseProvider')
  return context
}

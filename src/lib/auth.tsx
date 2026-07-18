import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import type { Socio } from './types'

interface AuthState {
  session: Session | null
  socio: Socio | null
  loading: boolean
}

const AuthContext = createContext<AuthState>({ session: null, socio: null, loading: true })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [socio, setSocio] = useState<Socio | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, s) => setSession(s))
    return () => sub.subscription.unsubscribe()
  }, [])

  const userId = session?.user.id
  useEffect(() => {
    if (!userId) {
      setSocio(null)
      return
    }
    supabase
      .from('socios')
      .select('*')
      .eq('id', userId)
      .single()
      .then(({ data }) => setSocio(data as Socio | null))
  }, [userId])

  return (
    <AuthContext.Provider value={{ session, socio, loading }}>{children}</AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}

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
  const userEmail = session?.user.email
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
      .then(({ data, error }) => {
        if (error || !data) {
          // La fila de socios no existe o RLS la bloquea. Antes se ignoraba el
          // error y socio quedaba en null para siempre, lo que reventaba
          // registrado_por en abonos/compras/pedidos. Dejamos constancia y
          // usamos la sesión como respaldo para que la app siga funcionando.
          console.error('No se pudo cargar el socio; se usa la sesión como respaldo.', error)
          setSocio({ id: userId, nombre: userEmail ?? 'Socio' })
        } else {
          setSocio(data as Socio)
        }
      })
  }, [userId, userEmail])

  return (
    <AuthContext.Provider value={{ session, socio, loading }}>{children}</AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}

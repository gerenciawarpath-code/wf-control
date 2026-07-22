import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { Card, ErrorMsg, btnPrimario, inputBase } from '../components/ui'

export default function Login() {
  const { session, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (loading) return null
  if (session) return <Navigate to="/" replace />

  async function entrar(e: FormEvent) {
    e.preventDefault()
    setEnviando(true)
    setError(null)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Correo o contraseña incorrectos')
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="entra w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <span className="wf-marca wf-marca-grande">WF</span>
          </div>
          <div className="label-faint mb-2">Warpath Forge</div>
          <h1 className="titulo-pantalla">WF Control</h1>
        </div>
        <Card>
          <form onSubmit={entrar} className="space-y-4">
            <div>
              <label className="label-faint mb-1.5 block" htmlFor="email">
                Correo
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className={inputBase}
                placeholder="tu@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="label-faint mb-1.5 block" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="current-password"
                className={inputBase}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <ErrorMsg>{error}</ErrorMsg>}
            <button type="submit" className={`${btnPrimario} w-full`} disabled={enviando}>
              {enviando ? 'Entrando…' : 'Entrar'}
            </button>
          </form>
        </Card>
        <p className="mt-6 text-center text-xs text-ink-faint">
          Solo los tres socios de Warpath Forge pueden entrar.
        </p>
      </div>
    </div>
  )
}

import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useData } from '../lib/hooks'
import { getClientesDetalle } from '../lib/data'
import { cop } from '../lib/format'
import {
  Card,
  Cargando,
  ErrorMsg,
  Vacio,
  btnPrimario,
  btnSecundario,
  inputBase,
} from '../components/ui'

export default function Clientes() {
  const { data, loading, error, reload } = useData(getClientesDetalle)
  const [q, setQ] = useState('')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setGuardando(true)
    setErrorForm(null)
    const { error } = await supabase
      .from('clientes')
      .insert({ nombre: nombre.trim(), telefono: telefono.trim() || null })
    setGuardando(false)
    if (error) {
      setErrorForm(error.message)
      return
    }
    setNombre('')
    setTelefono('')
    setMostrarForm(false)
    reload()
  }

  const filtrados = (data ?? []).filter(
    (c) =>
      c.nombre.toLowerCase().includes(q.trim().toLowerCase()) ||
      (c.telefono ?? '').includes(q.trim()),
  )

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-medium tracking-tight">Clientes</h1>
        <button className={btnPrimario} onClick={() => setMostrarForm(!mostrarForm)}>
          Nuevo cliente
        </button>
      </div>

      {mostrarForm && (
        <Card>
          <form onSubmit={guardar} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-faint mb-1.5 block">Nombre</label>
                <input
                  className={inputBase}
                  required
                  placeholder="Pepito Pérez"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
              <div>
                <label className="label-faint mb-1.5 block">Teléfono (WhatsApp)</label>
                <input
                  className={inputBase}
                  inputMode="tel"
                  placeholder="3001234567"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>
            </div>
            {errorForm && <ErrorMsg>{errorForm}</ErrorMsg>}
            <div className="flex gap-2">
              <button type="submit" className={btnSecundario} disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar cliente'}
              </button>
              <button type="button" className={btnSecundario} onClick={() => setMostrarForm(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        <input
          className={inputBase}
          placeholder="Buscar por nombre o teléfono"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {loading ? (
          <Cargando />
        ) : error ? (
          <div className="mt-4">
            <ErrorMsg>{error}</ErrorMsg>
          </div>
        ) : filtrados.length === 0 ? (
          <Vacio>
            {q ? 'Ningún cliente coincide con la búsqueda.' : 'Aún no hay clientes. Crea el primero.'}
          </Vacio>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {filtrados.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/clientes/${c.id}`}
                  className="flex items-center gap-3 py-3 transition-opacity duration-150 hover:opacity-70"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{c.nombre}</div>
                    {c.telefono && <div className="text-xs text-ink-faint">{c.telefono}</div>}
                  </div>
                  {c.deuda > 0 ? (
                    <div className="text-sm font-medium text-negative">debe {cop(c.deuda)}</div>
                  ) : (
                    <div className="text-xs text-ink-faint">al día</div>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

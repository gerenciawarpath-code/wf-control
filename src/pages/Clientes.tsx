import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Search } from 'lucide-react'
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

type Filtro = 'todos' | 'deuda' | 'aldia'

function iniciales(nombre: string): string {
  return (
    nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('') || '?'
  )
}

export default function Clientes() {
  const { data, loading, error, reload } = useData(getClientesDetalle)
  const [q, setQ] = useState('')
  const [filtro, setFiltro] = useState<Filtro>('todos')
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

  const todos = data ?? []
  const conDeuda = todos.filter((c) => c.deuda > 0)
  const porCobrar = conDeuda.reduce((suma, c) => suma + c.deuda, 0)

  const coincide = (c: (typeof todos)[number]) =>
    c.nombre.toLowerCase().includes(q.trim().toLowerCase()) || (c.telefono ?? '').includes(q.trim())
  const filtrados = todos.filter(
    (c) =>
      coincide(c) &&
      (filtro === 'todos' || (filtro === 'deuda' ? c.deuda > 0 : c.deuda <= 0)),
  )
  // Presentación: primero los que deben (mayor deuda arriba), después los al día.
  const deben = filtrados.filter((c) => c.deuda > 0).sort((a, b) => b.deuda - a.deuda)
  const alDia = filtrados.filter((c) => c.deuda <= 0)

  const fila = (c: (typeof todos)[number]) => {
    const debe = c.deuda > 0
    const meta = [
      c.telefono,
      c.num_pedidos > 0 ? (c.num_pedidos === 1 ? '1 pedido' : `${c.num_pedidos} pedidos`) : null,
    ].filter(Boolean)
    return (
      <Link key={c.id} to={`/clientes/${c.id}`} className={`cli-row${debe ? ' deuda' : ''}`}>
        <span className="cav">{iniciales(c.nombre)}</span>
        <div className="who">
          <b>{c.nombre}</b>
          {meta.length > 0 && <div className="meta">{meta.join(' · ')}</div>}
        </div>
        {debe ? (
          <div className="money neg tnum">debe {cop(c.deuda)}</div>
        ) : (
          <span className="chip-ok">al día</span>
        )}
        <ChevronRight size={18} strokeWidth={1.8} className="chev" />
      </Link>
    )
  }

  return (
    <div className="entra-lista space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="titulo-pantalla">Clientes</h1>
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
                  placeholder="Ej: Valentina López"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
              <div>
                <label className="label-faint mb-1.5 block">Teléfono (WhatsApp)</label>
                <input
                  className={inputBase}
                  inputMode="tel"
                  placeholder="Ej: 3215695768"
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

      {!loading && !error && (
        <div className="cli-tiles">
          <div className="cli-tile">
            <div className="lab">Clientes</div>
            <div className="val tnum">{todos.length}</div>
            <div className="sub">registrados</div>
          </div>
          <div className="cli-tile">
            <div className="lab">Con deuda</div>
            <div className="val tnum">{conDeuda.length}</div>
            <div className="sub">de {todos.length} clientes</div>
          </div>
          <div className="cli-tile alert">
            <div className="lab">Por cobrar</div>
            <div className="val tnum">{cop(porCobrar)}</div>
            <div className="sub">suma de lo que te deben</div>
          </div>
        </div>
      )}

      <div className="cli-bar">
        <div className="cli-filtros" role="tablist">
          {(
            [
              ['todos', 'Todos', todos.length],
              ['deuda', 'Con deuda', conDeuda.length],
              ['aldia', 'Al día', todos.length - conDeuda.length],
            ] as [Filtro, string, number][]
          ).map(([id, label, n]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filtro === id}
              className={filtro === id ? 'on' : ''}
              onClick={() => setFiltro(id)}
            >
              {label} <span className="cnt">{n}</span>
            </button>
          ))}
        </div>
        <label className="cli-find">
          <Search size={16} strokeWidth={2} />
          <input
            placeholder="Buscar por nombre o teléfono"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
      </div>

      <div className="cli-lista">
        {loading ? (
          <div className="p-5">
            <Cargando />
          </div>
        ) : error ? (
          <div className="p-5">
            <ErrorMsg>{error}</ErrorMsg>
          </div>
        ) : filtrados.length === 0 ? (
          <Vacio>
            {q || filtro !== 'todos'
              ? 'Ningún cliente coincide con la búsqueda.'
              : 'Aún no hay clientes. Crea el primero.'}
          </Vacio>
        ) : (
          <>
            {deben.length > 0 && (
              <>
                {filtro === 'todos' && <div className="grouphdr">Con deuda · {deben.length}</div>}
                {deben.map(fila)}
              </>
            )}
            {alDia.length > 0 && (
              <>
                {filtro === 'todos' && <div className="grouphdr">Al día · {alDia.length}</div>}
                {alDia.map(fila)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

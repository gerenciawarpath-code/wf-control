import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDownLeft, ArrowUpRight, ChevronRight, Wallet } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useData } from '../lib/hooks'
import { abrirComprobante, getAbonosFull, getComprasFull, getPedidosFull, getResumen } from '../lib/data'
import { cop, fmtFecha } from '../lib/format'
import type { Medio } from '../lib/types'
import AbonoForm from '../components/AbonoForm'
import { Cargando, ErrorMsg, Vacio, btnPrimario } from '../components/ui'

const nombresMedio: Record<Medio, string> = {
  bancolombia: 'Bancolombia',
  nequi: 'Nequi',
  efectivo: 'Efectivo',
}

interface PorMedio {
  entradas: number
  salidas: number
  neto: number
}

async function getPorMedio(): Promise<Record<Medio, PorMedio>> {
  const { data, error } = await supabase.from('caja_por_medio').select('*')
  if (error) throw new Error(error.message)
  const base: Record<Medio, PorMedio> = {
    bancolombia: { entradas: 0, salidas: 0, neto: 0 },
    nequi: { entradas: 0, salidas: 0, neto: 0 },
    efectivo: { entradas: 0, salidas: 0, neto: 0 },
  }
  for (const f of (data ?? []) as (PorMedio & { medio: Medio })[]) {
    base[f.medio] = { entradas: f.entradas, salidas: f.salidas, neto: f.neto }
  }
  return base
}

interface Movimiento {
  id: string
  fecha: string
  titulo: string
  sub: string
  monto: number // firmado: + entrada, − salida
  link: string
  comprobante: string | null
}

type FiltroMov = 'todos' | 'entradas' | 'salidas'

const filtrosMov: { id: FiltroMov; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'entradas', label: 'Entradas' },
  { id: 'salidas', label: 'Salidas' },
]

export default function Caja() {
  const resumen = useData(getResumen)
  const porMedio = useData(getPorMedio)
  const abonos = useData(() => getAbonosFull())
  const compras = useData(getComprasFull)
  const pedidos = useData(getPedidosFull)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [filtroMov, setFiltroMov] = useState<FiltroMov>('todos')

  if (resumen.loading || porMedio.loading || abonos.loading || compras.loading || pedidos.loading)
    return <Cargando />
  if (resumen.error || !resumen.data)
    return <ErrorMsg>No se pudo cargar la caja: {resumen.error}</ErrorMsg>

  const conSaldo = (pedidos.data ?? []).filter((p) => p.saldo > 0)

  const movimientos: Movimiento[] = [
    ...(abonos.data ?? []).map((a) => ({
      id: 'a-' + a.id,
      fecha: a.fecha,
      titulo: a.cliente_nombre,
      sub: `${nombresMedio[a.medio]} · abono · registró ${a.socio_nombre}`,
      monto: a.monto,
      link: `/pedidos/${a.pedido_id}`,
      comprobante: a.comprobante_path,
    })),
    ...(compras.data ?? []).map((c) => ({
      id: 'c-' + c.id,
      fecha: c.fecha,
      titulo: c.proveedor_nombre,
      sub: `${nombresMedio[c.medio]} · compra${c.es_ajuste ? ' · ajuste' : ''}`,
      monto: -c.total,
      link: `/compras/${c.id}`,
      comprobante: c.comprobante_url,
    })),
  ].sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))

  const nEntradas = movimientos.filter((m) => m.monto >= 0).length
  const nSalidas = movimientos.length - nEntradas
  const contarMov = (id: FiltroMov) =>
    id === 'todos' ? movimientos.length : id === 'entradas' ? nEntradas : nSalidas
  const movimientosVisibles = movimientos.filter((m) => {
    if (filtroMov === 'entradas') return m.monto >= 0
    if (filtroMov === 'salidas') return m.monto < 0
    return true
  })

  function recargar() {
    setMostrarForm(false)
    resumen.reload()
    porMedio.reload()
    abonos.reload()
    compras.reload()
    pedidos.reload()
  }

  return (
    <div className="caja entra-lista space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="titulo-pantalla">Caja</h1>
        {!mostrarForm && (
          <button className={btnPrimario} onClick={() => setMostrarForm(true)}>
            Registrar abono
          </button>
        )}
      </div>

      {mostrarForm && (
        <AbonoForm
          opciones={conSaldo.map((p) => ({
            id: p.pedido_id,
            label: `${p.cliente_nombre} — debe ${cop(p.saldo)}`,
            saldo: p.saldo,
          }))}
          onGuardado={recargar}
          onCancelar={() => setMostrarForm(false)}
        />
      )}

      <div className="caja-top">
        <div className="caja-hero">
          <div className="eye">
            <Wallet size={14} strokeWidth={2} />
            Total en caja
          </div>
          <div className="big dsp tnum">{cop(resumen.data.caja)}</div>
          <div className="note">Suma de Bancolombia, Nequi y Efectivo</div>
        </div>
        <div className="caja-split">
          <div className="r">
            <span className="k">
              <span className="d" style={{ background: 'var(--success-fg)' }} />
              Ganancia repartible
            </span>
            <span className="v dsp tnum" style={{ color: 'var(--success-fg)' }}>
              {cop(resumen.data.ganancia_repartible)}
            </span>
          </div>
          <div className="r">
            <span className="k">
              <span className="d" style={{ background: 'var(--text-tertiary)' }} />
              Para reponer
            </span>
            <span className="v dsp tnum">{cop(resumen.data.reponer)}</span>
          </div>
        </div>
      </div>

      <div className="caja-medios">
        {(Object.keys(nombresMedio) as Medio[]).map((m) => {
          const d = porMedio.data?.[m] ?? { entradas: 0, salidas: 0, neto: 0 }
          const enRojo = d.neto < 0
          return (
            <div key={m} className={`caja-medio${enRojo ? ' neg' : ''}`}>
              <div className="mh">
                <b>{nombresMedio[m].toUpperCase()}</b>
                {enRojo && <span className="tag">en rojo</span>}
              </div>
              <div className="bal dsp tnum">{cop(d.neto)}</div>
              <div className="io">
                <div className="in">
                  Entró
                  <span className="n dsp tnum">+{cop(d.entradas)}</span>
                </div>
                <div className="out">
                  Salió
                  <span className="n dsp tnum">−{cop(d.salidas)}</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="cli-lista">
        <div className="movs-head">
          <h2 className="text-lg font-medium">Movimientos</h2>
          <div className="cli-filtros" role="tablist">
            {filtrosMov.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filtroMov === f.id}
                className={filtroMov === f.id ? 'on' : ''}
                onClick={() => setFiltroMov(f.id)}
              >
                {f.label} <span className="cnt">{contarMov(f.id)}</span>
              </button>
            ))}
          </div>
        </div>

        {movimientosVisibles.length === 0 ? (
          <div className="p-5">
            <Vacio
              icono={<Wallet size={32} strokeWidth={1.75} />}
              detalle={
                filtroMov === 'todos'
                  ? 'Los abonos entran y las compras salen; todo aparece aquí.'
                  : undefined
              }
            >
              {filtroMov === 'todos' ? 'Aún no hay movimientos.' : 'No hay movimientos con este filtro.'}
            </Vacio>
          </div>
        ) : (
          movimientosVisibles.map((m) => (
            <Link key={m.id} to={m.link} className="cli-row">
              <span
                className={`grid h-9 w-9 flex-shrink-0 place-items-center rounded-[10px] ${
                  m.monto >= 0 ? 'bg-positive-soft text-positive' : 'bg-negative-soft text-negative'
                }`}
              >
                {m.monto >= 0 ? (
                  <ArrowDownLeft size={16} strokeWidth={2.2} />
                ) : (
                  <ArrowUpRight size={16} strokeWidth={2.2} />
                )}
              </span>
              <div className="who">
                <b>{m.titulo}</b>
                <div className="meta">
                  {fmtFecha(m.fecha)} · {m.sub}
                </div>
              </div>
              {m.comprobante && (
                <button
                  className="whitespace-nowrap text-sm text-accent hover:text-accent-hover"
                  onClick={(e) => {
                    e.stopPropagation()
                    abrirComprobante(m.comprobante!)
                  }}
                >
                  Ver comprobante
                </button>
              )}
              <div
                className={`dsp tnum whitespace-nowrap text-sm font-semibold ${
                  m.monto >= 0 ? 'text-positive' : 'text-negative'
                }`}
              >
                {m.monto >= 0 ? '+' : '−'}
                {cop(Math.abs(m.monto))}
              </div>
              <ChevronRight size={18} strokeWidth={1.8} className="chev" />
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Wallet } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useData } from '../lib/hooks'
import { abrirComprobante, getAbonosFull, getComprasFull, getPedidosFull, getResumen } from '../lib/data'
import { cop, fmtFecha } from '../lib/format'
import type { Medio } from '../lib/types'
import AbonoForm from '../components/AbonoForm'
import { Card, Cargando, ErrorMsg, Label, Vacio, btnPrimario } from '../components/ui'

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

export default function Caja() {
  const resumen = useData(getResumen)
  const porMedio = useData(getPorMedio)
  const abonos = useData(() => getAbonosFull())
  const compras = useData(getComprasFull)
  const pedidos = useData(getPedidosFull)
  const [mostrarForm, setMostrarForm] = useState(false)

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

  function recargar() {
    setMostrarForm(false)
    resumen.reload()
    porMedio.reload()
    abonos.reload()
    compras.reload()
    pedidos.reload()
  }

  return (
    <div className="entra-lista space-y-4 sm:space-y-6">
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

      <Card>
        <Label>Total en caja</Label>
        <div className="mt-2 text-4xl font-semibold tracking-tight text-accent">
          {cop(resumen.data.caja)}
        </div>
        <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
          {(Object.keys(nombresMedio) as Medio[]).map((m) => (
            <div key={m}>
              <Label>{nombresMedio[m]}</Label>
              <div className="mt-1 text-xl font-semibold tracking-tight">
                {cop(porMedio.data?.[m].neto ?? 0)}
              </div>
              <div className="mt-1 text-xs text-ink-faint">
                <span className="text-positive">+{cop(porMedio.data?.[m].entradas ?? 0)}</span>{' '}
                <span className="text-negative">−{cop(porMedio.data?.[m].salidas ?? 0)}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium">Movimientos</h2>
        {movimientos.length === 0 ? (
          <Vacio
            icono={<Wallet size={32} strokeWidth={1.75} />}
            detalle="Los abonos entran y las compras salen; todo aparece aquí."
          >
            Aún no hay movimientos.
          </Vacio>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {movimientos.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <Link to={m.link} className="text-sm font-medium hover:text-accent">
                    {m.titulo}
                  </Link>
                  <div className="text-xs text-ink-faint">
                    {fmtFecha(m.fecha)} · {m.sub}
                  </div>
                </div>
                {m.comprobante && (
                  <button
                    className="text-sm text-accent hover:text-accent-hover"
                    onClick={() => abrirComprobante(m.comprobante!)}
                  >
                    Ver comprobante
                  </button>
                )}
                <div
                  className={`w-28 text-right text-sm font-medium ${m.monto >= 0 ? 'text-positive' : 'text-negative'}`}
                >
                  {m.monto >= 0 ? '+' : '−'}
                  {cop(Math.abs(m.monto))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

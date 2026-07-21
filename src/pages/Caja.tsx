import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useData } from '../lib/hooks'
import { abrirComprobante, getAbonosFull, getPedidosFull, getResumen } from '../lib/data'
import { cop, fmtFecha } from '../lib/format'
import type { Medio } from '../lib/types'
import AbonoForm from '../components/AbonoForm'
import { Card, Cargando, ErrorMsg, Label, Vacio, btnPrimario } from '../components/ui'

const nombresMedio: Record<Medio, string> = {
  bancolombia: 'Bancolombia',
  nequi: 'Nequi',
  efectivo: 'Efectivo',
}

async function getPorMedio(): Promise<Record<Medio, number>> {
  const { data, error } = await supabase.from('caja_por_medio').select('*')
  if (error) throw new Error(error.message)
  const base: Record<Medio, number> = { bancolombia: 0, nequi: 0, efectivo: 0 }
  for (const fila of (data ?? []) as { medio: Medio; total: number }[]) base[fila.medio] = fila.total
  return base
}

export default function Caja() {
  const resumen = useData(getResumen)
  const porMedio = useData(getPorMedio)
  const abonos = useData(() => getAbonosFull())
  const pedidos = useData(getPedidosFull)
  const [mostrarForm, setMostrarForm] = useState(false)

  if (resumen.loading || porMedio.loading || abonos.loading || pedidos.loading)
    return <Cargando />
  if (resumen.error || !resumen.data)
    return <ErrorMsg>No se pudo cargar la caja: {resumen.error}</ErrorMsg>

  const conSaldo = (pedidos.data ?? []).filter((p) => p.saldo > 0)

  function recargar() {
    setMostrarForm(false)
    resumen.reload()
    porMedio.reload()
    abonos.reload()
    pedidos.reload()
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-xl font-medium tracking-tight">Caja</h1>
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
                {cop(porMedio.data?.[m] ?? 0)}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium">Movimientos</h2>
        {(abonos.data ?? []).length === 0 ? (
          <Vacio>Aún no hay movimientos. La caja arranca de cero.</Vacio>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {(abonos.data ?? []).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/pedidos/${a.pedido_id}`}
                    className="text-sm font-medium hover:text-accent"
                  >
                    {a.cliente_nombre}
                  </Link>
                  <div className="text-xs text-ink-faint">
                    {fmtFecha(a.fecha)} · {nombresMedio[a.medio]} · registró {a.socio_nombre}
                  </div>
                </div>
                {a.comprobante_path && (
                  <button
                    className="text-sm text-accent hover:text-accent-hover"
                    onClick={() => abrirComprobante(a.comprobante_path!)}
                  >
                    Ver comprobante
                  </button>
                )}
                <div className="w-28 text-right text-sm font-medium text-positive">
                  +{cop(a.monto)}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

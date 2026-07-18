import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useData } from '../lib/hooks'
import {
  abrirComprobante,
  estadoCuota,
  getAbonosFull,
  getCuotasDetalle,
  getPedidosFull,
} from '../lib/data'
import { cop, fmtFecha, fmtFechaLarga } from '../lib/format'
import type { EstadoPedido, PedidoItem } from '../lib/types'
import AbonoForm from '../components/AbonoForm'
import {
  Badge,
  Card,
  Cargando,
  ErrorMsg,
  Label,
  Vacio,
  btnPrimario,
  btnSecundario,
  tonoEstadoCuota,
  tonoEstadoPedido,
  tonoTipoPedido,
} from '../components/ui'

interface ItemJoin extends PedidoItem {
  productos: { nombre: string } | null
}

async function getItems(pedidoId: string): Promise<ItemJoin[]> {
  const { data, error } = await supabase
    .from('pedido_items')
    .select('*, productos(nombre)')
    .eq('pedido_id', pedidoId)
  if (error) throw new Error(error.message)
  return data as unknown as ItemJoin[]
}

const siguienteEstado: Partial<Record<EstadoPedido, { a: EstadoPedido; label: string }>> = {
  pendiente: { a: 'despachado', label: 'Marcar despachado' },
  despachado: { a: 'entregado', label: 'Marcar entregado' },
}

export default function PedidoDetalle() {
  const { id } = useParams<{ id: string }>()
  const pedidos = useData(getPedidosFull)
  const items = useData(() => getItems(id!), [id])
  const cuotas = useData(() => getCuotasDetalle(id), [id])
  const abonos = useData(() => getAbonosFull(id), [id])
  const [mostrarAbono, setMostrarAbono] = useState(false)
  const [errorEstado, setErrorEstado] = useState<string | null>(null)

  if (pedidos.loading || items.loading || cuotas.loading || abonos.loading) return <Cargando />

  const p = (pedidos.data ?? []).find((x) => x.pedido_id === id)
  if (!p) return <ErrorMsg>No se encontró el pedido.</ErrorMsg>

  const avance = siguienteEstado[p.estado]

  async function cambiarEstado(a: EstadoPedido) {
    setErrorEstado(null)
    const { error } = await supabase.from('pedidos').update({ estado: a }).eq('id', id)
    if (error) setErrorEstado(error.message)
    else pedidos.reload()
  }

  function recargarTodo() {
    setMostrarAbono(false)
    pedidos.reload()
    cuotas.reload()
    abonos.reload()
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <Link to="/pedidos" className="text-sm text-ink-faint hover:text-ink">
          ← Pedidos
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-medium tracking-tight">
              <Link to={`/clientes/${p.cliente_id}`} className="hover:text-accent">
                {p.cliente_nombre}
              </Link>
            </h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="text-sm text-ink-faint">{fmtFechaLarga(p.fecha)}</span>
              <Badge tono={tonoEstadoPedido[p.estado]}>{p.estado}</Badge>
              <Badge tono={tonoTipoPedido[p.tipo]}>
                {p.tipo === 'credito' ? 'crédito' : 'contado'}
              </Badge>
              <span className="text-sm text-ink-faint">· tomado por {p.socio_nombre}</span>
            </div>
          </div>
          {avance && (
            <button className={btnSecundario} onClick={() => cambiarEstado(avance.a)}>
              {avance.label}
            </button>
          )}
        </div>
        {errorEstado && (
          <div className="mt-2">
            <ErrorMsg>{errorEstado}</ErrorMsg>
          </div>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <Label>Valor total</Label>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{cop(p.valor_total)}</div>
        </Card>
        <Card>
          <Label>Recaudado</Label>
          <div className="mt-2 text-2xl font-semibold tracking-tight text-positive">
            {cop(p.recaudado)}
          </div>
        </Card>
        <Card>
          <Label>Saldo</Label>
          <div
            className={`mt-2 text-2xl font-semibold tracking-tight ${p.saldo > 0 ? 'text-negative' : ''}`}
          >
            {cop(p.saldo)}
          </div>
          {p.saldo === 0 && <div className="mt-1 text-sm text-positive">pagado completo</div>}
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-medium">Productos</h2>
        <ul className="mt-2 divide-y divide-line">
          {(items.data ?? []).map((it) => (
            <li key={it.id} className="flex items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">{it.productos?.nombre ?? '—'}</div>
                <div className="text-xs text-ink-faint">
                  {it.cantidad} × {cop(it.precio_venta)}
                </div>
              </div>
              <div className="text-sm font-medium">{cop(it.cantidad * it.precio_venta)}</div>
            </li>
          ))}
        </ul>
      </Card>

      {p.tipo === 'credito' && (
        <Card>
          <h2 className="text-lg font-medium">Plan de cuotas</h2>
          {(cuotas.data ?? []).length === 0 ? (
            <Vacio>Este pedido no tiene cuotas definidas.</Vacio>
          ) : (
            <ul className="mt-2 divide-y divide-line">
              {(cuotas.data ?? []).map((c) => {
                const estado = estadoCuota(c)
                return (
                  <li key={c.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">
                        Cuota {c.numero} · {fmtFechaLarga(c.fecha)}
                      </div>
                      {estado === 'parcial' && (
                        <div className="text-xs text-ink-faint">
                          abonado {cop(c.pagado)} de {cop(c.monto)}
                        </div>
                      )}
                    </div>
                    <Badge tono={tonoEstadoCuota[estado]}>{estado}</Badge>
                    <div className="w-24 text-right text-sm font-medium">{cop(c.monto)}</div>
                  </li>
                )
              })}
            </ul>
          )}
        </Card>
      )}

      <Card>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Abonos</h2>
          {p.saldo > 0 && !mostrarAbono && (
            <button className={btnPrimario} onClick={() => setMostrarAbono(true)}>
              Registrar abono
            </button>
          )}
        </div>
        {(abonos.data ?? []).length === 0 ? (
          <Vacio>Aún no hay abonos en este pedido.</Vacio>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {(abonos.data ?? []).map((a) => (
              <li key={a.id} className="flex flex-wrap items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{cop(a.monto)}</div>
                  <div className="text-xs text-ink-faint">
                    {fmtFecha(a.fecha)} · {a.medio} · registró {a.socio_nombre}
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
              </li>
            ))}
          </ul>
        )}
      </Card>

      {mostrarAbono && (
        <AbonoForm
          opciones={[{ id: p.pedido_id, label: p.cliente_nombre, saldo: p.saldo }]}
          pedidoFijo={p.pedido_id}
          onGuardado={recargarTodo}
          onCancelar={() => setMostrarAbono(false)}
        />
      )}
    </div>
  )
}

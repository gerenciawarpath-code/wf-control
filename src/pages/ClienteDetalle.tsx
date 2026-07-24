import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useData } from '../lib/hooks'
import { getPedidosFull } from '../lib/data'
import { eliminarCliente } from '../lib/mutations'
import { cop, fmtFechaLarga } from '../lib/format'
import type { ClienteDetalle as TCliente } from '../lib/types'
import GeneradorMensaje from '../components/GeneradorMensaje'
import { ConfirmDialog } from '../components/Modal'
import {
  Badge,
  Card,
  Cargando,
  ErrorMsg,
  Label,
  Vacio,
  btnSecundario,
  inputBase,
  tonoEstadoPedido,
  tonoTipoPedido,
} from '../components/ui'

async function getCliente(id: string): Promise<TCliente> {
  const { data, error } = await supabase.from('clientes_detalle').select('*').eq('id', id).single()
  if (error) throw new Error(error.message)
  return data as TCliente
}

export default function ClienteDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const cliente = useData(() => getCliente(id!), [id])
  const pedidos = useData(getPedidosFull)
  const [editando, setEditando] = useState(false)
  const [nombre, setNombre] = useState('')
  const [telefono, setTelefono] = useState('')
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [confirmarBorrar, setConfirmarBorrar] = useState(false)

  if (cliente.loading) return <Cargando />
  if (cliente.error || !cliente.data)
    return <ErrorMsg>No se encontró el cliente: {cliente.error}</ErrorMsg>

  const c = cliente.data
  const susPedidos = (pedidos.data ?? []).filter((p) => p.cliente_id === c.id)

  async function guardarEdicion(e: FormEvent) {
    e.preventDefault()
    setErrorForm(null)
    const { error } = await supabase
      .from('clientes')
      .update({ nombre: nombre.trim(), telefono: telefono.trim() || null })
      .eq('id', c.id)
    if (error) {
      setErrorForm(error.message)
      return
    }
    setEditando(false)
    cliente.reload()
  }

  return (
    <div className="entra-lista space-y-4 sm:space-y-6">
      <div>
        <Link to="/clientes" className="text-sm text-ink-faint hover:text-ink">
          ← Clientes
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="titulo-pantalla">{c.nombre}</h1>
            {c.telefono && (
              <a
                href={`https://wa.me/57${c.telefono.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-ink-secondary hover:text-accent"
              >
                {c.telefono} · WhatsApp
              </a>
            )}
          </div>
          <button
            className={btnSecundario}
            onClick={() => {
              setNombre(c.nombre)
              setTelefono(c.telefono ?? '')
              setEditando(!editando)
            }}
          >
            Editar
          </button>
        </div>
      </div>

      {editando && (
        <Card>
          <form onSubmit={guardarEdicion} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-faint mb-1.5 block">Nombre</label>
                <input
                  className={inputBase}
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
              <div>
                <label className="label-faint mb-1.5 block">Teléfono (WhatsApp)</label>
                <input
                  className={inputBase}
                  inputMode="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                />
              </div>
            </div>
            {errorForm && <ErrorMsg>{errorForm}</ErrorMsg>}
            <div className="flex gap-2">
              <button type="submit" className={btnSecundario}>
                Guardar cambios
              </button>
              <button type="button" className={btnSecundario} onClick={() => setEditando(false)}>
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <Label>Total comprado</Label>
          <div className="mt-2 text-2xl font-semibold tracking-tight">{cop(c.total_comprado)}</div>
          <div className="mt-1 text-sm text-ink-faint">
            {c.num_pedidos === 1 ? '1 pedido' : `${c.num_pedidos} pedidos`}
          </div>
        </Card>
        <Card>
          <Label>Debe</Label>
          <div
            className={`mt-2 text-2xl font-semibold tracking-tight ${c.deuda > 0 ? 'text-negative' : ''}`}
          >
            {cop(c.deuda)}
          </div>
          {c.deuda === 0 && <div className="mt-1 text-sm text-ink-faint">al día</div>}
        </Card>
        <Card>
          <Label>Recompra estimada</Label>
          <div className="mt-2 text-2xl font-semibold tracking-tight">
            {c.fecha_recompra ? fmtFechaLarga(c.fecha_recompra) : '—'}
          </div>
          <div className="mt-1 text-sm text-ink-faint">según su último producto</div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-medium">Mensaje de WhatsApp</h2>
        <p className="mb-3 mt-1 text-sm text-ink-secondary">
          La IA redacta un mensaje con los datos de {c.nombre}; tú lo revisas y lo envías.
        </p>
        <GeneradorMensaje clienteId={c.id} telefono={c.telefono} />
      </Card>

      <Card>
        <h2 className="text-lg font-medium">Historial de pedidos</h2>
        {susPedidos.length === 0 ? (
          <Vacio>Este cliente aún no tiene pedidos.</Vacio>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {susPedidos.map((p) => (
              <li key={p.pedido_id}>
                <Link
                  to={`/pedidos/${p.pedido_id}`}
                  className="flex flex-wrap items-center gap-3 py-3 transition-opacity duration-150 hover:opacity-70"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{fmtFechaLarga(p.fecha)}</div>
                    <div className="mt-1 flex gap-1.5">
                      <Badge tono={tonoEstadoPedido[p.estado]}>{p.estado}</Badge>
                      <Badge tono={tonoTipoPedido[p.tipo]}>
                        {p.tipo === 'credito' ? 'crédito' : 'contado'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{cop(p.valor_total)}</div>
                    {p.saldo > 0 && (
                      <div className="text-xs text-negative">debe {cop(p.saldo)}</div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-medium">Eliminar cliente</h2>
        {susPedidos.length > 0 ? (
          <p className="mt-2 text-sm text-ink-secondary">
            No se puede eliminar: tiene {susPedidos.length}{' '}
            {susPedidos.length === 1 ? 'pedido' : 'pedidos'}. Elimina o transfiere sus pedidos
            primero.
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-ink-secondary">
              Este cliente no tiene pedidos, así que se puede eliminar. La acción no se puede
              deshacer, pero queda registrada en el historial.
            </p>
            <button className="btn-peligro mt-4" onClick={() => setConfirmarBorrar(true)}>
              Eliminar cliente
            </button>
          </>
        )}
      </Card>

      {confirmarBorrar && (
        <ConfirmDialog
          titulo={`Eliminar a ${c.nombre}`}
          mensaje={
            <>
              ¿Seguro que quieres eliminar a <strong>{c.nombre}</strong>? Esta acción no se puede
              deshacer.
            </>
          }
          textoConfirmar="Eliminar cliente"
          onCancelar={() => setConfirmarBorrar(false)}
          onConfirmar={async () => {
            await eliminarCliente(c.id)
            navigate('/clientes')
          }}
        />
      )}
    </div>
  )
}

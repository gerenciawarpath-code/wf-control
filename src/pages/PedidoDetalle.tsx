import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useData } from '../lib/hooks'
import {
  abrirComprobante,
  estadoCuota,
  getAbonosFull,
  getClientes,
  getCuotasDetalle,
  getPedidosFull,
  getProductos,
  type AbonoFull,
} from '../lib/data'
import {
  actualizarPedidoCabecera,
  eliminarAbono,
  eliminarPedido,
  sincronizarCuotas,
  sincronizarItems,
  type CuotaEditable,
  type ItemEditable,
} from '../lib/mutations'
import { cop, fmtFecha, fmtFechaLarga, hoyISO, sumarDias } from '../lib/format'
import type { EstadoPedido, PedidoItem } from '../lib/types'
import AbonoForm from '../components/AbonoForm'
import { ConfirmDialog } from '../components/Modal'
import {
  Badge,
  Card,
  Cargando,
  ErrorMsg,
  Label,
  MoneyInput,
  Vacio,
  btnPrimario,
  btnSecundario,
  inputBase,
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

const estados: EstadoPedido[] = ['pendiente', 'despachado', 'entregado']

export default function PedidoDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const pedidos = useData(getPedidosFull)
  const items = useData(() => getItems(id!), [id])
  const cuotas = useData(() => getCuotasDetalle(id), [id])
  const abonos = useData(() => getAbonosFull(id), [id])
  const clientes = useData(getClientes)
  const productos = useData(getProductos)

  const [editCabecera, setEditCabecera] = useState(false)
  const [editItems, setEditItems] = useState(false)
  const [editCuotas, setEditCuotas] = useState(false)
  const [mostrarAbono, setMostrarAbono] = useState(false)
  const [abonoEditar, setAbonoEditar] = useState<AbonoFull | null>(null)
  const [abonoBorrar, setAbonoBorrar] = useState<AbonoFull | null>(null)
  const [borrarPedido, setBorrarPedido] = useState(false)

  if (
    pedidos.loading ||
    items.loading ||
    cuotas.loading ||
    abonos.loading ||
    clientes.loading ||
    productos.loading
  )
    return <Cargando />

  const p = (pedidos.data ?? []).find((x) => x.pedido_id === id)
  if (!p) return <ErrorMsg>No se encontró el pedido.</ErrorMsg>

  function recargarTodo() {
    setMostrarAbono(false)
    setAbonoEditar(null)
    setEditCabecera(false)
    setEditItems(false)
    setEditCuotas(false)
    pedidos.reload()
    items.reload()
    cuotas.reload()
    abonos.reload()
  }

  const sumaCuotas = (cuotas.data ?? []).reduce((s, c) => s + c.monto, 0)
  const cuotasDescuadran = p.tipo === 'credito' && (cuotas.data ?? []).length > 0 && sumaCuotas !== p.valor_total

  return (
    <div className="entra-lista space-y-4 sm:space-y-6">
      <div>
        <Link to="/pedidos" className="text-sm text-ink-faint hover:text-ink">
          ← Pedidos
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="titulo-pantalla">
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
          {!editCabecera && (
            <button className={btnSecundario} onClick={() => setEditCabecera(true)}>
              Editar pedido
            </button>
          )}
        </div>
      </div>

      {editCabecera && (
        <EditarCabecera
          estadoInicial={p.estado}
          fechaInicial={p.fecha}
          clienteInicial={p.cliente_id}
          clientes={(clientes.data ?? []).map((c) => ({ id: c.id, nombre: c.nombre }))}
          onGuardar={async (cambios) => {
            await actualizarPedidoCabecera(p.pedido_id, cambios)
            recargarTodo()
          }}
          onCancelar={() => setEditCabecera(false)}
        />
      )}

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
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-medium">Productos</h2>
          {!editItems && (
            <button className={btnSecundario} onClick={() => setEditItems(true)}>
              Editar productos
            </button>
          )}
        </div>
        {editItems ? (
          <EditarItems
            itemsIniciales={(items.data ?? []).map((it) => ({
              id: it.id,
              producto_id: it.producto_id,
              cantidad: it.cantidad,
              precio_venta: it.precio_venta,
              costo: it.costo,
              nombre: it.productos?.nombre ?? '—',
            }))}
            productos={(productos.data ?? []).filter((pr) => pr.activo)}
            onGuardar={async (nuevos) => {
              await sincronizarItems(
                p.pedido_id,
                nuevos,
                (items.data ?? []).map((it) => it.id),
              )
              recargarTodo()
            }}
            onCancelar={() => setEditItems(false)}
          />
        ) : (
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
        )}
      </Card>

      {p.tipo === 'credito' && (
        <Card>
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-medium">Plan de cuotas</h2>
            {!editCuotas && (
              <button className={btnSecundario} onClick={() => setEditCuotas(true)}>
                Editar plan
              </button>
            )}
          </div>

          {cuotasDescuadran && !editCuotas && (
            <div className="mt-3 rounded-control bg-warning-soft px-3 py-2 text-sm text-warning">
              Las cuotas suman {cop(sumaCuotas)} y el pedido vale {cop(p.valor_total)}. Ajusta el
              plan para que cuadren.
            </div>
          )}

          {editCuotas ? (
            <EditarCuotas
              cuotasIniciales={(cuotas.data ?? []).map((c) => ({
                id: c.id,
                fecha: c.fecha,
                monto: c.monto,
              }))}
              valorTotal={p.valor_total}
              onGuardar={async (nuevas) => {
                await sincronizarCuotas(
                  p.pedido_id,
                  nuevas,
                  (cuotas.data ?? []).map((c) => c.id),
                )
                recargarTodo()
              }}
              onCancelar={() => setEditCuotas(false)}
            />
          ) : (cuotas.data ?? []).length === 0 ? (
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
          {p.saldo > 0 && !mostrarAbono && !abonoEditar && (
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
                <button
                  className="text-sm text-ink-secondary hover:text-ink"
                  onClick={() => {
                    setMostrarAbono(false)
                    setAbonoEditar(a)
                  }}
                >
                  Editar
                </button>
                <button className="link-peligro" onClick={() => setAbonoBorrar(a)}>
                  Eliminar
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {(mostrarAbono || abonoEditar) && (
        <AbonoForm
          opciones={[{ id: p.pedido_id, label: p.cliente_nombre, saldo: p.saldo }]}
          pedidoFijo={p.pedido_id}
          abonoExistente={abonoEditar ?? undefined}
          onGuardado={recargarTodo}
          onCancelar={() => {
            setMostrarAbono(false)
            setAbonoEditar(null)
          }}
        />
      )}

      <Card>
        <h2 className="text-lg font-medium">Eliminar pedido</h2>
        <p className="mt-2 text-sm text-ink-secondary">
          Borra el pedido junto con sus cuotas y abonos. Afecta la caja y la deuda del cliente, y no
          se puede deshacer.
        </p>
        <button className="btn-peligro mt-4" onClick={() => setBorrarPedido(true)}>
          Eliminar pedido
        </button>
      </Card>

      {borrarPedido && (
        <ConfirmDialog
          titulo="Eliminar pedido"
          palabraClave="ELIMINAR"
          textoConfirmar="Eliminar pedido"
          mensaje={
            <>
              Vas a eliminar el pedido de <strong>{p.cliente_nombre}</strong> por{' '}
              <strong>{cop(p.valor_total)}</strong>. Esto también borra sus{' '}
              {(cuotas.data ?? []).length} cuotas y sus {(abonos.data ?? []).length} abonos
              {p.recaudado > 0 ? `, y baja ${cop(p.recaudado)} de la caja` : ''}. La acción no se
              puede deshacer.
            </>
          }
          onCancelar={() => setBorrarPedido(false)}
          onConfirmar={async () => {
            await eliminarPedido(p.pedido_id)
            navigate('/pedidos')
          }}
        />
      )}

      {abonoBorrar && (
        <ConfirmDialog
          titulo="Eliminar abono"
          textoConfirmar="Eliminar abono"
          mensaje={
            <>
              Vas a eliminar el abono de <strong>{cop(abonoBorrar.monto)}</strong> ({abonoBorrar.medio}
              ). Esto baja la caja y sube la deuda del cliente. No se puede deshacer.
            </>
          }
          onCancelar={() => setAbonoBorrar(null)}
          onConfirmar={async () => {
            await eliminarAbono(abonoBorrar.id)
            setAbonoBorrar(null)
            recargarTodo()
          }}
        />
      )}
    </div>
  )
}

/* ---------- Editor de cabecera ---------- */

function EditarCabecera({
  estadoInicial,
  fechaInicial,
  clienteInicial,
  clientes,
  onGuardar,
  onCancelar,
}: {
  estadoInicial: EstadoPedido
  fechaInicial: string
  clienteInicial: string
  clientes: { id: string; nombre: string }[]
  onGuardar: (c: { estado: EstadoPedido; fecha: string; cliente_id: string }) => Promise<void>
  onCancelar: () => void
}) {
  const [estado, setEstado] = useState(estadoInicial)
  const [fecha, setFecha] = useState(fechaInicial)
  const [clienteId, setClienteId] = useState(clienteInicial)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  return (
    <Card>
      <h2 className="text-lg font-medium">Editar pedido</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label-faint mb-1.5 block">Cliente</label>
          <select className={inputBase} value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
            {clientes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-faint mb-1.5 block">Estado</label>
          <select
            className={inputBase}
            value={estado}
            onChange={(e) => setEstado(e.target.value as EstadoPedido)}
          >
            {estados.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label-faint mb-1.5 block">Fecha</label>
          <input type="date" className={inputBase} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>
      {error && (
        <div className="mt-4">
          <ErrorMsg>{error}</ErrorMsg>
        </div>
      )}
      <div className="mt-4 flex gap-2">
        <button
          className={btnPrimario}
          disabled={guardando}
          onClick={async () => {
            setGuardando(true)
            setError(null)
            try {
              await onGuardar({ estado, fecha, cliente_id: clienteId })
            } catch (e) {
              setGuardando(false)
              setError(e instanceof Error ? e.message : 'No se pudo guardar.')
            }
          }}
        >
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
        <button className={btnSecundario} onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </Card>
  )
}

/* ---------- Editor de renglones ---------- */

interface ItemUI extends ItemEditable {
  nombre: string
}

function EditarItems({
  itemsIniciales,
  productos,
  onGuardar,
  onCancelar,
}: {
  itemsIniciales: ItemUI[]
  productos: { id: string; nombre: string; precio_venta: number; costo: number }[]
  onGuardar: (items: ItemEditable[]) => Promise<void>
  onCancelar: () => void
}) {
  const [lineas, setLineas] = useState<ItemUI[]>(itemsIniciales)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const total = lineas.reduce((s, l) => s + l.cantidad * l.precio_venta, 0)

  function cambiar(idx: number, cambio: Partial<ItemUI>) {
    setLineas(lineas.map((l, i) => (i === idx ? { ...l, ...cambio } : l)))
  }

  function agregar() {
    const pr = productos[0]
    if (!pr) return
    setLineas([
      ...lineas,
      { producto_id: pr.id, nombre: pr.nombre, cantidad: 1, precio_venta: pr.precio_venta, costo: pr.costo },
    ])
  }

  async function guardar() {
    const validas = lineas.filter((l) => l.producto_id && l.cantidad > 0)
    if (validas.length === 0) return setError('El pedido debe tener al menos un producto.')
    if (validas.some((l) => l.precio_venta <= 0))
      return setError('Todos los renglones deben tener un precio mayor a cero.')
    setGuardando(true)
    setError(null)
    try {
      await onGuardar(validas.map(({ nombre: _n, ...rest }) => rest))
    } catch (e) {
      setGuardando(false)
      setError(e instanceof Error ? e.message : 'No se pudo guardar.')
    }
  }

  return (
    <div className="mt-3 space-y-3">
      {lineas.map((l, idx) => (
        <div key={l.id ?? `nuevo-${idx}`} className="flex flex-wrap items-end gap-3">
          <div className="min-w-40 flex-1">
            {idx === 0 && <label className="label-faint mb-1.5 block">Producto</label>}
            {l.id ? (
              <div className="flex h-11 items-center text-sm font-medium">{l.nombre}</div>
            ) : (
              <select
                className={inputBase}
                value={l.producto_id}
                onChange={(e) => {
                  const pr = productos.find((x) => x.id === e.target.value)
                  cambiar(idx, {
                    producto_id: e.target.value,
                    nombre: pr?.nombre ?? '',
                    precio_venta: pr?.precio_venta ?? 0,
                    costo: pr?.costo ?? 0,
                  })
                }}
              >
                {productos.map((pr) => (
                  <option key={pr.id} value={pr.id}>
                    {pr.nombre}
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="w-20">
            {idx === 0 && <label className="label-faint mb-1.5 block">Cant.</label>}
            <input
              type="number"
              min={1}
              className={inputBase}
              value={l.cantidad}
              onChange={(e) => cambiar(idx, { cantidad: Number(e.target.value) })}
            />
          </div>
          <div className="w-32">
            {idx === 0 && <label className="label-faint mb-1.5 block">Precio</label>}
            <MoneyInput value={l.precio_venta} onChange={(n) => cambiar(idx, { precio_venta: n })} />
          </div>
          <button
            type="button"
            className="link-peligro h-11"
            onClick={() => setLineas(lineas.filter((_, i) => i !== idx))}
          >
            Quitar
          </button>
        </div>
      ))}

      {productos.length > 0 && (
        <button type="button" className={btnSecundario} onClick={agregar}>
          Agregar producto
        </button>
      )}

      <div className="border-t border-line pt-3 text-right">
        <Label className="mb-1">Nuevo valor total</Label>
        <div className="text-xl font-semibold tracking-tight">{cop(total)}</div>
      </div>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      <div className="flex gap-2">
        <button className={btnPrimario} onClick={guardar} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar productos'}
        </button>
        <button className={btnSecundario} onClick={onCancelar}>
          Cancelar
        </button>
      </div>
      <p className="text-xs text-ink-faint">
        Si es un pedido a crédito y cambia el total, revisa el plan de cuotas para que vuelva a
        cuadrar.
      </p>
    </div>
  )
}

/* ---------- Editor de cuotas ---------- */

function EditarCuotas({
  cuotasIniciales,
  valorTotal,
  onGuardar,
  onCancelar,
}: {
  cuotasIniciales: CuotaEditable[]
  valorTotal: number
  onGuardar: (cuotas: CuotaEditable[]) => Promise<void>
  onCancelar: () => void
}) {
  const [lineas, setLineas] = useState<CuotaEditable[]>(cuotasIniciales)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const suma = lineas.reduce((s, c) => s + c.monto, 0)
  const diferencia = valorTotal - suma

  function cambiar(idx: number, cambio: Partial<CuotaEditable>) {
    setLineas(lineas.map((c, i) => (i === idx ? { ...c, ...cambio } : c)))
  }

  async function guardar() {
    if (lineas.length === 0) return setError('Debe haber al menos una cuota.')
    if (lineas.some((c) => !c.fecha || c.monto <= 0))
      return setError('Cada cuota necesita fecha y monto mayor a cero.')
    if (diferencia !== 0)
      return setError(
        diferencia > 0
          ? `Faltan ${cop(diferencia)} para cuadrar con el valor del pedido.`
          : `Las cuotas suman ${cop(-diferencia)} de más.`,
      )
    setGuardando(true)
    setError(null)
    try {
      await onGuardar(lineas)
    } catch (e) {
      setGuardando(false)
      setError(e instanceof Error ? e.message : 'No se pudo guardar.')
    }
  }

  return (
    <div className="mt-3 space-y-3">
      {lineas.map((c, idx) => (
        <div key={c.id ?? `nuevo-${idx}`} className="flex flex-wrap items-center gap-3">
          <span className="w-14 text-sm text-ink-faint">Cuota {idx + 1}</span>
          <input
            type="date"
            className={`${inputBase} w-40`}
            value={c.fecha}
            onChange={(e) => cambiar(idx, { fecha: e.target.value })}
          />
          <div className="w-32">
            <MoneyInput value={c.monto} onChange={(n) => cambiar(idx, { monto: n })} />
          </div>
          <button
            type="button"
            className="link-peligro"
            onClick={() => setLineas(lineas.filter((_, i) => i !== idx))}
          >
            Quitar
          </button>
        </div>
      ))}

      <button
        type="button"
        className={btnSecundario}
        onClick={() =>
          setLineas([
            ...lineas,
            { fecha: sumarDias(lineas[lineas.length - 1]?.fecha ?? hoyISO(), 15), monto: Math.max(diferencia, 0) },
          ])
        }
      >
        Agregar cuota
      </button>

      <p className={`text-sm ${diferencia === 0 ? 'text-positive' : 'text-warning'}`}>
        {diferencia === 0
          ? `Las cuotas suman ${cop(suma)} y cuadran con el pedido.`
          : diferencia > 0
            ? `Faltan ${cop(diferencia)} para cuadrar con ${cop(valorTotal)}.`
            : `Las cuotas suman ${cop(-diferencia)} de más (el pedido vale ${cop(valorTotal)}).`}
      </p>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      <div className="flex gap-2">
        <button className={btnPrimario} onClick={guardar} disabled={guardando || diferencia !== 0}>
          {guardando ? 'Guardando…' : 'Guardar plan'}
        </button>
        <button className={btnSecundario} onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

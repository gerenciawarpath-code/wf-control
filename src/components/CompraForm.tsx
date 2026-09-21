import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/hooks'
import {
  crearProveedor,
  getPedidosFull,
  getProductos,
  getProveedores,
  subirComprobante,
} from '../lib/data'
import { crearCompra, actualizarCompra, type CompraCabecera } from '../lib/mutations'
import { cop, hoyISO } from '../lib/format'
import type { Medio } from '../lib/types'
import ProductoThumb from './ProductoThumb'
import { Card, Cargando, ErrorMsg, Label, MoneyInput, btnPrimario, btnSecundario, inputBase } from './ui'

const medios: { id: Medio; label: string }[] = [
  { id: 'bancolombia', label: 'Bancolombia' },
  { id: 'nequi', label: 'Nequi' },
  { id: 'efectivo', label: 'Efectivo' },
]

export interface ItemCompraUI {
  producto_id: string
  cantidad: number
  costo_unitario: number
}

export default function CompraForm({
  compraId,
  cabeceraInicial,
  itemsIniciales,
  pedidoFijo,
  onGuardado,
  onCancelar,
}: {
  compraId?: string // presente = edición
  cabeceraInicial?: Partial<CompraCabecera>
  itemsIniciales?: ItemCompraUI[]
  pedidoFijo?: string | null
  onGuardado: (id?: string) => void
  onCancelar: () => void
}) {
  const { socio, session } = useAuth()
  const proveedores = useData(getProveedores)
  const productos = useData(getProductos)
  const pedidos = useData(getPedidosFull)

  const [proveedorId, setProveedorId] = useState(cabeceraInicial?.proveedor_id ?? '')
  const [fecha, setFecha] = useState(cabeceraInicial?.fecha ?? hoyISO())
  const [medio, setMedio] = useState<Medio>(cabeceraInicial?.medio ?? 'nequi')
  const [pedidoId, setPedidoId] = useState<string>(pedidoFijo ?? cabeceraInicial?.pedido_id ?? '')
  const [nota, setNota] = useState(cabeceraInicial?.nota ?? '')
  const [items, setItems] = useState<ItemCompraUI[]>(
    itemsIniciales && itemsIniciales.length > 0
      ? itemsIniciales
      : [{ producto_id: '', cantidad: 1, costo_unitario: 0 }],
  )
  const [archivo, setArchivo] = useState<File | null>(null)
  const [creandoProv, setCreandoProv] = useState(false)
  const [nombreProv, setNombreProv] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Proveedor por defecto: el principal, una vez cargados
  const provList = proveedores.data
  useEffect(() => {
    if (proveedorId || !provList || provList.length === 0) return
    const principal = provList.find((p) => p.nombre === 'Proveedor principal') ?? provList[0]
    if (principal) setProveedorId(principal.id)
  }, [provList, proveedorId])

  if (proveedores.loading || productos.loading || pedidos.loading) return <Cargando />

  const listaProductos = (productos.data ?? []).filter((p) => p.activo)
  const total = items.reduce((s, i) => s + i.cantidad * i.costo_unitario, 0)
  const pedidosLigables = (pedidos.data ?? []).filter((p) => !p.tiene_compra || p.pedido_id === pedidoId)

  function cambiar(idx: number, cambio: Partial<ItemCompraUI>) {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...cambio } : it)))
  }

  function elegirProducto(idx: number, productoId: string) {
    const prod = listaProductos.find((p) => p.id === productoId)
    cambiar(idx, { producto_id: productoId, costo_unitario: prod ? prod.costo : 0 })
  }

  async function guardarProveedor() {
    if (!nombreProv.trim()) return
    try {
      const p = await crearProveedor(nombreProv)
      await proveedores.reload()
      setProveedorId(p.id)
      setCreandoProv(false)
      setNombreProv('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear el proveedor.')
    }
  }

  async function guardar() {
    setError(null)
    const validos = items.filter((i) => i.producto_id && i.cantidad > 0)
    if (!proveedorId) return setError('Elige el proveedor.')
    if (validos.length === 0) return setError('Agrega al menos un producto.')
    if (validos.some((i) => i.costo_unitario <= 0))
      return setError('Cada renglón debe tener un costo mayor a cero.')
    if (!compraId && !archivo) return setError('Sube el comprobante de la compra.')

    // registrado_por no puede leer socio!.id si socio llega null: respaldo con la sesión.
    const registradoPor = socio?.id ?? session?.user?.id
    if (!compraId && !registradoPor)
      return setError('Tu sesión no está disponible o expiró. Vuelve a iniciar sesión e inténtalo de nuevo.')

    setGuardando(true)
    try {
      let comprobante_url = cabeceraInicial?.comprobante_url ?? null
      if (archivo) comprobante_url = await subirComprobante('compras', archivo)

      const cabecera: CompraCabecera = {
        proveedor_id: proveedorId,
        fecha,
        medio,
        pedido_id: pedidoId || null,
        nota: nota.trim() || null,
        comprobante_url,
      }

      if (compraId) {
        await actualizarCompra(compraId, cabecera, validos)
        onGuardado(compraId)
      } else {
        // registradoPor ya se validó arriba para el alta; este chequeo lo estrecha para TS.
        if (!registradoPor) throw new Error('Tu sesión no está disponible o expiró.')
        const id = await crearCompra({ ...cabecera, registrado_por: registradoPor }, validos)
        onGuardado(id)
      }
    } catch (e) {
      setGuardando(false)
      setError(e instanceof Error ? e.message : 'No se pudo guardar la compra.')
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-medium">{compraId ? 'Editar compra' : 'Nueva compra'}</h2>

      <div className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label-faint mb-1.5 block">Proveedor</label>
            {creandoProv ? (
              <div className="flex gap-2">
                <input
                  className={inputBase}
                  placeholder="Nombre del proveedor"
                  value={nombreProv}
                  onChange={(e) => setNombreProv(e.target.value)}
                />
                <button type="button" className={btnSecundario} onClick={guardarProveedor}>
                  Crear
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <select
                  className={inputBase}
                  value={proveedorId}
                  onChange={(e) => setProveedorId(e.target.value)}
                >
                  {(proveedores.data ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombre}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="btn-terciario shrink-0"
                  onClick={() => setCreandoProv(true)}
                >
                  Nuevo
                </button>
              </div>
            )}
          </div>
          <div>
            <label className="label-faint mb-1.5 block">Medio de pago</label>
            <select
              className={inputBase}
              value={medio}
              onChange={(e) => setMedio(e.target.value as Medio)}
            >
              {medios.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-faint mb-1.5 block">Fecha</label>
            <input
              type="date"
              className={inputBase}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>

        {/* Renglones */}
        <div className="space-y-3">
          {items.map((it, idx) => {
            const prod = listaProductos.find((p) => p.id === it.producto_id)
            return (
              <div key={idx} className="flex flex-wrap items-end gap-3">
                <ProductoThumb url={prod?.foto_url} size={44} />
                <div className="min-w-40 flex-1">
                  {idx === 0 && <label className="label-faint mb-1.5 block">Producto</label>}
                  <select
                    className={inputBase}
                    value={it.producto_id}
                    onChange={(e) => elegirProducto(idx, e.target.value)}
                  >
                    <option value="">Elegir…</option>
                    {listaProductos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.nombre}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-20">
                  {idx === 0 && <label className="label-faint mb-1.5 block">Cant.</label>}
                  <input
                    type="number"
                    min={1}
                    className={inputBase}
                    value={it.cantidad}
                    onChange={(e) => cambiar(idx, { cantidad: Number(e.target.value) })}
                  />
                </div>
                <div className="w-32">
                  {idx === 0 && <label className="label-faint mb-1.5 block">Costo unit.</label>}
                  <MoneyInput
                    value={it.costo_unitario}
                    onChange={(n) => cambiar(idx, { costo_unitario: n })}
                  />
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    className="link-peligro h-11"
                    onClick={() => setItems(items.filter((_, i) => i !== idx))}
                  >
                    Quitar
                  </button>
                )}
              </div>
            )
          })}
          <button
            type="button"
            className={btnSecundario}
            onClick={() => setItems([...items, { producto_id: '', cantidad: 1, costo_unitario: 0 }])}
          >
            Agregar producto
          </button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label-faint mb-1.5 block">Ligar a un pedido (opcional)</label>
            <select
              className={inputBase}
              value={pedidoId}
              onChange={(e) => setPedidoId(e.target.value)}
              disabled={Boolean(pedidoFijo)}
            >
              <option value="">Stock en lote (sin pedido)</option>
              {pedidosLigables.map((p) => (
                <option key={p.pedido_id} value={p.pedido_id}>
                  {p.cliente_nombre} — {cop(p.valor_total)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-faint mb-1.5 block">
              Comprobante{compraId ? ' (deja vacío para conservar)' : ''}
            </label>
            <input
              type="file"
              accept="image/*,.pdf"
              className="block w-full text-sm text-ink-secondary file:mr-3 file:rounded-full file:border file:border-line file:bg-card file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-card3"
              onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            />
          </div>
        </div>

        <div>
          <label className="label-faint mb-1.5 block">Nota (opcional)</label>
          <input
            className={inputBase}
            placeholder="Ej: incluye envío"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
          />
        </div>

        <div className="border-t border-line pt-4 text-right">
          <Label className="mb-1">Total de la compra</Label>
          <div className="dsp tnum text-2xl font-bold tracking-tight">{cop(total)}</div>
        </div>

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <div className="flex gap-2">
          <button className={btnPrimario} onClick={guardar} disabled={guardando}>
            {guardando ? 'Guardando…' : compraId ? 'Guardar cambios' : 'Guardar compra'}
          </button>
          <button className={btnSecundario} onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </div>
    </Card>
  )
}

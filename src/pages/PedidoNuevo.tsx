import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/hooks'
import { getClientes, getProductos, getSocios, subirComprobante } from '../lib/data'
import { cop, hoyISO, sumarDias } from '../lib/format'
import type { Medio, TipoPedido } from '../lib/types'
import {
  Card,
  Cargando,
  ErrorMsg,
  Label,
  MoneyInput,
  btnPrimario,
  btnSecundario,
  inputBase,
} from '../components/ui'

interface ItemForm {
  productoId: string
  cantidad: number
  precio: number
}

interface CuotaForm {
  fecha: string
  monto: number
}

const medios: { id: Medio; label: string }[] = [
  { id: 'bancolombia', label: 'Bancolombia' },
  { id: 'nequi', label: 'Nequi' },
  { id: 'efectivo', label: 'Efectivo' },
]

export default function PedidoNuevo() {
  const navigate = useNavigate()
  const { socio } = useAuth()
  const clientes = useData(getClientes)
  const productos = useData(getProductos)
  const socios = useData(getSocios)

  const [clienteId, setClienteId] = useState('')
  const [tomadoPor, setTomadoPor] = useState('')
  const [fecha, setFecha] = useState(hoyISO())
  const [items, setItems] = useState<ItemForm[]>([{ productoId: '', cantidad: 1, precio: 0 }])
  const [tipo, setTipo] = useState<TipoPedido>('contado')
  const [medio, setMedio] = useState<Medio>('nequi')
  const [comprobante, setComprobante] = useState<File | null>(null)
  const [cuotas, setCuotas] = useState<CuotaForm[]>([])
  const [numCuotas, setNumCuotas] = useState(2)
  const [frecuencia, setFrecuencia] = useState(15)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (clientes.loading || productos.loading || socios.loading) return <Cargando />

  const listaProductos = (productos.data ?? []).filter((p) => p.activo)
  const quienTomo = tomadoPor || socio?.id || ''

  const valorTotal = items.reduce((s, i) => s + i.cantidad * i.precio, 0)
  const totalCuotas = cuotas.reduce((s, c) => s + c.monto, 0)
  const diferencia = valorTotal - totalCuotas

  function cambiarItem(idx: number, cambio: Partial<ItemForm>) {
    setItems(items.map((it, i) => (i === idx ? { ...it, ...cambio } : it)))
  }

  function elegirProducto(idx: number, productoId: string) {
    const prod = listaProductos.find((p) => p.id === productoId)
    cambiarItem(idx, { productoId, precio: prod ? prod.precio_venta : 0 })
  }

  function generarPlan() {
    if (valorTotal <= 0) return
    const base = Math.floor(valorTotal / numCuotas)
    const nuevas: CuotaForm[] = []
    for (let i = 0; i < numCuotas; i++) {
      nuevas.push({
        fecha: sumarDias(fecha, frecuencia * (i + 1)),
        monto: i === numCuotas - 1 ? valorTotal - base * (numCuotas - 1) : base,
      })
    }
    setCuotas(nuevas)
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setError(null)

    const itemsListos = items.filter((i) => i.productoId && i.cantidad > 0)
    if (!clienteId) return setError('Elige el cliente.')
    if (itemsListos.length === 0) return setError('Agrega al menos un producto.')
    if (itemsListos.some((i) => i.precio <= 0))
      return setError('Todos los productos deben tener un precio mayor a cero.')
    if (tipo === 'credito') {
      if (cuotas.length === 0) return setError('Define el plan de cuotas.')
      if (cuotas.some((c) => !c.fecha || c.monto <= 0))
        return setError('Cada cuota necesita fecha y monto.')
      if (diferencia !== 0)
        return setError(
          diferencia > 0
            ? `Faltan ${cop(diferencia)} por asignar en las cuotas.`
            : `Las cuotas suman ${cop(-diferencia)} de más.`,
        )
    }

    setGuardando(true)
    const { data: pedido, error: e1 } = await supabase
      .from('pedidos')
      .insert({ cliente_id: clienteId, tomado_por: quienTomo, fecha, tipo })
      .select('id')
      .single()
    if (e1 || !pedido) {
      setGuardando(false)
      return setError('No se pudo crear el pedido: ' + e1?.message)
    }

    try {
      const { error: e2 } = await supabase.from('pedido_items').insert(
        itemsListos.map((i) => {
          const prod = listaProductos.find((p) => p.id === i.productoId)!
          return {
            pedido_id: pedido.id,
            producto_id: i.productoId,
            cantidad: i.cantidad,
            precio_venta: i.precio,
            costo: prod.costo,
          }
        }),
      )
      if (e2) throw new Error(e2.message)

      if (tipo === 'credito') {
        const { error: e3 } = await supabase.from('cuotas').insert(
          cuotas.map((c, i) => ({
            pedido_id: pedido.id,
            numero: i + 1,
            fecha: c.fecha,
            monto: c.monto,
          })),
        )
        if (e3) throw new Error(e3.message)
      } else {
        // De contado: el pago completo entra a la caja de una vez
        let path: string | null = null
        if (comprobante) path = await subirComprobante(pedido.id, comprobante)
        const { error: e4 } = await supabase.from('abonos').insert({
          pedido_id: pedido.id,
          monto: valorTotal,
          medio,
          fecha,
          registrado_por: socio!.id,
          comprobante_path: path,
        })
        if (e4) throw new Error(e4.message)
      }

      navigate(`/pedidos/${pedido.id}`)
    } catch (err) {
      // Si algo falla a mitad de camino, se borra el pedido para no dejar datos a medias
      await supabase.from('pedidos').delete().eq('id', pedido.id)
      setGuardando(false)
      setError(err instanceof Error ? err.message : 'No se pudo guardar el pedido.')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <Link to="/pedidos" className="text-sm text-ink-faint hover:text-ink">
          ← Pedidos
        </Link>
        <h1 className="mt-2 titulo-pantalla">Nuevo pedido</h1>
      </div>

      <form onSubmit={guardar} className="space-y-4 sm:space-y-6">
        <Card>
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="label-faint mb-1.5 block">Cliente</label>
              <select
                className={inputBase}
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
              >
                <option value="">Elegir cliente…</option>
                {(clientes.data ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-faint mb-1.5 block">Quién lo tomó</label>
              <select
                className={inputBase}
                value={quienTomo}
                onChange={(e) => setTomadoPor(e.target.value)}
              >
                {(socios.data ?? []).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
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
        </Card>

        <Card>
          <h2 className="text-lg font-medium">Productos</h2>
          {listaProductos.length === 0 ? (
            <p className="mt-3 text-sm text-ink-secondary">
              Primero crea tus productos en la pestaña{' '}
              <Link to="/productos" className="text-accent">
                Productos
              </Link>
              .
            </p>
          ) : (
            <div className="mt-3 space-y-3">
              {items.map((it, idx) => (
                <div key={idx} className="flex flex-wrap items-end gap-3">
                  <div className="min-w-40 flex-1">
                    {idx === 0 && <label className="label-faint mb-1.5 block">Producto</label>}
                    <select
                      className={inputBase}
                      value={it.productoId}
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
                      onChange={(e) => cambiarItem(idx, { cantidad: Number(e.target.value) })}
                    />
                  </div>
                  <div className="w-32">
                    {idx === 0 && <label className="label-faint mb-1.5 block">Precio</label>}
                    <MoneyInput value={it.precio} onChange={(n) => cambiarItem(idx, { precio: n })} />
                  </div>
                  {items.length > 1 && (
                    <button
                      type="button"
                      className="h-10 text-sm text-ink-faint hover:text-negative"
                      onClick={() => setItems(items.filter((_, i) => i !== idx))}
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ))}
              <button
                type="button"
                className={btnSecundario}
                onClick={() => setItems([...items, { productoId: '', cantidad: 1, precio: 0 }])}
              >
                Agregar producto
              </button>
            </div>
          )}
          <div className="mt-4 border-t border-line pt-4 text-right">
            <Label className="mb-1">Valor total</Label>
            <div className="text-2xl font-semibold tracking-tight">{cop(valorTotal)}</div>
          </div>
        </Card>

        <Card>
          <h2 className="text-lg font-medium">Forma de pago</h2>
          <div className="mt-3 flex gap-1.5">
            {(['contado', 'credito'] as TipoPedido[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`rounded-full px-4 py-1.5 text-sm transition-colors duration-150 ${
                  tipo === t
                    ? 'bg-accent-soft font-medium text-accent'
                    : 'border border-line bg-card text-ink-secondary hover:bg-card3'
                }`}
              >
                {t === 'contado' ? 'De contado' : 'A crédito'}
              </button>
            ))}
          </div>

          {tipo === 'contado' ? (
            <div className="mt-4 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
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
                  <label className="label-faint mb-1.5 block">Comprobante (opcional)</label>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    className="block w-full text-sm text-ink-secondary file:mr-3 file:rounded-full file:border file:border-line file:bg-card file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-card3"
                    onChange={(e) => setComprobante(e.target.files?.[0] ?? null)}
                  />
                </div>
              </div>
              {valorTotal > 0 && (
                <p className="text-sm text-ink-secondary">
                  Se registrará el pago completo de{' '}
                  <strong className="font-medium text-ink">{cop(valorTotal)}</strong> en la caja.
                </p>
              )}
            </div>
          ) : (
            <div className="mt-4 space-y-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="w-24">
                  <label className="label-faint mb-1.5 block">Cuotas</label>
                  <select
                    className={inputBase}
                    value={numCuotas}
                    onChange={(e) => setNumCuotas(Number(e.target.value))}
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="w-36">
                  <label className="label-faint mb-1.5 block">Cada</label>
                  <select
                    className={inputBase}
                    value={frecuencia}
                    onChange={(e) => setFrecuencia(Number(e.target.value))}
                  >
                    <option value={7}>7 días</option>
                    <option value={15}>15 días</option>
                    <option value={30}>30 días</option>
                  </select>
                </div>
                <button type="button" className={btnSecundario} onClick={generarPlan}>
                  Generar plan
                </button>
              </div>

              {cuotas.length > 0 && (
                <div className="space-y-3">
                  {cuotas.map((c, idx) => (
                    <div key={idx} className="flex flex-wrap items-center gap-3">
                      <span className="w-14 text-sm text-ink-faint">Cuota {idx + 1}</span>
                      <input
                        type="date"
                        className={`${inputBase} w-40`}
                        value={c.fecha}
                        onChange={(e) =>
                          setCuotas(cuotas.map((x, i) => (i === idx ? { ...x, fecha: e.target.value } : x)))
                        }
                      />
                      <div className="w-32">
                        <MoneyInput
                          value={c.monto}
                          onChange={(n) =>
                            setCuotas(cuotas.map((x, i) => (i === idx ? { ...x, monto: n } : x)))
                          }
                        />
                      </div>
                      <button
                        type="button"
                        className="text-sm text-ink-faint hover:text-negative"
                        onClick={() => setCuotas(cuotas.filter((_, i) => i !== idx))}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className={btnSecundario}
                    onClick={() =>
                      setCuotas([
                        ...cuotas,
                        { fecha: sumarDias(cuotas[cuotas.length - 1]?.fecha ?? fecha, frecuencia), monto: 0 },
                      ])
                    }
                  >
                    Agregar cuota
                  </button>
                  <p
                    className={`text-sm ${diferencia === 0 ? 'text-positive' : 'text-warning'}`}
                  >
                    {diferencia === 0
                      ? `Las cuotas suman ${cop(totalCuotas)} y cuadran con el total.`
                      : diferencia > 0
                        ? `Faltan ${cop(diferencia)} por asignar en las cuotas.`
                        : `Las cuotas suman ${cop(-diferencia)} de más.`}
                  </p>
                </div>
              )}
            </div>
          )}
        </Card>

        {error && <ErrorMsg>{error}</ErrorMsg>}
        <button type="submit" className={btnPrimario} disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar pedido'}
        </button>
      </form>
    </div>
  )
}

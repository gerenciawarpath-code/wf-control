import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useData } from '../lib/hooks'
import { getProductos, subirFotoProducto } from '../lib/data'
import { eliminarProducto, toggleProductoActivo } from '../lib/mutations'
import { cop } from '../lib/format'
import type { Producto } from '../lib/types'
import { ConfirmDialog } from '../components/Modal'
import ProductoThumb from '../components/ProductoThumb'
import {
  Badge,
  Card,
  Cargando,
  ErrorMsg,
  MoneyInput,
  Vacio,
  btnPrimario,
  btnSecundario,
  inputBase,
} from '../components/ui'

export default function Productos() {
  const { data, loading, error, reload } = useData(getProductos)
  const [editando, setEditando] = useState<Producto | 'nuevo' | null>(null)
  const [nombre, setNombre] = useState('')
  const [costo, setCosto] = useState(0)
  const [precio, setPrecio] = useState(0)
  const [duracion, setDuracion] = useState(30)
  const [fotoActual, setFotoActual] = useState<string | null>(null)
  const [fotoNueva, setFotoNueva] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [borrar, setBorrar] = useState<Producto | null>(null)

  const ganancia = precio - costo
  const previewFoto = fotoNueva ? URL.createObjectURL(fotoNueva) : fotoActual

  async function cambiarActivo(p: Producto) {
    await toggleProductoActivo(p.id, !p.activo)
    reload()
  }

  function abrirForm(p: Producto | 'nuevo') {
    setEditando(p)
    setErrorForm(null)
    setFotoNueva(null)
    if (p === 'nuevo') {
      setNombre('')
      setCosto(0)
      setPrecio(0)
      setDuracion(30)
      setFotoActual(null)
    } else {
      setNombre(p.nombre)
      setCosto(p.costo)
      setPrecio(p.precio_venta)
      setDuracion(p.duracion_dias)
      setFotoActual(p.foto_url)
    }
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setErrorForm(null)
    if (duracion <= 0) return setErrorForm('La duración debe ser mayor a cero días.')
    setGuardando(true)
    try {
      let fotoUrl = fotoActual
      if (fotoNueva) fotoUrl = await subirFotoProducto(fotoNueva)
      const valores = {
        nombre: nombre.trim(),
        costo,
        precio_venta: precio,
        duracion_dias: duracion,
        foto_url: fotoUrl,
      }
      const { error } =
        editando === 'nuevo'
          ? await supabase.from('productos').insert(valores)
          : await supabase.from('productos').update(valores).eq('id', (editando as Producto).id)
      if (error) throw new Error(error.message)
    } catch (err) {
      setGuardando(false)
      setErrorForm(err instanceof Error ? err.message : 'No se pudo guardar el producto.')
      return
    }
    setGuardando(false)
    setEditando(null)
    reload()
  }

  return (
    <div className="entra-lista space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="titulo-pantalla">Productos</h1>
        {!editando && (
          <button className={btnPrimario} onClick={() => abrirForm('nuevo')}>
            Nuevo producto
          </button>
        )}
      </div>

      {editando && (
        <Card>
          <h2 className="text-lg font-medium">
            {editando === 'nuevo' ? 'Nuevo producto' : `Editar ${(editando as Producto).nombre}`}
          </h2>
          <form onSubmit={guardar} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-faint mb-1.5 block">Nombre</label>
                <input
                  className={inputBase}
                  required
                  placeholder="Creatina 300g"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
              </div>
              <div>
                <label className="label-faint mb-1.5 block">Duración (días)</label>
                <input
                  type="number"
                  min={1}
                  className={inputBase}
                  value={duracion}
                  onChange={(e) => setDuracion(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="label-faint mb-1.5 block">Costo (lo que nos cuesta)</label>
                <MoneyInput value={costo} onChange={setCosto} placeholder="80.000" />
              </div>
              <div>
                <label className="label-faint mb-1.5 block">Precio de venta</label>
                <MoneyInput value={precio} onChange={setPrecio} placeholder="120.000" />
              </div>
            </div>
            <div>
              <label className="label-faint mb-1.5 block">Foto</label>
              <div className="flex items-center gap-3">
                <ProductoThumb url={previewFoto} size={56} />
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-ink-secondary file:mr-3 file:rounded-full file:border file:border-line file:bg-card file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-card3"
                  onChange={(e) => setFotoNueva(e.target.files?.[0] ?? null)}
                />
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                Se redimensiona a máx. 800×800 automáticamente.
              </p>
            </div>
            <p className="text-sm text-ink-secondary">
              Ganancia unitaria:{' '}
              <strong className={`font-medium ${ganancia >= 0 ? 'text-positive' : 'text-negative'}`}>
                {cop(ganancia)}
              </strong>
              {ganancia < 0 && ' — el precio está por debajo del costo'}
            </p>
            {errorForm && <ErrorMsg>{errorForm}</ErrorMsg>}
            <div className="flex gap-2">
              <button type="submit" className={btnSecundario} disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar producto'}
              </button>
              <button type="button" className={btnSecundario} onClick={() => setEditando(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <Cargando />
        ) : error ? (
          <ErrorMsg>{error}</ErrorMsg>
        ) : (data ?? []).length === 0 ? (
          <Vacio>Aún no hay productos. Crea el primero para poder registrar pedidos.</Vacio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ tableLayout: 'auto' }}>
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="label-faint py-2 pr-4 font-medium">Producto</th>
                  <th className="label-faint py-2 pr-4 text-right font-medium">Costo</th>
                  <th className="label-faint py-2 pr-4 text-right font-medium">Precio</th>
                  <th className="label-faint py-2 pr-4 text-right font-medium">Ganancia</th>
                  <th className="label-faint py-2 pr-4 text-right font-medium">Duración</th>
                  <th className="label-faint py-2 pr-4 font-medium">Estado</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(data ?? []).map((p) => (
                  <tr key={p.id} className={p.activo ? '' : 'opacity-60'}>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-3">
                        <ProductoThumb url={p.foto_url} size={36} />
                        <span className="font-medium">{p.nombre}</span>
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-right">{cop(p.costo)}</td>
                    <td className="py-3 pr-4 text-right">{cop(p.precio_venta)}</td>
                    <td className="py-3 pr-4 text-right font-medium text-positive">
                      {cop(p.precio_venta - p.costo)}
                    </td>
                    <td className="py-3 pr-4 text-right text-ink-secondary">
                      {p.duracion_dias} días
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tono={p.activo ? 'verde' : 'neutro'}>
                        {p.activo ? 'activo' : 'inactivo'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-3 whitespace-nowrap">
                        <button
                          className="text-sm text-accent hover:text-accent-hover"
                          onClick={() => abrirForm(p)}
                        >
                          Editar
                        </button>
                        <button
                          className="text-sm text-ink-secondary hover:text-ink"
                          onClick={() => cambiarActivo(p)}
                        >
                          {p.activo ? 'Desactivar' : 'Activar'}
                        </button>
                        <button className="link-peligro" onClick={() => setBorrar(p)}>
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {borrar && (
        <ConfirmDialog
          titulo={`Eliminar ${borrar.nombre}`}
          mensaje={
            <>
              ¿Seguro que quieres eliminar <strong>{borrar.nombre}</strong>? Si ya se usó en algún
              pedido no se podrá borrar; en ese caso, desactívalo.
            </>
          }
          textoConfirmar="Eliminar producto"
          onCancelar={() => setBorrar(null)}
          onConfirmar={async () => {
            await eliminarProducto(borrar.id)
            setBorrar(null)
            reload()
          }}
        />
      )}
    </div>
  )
}

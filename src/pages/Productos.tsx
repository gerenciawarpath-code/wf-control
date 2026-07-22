import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useData } from '../lib/hooks'
import { getProductos } from '../lib/data'
import { cop } from '../lib/format'
import type { Producto } from '../lib/types'
import {
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
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)

  const ganancia = precio - costo

  function abrirForm(p: Producto | 'nuevo') {
    setEditando(p)
    setErrorForm(null)
    if (p === 'nuevo') {
      setNombre('')
      setCosto(0)
      setPrecio(0)
      setDuracion(30)
    } else {
      setNombre(p.nombre)
      setCosto(p.costo)
      setPrecio(p.precio_venta)
      setDuracion(p.duracion_dias)
    }
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setErrorForm(null)
    if (duracion <= 0) return setErrorForm('La duración debe ser mayor a cero días.')
    setGuardando(true)
    const valores = {
      nombre: nombre.trim(),
      costo,
      precio_venta: precio,
      duracion_dias: duracion,
    }
    const { error } =
      editando === 'nuevo'
        ? await supabase.from('productos').insert(valores)
        : await supabase.from('productos').update(valores).eq('id', (editando as Producto).id)
    setGuardando(false)
    if (error) {
      setErrorForm(error.message)
      return
    }
    setEditando(null)
    reload()
  }

  return (
    <div className="space-y-4 sm:space-y-6">
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
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(data ?? []).map((p) => (
                  <tr key={p.id}>
                    <td className="py-3 pr-4 font-medium">{p.nombre}</td>
                    <td className="py-3 pr-4 text-right">{cop(p.costo)}</td>
                    <td className="py-3 pr-4 text-right">{cop(p.precio_venta)}</td>
                    <td className="py-3 pr-4 text-right font-medium text-positive">
                      {cop(p.precio_venta - p.costo)}
                    </td>
                    <td className="py-3 pr-4 text-right text-ink-secondary">
                      {p.duracion_dias} días
                    </td>
                    <td className="py-3 text-right">
                      <button
                        className="text-sm text-accent hover:text-accent-hover"
                        onClick={() => abrirForm(p)}
                      >
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

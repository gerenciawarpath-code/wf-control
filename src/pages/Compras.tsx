import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { useData } from '../lib/hooks'
import { getComprasFull, getProveedores } from '../lib/data'
import { cop, fmtFecha } from '../lib/format'
import type { Medio } from '../lib/types'
import { Badge, Card, Cargando, ErrorMsg, Vacio, btnPrimario, inputBase } from '../components/ui'

const nombresMedio: Record<Medio, string> = {
  bancolombia: 'Bancolombia',
  nequi: 'Nequi',
  efectivo: 'Efectivo',
}

export default function Compras() {
  const compras = useData(getComprasFull)
  const proveedores = useData(getProveedores)
  const [fProveedor, setFProveedor] = useState('')
  const [fMedio, setFMedio] = useState('')
  const [fMes, setFMes] = useState('')

  if (compras.loading) return <Cargando />
  if (compras.error || !compras.data)
    return <ErrorMsg>No se pudieron cargar las compras: {compras.error}</ErrorMsg>

  const visibles = compras.data.filter((c) => {
    if (fProveedor && c.proveedor_id !== fProveedor) return false
    if (fMedio && c.medio !== fMedio) return false
    if (fMes && c.fecha.slice(0, 7) !== fMes) return false
    return true
  })

  return (
    <div className="entra-lista space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="titulo-pantalla">Compras</h1>
        <Link to="/compras/nueva" className={btnPrimario}>
          Nueva compra
        </Link>
      </div>

      <Card>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="label-faint mb-1.5 block">Proveedor</label>
            <select
              className={inputBase}
              value={fProveedor}
              onChange={(e) => setFProveedor(e.target.value)}
            >
              <option value="">Todos</option>
              {(proveedores.data ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-faint mb-1.5 block">Medio</label>
            <select className={inputBase} value={fMedio} onChange={(e) => setFMedio(e.target.value)}>
              <option value="">Todos</option>
              {(Object.keys(nombresMedio) as Medio[]).map((m) => (
                <option key={m} value={m}>
                  {nombresMedio[m]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-faint mb-1.5 block">Mes</label>
            <input
              type="month"
              className={inputBase}
              value={fMes}
              onChange={(e) => setFMes(e.target.value)}
            />
          </div>
        </div>
      </Card>

      <Card>
        {visibles.length === 0 ? (
          <Vacio
            icono={<ShoppingCart size={32} strokeWidth={1.75} />}
            detalle="Cuando registres una compra a un proveedor, aparecerá aquí."
          >
            No hay compras con estos filtros.
          </Vacio>
        ) : (
          <ul className="divide-y divide-line">
            {visibles.map((c) => (
              <li key={c.id}>
                <Link
                  to={`/compras/${c.id}`}
                  className="flex flex-wrap items-center gap-3 py-3.5 transition-opacity duration-150 hover:opacity-70"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{c.proveedor_nombre}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-ink-faint">{fmtFecha(c.fecha)}</span>
                      <span className="text-xs text-ink-faint">· {nombresMedio[c.medio]}</span>
                      {c.es_ajuste ? (
                        <Badge tono="neutro">ajuste</Badge>
                      ) : c.pedido_id ? (
                        <Badge tono="verde">ligada a pedido{c.cliente_nombre ? ` · ${c.cliente_nombre}` : ''}</Badge>
                      ) : (
                        <Badge tono="azul">stock en lote</Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-sm font-medium text-negative">−{cop(c.total)}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

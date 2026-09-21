import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Search, ShoppingCart } from 'lucide-react'
import { useData } from '../lib/hooks'
import { getComprasFull, getProveedores } from '../lib/data'
import { cop, fmtFecha, hoyISO } from '../lib/format'
import type { Medio } from '../lib/types'
import { Badge, Cargando, ErrorMsg, Vacio, btnPrimario, inputBase } from '../components/ui'

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
  const [q, setQ] = useState('')

  if (compras.loading) return <Cargando />
  if (compras.error || !compras.data)
    return <ErrorMsg>No se pudieron cargar las compras: {compras.error}</ErrorMsg>

  const visibles = compras.data.filter((c) => {
    if (fProveedor && c.proveedor_id !== fProveedor) return false
    if (fMedio && c.medio !== fMedio) return false
    if (fMes && c.fecha.slice(0, 7) !== fMes) return false
    const busca = q.trim().toLowerCase()
    if (
      busca &&
      !c.proveedor_nombre.toLowerCase().includes(busca) &&
      !(c.cliente_nombre ?? '').toLowerCase().includes(busca)
    )
      return false
    return true
  })

  // Resumen de solo lectura sobre las mismas compras que muestra la lista (sin filtros).
  // Los ajustes (es_ajuste) siguen en la lista pero no cuentan en estas tarjetas.
  const todas = compras.data
  const sinAjustes = todas.filter((c) => !c.es_ajuste)
  const mes = hoyISO().slice(0, 7)
  const delMes = sinAjustes.filter((c) => c.fecha.startsWith(mes))
  const totalMes = delMes.reduce((suma, c) => suma + c.total, 0)
  const totalHistorico = sinAjustes.reduce((suma, c) => suma + c.total, 0)
  const nMedio = (m: string) => (m ? todas.filter((c) => c.medio === m).length : todas.length)

  return (
    <div className="entra-lista space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="titulo-pantalla">Compras</h1>
        <Link to="/compras/nueva" className={btnPrimario}>
          Nueva compra
        </Link>
      </div>

      <div className="cli-tiles">
        <div className="cli-tile">
          <div className="lab">Compras del mes</div>
          <div className="val tnum">{delMes.length}</div>
          <div className="sub">de {sinAjustes.length} en total · no incluye ajustes</div>
        </div>
        <div className="cli-tile">
          <div className="lab">Total comprado del mes</div>
          <div className="val tnum">{cop(totalMes)}</div>
          <div className="sub">suma de las compras del mes · no incluye ajustes</div>
        </div>
        <div className="cli-tile">
          <div className="lab">Total comprado</div>
          <div className="val tnum">{cop(totalHistorico)}</div>
          <div className="sub">histórico, {sinAjustes.length === 1 ? '1 compra' : `${sinAjustes.length} compras`} · no incluye ajustes</div>
        </div>
      </div>

      <div className="cli-bar">
        <div style={{ flexBasis: '100%', overflowX: 'auto' }}>
        <div className="cli-filtros" role="tablist">
          {[
            ['', 'Todos'],
            ...(Object.keys(nombresMedio) as Medio[]).map((m) => [m, nombresMedio[m]]),
          ].map(([id, label]) => (
            <button
              key={id || 'todos'}
              type="button"
              role="tab"
              aria-selected={fMedio === id}
              className={fMedio === id ? 'on' : ''}
              style={{ whiteSpace: 'nowrap' }}
              onClick={() => setFMedio(id)}
            >
              {label} <span className="cnt">{nMedio(id)}</span>
            </button>
          ))}
        </div>
        </div>
        <label className="cli-find">
          <Search size={16} strokeWidth={2} />
          <input placeholder="Buscar proveedor o cliente…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <select
          className={`${inputBase} cli-sel`}
          aria-label="Proveedor"
          value={fProveedor}
          onChange={(e) => setFProveedor(e.target.value)}
        >
          <option value="">Proveedor: todos</option>
          {(proveedores.data ?? []).map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        <input
          type="month"
          aria-label="Mes"
          className={`${inputBase} cli-sel`}
          value={fMes}
          onChange={(e) => setFMes(e.target.value)}
        />
      </div>

      <div className="cli-lista">
        {visibles.length === 0 ? (
          <Vacio
            icono={<ShoppingCart size={32} strokeWidth={1.75} />}
            detalle="Cuando registres una compra a un proveedor, aparecerá aquí."
          >
            No hay compras con estos filtros.
          </Vacio>
        ) : (
          visibles.map((c) => (
            <Link key={c.id} to={`/compras/${c.id}`} className="cli-row ped-fila">
              <div className="who">
                <b>{c.proveedor_nombre}</b>
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
              <div className="ped-monto">
                <div className="tot tnum" style={{ color: 'var(--danger-fg)' }}>
                  −{cop(c.total)}
                </div>
              </div>
              <ChevronRight size={18} strokeWidth={1.8} className="chev" />
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Search, ShoppingBag } from 'lucide-react'
import { useData } from '../lib/hooks'
import { getPedidosFull } from '../lib/data'
import { cop, fmtFecha, hoyISO } from '../lib/format'
import { Badge, Cargando, ErrorMsg, Vacio, btnPrimario, tonoEstadoPedido, tonoTipoPedido } from '../components/ui'

type Filtro = 'todos' | 'pendiente' | 'despachado' | 'entregado' | 'deuda'

const filtros: { id: Filtro; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'despachado', label: 'Despachados' },
  { id: 'entregado', label: 'Entregados' },
  { id: 'deuda', label: 'Con deuda' },
]

export default function Pedidos() {
  const { data, loading, error } = useData(getPedidosFull)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [q, setQ] = useState('')

  const busca = q.trim().toLowerCase()
  const visibles = (data ?? []).filter((p) => {
    if (busca && !p.cliente_nombre.toLowerCase().includes(busca)) return false
    if (filtro === 'todos') return true
    if (filtro === 'deuda') return p.saldo > 0
    return p.estado === filtro
  })

  // Resumen de solo lectura sobre los mismos pedidos que muestra la lista.
  const todos = data ?? []
  const mes = hoyISO().slice(0, 7)
  const delMes = todos.filter((p) => p.fecha.startsWith(mes)).length
  const porDespachar = todos.filter((p) => p.estado !== 'entregado').length
  const conSaldo = todos.filter((p) => p.saldo > 0)
  const porCobrar = conSaldo.reduce((suma, p) => suma + p.saldo, 0)
  const contar = (id: Filtro) =>
    id === 'todos'
      ? todos.length
      : id === 'deuda'
        ? conSaldo.length
        : todos.filter((p) => p.estado === id).length

  return (
    <div className="entra-lista space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="titulo-pantalla">Pedidos</h1>
        <Link to="/pedidos/nuevo" className={btnPrimario}>
          Nuevo pedido
        </Link>
      </div>

      {!loading && !error && (
        <div className="cli-tiles">
          <div className="cli-tile">
            <div className="lab">Pedidos del mes</div>
            <div className="val tnum">{delMes}</div>
            <div className="sub">de {todos.length} en total</div>
          </div>
          <div className="cli-tile">
            <div className="lab">Por despachar</div>
            <div className="val tnum">{porDespachar}</div>
            <div className="sub">pendientes o despachados sin entregar</div>
          </div>
          <div className="cli-tile alert">
            <div className="lab">Por cobrar</div>
            <div className="val tnum">{cop(porCobrar)}</div>
            <div className="sub">
              {conSaldo.length === 1 ? '1 pedido con saldo' : `${conSaldo.length} pedidos con saldo`}
            </div>
          </div>
        </div>
      )}

      <div className="cli-bar">
        <div className="cli-filtros" role="tablist" style={{ overflowX: 'auto', maxWidth: '100%' }}>
          {filtros.map((f) => (
            <button
              key={f.id}
              type="button"
              role="tab"
              aria-selected={filtro === f.id}
              onClick={() => setFiltro(f.id)}
              className={filtro === f.id ? 'on' : ''}
              style={{ whiteSpace: 'nowrap' }}
            >
              {f.label} <span className="cnt">{contar(f.id)}</span>
            </button>
          ))}
        </div>
        <label className="cli-find">
          <Search size={16} strokeWidth={2} />
          <input placeholder="Buscar por cliente…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <div className="cli-lista">
        {loading ? (
          <div className="p-5">
            <Cargando />
          </div>
        ) : error ? (
          <div className="p-5">
            <ErrorMsg>{error}</ErrorMsg>
          </div>
        ) : visibles.length === 0 ? (
          <Vacio
            icono={<ShoppingBag size={32} strokeWidth={1.75} />}
            detalle={
              filtro === 'todos' && !q ? 'Cuando registres un pedido, aparecerá aquí.' : undefined
            }
          >
            {filtro === 'todos' && !q ? 'Aún no hay pedidos' : 'No hay pedidos con este filtro'}
          </Vacio>
        ) : (
          visibles.map((p) => (
            <Link key={p.pedido_id} to={`/pedidos/${p.pedido_id}`} className="cli-row ped-fila">
              <div className="who">
                <b>{p.cliente_nombre}</b>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-xs text-ink-faint">{fmtFecha(p.fecha)}</span>
                  <Badge tono={tonoEstadoPedido[p.estado]}>{p.estado}</Badge>
                  <Badge tono={tonoTipoPedido[p.tipo]}>
                    {p.tipo === 'credito' ? 'crédito' : 'contado'}
                  </Badge>
                  <Badge tono={p.tiene_compra ? 'verde' : 'ambar'}>
                    {p.tiene_compra ? 'comprado' : 'pendiente comprar'}
                  </Badge>
                </div>
              </div>
              <div className="ped-monto">
                <div className="tot tnum">{cop(p.valor_total)}</div>
                {p.saldo > 0 ? (
                  <div className="est neg tnum">debe {cop(p.saldo)}</div>
                ) : (
                  <div className="est pos">pagado</div>
                )}
              </div>
              <ChevronRight size={18} strokeWidth={1.8} className="chev" />
            </Link>
          ))
        )}
      </div>
    </div>
  )
}

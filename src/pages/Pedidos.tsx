import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ShoppingBag } from 'lucide-react'
import { useData } from '../lib/hooks'
import { getPedidosFull } from '../lib/data'
import { cop, fmtFecha } from '../lib/format'
import { Badge, Card, Cargando, ErrorMsg, Vacio, btnPrimario, tonoEstadoPedido, tonoTipoPedido } from '../components/ui'

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

  const visibles = (data ?? []).filter((p) => {
    if (filtro === 'todos') return true
    if (filtro === 'deuda') return p.saldo > 0
    return p.estado === filtro
  })

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="titulo-pantalla">Pedidos</h1>
        <Link to="/pedidos/nuevo" className={btnPrimario}>
          Nuevo pedido
        </Link>
      </div>

      <div className="flex gap-1.5 overflow-x-auto">
        {filtros.map((f) => (
          <button
            key={f.id}
            onClick={() => setFiltro(f.id)}
            className={`whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-colors duration-150 ${
              filtro === f.id
                ? 'bg-accent-soft font-medium text-accent'
                : 'border border-line bg-card text-ink-secondary hover:bg-card3'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        {loading ? (
          <Cargando />
        ) : error ? (
          <ErrorMsg>{error}</ErrorMsg>
        ) : visibles.length === 0 ? (
          <Vacio
            icono={<ShoppingBag size={32} strokeWidth={1.75} />}
            detalle={filtro === 'todos' ? 'Cuando registres un pedido, aparecerá aquí.' : undefined}
          >
            {filtro === 'todos' ? 'Aún no hay pedidos' : 'No hay pedidos con este filtro'}
          </Vacio>
        ) : (
          <ul className="divide-y divide-line">
            {visibles.map((p) => (
              <li key={p.pedido_id}>
                <Link
                  to={`/pedidos/${p.pedido_id}`}
                  className="flex flex-wrap items-center gap-3 py-3 transition-opacity duration-150 hover:opacity-70"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{p.cliente_nombre}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      <span className="text-xs text-ink-faint">{fmtFecha(p.fecha)}</span>
                      <Badge tono={tonoEstadoPedido[p.estado]}>{p.estado}</Badge>
                      <Badge tono={tonoTipoPedido[p.tipo]}>
                        {p.tipo === 'credito' ? 'crédito' : 'contado'}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{cop(p.valor_total)}</div>
                    {p.saldo > 0 ? (
                      <div className="text-xs text-negative">debe {cop(p.saldo)}</div>
                    ) : (
                      <div className="text-xs text-positive">pagado</div>
                    )}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useData } from '../lib/hooks'
import { getInicio } from '../lib/data'
import { cop, fmtFecha } from '../lib/format'
import AsistenteCard from '../components/AsistenteCard'
import { Card, Cargando, ErrorMsg, Label, Punto, Vacio } from '../components/ui'

export default function Inicio() {
  const { data, loading, error } = useData(getInicio)

  if (loading) return <Cargando />
  if (error || !data) return <ErrorMsg>No se pudo cargar el resumen: {error}</ErrorMsg>

  const { resumen, atencion, clientesConDeuda, proximosRecompra } = data

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <Label>Caja</Label>
        <div className="brillo mt-2 inline-block">
          <div className="figure-hero text-accent">{cop(resumen.caja)}</div>
        </div>
        <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2 text-sm text-ink-secondary">
          <span>
            Ganancia repartible{' '}
            <strong className="font-medium text-positive">{cop(resumen.ganancia_repartible)}</strong>
          </span>
          <span>
            Para reponer producto{' '}
            <strong className="font-medium text-ink">{cop(resumen.reponer)}</strong>
          </span>
        </div>
      </Card>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link to="/clientes">
          <Card className="h-full transition-colors duration-150 hover:border-line-strong">
            <Label>Te deben</Label>
            <div className="mt-2 text-3xl font-semibold tracking-tight">
              {cop(resumen.te_deben)}
            </div>
            <div className="mt-1 text-sm text-ink-faint">
              {clientesConDeuda === 1 ? '1 cliente con deuda' : `${clientesConDeuda} clientes con deuda`}
            </div>
          </Card>
        </Link>
        <Link to="/pedidos">
          <Card className="h-full transition-colors duration-150 hover:border-line-strong">
            <Label>Pedidos pendientes</Label>
            <div className="mt-2 text-3xl font-semibold tracking-tight">
              {resumen.pedidos_pendientes}
            </div>
            <div className="mt-1 text-sm text-ink-faint">sin despachar aún</div>
          </Card>
        </Link>
      </div>

      <AsistenteCard />

      <Card>
        <h2 className="text-lg font-medium">Requiere atención</h2>
        {atencion.length === 0 ? (
          <Vacio>Nadie está vencido ni vence hoy. Todo al día.</Vacio>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {atencion.map((a) => (
              <li key={a.cliente_id + a.tipo} className="flex items-center gap-3 py-3">
                <Punto tono={a.tipo === 'vencida' ? 'rojo' : 'ambar'} />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/clientes/${a.cliente_id}`}
                    className="text-sm font-medium hover:text-accent"
                  >
                    {a.cliente_nombre}
                  </Link>
                  <div className={`text-xs ${a.tipo === 'vencida' ? 'text-negative' : 'text-warning'}`}>
                    {a.tipo === 'vencida'
                      ? a.dias === 1
                        ? 'vencida hace 1 día'
                        : `vencida hace ${a.dias} días`
                      : 'vence hoy'}
                  </div>
                </div>
                <div className="text-sm font-medium">{cop(a.monto)}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card>
        <h2 className="text-lg font-medium">Próximos a recomprar</h2>
        {proximosRecompra.length === 0 ? (
          <Vacio>A nadie se le acaba el producto en los próximos 7 días.</Vacio>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {proximosRecompra.map((r) => (
              <li key={r.cliente_id} className="flex items-center gap-3 py-3">
                <Punto tono="azul" />
                <div className="min-w-0 flex-1">
                  <Link
                    to={`/clientes/${r.cliente_id}`}
                    className="text-sm font-medium hover:text-accent"
                  >
                    {r.cliente_nombre}
                  </Link>
                  <div className="text-xs text-ink-secondary">
                    {r.dias === 0
                      ? 'se le acaba hoy'
                      : r.dias === 1
                        ? 'se le acaba mañana'
                        : `se le acaba en ${r.dias} días`}
                  </div>
                </div>
                <div className="text-sm text-ink-faint">{fmtFecha(r.fecha)}</div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

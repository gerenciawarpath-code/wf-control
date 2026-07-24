import { useData } from '../lib/hooks'
import { getKpis } from '../lib/kpis'
import { cop } from '../lib/format'
import { Badge, Card, Cargando, ErrorMsg, Label } from '../components/ui'

function fmtCrecimiento(c: number | null): string {
  if (c === null) return '—'
  return `${c >= 0 ? '+' : ''}${Math.round(c)}%`
}

export default function Kpis() {
  const { data, loading, error } = useData(getKpis)

  if (loading) return <Cargando />
  if (error || !data) return <ErrorMsg>No se pudieron cargar los KPIs: {error}</ErrorMsg>

  return (
    <div className="entra-lista space-y-4 sm:space-y-6">
      <h1 className="titulo-pantalla">KPIs de crecimiento</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <Label>Ventas este mes</Label>
          <div className="mt-2 text-3xl font-semibold tracking-tight text-accent">
            {cop(data.ventasMesActual)}
          </div>
          <div className="mt-1 text-sm text-ink-faint">valor de los pedidos del mes</div>
        </Card>
        <Card>
          <Label>Crecimiento vs mes pasado</Label>
          <div
            className={`mt-2 text-3xl font-semibold tracking-tight ${
              data.crecimientoMesActual === null
                ? 'text-ink-faint'
                : data.crecimientoMesActual >= 0
                  ? 'text-positive'
                  : 'text-negative'
            }`}
          >
            {fmtCrecimiento(data.crecimientoMesActual)}
          </div>
          <div className="mt-1 text-sm text-ink-faint">
            {data.crecimientoMesActual === null
              ? 'el mes pasado no hubo ventas'
              : 'comparado con el mes anterior'}
          </div>
        </Card>
        <Card>
          <Label>Clientes nuevos este mes</Label>
          <div className="mt-2 text-3xl font-semibold tracking-tight">
            {data.clientesNuevosMesActual}
          </div>
          <div className="mt-1 text-sm text-ink-faint">registrados en el sistema</div>
        </Card>
      </div>

      <Card>
        <h2 className="text-lg font-medium">Entradas proyectadas por cuotas</h2>
        <p className="mt-1 text-sm text-ink-secondary">
          Lo que debería entrar según las fechas de las cuotas pendientes.
        </p>
        <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-3">
          <div>
            <Label>Esta semana</Label>
            <div className="mt-1 text-2xl font-semibold tracking-tight">
              {cop(data.proyectadoSemana)}
            </div>
            <div className="mt-1 text-sm text-ink-faint">próximos 7 días</div>
          </div>
          <div>
            <Label>Este mes</Label>
            <div className="mt-1 text-2xl font-semibold tracking-tight">
              {cop(data.proyectadoMes)}
            </div>
            <div className="mt-1 text-sm text-ink-faint">de hoy a fin de mes</div>
          </div>
          <div>
            <Label>Vencido sin cobrar</Label>
            <div
              className={`mt-1 text-2xl font-semibold tracking-tight ${
                data.vencidoPendiente > 0 ? 'text-negative' : ''
              }`}
            >
              {cop(data.vencidoPendiente)}
            </div>
            <div className="mt-1 text-sm text-ink-faint">cuotas que ya debieron pagarse</div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-medium">Mes a mes</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="label-faint py-2 pr-4 font-medium">Mes</th>
                <th className="label-faint py-2 pr-4 text-right font-medium">Clientes nuevos</th>
                <th className="label-faint py-2 pr-4 text-right font-medium">Ventas</th>
                <th className="label-faint py-2 text-right font-medium">Crecimiento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {data.meses.map((m) => (
                <tr key={m.key}>
                  <td className="py-3 pr-4 font-medium">{m.label}</td>
                  <td className="py-3 pr-4 text-right">{m.clientesNuevos}</td>
                  <td className="py-3 pr-4 text-right">{cop(m.ventas)}</td>
                  <td className="py-3 text-right">
                    {m.crecimiento === null ? (
                      <span className="text-ink-faint">—</span>
                    ) : (
                      <Badge tono={m.crecimiento >= 0 ? 'verde' : 'rojo'}>
                        {fmtCrecimiento(m.crecimiento)}
                      </Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

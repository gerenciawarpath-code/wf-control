import { Link } from 'react-router-dom'
import { useData } from '../lib/hooks'
import { getInicio } from '../lib/data'
import { cop, fmtFecha } from '../lib/format'
import AsistenteCard from '../components/AsistenteCard'
import { Cargando, ErrorMsg } from '../components/ui'

export default function Inicio() {
  const { data, loading, error } = useData(getInicio)

  if (loading) return <Cargando />
  if (error || !data) return <ErrorMsg>No se pudo cargar el resumen: {error}</ErrorMsg>

  const { resumen, atencion, clientesConDeuda, proximosRecompra } = data

  // Encabezado presentacional (solo texto de fecha; no altera ningún dato).
  const fecha = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const cuando = fecha.charAt(0).toUpperCase() + fecha.slice(1) + ' · estado del negocio hoy'

  const vencidas = atencion.filter((a) => a.tipo === 'vencida').length

  return (
    <div className="inicio entra-lista">
      <div className="pagehead">
        <h1>Inicio</h1>
        <span className="when">{cuando}</span>
      </div>

      {/* Hero: Caja */}
      <section className="panel caja">
        <div className="lead">
          <span className="eyebrow">Caja</span>
          <div className="num tnum">{cop(resumen.caja)}</div>
        </div>
        <div className="subrow">
          <div className="substat">
            <div className="k">
              <span className="dot" style={{ background: 'var(--success-fg)' }} />
              Ganancia repartible
            </div>
            <div className="v tnum" style={{ color: 'var(--success-fg)' }}>
              {cop(resumen.ganancia_repartible)}
            </div>
          </div>
          <div className="substat">
            <div className="k">
              <span className="dot" style={{ background: 'var(--text-tertiary)' }} />
              Para reponer producto
            </div>
            <div className="v tnum">{cop(resumen.reponer)}</div>
          </div>
        </div>
      </section>

      {/* Tarjetas de dato */}
      <section className="tiles">
        <Link to="/clientes" className="tile-link">
          <div className="panel tile alert">
            <div className="top">
              <span className="eyebrow">Te deben</span>
              {clientesConDeuda > 0 ? (
                <span className="chip crit">
                  {clientesConDeuda === 1 ? '1 cliente' : `${clientesConDeuda} clientes`}
                </span>
              ) : (
                <span className="chip mute">al día</span>
              )}
            </div>
            <div className="v tnum">{cop(resumen.te_deben)}</div>
            <div className="sub">
              {clientesConDeuda === 1
                ? '1 cliente con deuda'
                : `${clientesConDeuda} clientes con deuda`}
            </div>
          </div>
        </Link>

        <Link to="/compras" className="tile-link">
          <div className="panel tile">
            <div className="top">
              <span className="eyebrow">Comprometido para comprar</span>
              {resumen.pedidos_sin_compra > 0 ? (
                <span className="chip blue">{resumen.pedidos_sin_compra} sin compra</span>
              ) : (
                <span className="chip mute">al día</span>
              )}
            </div>
            <div className="v tnum">{cop(resumen.comprometido_comprar)}</div>
            <div className="sub">
              {resumen.pedidos_sin_compra === 1
                ? '1 pedido sin compra registrada'
                : `${resumen.pedidos_sin_compra} pedidos sin compra registrada`}
            </div>
          </div>
        </Link>

        <Link to="/pedidos" className="tile-link">
          <div className="panel tile">
            <div className="top">
              <span className="eyebrow">Pedidos pendientes</span>
              {resumen.pedidos_pendientes > 0 ? (
                <span className="chip blue">
                  {resumen.pedidos_pendientes === 1
                    ? '1 sin despachar'
                    : `${resumen.pedidos_pendientes} sin despachar`}
                </span>
              ) : (
                <span className="chip mute">al día</span>
              )}
            </div>
            <div className="v tnum">{resumen.pedidos_pendientes}</div>
            <div className="sub">sin despachar aún</div>
          </div>
        </Link>
      </section>

      <AsistenteCard />

      {/* Requiere atención */}
      <section className="panel att">
        <div className="att-head">
          <h2>
            Requiere atención
            {vencidas > 0 && (
              <span className="count">{vencidas === 1 ? '1 vencida' : `${vencidas} vencidas`}</span>
            )}
          </h2>
        </div>
        {atencion.length === 0 ? (
          <div className="att-empty text-sm text-ink-secondary">Nadie está vencido. Todo al día.</div>
        ) : (
          atencion.map((a) => (
            <div className="row" key={a.cliente_id + a.tipo}>
              <div className="who">
                <span
                  className="stripe"
                  style={{ background: a.tipo === 'vencida' ? 'var(--danger-fg)' : 'var(--warning-fg)' }}
                />
                <div>
                  <Link to={`/clientes/${a.cliente_id}`} className="name">
                    {a.cliente_nombre}
                  </Link>
                  <div
                    className="meta"
                    style={{ color: a.tipo === 'vencida' ? 'var(--danger-fg)' : 'var(--warning-fg)' }}
                  >
                    {a.tipo === 'vencida'
                      ? a.dias === 1
                        ? 'vencida hace 1 día'
                        : `vencida hace ${a.dias} días`
                      : 'vence hoy'}
                  </div>
                </div>
              </div>
              <span />
              <div className="amt tnum">{cop(a.monto)}</div>
            </div>
          ))
        )}
      </section>

      {/* Próximos a recomprar */}
      <section className="panel att">
        <div className="att-head">
          <h2>Próximos a recomprar</h2>
        </div>
        {proximosRecompra.length === 0 ? (
          <div className="att-empty text-sm text-ink-secondary">
            Nadie recompra en los próximos 7 días.
          </div>
        ) : (
          proximosRecompra.map((r) => (
            <div className="row" key={r.cliente_id}>
              <div className="who">
                <span className="stripe" style={{ background: 'var(--accent)' }} />
                <div>
                  <Link to={`/clientes/${r.cliente_id}`} className="name">
                    {r.cliente_nombre}
                  </Link>
                  <div className="meta" style={{ color: 'var(--text-secondary)' }}>
                    {r.dias === 0
                      ? 'se le acaba hoy'
                      : r.dias === 1
                        ? 'se le acaba mañana'
                        : `se le acaba en ${r.dias} días`}
                  </div>
                </div>
              </div>
              <span />
              <div className="amt tnum" style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
                {fmtFecha(r.fecha)}
              </div>
            </div>
          ))
        )}
      </section>
    </div>
  )
}

import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChartLine,
  ChevronRight,
  Clock,
  Database,
  FilePlus,
  FileText,
  MapPin,
  Package,
  PackagePlus,
  ShoppingCart,
  TriangleAlert,
  User,
  UserPlus,
  UserX,
  Wallet,
} from 'lucide-react'
import { useData } from '../lib/hooks'
import { getInicio, getPedidosFull, getSeAcaba, getVentas30 } from '../lib/data'
import { cop, diasDesde, fmtFecha } from '../lib/format'
import { useAuth } from '../lib/auth'
import AsistenteCard from '../components/AsistenteCard'
import VentasChart from '../components/VentasChart'
import { Cargando, ErrorMsg } from '../components/ui'
import type { EstadoPedido } from '../lib/types'

const chipEstado: Record<EstadoPedido, { clase: string; texto: string }> = {
  pendiente: { clase: 'b-warn', texto: 'Pendiente' },
  despachado: { clase: 'b-blue', texto: 'Despachado' },
  entregado: { clase: 'b-green', texto: 'Entregado' },
}

function Encabezado({
  icono,
  tono,
  titulo,
  to,
  enlace,
}: {
  icono: ReactNode
  tono: string
  titulo: string
  to?: string
  enlace?: string
}) {
  return (
    <div className="sec-h">
      <span className={`ic ${tono}`}>{icono}</span>
      <h2>{titulo}</h2>
      {to && (
        <Link to={to} className="more">
          {enlace ?? 'Ver todos'} →
        </Link>
      )}
    </div>
  )
}

export default function Inicio() {
  const { socio } = useAuth()
  const { data, loading, error } = useData(getInicio)
  // Lecturas complementarias: si fallan, solo su tarjeta muestra vacío; el resto de Inicio sigue.
  const ventas = useData(getVentas30)
  const seAcaba = useData(getSeAcaba)
  const pedidos = useData(getPedidosFull)
  const [tab, setTab] = useState<'vencida' | 'hoy'>('vencida')

  if (loading) return <Cargando />
  if (error || !data) return <ErrorMsg>No se pudo cargar el resumen: {error}</ErrorMsg>

  const { resumen, atencion, clientesConDeuda } = data

  const primerNombre = (socio?.nombre ?? '').split(/[\s@]+/)[0]
  const fecha = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const fechaTxt = fecha.charAt(0).toUpperCase() + fecha.slice(1)

  const vencidas = atencion.filter((a) => a.tipo === 'vencida')
  const hoy = atencion.filter((a) => a.tipo === 'hoy')
  const lista = (tab === 'vencida' ? vencidas : hoy).slice(0, 5)

  const total30 = ventas.data?.reduce((s, d) => s + d.total, 0) ?? 0
  const ultimos = (pedidos.data ?? []).slice(0, 5)
  const ventasTotal = (pedidos.data ?? []).reduce((s, p) => s + p.valor_total, 0)
  const recaudadoTotal = (pedidos.data ?? []).reduce((s, p) => s + p.recaudado, 0)

  return (
    <div className="inicio entra-lista">
      {/* Bienvenida */}
      <section className="welcome">
        <div className="hello">
          <span className="eyebrow" style={{ color: 'var(--accent)' }}>
            Bienvenido de nuevo
          </span>
          <h1>Hola, {primerNombre || 'socio'}</h1>
          <p>Aquí tienes el estado de Warpath Forge hoy.</p>
        </div>
        <div className="banner">
          <div className="q">
            “Orden hoy,
            <br />
            resultados mañana”
          </div>
          <div className="wt" />
        </div>
        <div className="datecard">
          <div className="r">
            <CalendarDays size={16} strokeWidth={1.7} />
            {fechaTxt}
          </div>
          <div className="r mut">
            <MapPin size={16} strokeWidth={1.7} />
            Medellín, Colombia
          </div>
        </div>
      </section>

      {/* KPIs */}
      <section className="grid4">
        <Link to="/caja" className="panel kpi">
          <div className="h">
            <span className="ic blue">
              <Database size={19} strokeWidth={1.7} />
            </span>
            <span className="lab">Caja total</span>
            <ChevronRight className="go" size={18} strokeWidth={1.7} />
          </div>
          <div className="val tnum">{cop(resumen.caja)}</div>
          <div className="kpi-foot">
            <div className="mini">
              <div className="k">
                <span className="dot" style={{ background: 'var(--success-fg)' }} />
                Ganancia repartible
              </div>
              <div className="v tnum" style={{ color: 'var(--success-fg)' }}>
                {cop(resumen.ganancia_repartible)}
              </div>
            </div>
            <div className="mini">
              <div className="k">
                <span className="dot" style={{ background: 'var(--text-tertiary)' }} />
                Para reponer
              </div>
              <div className="v tnum">{cop(resumen.reponer)}</div>
            </div>
          </div>
        </Link>

        <Link to="/clientes" className="panel kpi">
          <div className="h">
            <span className="ic red">
              <UserX size={19} strokeWidth={1.7} />
            </span>
            <span className="lab">Te deben</span>
            <ChevronRight className="go" size={18} strokeWidth={1.7} />
          </div>
          <div className="val red tnum">{cop(resumen.te_deben)}</div>
          <div className="sub">
            {clientesConDeuda === 1 ? '1 cliente con deuda' : `${clientesConDeuda} clientes con deuda`}
          </div>
        </Link>

        <Link to="/compras" className="panel kpi">
          <div className="h">
            <span className="ic gray">
              <ShoppingCart size={19} strokeWidth={1.7} />
            </span>
            <span className="lab">
              Comprometido
              <br />
              para comprar
            </span>
            <ChevronRight className="go" size={18} strokeWidth={1.7} />
          </div>
          <div className="val tnum">{cop(resumen.comprometido_comprar)}</div>
          <div className="sub">
            {resumen.pedidos_sin_compra === 1
              ? '1 pedido sin compra registrada'
              : `${resumen.pedidos_sin_compra} pedidos sin compra registrada`}
          </div>
        </Link>

        <Link to="/pedidos" className="panel kpi">
          <div className="h">
            <span className="ic gray">
              <Package size={19} strokeWidth={1.7} />
            </span>
            <span className="lab">
              Pedidos
              <br />
              pendientes
            </span>
            <ChevronRight className="go" size={18} strokeWidth={1.7} />
          </div>
          <div className="val tnum">{resumen.pedidos_pendientes}</div>
          <div className="sub">Sin despachar aún</div>
        </Link>
      </section>

      {/* Ventas · Asistente · Atención */}
      <section className="grid3">
        <div className="panel pad">
          <Encabezado
            icono={<ChartLine size={17} strokeWidth={1.7} />}
            tono="blue"
            titulo="Ventas de los últimos 30 días"
          />
          <div className="chart-head">
            <div className="big tnum">{cop(total30)}</div>
            <span className="pill">Últimos 30 días</span>
          </div>
          {ventas.data ? (
            <VentasChart datos={ventas.data} />
          ) : (
            <div className="vacio-card">
              {ventas.loading ? 'Cargando ventas…' : 'No se pudieron cargar las ventas.'}
            </div>
          )}
        </div>

        <AsistenteCard />

        <div className="panel pad">
          <Encabezado
            icono={<TriangleAlert size={16} strokeWidth={1.8} />}
            tono="red"
            titulo="Requiere atención"
            to="/clientes"
            enlace="Ver todas"
          />
          <div className="tabs">
            <button
              type="button"
              className={`tab ${tab === 'vencida' ? 'on' : 'off'}`}
              onClick={() => setTab('vencida')}
            >
              Cuotas vencidas <span className="n">{vencidas.length}</span>
            </button>
            <button
              type="button"
              className={`tab ${tab === 'hoy' ? 'on' : 'off'}`}
              onClick={() => setTab('hoy')}
            >
              Vencen hoy <span className="n">{hoy.length}</span>
            </button>
          </div>
          {lista.length === 0 ? (
            <div className="vacio-card">
              {tab === 'vencida' ? 'Nadie está vencido. Todo al día.' : 'Nadie vence hoy.'}
            </div>
          ) : (
            lista.map((a) => (
              <Link
                to={`/clientes/${a.cliente_id}`}
                className="att-row"
                key={a.cliente_id + a.tipo}
              >
                <span className={`rd ${a.tipo === 'hoy' ? 'warn' : ''}`} />
                <div>
                  <div className="nm">{a.cliente_nombre}</div>
                  <div className={`mt ${a.tipo === 'hoy' ? 'warn' : ''}`}>
                    {a.tipo === 'vencida'
                      ? a.dias === 1
                        ? 'Vencida hace 1 día'
                        : `Vencida hace ${a.dias} días`
                      : 'Vence hoy'}
                  </div>
                </div>
                <div className="amt tnum">{cop(a.monto)}</div>
                <ChevronRight className="go" size={16} strokeWidth={1.7} />
              </Link>
            ))
          )}
        </div>
      </section>

      {/* Accesos rápidos */}
      <section className="qa">
        <Link to="/pedidos/nuevo" className="panel">
          <span className="ic">
            <FilePlus size={20} strokeWidth={1.7} />
          </span>
          <div>
            <div className="t">Nuevo pedido</div>
            <div className="d">Registrar venta</div>
          </div>
        </Link>
        <Link to="/clientes" className="panel">
          <span className="ic">
            <UserPlus size={20} strokeWidth={1.7} />
          </span>
          <div>
            <div className="t">Nuevo cliente</div>
            <div className="d">Agregar cliente</div>
          </div>
        </Link>
        <Link to="/compras/nueva" className="panel">
          <span className="ic">
            <ShoppingCart size={20} strokeWidth={1.7} />
          </span>
          <div>
            <div className="t">Nueva compra</div>
            <div className="d">Registrar compra</div>
          </div>
        </Link>
        <Link to="/productos" className="panel">
          <span className="ic">
            <PackagePlus size={20} strokeWidth={1.7} />
          </span>
          <div>
            <div className="t">Nuevo producto</div>
            <div className="d">Agregar producto</div>
          </div>
        </Link>
        <Link to="/catalogo" className="panel">
          <span className="ic">
            <BookOpen size={20} strokeWidth={1.7} />
          </span>
          <div>
            <div className="t">Ver catálogo</div>
            <div className="d">Productos activos</div>
          </div>
        </Link>
        <Link to="/kpis" className="promo">
          <div className="pt">
            GESTIONA
            <br />
            CRECE
            <br />
            DOMINA
          </div>
          <span className="pg">
            <ArrowRight size={18} strokeWidth={1.9} />
          </span>
        </Link>
      </section>

      {/* Fila inferior */}
      <section className="grid3 bottom">
        <div className="panel pad">
          <Encabezado
            icono={<Clock size={16} strokeWidth={1.7} />}
            tono="warn"
            titulo="Se les acaba esta semana"
            to="/mensajes"
          />
          <p className="subt">Clientes por reabastecer — oportunidad de venta</p>
          {seAcaba.data && seAcaba.data.length > 0 ? (
            seAcaba.data.slice(0, 5).map((r) => (
              <Link to={`/clientes/${r.cliente_id}`} className="list-row" key={r.cliente_id + r.producto}>
                <span className="thumb">
                  <User size={16} strokeWidth={1.6} />
                </span>
                <div className="grow">
                  <div className="nm">{r.cliente_nombre}</div>
                  <div className="mt">
                    {r.producto} · lo tomó hace {diasDesde(r.desde)} días
                  </div>
                </div>
                <span className={`badge2 ${r.dias <= 3 ? 'b-red' : 'b-warn'}`}>
                  {r.dias === 0 ? 'hoy' : r.dias === 1 ? 'mañana' : `en ${r.dias} días`}
                </span>
              </Link>
            ))
          ) : (
            <div className="vacio-card">
              {seAcaba.loading
                ? 'Cargando…'
                : seAcaba.error
                  ? 'No se pudo cargar.'
                  : 'A nadie se le acaba el producto en los próximos 7 días.'}
            </div>
          )}
        </div>

        <div className="panel pad">
          <Encabezado
            icono={<FileText size={16} strokeWidth={1.7} />}
            tono="blue"
            titulo="Últimos pedidos"
            to="/pedidos"
          />
          {ultimos.length > 0 ? (
            ultimos.map((p) => (
              <Link to={`/pedidos/${p.pedido_id}`} className="ped" key={p.pedido_id}>
                <span className="id">{fmtFecha(p.fecha)}</span>
                <div className="nm">{p.cliente_nombre}</div>
                <span className={`badge2 ${chipEstado[p.estado].clase}`}>{chipEstado[p.estado].texto}</span>
                <span className="amt tnum">{cop(p.valor_total)}</span>
              </Link>
            ))
          ) : (
            <div className="vacio-card">
              {pedidos.loading ? 'Cargando…' : pedidos.error ? 'No se pudo cargar.' : 'Aún no hay pedidos.'}
            </div>
          )}
        </div>

        <div className="panel pad">
          <Encabezado
            icono={<Wallet size={16} strokeWidth={1.7} />}
            tono="gray"
            titulo="Resumen general"
            to="/kpis"
            enlace="Ver más"
          />
          <p className="subt">Acumulado del negocio</p>
          <div className="res-row">
            <span className="l">Ventas</span>
            <span className="v tnum">{cop(ventasTotal)}</span>
          </div>
          <div className="res-row">
            <span className="l">Compras</span>
            <span className="v tnum">{cop(resumen.compras_total)}</span>
          </div>
          <div className="res-row">
            <span className="l">Recaudado</span>
            <span className="v tnum">{cop(recaudadoTotal)}</span>
          </div>
          <div className="res-row">
            <span className="l">Ganancia repartible</span>
            <span className="v tnum">{cop(resumen.ganancia_repartible)}</span>
          </div>
          {resumen.reponer > 0 && (
            <div className="callout">
              <TriangleAlert size={18} strokeWidth={1.8} className="ico" />
              <div className="t">
                <b>Ojo con la caja:</b> hay {cop(resumen.reponer)} para reponer producto antes de repartir
                ganancia.
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

import { Fragment, useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle, Package, Search, Wallet } from 'lucide-react'
import { useData } from '../lib/hooks'
import { getClientesDetalle, getInicio } from '../lib/data'
import type { MotivoMensaje } from '../lib/asistente'
import { cop, fmtFecha } from '../lib/format'
import GeneradorMensaje from '../components/GeneradorMensaje'
import { Cargando, ErrorMsg, Vacio, btnSecundario } from '../components/ui'

interface Sugerencia {
  id: string
  cliente_id: string
  nombre: string
  detalle: string
  extra: string
  motivo: MotivoMensaje
}

type Filtro = 'todos' | 'cobrar' | 'reabastecer'

export default function Mensajes() {
  const inicio = useData(getInicio)
  const clientes = useData(getClientesDetalle)
  const [abierto, setAbierto] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [q, setQ] = useState('')

  if (inicio.loading || clientes.loading) return <Cargando />
  if (inicio.error || !inicio.data)
    return <ErrorMsg>No se pudieron cargar las sugerencias: {inicio.error}</ErrorMsg>

  const telefonos = new Map((clientes.data ?? []).map((c) => [c.id, c.telefono]))

  const cobrar: Sugerencia[] = inicio.data.atencion.map((a) => ({
    id: `${a.cliente_id}-${a.tipo}`,
    cliente_id: a.cliente_id,
    nombre: a.cliente_nombre,
    detalle:
      a.tipo === 'vencida'
        ? a.dias === 1
          ? 'cuota vencida hace 1 día'
          : `cuota vencida hace ${a.dias} días`
        : 'cuota vence hoy',
    extra: cop(a.monto),
    motivo: 'cobro',
  }))

  const reabastecer: Sugerencia[] = inicio.data.proximosRecompra.map((r) => ({
    id: `${r.cliente_id}-recompra`,
    cliente_id: r.cliente_id,
    nombre: r.cliente_nombre,
    detalle:
      r.dias === 0
        ? 'se le acaba el producto hoy'
        : r.dias === 1
          ? 'se le acaba el producto mañana'
          : `se le acaba el producto en ${r.dias} días`,
    extra: fmtFecha(r.fecha),
    motivo: 'recompra',
  }))

  const sugerencias = [...cobrar, ...reabastecer]

  // Resumen de solo lectura sobre los mismos datos que ya carga la pantalla.
  const porCobrar = inicio.data.atencion
    .filter((a) => a.tipo === 'vencida')
    .reduce((suma, a) => suma + a.monto, 0)

  const busca = q.trim().toLowerCase()
  const coincide = (s: Sugerencia) => s.nombre.toLowerCase().includes(busca)
  const cobrarVisibles = cobrar.filter((s) => coincide(s) && (filtro === 'todos' || filtro === 'cobrar'))
  const reabastecerVisibles = reabastecer.filter(
    (s) => coincide(s) && (filtro === 'todos' || filtro === 'reabastecer'),
  )
  const totalVisible = cobrarVisibles.length + reabastecerVisibles.length

  function fila(s: Sugerencia, tono: 'deuda' | 'aviso') {
    return (
      <div key={s.id} className={`cli-row ${tono}`} style={{ cursor: 'default' }}>
        <span className="cav">
          {s.motivo === 'cobro' ? (
            <Wallet size={17} strokeWidth={1.8} />
          ) : (
            <Package size={17} strokeWidth={1.8} />
          )}
        </span>
        <div className="who">
          <Link to={`/clientes/${s.cliente_id}`} className="hover:text-accent">
            <b>{s.nombre}</b>
          </Link>
          <div className="meta">{s.detalle}</div>
        </div>
        {s.motivo === 'cobro' ? (
          <div className="money neg tnum">{s.extra}</div>
        ) : (
          <div className="whitespace-nowrap text-sm text-ink-secondary">{s.extra}</div>
        )}
        <button className={btnSecundario} onClick={() => setAbierto(abierto === s.id ? null : s.id)}>
          {abierto === s.id ? 'Cerrar' : 'Redactar'}
        </button>
      </div>
    )
  }

  return (
    <div className="entra-lista space-y-4 sm:space-y-6">
      <div>
        <h1 className="titulo-pantalla">Mensajes</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          La IA redacta el mensaje con los datos reales; tú lo revisas y lo envías.
        </p>
      </div>

      <div className="cli-tiles">
        <div className="cli-tile">
          <div className="lab">Para contactar hoy</div>
          <div className="val tnum">{sugerencias.length}</div>
          <div className="sub">personas en la lista</div>
        </div>
        <div className="cli-tile alert">
          <div className="lab">Por cobrar</div>
          <div className="val tnum">{cop(porCobrar)}</div>
          <div className="sub">suma de las cuotas vencidas</div>
        </div>
        <div className="cli-tile">
          <div className="lab">Se les acaba</div>
          <div className="val tnum">{reabastecer.length}</div>
          <div className="sub">para reabastecer</div>
        </div>
      </div>

      <div className="cli-bar">
        <div className="cli-filtros" role="tablist">
          {(
            [
              ['todos', 'Todos', sugerencias.length],
              ['cobrar', 'Cobrar', cobrar.length],
              ['reabastecer', 'Reabastecer', reabastecer.length],
            ] as [Filtro, string, number][]
          ).map(([id, label, n]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={filtro === id}
              className={filtro === id ? 'on' : ''}
              onClick={() => setFiltro(id)}
            >
              {label} <span className="cnt">{n}</span>
            </button>
          ))}
        </div>
        <label className="cli-find">
          <Search size={16} strokeWidth={2} />
          <input placeholder="Buscar por cliente…" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
      </div>

      <div className="cli-lista">
        {sugerencias.length === 0 ? (
          <div className="p-5">
            <Vacio
              icono={<MessageCircle size={32} strokeWidth={1.75} />}
              detalle="Cuando alguien esté vencido, venza hoy o esté por recomprar, aparecerá aquí."
            >
              Nadie necesita mensaje hoy. Todo al día.
            </Vacio>
          </div>
        ) : totalVisible === 0 ? (
          <div className="p-5">
            <Vacio>Nadie coincide con la búsqueda.</Vacio>
          </div>
        ) : (
          <>
            {cobrarVisibles.length > 0 && (
              <>
                <div className="grouphdr">Cobrar · cuotas vencidas · {cobrarVisibles.length}</div>
                {cobrarVisibles.map((s) => (
                  <Fragment key={s.id}>
                    {fila(s, 'deuda')}
                    {abierto === s.id && (
                      <div className="border-b border-line bg-card2 px-4 py-4 sm:px-5">
                        <GeneradorMensaje
                          clienteId={s.cliente_id}
                          telefono={telefonos.get(s.cliente_id) ?? null}
                          motivoFijo={s.motivo}
                        />
                      </div>
                    )}
                  </Fragment>
                ))}
              </>
            )}
            {reabastecerVisibles.length > 0 && (
              <>
                <div className="grouphdr">Reabastecer · se les acaba el producto · {reabastecerVisibles.length}</div>
                {reabastecerVisibles.map((s) => (
                  <Fragment key={s.id}>
                    {fila(s, 'aviso')}
                    {abierto === s.id && (
                      <div className="border-b border-line bg-card2 px-4 py-4 sm:px-5">
                        <GeneradorMensaje
                          clienteId={s.cliente_id}
                          telefono={telefonos.get(s.cliente_id) ?? null}
                          motivoFijo={s.motivo}
                        />
                      </div>
                    )}
                  </Fragment>
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}

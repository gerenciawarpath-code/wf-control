import { useState } from 'react'
import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useData } from '../lib/hooks'
import { getClientesDetalle, getInicio } from '../lib/data'
import type { MotivoMensaje } from '../lib/asistente'
import { cop, fmtFecha } from '../lib/format'
import GeneradorMensaje from '../components/GeneradorMensaje'
import { Card, Cargando, ErrorMsg, Punto, Vacio, btnSecundario, type Tono } from '../components/ui'

interface Sugerencia {
  id: string
  cliente_id: string
  nombre: string
  tono: Tono
  detalle: string
  extra: string
  motivo: MotivoMensaje
}

export default function Mensajes() {
  const inicio = useData(getInicio)
  const clientes = useData(getClientesDetalle)
  const [abierto, setAbierto] = useState<string | null>(null)

  if (inicio.loading || clientes.loading) return <Cargando />
  if (inicio.error || !inicio.data)
    return <ErrorMsg>No se pudieron cargar las sugerencias: {inicio.error}</ErrorMsg>

  const telefonos = new Map((clientes.data ?? []).map((c) => [c.id, c.telefono]))

  const sugerencias: Sugerencia[] = [
    ...inicio.data.atencion.map((a) => ({
      id: `${a.cliente_id}-${a.tipo}`,
      cliente_id: a.cliente_id,
      nombre: a.cliente_nombre,
      tono: (a.tipo === 'vencida' ? 'rojo' : 'ambar') as Tono,
      detalle:
        a.tipo === 'vencida'
          ? a.dias === 1
            ? 'cuota vencida hace 1 día'
            : `cuota vencida hace ${a.dias} días`
          : 'cuota vence hoy',
      extra: cop(a.monto),
      motivo: 'cobro' as MotivoMensaje,
    })),
    ...inicio.data.proximosRecompra.map((r) => ({
      id: `${r.cliente_id}-recompra`,
      cliente_id: r.cliente_id,
      nombre: r.cliente_nombre,
      tono: 'azul' as Tono,
      detalle:
        r.dias === 0
          ? 'se le acaba el producto hoy'
          : r.dias === 1
            ? 'se le acaba el producto mañana'
            : `se le acaba el producto en ${r.dias} días`,
      extra: fmtFecha(r.fecha),
      motivo: 'recompra' as MotivoMensaje,
    })),
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="titulo-pantalla">Mensajes</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          A quién contactar hoy. La IA redacta el mensaje con los datos reales; tú lo revisas y lo
          envías.
        </p>
      </div>

      <Card>
        {sugerencias.length === 0 ? (
          <Vacio
            icono={<MessageCircle size={32} strokeWidth={1.75} />}
            detalle="Cuando alguien esté vencido, venza hoy o esté por recomprar, aparecerá aquí."
          >
            Nadie necesita mensaje hoy. Todo al día.
          </Vacio>
        ) : (
          <ul className="divide-y divide-line">
            {sugerencias.map((s) => (
              <li key={s.id} className="py-3">
                <div className="flex flex-wrap items-center gap-3">
                  <Punto tono={s.tono} />
                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/clientes/${s.cliente_id}`}
                      className="text-sm font-medium hover:text-accent"
                    >
                      {s.nombre}
                    </Link>
                    <div className="text-xs text-ink-secondary">{s.detalle}</div>
                  </div>
                  <div className="text-sm text-ink-secondary">{s.extra}</div>
                  <button
                    className={btnSecundario}
                    onClick={() => setAbierto(abierto === s.id ? null : s.id)}
                  >
                    {abierto === s.id ? 'Cerrar' : 'Redactar'}
                  </button>
                </div>
                {abierto === s.id && (
                  <div className="mt-3 border-l-2 border-accent-soft pl-4 sm:ml-4">
                    <GeneradorMensaje
                      clienteId={s.cliente_id}
                      telefono={telefonos.get(s.cliente_id) ?? null}
                      motivoFijo={s.motivo}
                    />
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}

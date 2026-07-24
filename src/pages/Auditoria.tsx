import { useState } from 'react'
import { useData } from '../lib/hooks'
import { getAuditoria, type AuditoriaFila } from '../lib/data'
import { cop } from '../lib/format'
import { Badge, Card, Cargando, ErrorMsg, Vacio } from '../components/ui'
import { Modal } from '../components/Modal'

const nombreTabla: Record<string, string> = {
  clientes: 'Cliente',
  productos: 'Producto',
  pedidos: 'Pedido',
  pedido_items: 'Renglón de pedido',
  cuotas: 'Cuota',
  abonos: 'Abono',
}

/** Etiqueta legible de lo que cambió, a partir del estado anterior. */
function describir(f: AuditoriaFila): string {
  const d = f.datos_anteriores ?? {}
  const base = nombreTabla[f.tabla] ?? f.tabla
  if (f.tabla === 'clientes' || f.tabla === 'productos') return `${base}: ${d.nombre ?? ''}`
  if (f.tabla === 'abonos' && typeof d.monto === 'number') return `${base} de ${cop(d.monto)}`
  if (f.tabla === 'cuotas' && d.numero != null) return `${base} ${d.numero}`
  return base
}

function fmtCuando(iso: string): string {
  return new Date(iso).toLocaleString('es-CO', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** Formatea un valor del "antes" para leerlo sin ruido técnico. */
function valorLegible(clave: string, valor: unknown): string {
  if (valor === null || valor === undefined) return '—'
  if (typeof valor === 'boolean') return valor ? 'sí' : 'no'
  if (
    typeof valor === 'number' &&
    /monto|costo|precio|valor/.test(clave) &&
    !/dias|numero|cantidad/.test(clave)
  )
    return cop(valor)
  return String(valor)
}

export default function Auditoria() {
  const { data, loading, error } = useData(getAuditoria)
  const [detalle, setDetalle] = useState<AuditoriaFila | null>(null)

  if (loading) return <Cargando />
  if (error || !data) return <ErrorMsg>No se pudo cargar el historial: {error}</ErrorMsg>

  return (
    <div className="entra-lista space-y-4 sm:space-y-6">
      <div>
        <h1 className="titulo-pantalla">Historial de cambios</h1>
        <p className="mt-1 text-sm text-ink-secondary">
          Las últimas 100 ediciones y eliminaciones: quién, qué y cuándo. Útil para revisar entre
          socios cuando algo se ve raro.
        </p>
      </div>

      <Card>
        {data.length === 0 ? (
          <Vacio detalle="Cuando alguien edite o elimine algo, quedará registrado aquí.">
            Aún no hay cambios registrados.
          </Vacio>
        ) : (
          <ul className="divide-y divide-line">
            {data.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-3 py-3.5">
                <Badge tono={f.accion === 'eliminar' ? 'rojo' : 'azul'}>
                  {f.accion === 'eliminar' ? 'eliminó' : 'editó'}
                </Badge>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{describir(f)}</div>
                  <div className="text-xs text-ink-faint">
                    {f.socio_nombre ?? 'sistema'} · {fmtCuando(f.fecha)}
                  </div>
                </div>
                {f.datos_anteriores && (
                  <button
                    className="text-sm text-accent hover:text-accent-hover"
                    onClick={() => setDetalle(f)}
                  >
                    Ver antes
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {detalle && detalle.datos_anteriores && (
        <Modal titulo={`Antes · ${describir(detalle)}`} onCerrar={() => setDetalle(null)}>
          <div className="space-y-2">
            <p className="text-xs text-ink-faint">
              Estado del registro justo antes de que {detalle.socio_nombre ?? 'el sistema'} lo{' '}
              {detalle.accion === 'eliminar' ? 'eliminara' : 'editara'}.
            </p>
            <dl className="divide-y divide-line">
              {Object.entries(detalle.datos_anteriores)
                .filter(([k]) => k !== 'id' && k !== 'created_at')
                .map(([k, v]) => (
                  <div key={k} className="flex gap-3 py-2 text-sm">
                    <dt className="w-40 shrink-0 text-ink-faint">{k}</dt>
                    <dd className="min-w-0 flex-1 break-words font-medium">{valorLegible(k, v)}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </Modal>
      )}
    </div>
  )
}

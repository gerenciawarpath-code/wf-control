import { Link } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import type { RespuestaAsistente as TResp } from '../lib/asistente'
import { cop } from '../lib/format'
import { Badge, type Tono } from './ui'

/** Mapea el estado del item a color de badge (v2). */
function tonoEstado(estado?: string): Tono {
  switch (estado) {
    case 'vencido':
    case 'vencida':
      return 'rojo'
    case 'vence_hoy':
      return 'ambar'
    case 'al_dia':
    case 'pagado':
    case 'pagada':
      return 'verde'
    default:
      return 'neutro'
  }
}

function etiquetaEstado(estado?: string): string {
  if (!estado) return ''
  return estado.replace(/_/g, ' ')
}

/** Resalta la cifra `highlight` dentro del resumen, en azul de marca. */
function ResumenConCifra({ summary, highlight }: { summary: string; highlight?: string }) {
  if (highlight && summary.includes(highlight)) {
    const [antes, ...resto] = summary.split(highlight)
    return (
      <p className="text-xl font-semibold leading-snug tracking-tight">
        {antes}
        <span className="text-accent">{highlight}</span>
        {resto.join(highlight)}
      </p>
    )
  }
  return <p className="text-xl font-semibold leading-snug tracking-tight">{summary}</p>
}

export default function RespuestaAsistente({ respuesta }: { respuesta: TResp }) {
  // Fallback: prosa con markdown básico (sin pipes ni asteriscos crudos)
  if (respuesta.clase === 'texto') {
    return (
      <div className="mt-4 rounded-control bg-page px-4 py-3 text-sm leading-relaxed text-ink [&_li]:my-0.5 [&_strong]:font-semibold [&_ul]:my-1 [&_ul]:list-disc [&_ul]:pl-5">
        <ReactMarkdown>{respuesta.texto}</ReactMarkdown>
      </div>
    )
  }

  const { summary, highlight, items, alert, cta } = respuesta.data

  return (
    <div className="mt-4 space-y-4">
      <ResumenConCifra summary={summary} highlight={highlight} />

      {alert && (
        <div className="rounded-control bg-warning-soft px-4 py-3 text-sm font-medium text-warning">
          {alert}
        </div>
      )}

      {items && items.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left">
                <th className="label-faint py-2 pr-4 font-medium">Cliente</th>
                <th className="label-faint py-2 pr-4 text-right font-medium">Monto</th>
                <th className="label-faint py-2 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {items.map((it, i) => (
                <tr key={`${it.cliente}-${i}`}>
                  <td className="py-3 pr-4 font-medium">{it.cliente}</td>
                  <td className="py-3 pr-4 text-right font-medium tabular-nums">{cop(it.monto)}</td>
                  <td className="py-3">
                    {it.estado ? (
                      <Badge tono={tonoEstado(it.estado)}>{etiquetaEstado(it.estado)}</Badge>
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {cta && (
        <Link to={cta.action} className="btn-secundario">
          {cta.label}
        </Link>
      )}
    </div>
  )
}

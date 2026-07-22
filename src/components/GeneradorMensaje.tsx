import { useState } from 'react'
import { generarMensaje, linkWhatsApp, type MotivoMensaje } from '../lib/asistente'
import { ErrorMsg, btnPrimario, btnSecundario } from './ui'

const motivos: { id: MotivoMensaje; label: string }[] = [
  { id: 'cobro', label: 'Cobro' },
  { id: 'recompra', label: 'Recompra' },
  { id: 'promo', label: 'Promo' },
]

export default function GeneradorMensaje({
  clienteId,
  telefono,
  motivoFijo,
}: {
  clienteId: string
  telefono: string | null
  motivoFijo?: MotivoMensaje
}) {
  const [motivo, setMotivo] = useState<MotivoMensaje>(motivoFijo ?? 'cobro')
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiado, setCopiado] = useState(false)

  async function redactar() {
    setCargando(true)
    setError(null)
    try {
      setMensaje(await generarMensaje(clienteId, motivo))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo redactar el mensaje.')
    } finally {
      setCargando(false)
    }
  }

  async function copiar() {
    await navigator.clipboard.writeText(mensaje)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5">
        {!motivoFijo &&
          motivos.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMotivo(m.id)}
              className={`rounded-full px-4 py-1.5 text-sm transition-colors duration-150 ${
                motivo === m.id
                  ? 'bg-accent-soft font-medium text-accent'
                  : 'border border-line bg-card text-ink-secondary hover:bg-card3'
              }`}
            >
              {m.label}
            </button>
          ))}
        <button type="button" className={btnSecundario} onClick={redactar} disabled={cargando}>
          {cargando ? 'Redactando…' : mensaje ? 'Redactar de nuevo' : 'Redactar mensaje'}
        </button>
      </div>

      {error && <ErrorMsg>{error}</ErrorMsg>}

      {mensaje && (
        <>
          <textarea
            className="w-full rounded-control border border-line bg-card p-3 text-sm text-ink transition-[box-shadow,border-color] duration-150"
            rows={4}
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-2">
            {telefono ? (
              <a
                href={linkWhatsApp(telefono, mensaje)}
                target="_blank"
                rel="noreferrer"
                className={btnPrimario}
              >
                Enviar por WhatsApp
              </a>
            ) : (
              <span className="text-sm text-ink-faint">
                Este cliente no tiene teléfono guardado.
              </span>
            )}
            <button type="button" className={btnSecundario} onClick={copiar}>
              {copiado ? 'Copiado' : 'Copiar'}
            </button>
          </div>
          <p className="text-xs text-ink-faint">
            Revisa el texto antes de enviarlo — tú tienes la última palabra.
          </p>
        </>
      )}
    </div>
  )
}

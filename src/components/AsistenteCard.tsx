import { useState, type FormEvent } from 'react'
import { preguntarAsistente } from '../lib/asistente'
import { Card, ErrorMsg, btnPrimario, inputBase } from './ui'

const sugerencias = [
  '¿Quién paga hoy?',
  '¿Quién está vencido?',
  '¿Cuánto nos deben?',
  '¿A quién se le acaba el producto esta semana?',
]

export default function AsistenteCard() {
  const [pregunta, setPregunta] = useState('')
  const [respuesta, setRespuesta] = useState<string | null>(null)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function preguntar(q: string) {
    const limpia = q.trim()
    if (!limpia || cargando) return
    setPregunta(q)
    setCargando(true)
    setError(null)
    setRespuesta(null)
    try {
      setRespuesta(await preguntarAsistente(limpia))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'El asistente no respondió.')
    } finally {
      setCargando(false)
    }
  }

  function enviar(e: FormEvent) {
    e.preventDefault()
    preguntar(pregunta)
  }

  return (
    <Card>
      <h2 className="text-lg font-medium">Asistente</h2>
      <p className="mt-1 text-sm text-ink-secondary">
        Pregúntale al negocio; responde con los datos reales.
      </p>
      <form onSubmit={enviar} className="mt-3 flex gap-2">
        <input
          className={inputBase}
          placeholder="¿Quién paga hoy?"
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
        />
        <button type="submit" className={`${btnPrimario} shrink-0`} disabled={cargando}>
          {cargando ? 'Pensando…' : 'Preguntar'}
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {sugerencias.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => preguntar(s)}
            className="rounded-full border border-line bg-card px-3 py-1 text-xs text-ink-secondary transition-colors duration-150 hover:bg-page"
          >
            {s}
          </button>
        ))}
      </div>
      {error && (
        <div className="mt-3">
          <ErrorMsg>{error}</ErrorMsg>
        </div>
      )}
      {respuesta && (
        <div className="mt-4 whitespace-pre-wrap rounded-control bg-page px-4 py-3 text-sm leading-relaxed">
          {respuesta}
        </div>
      )}
    </Card>
  )
}

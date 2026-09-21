import { useState, type FormEvent } from 'react'
import { Sparkles } from 'lucide-react'
import { preguntarAsistente, type RespuestaAsistente as TResp } from '../lib/asistente'
import { ErrorMsg, btnPrimario, inputBase } from './ui'
import RespuestaAsistente from './RespuestaAsistente'

const sugerencias = [
  '¿Quién paga hoy?',
  '¿Quién está vencido?',
  '¿Cuánto nos deben?',
  '¿A quién se le acaba el producto esta semana?',
]

export default function AsistenteCard() {
  const [pregunta, setPregunta] = useState('')
  const [respuesta, setRespuesta] = useState<TResp | null>(null)
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
    <section className="panel asist">
      <div className="asist-head">
        <span className="spark">
          <Sparkles size={15} strokeWidth={1.75} />
        </span>
        <h2>Asistente</h2>
      </div>
      <p className="mt-1 ml-9 text-sm text-ink-secondary">
        Pregúntale al negocio; responde con los datos reales.
      </p>
      <form onSubmit={enviar} className="mt-3.5 flex gap-2.5">
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
      <div className="mt-3 flex flex-wrap gap-2">
        {sugerencias.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => preguntar(s)}
            className="rounded-full border border-line-mid bg-transparent px-3.5 py-1.5 text-xs text-ink-secondary transition-colors duration-150 hover:border-accent hover:bg-accent-soft hover:text-ink"
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
      {respuesta && <RespuestaAsistente respuesta={respuesta} />}
    </section>
  )
}

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
    <section className="panel pad asist">
      <div className="asist-head">
        <span className="spark2">
          <Sparkles size={17} strokeWidth={1.75} />
        </span>
        <h2>Asistente WF (IA)</h2>
        <span className="st">
          <span className="dot" style={{ background: 'var(--success-fg)' }} />
          En línea
        </span>
      </div>
      <p className="hint">Tu asistente para consultar ventas, clientes, pedidos y más.</p>
      <form onSubmit={enviar} className="askrow">
        <input
          className={`${inputBase} askin`}
          placeholder="¿Qué necesitas saber hoy?"
          value={pregunta}
          onChange={(e) => setPregunta(e.target.value)}
        />
        <button type="submit" className={`${btnPrimario} shrink-0`} disabled={cargando}>
          {cargando ? 'Pensando…' : 'Preguntar'}
        </button>
      </form>
      <p className="sug-t">Sugerencias rápidas</p>
      <div className="chips">
        {sugerencias.map((s) => (
          <button key={s} type="button" onClick={() => preguntar(s)} className="chip-sug">
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

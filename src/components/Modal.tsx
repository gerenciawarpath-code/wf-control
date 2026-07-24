import { useEffect, useState, type ReactNode } from 'react'
import { ErrorMsg, inputBase } from './ui'

/** Modal base: overlay + card centrada, cierra con Esc o clic afuera. */
export function Modal({
  titulo,
  children,
  onCerrar,
}: {
  titulo: string
  children: ReactNode
  onCerrar: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCerrar()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCerrar])

  return (
    <div className="modal-fondo" onClick={onCerrar} role="dialog" aria-modal="true">
      <div className="modal-caja" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-medium">{titulo}</h2>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

/**
 * Confirmación elegante. Reemplaza a window.confirm().
 * Si `palabraClave` se pasa (ej. "ELIMINAR"), exige escribirla para habilitar.
 */
export function ConfirmDialog({
  titulo,
  mensaje,
  palabraClave,
  textoConfirmar = 'Eliminar',
  destructivo = true,
  onConfirmar,
  onCancelar,
}: {
  titulo: string
  mensaje: ReactNode
  palabraClave?: string
  textoConfirmar?: string
  destructivo?: boolean
  onConfirmar: () => Promise<void> | void
  onCancelar: () => void
}) {
  const [escrito, setEscrito] = useState('')
  const [procesando, setProcesando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const habilitado = !palabraClave || escrito.trim().toUpperCase() === palabraClave.toUpperCase()

  async function confirmar() {
    if (!habilitado) return
    setProcesando(true)
    setError(null)
    try {
      await onConfirmar()
    } catch (e) {
      setProcesando(false)
      setError(e instanceof Error ? e.message : 'No se pudo completar la acción.')
    }
  }

  return (
    <Modal titulo={titulo} onCerrar={onCancelar}>
      <div className="space-y-4">
        <div className="text-sm leading-relaxed text-ink-secondary">{mensaje}</div>

        {palabraClave && (
          <div>
            <label className="label-faint mb-1.5 block">
              Escribe {palabraClave} para confirmar
            </label>
            <input
              className={inputBase}
              value={escrito}
              autoFocus
              placeholder={palabraClave}
              onChange={(e) => setEscrito(e.target.value)}
            />
          </div>
        )}

        {error && <ErrorMsg>{error}</ErrorMsg>}

        <div className="flex justify-end gap-2">
          <button className="btn-secundario" onClick={onCancelar} disabled={procesando}>
            Cancelar
          </button>
          <button
            className={destructivo ? 'btn-peligro-fill' : 'btn-primario'}
            onClick={confirmar}
            disabled={!habilitado || procesando}
          >
            {procesando ? 'Procesando…' : textoConfirmar}
          </button>
        </div>
      </div>
    </Modal>
  )
}

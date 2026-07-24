import { useState, type FormEvent } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { subirComprobante } from '../lib/data'
import { actualizarAbono } from '../lib/mutations'
import { cop, hoyISO } from '../lib/format'
import type { AbonoFull } from '../lib/data'
import type { Medio } from '../lib/types'
import { Card, ErrorMsg, MoneyInput, btnPrimario, btnSecundario, inputBase } from './ui'

export interface OpcionPedido {
  id: string
  label: string
  saldo: number
}

const medios: { id: Medio; label: string }[] = [
  { id: 'bancolombia', label: 'Bancolombia' },
  { id: 'nequi', label: 'Nequi' },
  { id: 'efectivo', label: 'Efectivo' },
]

export default function AbonoForm({
  opciones,
  pedidoFijo,
  abonoExistente,
  onGuardado,
  onCancelar,
}: {
  opciones: OpcionPedido[]
  pedidoFijo?: string
  abonoExistente?: AbonoFull
  onGuardado: () => void
  onCancelar: () => void
}) {
  const { socio } = useAuth()
  const editando = Boolean(abonoExistente)
  const [pedidoId, setPedidoId] = useState(pedidoFijo ?? abonoExistente?.pedido_id ?? '')
  const [monto, setMonto] = useState(abonoExistente?.monto ?? 0)
  const [medio, setMedio] = useState<Medio>(abonoExistente?.medio ?? 'nequi')
  const [fecha, setFecha] = useState(abonoExistente?.fecha ?? hoyISO())
  const [archivo, setArchivo] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const elegido = opciones.find((o) => o.id === pedidoId)
  // Al editar, el saldo del pedido ya descuenta este abono; el tope real
  // es el saldo actual + lo que este abono ya aportaba.
  const topeMonto = elegido ? elegido.saldo + (abonoExistente?.monto ?? 0) : Infinity

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (!pedidoId) return setError('Elige el pedido al que pertenece el abono.')
    if (monto <= 0) return setError('Escribe el monto del abono.')
    if (monto > topeMonto)
      return setError(`El abono supera el saldo del pedido (${cop(topeMonto)}).`)

    setGuardando(true)
    try {
      let path: string | null | undefined
      if (archivo) path = await subirComprobante(pedidoId, archivo)

      if (editando) {
        await actualizarAbono(abonoExistente!.id, {
          monto,
          medio,
          fecha,
          ...(path !== undefined ? { comprobante_path: path } : {}),
        })
      } else {
        const { error: e1 } = await supabase.from('abonos').insert({
          pedido_id: pedidoId,
          monto,
          medio,
          fecha,
          registrado_por: socio!.id,
          comprobante_path: path ?? null,
        })
        if (e1) throw new Error(e1.message)
      }
      onGuardado()
    } catch (err) {
      setGuardando(false)
      setError(err instanceof Error ? err.message : 'No se pudo guardar el abono.')
    }
  }

  return (
    <Card>
      <h2 className="text-lg font-medium">{editando ? 'Editar abono' : 'Registrar abono'}</h2>
      <form onSubmit={guardar} className="mt-4 space-y-4">
        {!pedidoFijo && !editando && (
          <div>
            <label className="label-faint mb-1.5 block">Pedido</label>
            <select
              className={inputBase}
              value={pedidoId}
              onChange={(e) => setPedidoId(e.target.value)}
            >
              <option value="">Elegir pedido…</option>
              {opciones.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="label-faint mb-1.5 block">Monto</label>
            <MoneyInput value={monto} onChange={setMonto} />
            {elegido && (
              <p className="mt-1 text-xs text-ink-faint">disponible: {cop(topeMonto)}</p>
            )}
          </div>
          <div>
            <label className="label-faint mb-1.5 block">Medio</label>
            <select
              className={inputBase}
              value={medio}
              onChange={(e) => setMedio(e.target.value as Medio)}
            >
              {medios.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label-faint mb-1.5 block">Fecha</label>
            <input
              type="date"
              className={inputBase}
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </div>
        </div>
        <div>
          <label className="label-faint mb-1.5 block">
            Comprobante{editando ? ' (deja vacío para conservar el actual)' : ''}
          </label>
          <input
            type="file"
            accept="image/*,.pdf"
            className="block w-full text-sm text-ink-secondary file:mr-3 file:rounded-full file:border file:border-line file:bg-card file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-card3"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
          />
        </div>
        {error && <ErrorMsg>{error}</ErrorMsg>}
        <div className="flex gap-2">
          <button type="submit" className={btnPrimario} disabled={guardando}>
            {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar abono'}
          </button>
          <button type="button" className={btnSecundario} onClick={onCancelar}>
            Cancelar
          </button>
        </div>
      </form>
    </Card>
  )
}

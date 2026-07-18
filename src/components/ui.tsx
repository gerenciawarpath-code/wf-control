import type { ReactNode } from 'react'
import type { EstadoCuota, EstadoPedido, TipoPedido } from '../lib/types'

/* Clases compartidas (skill wf-control-design) */

export const btnPrimario =
  'inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-accent-hover'

export const btnSecundario =
  'inline-flex items-center justify-center gap-2 rounded-full border border-line bg-card px-5 py-2.5 text-sm font-medium text-ink transition-colors duration-200 hover:bg-page'

export const inputBase =
  'h-10 w-full rounded-control border border-line bg-card px-3 text-sm text-ink transition-[box-shadow,border-color] duration-150 placeholder:text-ink-faint'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-card border border-line bg-card p-5 shadow-card sm:p-6 ${className}`}>
      {children}
    </div>
  )
}

export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`label-faint ${className}`}>{children}</div>
}

export type Tono = 'neutro' | 'azul' | 'verde' | 'rojo' | 'ambar'

const badgeTonos: Record<Tono, string> = {
  neutro: 'bg-black/5 text-ink-secondary',
  azul: 'bg-accent-soft text-accent',
  verde: 'bg-positive-soft text-positive',
  rojo: 'bg-negative-soft text-negative',
  ambar: 'bg-warning-soft text-warning',
}

export function Badge({ tono = 'neutro', children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${badgeTonos[tono]}`}
    >
      {children}
    </span>
  )
}

const puntoTonos: Record<Tono, string> = {
  neutro: 'bg-ink-faint',
  azul: 'bg-accent',
  verde: 'bg-positive',
  rojo: 'bg-negative',
  ambar: 'bg-warning',
}

export function Punto({ tono }: { tono: Tono }) {
  return <span className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${puntoTonos[tono]}`} />
}

export const tonoEstadoPedido: Record<EstadoPedido, Tono> = {
  pendiente: 'ambar',
  despachado: 'azul',
  entregado: 'verde',
}

export const tonoEstadoCuota: Record<EstadoCuota, Tono> = {
  pendiente: 'neutro',
  parcial: 'ambar',
  vencida: 'rojo',
  pagada: 'verde',
}

export const tonoTipoPedido: Record<TipoPedido, Tono> = {
  contado: 'neutro',
  credito: 'azul',
}

export function MoneyInput({
  value,
  onChange,
  placeholder = '120.000',
  className = '',
}: {
  value: number
  onChange: (n: number) => void
  placeholder?: string
  className?: string
}) {
  return (
    <input
      inputMode="numeric"
      className={`${inputBase} ${className}`}
      value={value ? value.toLocaleString('es-CO') : ''}
      onChange={(e) => {
        const n = parseInt(e.target.value.replace(/\D/g, ''), 10)
        onChange(Number.isNaN(n) ? 0 : n)
      }}
      placeholder={placeholder}
    />
  )
}

export function Cargando() {
  return <div className="py-16 text-center text-sm text-ink-faint">Cargando…</div>
}

export function Vacio({ children }: { children: ReactNode }) {
  return <div className="py-10 text-center text-sm text-ink-faint">{children}</div>
}

export function ErrorMsg({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-control bg-negative-soft px-3 py-2 text-sm text-negative">{children}</div>
  )
}

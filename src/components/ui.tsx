import type { ReactNode } from 'react'
import type { EstadoCuota, EstadoPedido, TipoPedido } from '../lib/types'

/* Clases compartidas — implementadas en index.css (skill wf-control-design v2) */

export const btnPrimario = 'btn-primario'
export const btnSecundario = 'btn-secundario'
export const btnTerciario = 'btn-terciario'
export const inputBase = 'input-base'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`card ${className}`}>{children}</div>
}

export function CardHero({
  children,
  className = '',
}: {
  children: ReactNode
  className?: string
}) {
  return <div className={`card-hero ${className}`}>{children}</div>
}

export function Label({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`label-faint ${className}`}>{children}</div>
}

export type Tono = 'neutro' | 'azul' | 'verde' | 'rojo' | 'ambar'

const badgeTonos: Record<Tono, string> = {
  neutro: 'bg-card3 text-ink-secondary',
  azul: 'bg-accent-soft text-accent',
  verde: 'bg-positive-soft text-positive',
  rojo: 'bg-negative-soft text-negative',
  ambar: 'bg-warning-soft text-warning',
}

export function Badge({ tono = 'neutro', children }: { tono?: Tono; children: ReactNode }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badgeTonos[tono]}`}
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
  return <span className={`inline-block h-2 w-2 shrink-0 rounded-full ${puntoTonos[tono]}`} />
}

export const tonoEstadoPedido: Record<EstadoPedido, Tono> = {
  pendiente: 'ambar',
  despachado: 'azul',
  entregado: 'verde',
}

/* v2: parcial pasa a azul (brand-tint); pendiente queda neutro */
export const tonoEstadoCuota: Record<EstadoCuota, Tono> = {
  pendiente: 'neutro',
  parcial: 'azul',
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
  placeholder = 'Ej: 120.000',
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
      className={`input-base ${className}`}
      value={value ? value.toLocaleString('es-CO') : ''}
      onChange={(e) => {
        const n = parseInt(e.target.value.replace(/\D/g, ''), 10)
        onChange(Number.isNaN(n) ? 0 : n)
      }}
      placeholder={placeholder}
    />
  )
}

/* Loading: skeletons con la forma del contenido, nunca pantalla vacía */
export function Cargando() {
  return (
    <div className="card space-y-3" aria-busy="true" aria-label="Cargando">
      <div className="skeleton h-3 w-24" />
      <div className="skeleton h-10 w-48" />
      <div className="skeleton h-4 w-full" />
      <div className="skeleton h-4 w-2/3" />
    </div>
  )
}

export function Vacio({
  children,
  detalle,
  icono,
}: {
  children: ReactNode
  detalle?: string
  icono?: ReactNode
}) {
  return (
    <div className="py-10 text-center">
      {icono && <div className="mb-3 flex justify-center text-ink-faint">{icono}</div>}
      <div className="text-sm font-medium text-ink-secondary">{children}</div>
      {detalle && <div className="mt-1 text-sm text-ink-faint">{detalle}</div>}
    </div>
  )
}

export function ErrorMsg({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-control bg-negative-soft px-3 py-2 text-sm text-negative">{children}</div>
  )
}

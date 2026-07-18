/** Pesos colombianos: $1.920.000 (sin decimales) */
export function cop(n: number): string {
  return '$' + Math.round(n).toLocaleString('es-CO')
}

/** Fecha local de hoy en formato AAAA-MM-DD (sin líos de zona horaria) */
export function hoyISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Convierte 'AAAA-MM-DD' a Date local (evita el corrimiento de un día por UTC) */
export function parseFecha(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function fmtFecha(iso: string): string {
  return parseFecha(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

export function fmtFechaLarga(iso: string): string {
  return parseFecha(iso).toLocaleDateString('es-CO', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** Días completos desde una fecha hasta hoy (positivo = ya pasó) */
export function diasDesde(iso: string): number {
  const hoy = parseFecha(hoyISO()).getTime()
  return Math.round((hoy - parseFecha(iso).getTime()) / 86_400_000)
}

/** Suma días a una fecha ISO y devuelve ISO */
export function sumarDias(iso: string, dias: number): string {
  const d = parseFecha(iso)
  d.setDate(d.getDate() + dias)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

import { supabase } from './supabase'
import { getClientes, getCuotasDetalle } from './data'
import { hoyISO, sumarDias } from './format'
import type { PedidoTotales } from './types'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

function mesKey(iso: string): string {
  return iso.slice(0, 7)
}

export function mesLabel(key: string): string {
  const [y, m] = key.split('-').map(Number)
  return `${MESES[m - 1]} ${y}`
}

function mesAnterior(key: string): string {
  let [y, m] = key.split('-').map(Number)
  m--
  if (m === 0) {
    m = 12
    y--
  }
  return `${y}-${String(m).padStart(2, '0')}`
}

export interface MesKpi {
  key: string
  label: string
  clientesNuevos: number
  ventas: number
  /** % vs el mes anterior; null cuando el mes anterior no tuvo ventas */
  crecimiento: number | null
}

export interface Kpis {
  ventasMesActual: number
  crecimientoMesActual: number | null
  clientesNuevosMesActual: number
  proyectadoSemana: number
  proyectadoMes: number
  vencidoPendiente: number
  meses: MesKpi[]
}

export async function getKpis(): Promise<Kpis> {
  const [totalesRes, clientes, cuotas] = await Promise.all([
    supabase.from('pedido_totales').select('*'),
    getClientes(),
    getCuotasDetalle(),
  ])
  if (totalesRes.error) throw new Error(totalesRes.error.message)
  const totales = (totalesRes.data ?? []) as PedidoTotales[]

  const hoy = hoyISO()
  const mesActual = mesKey(hoy)

  // Ventas por mes (valor total de los pedidos, por fecha del pedido)
  const ventasPorMes = new Map<string, number>()
  for (const t of totales) {
    const k = mesKey(t.fecha)
    ventasPorMes.set(k, (ventasPorMes.get(k) ?? 0) + t.valor_total)
  }

  // Clientes nuevos por mes (por fecha de creación)
  const clientesPorMes = new Map<string, number>()
  for (const c of clientes) {
    const k = mesKey(c.created_at)
    clientesPorMes.set(k, (clientesPorMes.get(k) ?? 0) + 1)
  }

  // Últimos 6 meses, del más reciente al más antiguo
  const meses: MesKpi[] = []
  let key = mesActual
  for (let i = 0; i < 6; i++) {
    const ventas = ventasPorMes.get(key) ?? 0
    const previas = ventasPorMes.get(mesAnterior(key)) ?? 0
    meses.push({
      key,
      label: mesLabel(key),
      clientesNuevos: clientesPorMes.get(key) ?? 0,
      ventas,
      crecimiento: previas > 0 ? ((ventas - previas) / previas) * 100 : null,
    })
    key = mesAnterior(key)
  }

  // Entradas proyectadas: cuotas aún no pagadas, por su fecha de vencimiento
  const finSemana = sumarDias(hoy, 7)
  let proyectadoSemana = 0
  let proyectadoMes = 0
  let vencidoPendiente = 0
  for (const c of cuotas) {
    const pendiente = c.monto - c.pagado
    if (pendiente <= 0) continue
    if (c.fecha < hoy) {
      vencidoPendiente += pendiente
      continue
    }
    if (c.fecha <= finSemana) proyectadoSemana += pendiente
    if (mesKey(c.fecha) === mesActual) proyectadoMes += pendiente
  }

  return {
    ventasMesActual: meses[0].ventas,
    crecimientoMesActual: meses[0].crecimiento,
    clientesNuevosMesActual: meses[0].clientesNuevos,
    proyectadoSemana,
    proyectadoMes,
    vencidoPendiente,
    meses,
  }
}

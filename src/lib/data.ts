import { supabase } from './supabase'
import { diasDesde, hoyISO, sumarDias } from './format'
import type {
  Abono,
  Cliente,
  ClienteDetalle,
  CuotaDetalle,
  EstadoCuota,
  PedidoTotales,
  Producto,
  ResumenGeneral,
  Socio,
} from './types'

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  if (res.data === null) throw new Error('Sin datos')
  return res.data
}

/**
 * Estado de una cuota, calculado con la fecha local del dispositivo
 * (la vista reparte lo pagado; aquí solo se compara contra hoy).
 */
export function estadoCuota(c: { fecha: string; monto: number; pagado: number }): EstadoCuota {
  if (c.pagado >= c.monto) return 'pagada'
  if (c.fecha < hoyISO()) return 'vencida'
  return c.pagado > 0 ? 'parcial' : 'pendiente'
}

export async function getResumen(): Promise<ResumenGeneral> {
  return check(await supabase.from('resumen_general').select('*').single<ResumenGeneral>())
}

export async function getClientes(): Promise<Cliente[]> {
  return check(
    await supabase.from('clientes').select('*').order('nombre').returns<Cliente[]>(),
  )
}

export async function getClientesDetalle(): Promise<ClienteDetalle[]> {
  return check(
    await supabase.from('clientes_detalle').select('*').order('nombre').returns<ClienteDetalle[]>(),
  )
}

export async function getProductos(): Promise<Producto[]> {
  return check(await supabase.from('productos').select('*').order('nombre').returns<Producto[]>())
}

export async function getSocios(): Promise<Socio[]> {
  return check(await supabase.from('socios').select('*').order('nombre').returns<Socio[]>())
}

export interface PedidoFull extends PedidoTotales {
  cliente_nombre: string
  socio_nombre: string
}

interface PedidoNombres {
  id: string
  clientes: { nombre: string } | null
  socios: { nombre: string } | null
}

export async function getPedidosFull(): Promise<PedidoFull[]> {
  const [totales, nombres] = await Promise.all([
    supabase.from('pedido_totales').select('*').returns<PedidoTotales[]>(),
    supabase.from('pedidos').select('id, clientes(nombre), socios(nombre)'),
  ])
  const mapa = new Map(
    (check(nombres) as unknown as PedidoNombres[]).map((p) => [p.id, p]),
  )
  return check(totales)
    .map((t) => ({
      ...t,
      cliente_nombre: mapa.get(t.pedido_id)?.clientes?.nombre ?? '—',
      socio_nombre: mapa.get(t.pedido_id)?.socios?.nombre ?? '—',
    }))
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
}

export async function getCuotasDetalle(pedidoId?: string): Promise<CuotaDetalle[]> {
  let q = supabase.from('cuotas_detalle').select('*')
  if (pedidoId) q = q.eq('pedido_id', pedidoId)
  return check(await q.order('fecha').order('numero').returns<CuotaDetalle[]>())
}

export interface AbonoFull extends Abono {
  cliente_nombre: string
  socio_nombre: string
}

interface AbonoJoin extends Abono {
  pedidos: { clientes: { nombre: string } | null } | null
  socios: { nombre: string } | null
}

export async function getAbonosFull(pedidoId?: string): Promise<AbonoFull[]> {
  let q = supabase.from('abonos').select('*, pedidos(clientes(nombre)), socios(nombre)')
  if (pedidoId) q = q.eq('pedido_id', pedidoId)
  const rows = check(await q.order('fecha', { ascending: false }).order('created_at', { ascending: false })) as unknown as AbonoJoin[]
  return rows.map((a) => ({
    ...a,
    cliente_nombre: a.pedidos?.clientes?.nombre ?? '—',
    socio_nombre: a.socios?.nombre ?? '—',
  }))
}

/* ---------- Pantalla de inicio ---------- */

export interface AtencionItem {
  cliente_id: string
  cliente_nombre: string
  tipo: 'vencida' | 'hoy'
  monto: number
  dias: number
}

export interface RecompraItem {
  cliente_id: string
  cliente_nombre: string
  fecha: string
  /** Días que faltan para que se le acabe el producto (0 = hoy) */
  dias: number
}

export interface Inicio {
  resumen: ResumenGeneral
  atencion: AtencionItem[]
  clientesConDeuda: number
  proximosRecompra: RecompraItem[]
}

export async function getInicio(): Promise<Inicio> {
  const [resumen, cuotas, pedidos, clientes] = await Promise.all([
    getResumen(),
    getCuotasDetalle(),
    supabase.from('pedidos').select('id, cliente_id, clientes(nombre)'),
    getClientesDetalle(),
  ])
  const mapa = new Map(
    (check(pedidos) as unknown as { id: string; cliente_id: string; clientes: { nombre: string } | null }[]).map(
      (p) => [p.id, p],
    ),
  )

  // Agrupa lo vencido y lo que vence hoy por cliente
  const porCliente = new Map<string, { nombre: string; vencido: number; hoy: number; dias: number }>()
  const hoy = hoyISO()
  for (const c of cuotas) {
    const estado = estadoCuota(c)
    if (estado === 'pagada') continue
    const esVencida = estado === 'vencida'
    const venceHoy = c.fecha === hoy
    if (!esVencida && !venceHoy) continue
    const ped = mapa.get(c.pedido_id)
    if (!ped) continue
    const registro = porCliente.get(ped.cliente_id) ?? {
      nombre: ped.clientes?.nombre ?? '—',
      vencido: 0,
      hoy: 0,
      dias: 0,
    }
    const pendiente = c.monto - c.pagado
    if (esVencida) {
      registro.vencido += pendiente
      registro.dias = Math.max(registro.dias, diasDesde(c.fecha))
    } else {
      registro.hoy += pendiente
    }
    porCliente.set(ped.cliente_id, registro)
  }

  const atencion: AtencionItem[] = []
  for (const [clienteId, r] of porCliente) {
    if (r.vencido > 0)
      atencion.push({ cliente_id: clienteId, cliente_nombre: r.nombre, tipo: 'vencida', monto: r.vencido, dias: r.dias })
    if (r.hoy > 0)
      atencion.push({ cliente_id: clienteId, cliente_nombre: r.nombre, tipo: 'hoy', monto: r.hoy, dias: 0 })
  }
  atencion.sort((a, b) => (a.tipo === b.tipo ? b.monto - a.monto : a.tipo === 'vencida' ? -1 : 1))

  // Clientes cuyo último producto se acaba en los próximos 7 días
  const finVentana = sumarDias(hoy, 7)
  const proximosRecompra: RecompraItem[] = clientes
    .filter((c) => c.fecha_recompra && c.fecha_recompra >= hoy && c.fecha_recompra <= finVentana)
    .map((c) => ({
      cliente_id: c.id,
      cliente_nombre: c.nombre,
      fecha: c.fecha_recompra!,
      dias: -diasDesde(c.fecha_recompra!),
    }))
    .sort((a, b) => a.dias - b.dias)

  return {
    resumen,
    atencion,
    clientesConDeuda: clientes.filter((c) => c.deuda > 0).length,
    proximosRecompra,
  }
}

/* ---------- Comprobantes ---------- */

export async function subirComprobante(pedidoId: string, file: File): Promise<string> {
  const limpio = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const path = `${pedidoId}/${Date.now()}-${limpio}`
  const { error } = await supabase.storage.from('comprobantes').upload(path, file)
  if (error) throw new Error('No se pudo subir el comprobante: ' + error.message)
  return path
}

export async function abrirComprobante(path: string) {
  const { data, error } = await supabase.storage.from('comprobantes').createSignedUrl(path, 600)
  if (error || !data) throw new Error('No se pudo abrir el comprobante')
  window.open(data.signedUrl, '_blank')
}

/* ---------- Auditoría ---------- */

export interface AuditoriaFila {
  id: string
  tabla: string
  registro_id: string
  accion: 'editar' | 'eliminar'
  fecha: string
  socio_nombre: string | null
  datos_anteriores: Record<string, unknown> | null
}

export async function getAuditoria(): Promise<AuditoriaFila[]> {
  return check(
    await supabase.from('auditoria_detalle').select('*').limit(100).returns<AuditoriaFila[]>(),
  )
}

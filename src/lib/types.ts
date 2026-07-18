export type EstadoPedido = 'pendiente' | 'despachado' | 'entregado'
export type TipoPedido = 'contado' | 'credito'
export type Medio = 'bancolombia' | 'nequi' | 'efectivo'
export type EstadoCuota = 'pendiente' | 'parcial' | 'pagada' | 'vencida'

export interface Socio {
  id: string
  nombre: string
}

export interface Cliente {
  id: string
  nombre: string
  telefono: string | null
  created_at: string
}

export interface Producto {
  id: string
  nombre: string
  costo: number
  precio_venta: number
  duracion_dias: number
  activo: boolean
}

export interface Pedido {
  id: string
  cliente_id: string
  tomado_por: string
  fecha: string
  estado: EstadoPedido
  tipo: TipoPedido
}

export interface PedidoItem {
  id: string
  pedido_id: string
  producto_id: string
  cantidad: number
  precio_venta: number
  costo: number
}

export interface Cuota {
  id: string
  pedido_id: string
  numero: number
  fecha: string
  monto: number
}

export interface Abono {
  id: string
  pedido_id: string
  monto: number
  medio: Medio
  fecha: string
  registrado_por: string
  comprobante_path: string | null
  created_at: string
}

/* Vistas (las fórmulas del dinero viven en la base de datos) */

export interface PedidoTotales {
  pedido_id: string
  cliente_id: string
  tomado_por: string
  fecha: string
  estado: EstadoPedido
  tipo: TipoPedido
  valor_total: number
  costo_total: number
  recaudado: number
  saldo: number
  costo_recuperado: number
  ganancia_realizada: number
}

export interface CuotaDetalle {
  id: string
  pedido_id: string
  numero: number
  fecha: string
  monto: number
  pagado: number
}

export interface ResumenGeneral {
  caja: number
  ganancia_repartible: number
  reponer: number
  te_deben: number
  pedidos_con_deuda: number
  pedidos_pendientes: number
}

export interface ClienteDetalle {
  id: string
  nombre: string
  telefono: string | null
  created_at: string
  total_comprado: number
  deuda: number
  num_pedidos: number
  fecha_recompra: string | null
}

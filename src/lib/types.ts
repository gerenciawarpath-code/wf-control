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
  foto_url: string | null
  /* Columnas del catálogo web (módulo Catálogo). Opcionales: los productos
     antiguos y las pantallas existentes no las usan. */
  ficha_id?: string | null
  tamano?: string | null
  precio_anterior?: number | null
  visible_catalogo?: boolean
}

export interface Proveedor {
  id: string
  nombre: string
  telefono: string | null
  activo: boolean
}

export interface Compra {
  id: string
  proveedor_id: string
  fecha: string
  medio: Medio
  comprobante_url: string | null
  pedido_id: string | null
  registrado_por: string | null
  nota: string | null
  es_ajuste: boolean
}

export interface CompraItem {
  id: string
  compra_id: string
  producto_id: string | null
  cantidad: number
  costo_unitario: number
  costo_total: number
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
  tiene_compra: boolean
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
  compras_total: number
  comprometido_comprar: number
  pedidos_sin_compra: number
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

/* ---------- Módulo Catálogo (vitrina web) ---------- */

export type CategoriaCatalogo =
  | 'proteinas'
  | 'creatina'
  | 'pre-entreno'
  | 'aminoacidos'
  | 'vitaminas'
  | 'quemadores'
  | 'salud'
  | 'accesorios'

export type ObjetivoCatalogo = 'masa' | 'definicion' | 'energia' | 'recuperacion' | 'salud'

export type EtiquetaCatalogo = 'mas-vendido' | 'recomendado' | 'esencial'

export interface Marca {
  id: string
  nombre: string
  slug: string
  pais: string | null
  logo_url: string | null
  descripcion: string | null
  orden: number
  visible: boolean
}

export interface CatalogoFicha {
  id: string
  slug: string
  nombre: string
  marca_id: string | null
  tipo: CategoriaCatalogo | null
  objetivos: ObjetivoCatalogo[] | null
  resumen: string | null
  descripcion: string | null
  para_quien: string | null
  contiene: string[] | null
  uso: string | null
  por_que: string | null
  consideraciones: string[] | null
  sabores: string[] | null
  estimulante: boolean
  etiqueta: EtiquetaCatalogo | null
  nuevo: boolean
  destacado: boolean
  foto_url: string | null
  fotos: string[] | null
  orden: number
  visible: boolean
}

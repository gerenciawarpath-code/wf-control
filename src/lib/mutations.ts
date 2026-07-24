import { supabase } from './supabase'
import type { EstadoPedido, Medio } from './types'

function ok(error: { message: string } | null) {
  if (error) throw new Error(error.message)
}

/* ---------- Clientes ---------- */

export async function contarPedidosCliente(clienteId: string): Promise<number> {
  const { count, error } = await supabase
    .from('pedidos')
    .select('id', { count: 'exact', head: true })
    .eq('cliente_id', clienteId)
  ok(error)
  return count ?? 0
}

export async function eliminarCliente(clienteId: string): Promise<void> {
  const n = await contarPedidosCliente(clienteId)
  if (n > 0) {
    throw new Error(
      `No se puede eliminar: tiene ${n} ${n === 1 ? 'pedido' : 'pedidos'}. Elimina o transfiere sus pedidos primero.`,
    )
  }
  ok((await supabase.from('clientes').delete().eq('id', clienteId)).error)
}

/* ---------- Productos ---------- */

export async function productoUsado(productoId: string): Promise<number> {
  const { count, error } = await supabase
    .from('pedido_items')
    .select('id', { count: 'exact', head: true })
    .eq('producto_id', productoId)
  ok(error)
  return count ?? 0
}

export async function toggleProductoActivo(productoId: string, activo: boolean): Promise<void> {
  ok((await supabase.from('productos').update({ activo }).eq('id', productoId)).error)
}

export async function eliminarProducto(productoId: string): Promise<void> {
  const n = await productoUsado(productoId)
  if (n > 0) {
    throw new Error(
      `No se puede eliminar: este producto ya se usó en ${n} ${n === 1 ? 'pedido' : 'pedidos'}. Desactívalo en su lugar para que no aparezca en pedidos nuevos.`,
    )
  }
  ok((await supabase.from('productos').delete().eq('id', productoId)).error)
}

/* ---------- Pedidos ---------- */

export async function actualizarPedidoCabecera(
  pedidoId: string,
  cambios: { estado?: EstadoPedido; fecha?: string; cliente_id?: string },
): Promise<void> {
  ok((await supabase.from('pedidos').update(cambios).eq('id', pedidoId)).error)
}

export interface ItemEditable {
  id?: string // presente = existente; ausente = nuevo
  producto_id: string
  cantidad: number
  precio_venta: number
  costo: number
}

/**
 * Sincroniza los renglones del pedido con la lista dada:
 * actualiza los existentes, inserta los nuevos y borra los quitados.
 * El costo se conserva congelado (no se toca al editar cantidad/precio).
 */
export async function sincronizarItems(
  pedidoId: string,
  nuevos: ItemEditable[],
  idsOriginales: string[],
): Promise<void> {
  const idsPresentes = new Set(nuevos.filter((i) => i.id).map((i) => i.id))
  const aBorrar = idsOriginales.filter((id) => !idsPresentes.has(id))

  for (const it of nuevos) {
    if (it.id) {
      ok(
        (
          await supabase
            .from('pedido_items')
            .update({ cantidad: it.cantidad, precio_venta: it.precio_venta })
            .eq('id', it.id)
        ).error,
      )
    } else {
      ok(
        (
          await supabase.from('pedido_items').insert({
            pedido_id: pedidoId,
            producto_id: it.producto_id,
            cantidad: it.cantidad,
            precio_venta: it.precio_venta,
            costo: it.costo,
          })
        ).error,
      )
    }
  }
  for (const id of aBorrar) {
    ok((await supabase.from('pedido_items').delete().eq('id', id)).error)
  }
}

export async function eliminarPedido(pedidoId: string): Promise<void> {
  // La cascada borra pedido_items, cuotas y abonos; el trigger audita cada uno.
  ok((await supabase.from('pedidos').delete().eq('id', pedidoId)).error)
}

/* ---------- Cuotas ---------- */

export interface CuotaEditable {
  id?: string
  fecha: string
  monto: number
}

/** Reemplaza el plan de cuotas. La suma debe validarse antes en la UI. */
export async function sincronizarCuotas(
  pedidoId: string,
  cuotas: CuotaEditable[],
  idsOriginales: string[],
): Promise<void> {
  const idsPresentes = new Set(cuotas.filter((c) => c.id).map((c) => c.id))
  const aBorrar = idsOriginales.filter((id) => !idsPresentes.has(id))

  // Se borra primero lo quitado para no chocar con el unique(pedido_id, numero)
  for (const id of aBorrar) {
    ok((await supabase.from('cuotas').delete().eq('id', id)).error)
  }
  let numero = 1
  for (const c of cuotas) {
    if (c.id) {
      ok(
        (
          await supabase
            .from('cuotas')
            .update({ numero, fecha: c.fecha, monto: c.monto })
            .eq('id', c.id)
        ).error,
      )
    } else {
      ok(
        (
          await supabase
            .from('cuotas')
            .insert({ pedido_id: pedidoId, numero, fecha: c.fecha, monto: c.monto })
        ).error,
      )
    }
    numero++
  }
}

/* ---------- Abonos ---------- */

export async function actualizarAbono(
  abonoId: string,
  cambios: { monto?: number; medio?: Medio; fecha?: string; comprobante_path?: string | null },
): Promise<void> {
  ok((await supabase.from('abonos').update(cambios).eq('id', abonoId)).error)
}

export async function eliminarAbono(abonoId: string): Promise<void> {
  ok((await supabase.from('abonos').delete().eq('id', abonoId)).error)
}

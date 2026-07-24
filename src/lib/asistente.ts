import { supabase } from './supabase'

export type MotivoMensaje = 'cobro' | 'recompra' | 'promo'

export type TipoRespuesta =
  | 'clientes_deuda'
  | 'pagos_hoy'
  | 'vencidos'
  | 'recompra'
  | 'general'

export interface ItemRespuesta {
  cliente: string
  monto: number
  estado?: string
}

export interface RespuestaEstructurada {
  summary: string
  highlight?: string
  type: TipoRespuesta
  items?: ItemRespuesta[]
  alert?: string
  cta?: { label: string; action: string }
}

/** Discriminada: estructurada (JSON del modelo) o texto plano (fallback). */
export type RespuestaAsistente =
  | { clase: 'estructurada'; data: RespuestaEstructurada }
  | { clase: 'texto'; texto: string }

async function invocar(body: Record<string, unknown>): Promise<string> {
  const { data, error } = await supabase.functions.invoke('asistente', { body })
  if (error) {
    throw new Error(
      'El asistente no respondió. Verifica que la función "asistente" esté desplegada en Supabase y tenga su clave de API configurada.',
    )
  }
  if (data?.error) throw new Error(data.error)
  return (data?.respuesta as string) ?? ''
}

/** Quita cercos ```json ... ``` que a veces envuelve el modelo. */
function limpiarCercos(texto: string): string {
  const m = texto.trim().match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i)
  return m ? m[1].trim() : texto.trim()
}

/**
 * Pregunta libre. Intenta interpretar la respuesta como JSON estructurado;
 * si no es JSON válido con `summary`, la trata como prosa (fallback).
 */
export async function preguntarAsistente(pregunta: string): Promise<RespuestaAsistente> {
  const bruto = await invocar({ tipo: 'pregunta', pregunta })
  const limpio = limpiarCercos(bruto)
  try {
    const obj = JSON.parse(limpio)
    if (obj && typeof obj.summary === 'string' && typeof obj.type === 'string') {
      return { clase: 'estructurada', data: obj as RespuestaEstructurada }
    }
  } catch {
    // no era JSON: cae a texto
  }
  return { clase: 'texto', texto: bruto }
}

/** Redacta un mensaje de WhatsApp personalizado para un cliente */
export function generarMensaje(clienteId: string, motivo: MotivoMensaje): Promise<string> {
  return invocar({ tipo: 'mensaje', cliente_id: clienteId, motivo })
}

/** Link para abrir WhatsApp con el mensaje listo para enviar */
export function linkWhatsApp(telefono: string, mensaje: string): string {
  return `https://wa.me/57${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
}

import { supabase } from './supabase'

export type MotivoMensaje = 'cobro' | 'recompra' | 'promo'

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

/** Pregunta libre sobre el negocio ("¿quién paga hoy?", "¿cuánto nos deben?") */
export function preguntarAsistente(pregunta: string): Promise<string> {
  return invocar({ tipo: 'pregunta', pregunta })
}

/** Redacta un mensaje de WhatsApp personalizado para un cliente */
export function generarMensaje(clienteId: string, motivo: MotivoMensaje): Promise<string> {
  return invocar({ tipo: 'mensaje', cliente_id: clienteId, motivo })
}

/** Link para abrir WhatsApp con el mensaje listo para enviar */
export function linkWhatsApp(telefono: string, mensaje: string): string {
  return `https://wa.me/57${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensaje)}`
}

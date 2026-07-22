// WF Control — Edge Function "asistente"
// Corre en Supabase (Deno). La clave de Anthropic vive aquí como secreto,
// nunca en el navegador. Solo responde a socios con sesión iniciada (RLS).
import Anthropic from 'npm:@anthropic-ai/sdk'
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  })
}

/** Fecha de hoy en Colombia, formato AAAA-MM-DD */
function hoyBogota(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: 'America/Bogota' })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Sin autorización' }, 401)

    // Cliente de Supabase con la sesión del socio que llama:
    // RLS aplica igual que en la app.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )

    const { data: auth } = await supabase.auth.getUser()
    if (!auth?.user) return json({ error: 'Solo los socios pueden usar el asistente' }, 401)

    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!apiKey) {
      return json(
        { error: 'Falta el secreto ANTHROPIC_API_KEY en la configuración de la función' },
        500,
      )
    }

    const body = await req.json()
    const hoy = hoyBogota()

    // ---- Datos reales (las vistas ya traen las fórmulas del dinero) ----
    const [resumen, clientes, cuotas, pedidos, porMedio] = await Promise.all([
      supabase.from('resumen_general').select('*').single(),
      supabase.from('clientes_detalle').select('*'),
      supabase.from('cuotas_detalle').select('*'),
      supabase.from('pedido_totales').select('*'),
      supabase.from('caja_por_medio').select('*'),
    ])

    const nombrePorCliente = new Map(
      (clientes.data ?? []).map((c: { id: string; nombre: string }) => [c.id, c.nombre]),
    )
    const clientePorPedido = new Map(
      (pedidos.data ?? []).map((p: { pedido_id: string; cliente_id: string }) => [
        p.pedido_id,
        p.cliente_id,
      ]),
    )

    // Cuotas sin pagar, con estado calculado contra la fecha de Colombia
    const cuotasPendientes = (cuotas.data ?? [])
      .map((c: { pedido_id: string; fecha: string; monto: number; pagado: number }) => {
        const clienteId = clientePorPedido.get(c.pedido_id)
        const estado =
          c.pagado >= c.monto
            ? 'pagada'
            : c.fecha < hoy
              ? 'vencida'
              : c.fecha === hoy
                ? 'vence_hoy'
                : c.pagado > 0
                  ? 'parcial'
                  : 'pendiente'
        return {
          cliente: nombrePorCliente.get(clienteId) ?? 'desconocido',
          fecha: c.fecha,
          monto: c.monto,
          pendiente: c.monto - c.pagado,
          estado,
        }
      })
      .filter((c) => c.estado !== 'pagada')

    const anthropic = new Anthropic({ apiKey })

    // ---- Modo 1: redactar un mensaje de WhatsApp para un cliente ----
    if (body.tipo === 'mensaje') {
      const cliente = (clientes.data ?? []).find(
        (c: { id: string }) => c.id === body.cliente_id,
      )
      if (!cliente) return json({ error: 'Cliente no encontrado' }, 404)

      const contexto = {
        hoy,
        cliente: {
          nombre: cliente.nombre,
          deuda: cliente.deuda,
          se_le_acaba_el_producto: cliente.fecha_recompra,
        },
        cuotas_pendientes: cuotasPendientes.filter((c) => c.cliente === cliente.nombre),
      }
      const motivos: Record<string, string> = {
        cobro: 'recordarle con amabilidad el pago pendiente (cuota vencida o próxima a vencer)',
        recompra: 'avisarle que su producto está por acabarse e invitarlo a recomprar',
        promo: 'contarle que hay promociones en la tienda e invitarlo a comprar',
      }

      const respuesta = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system:
          'Redactas mensajes de WhatsApp para los clientes de Warpath Forge, una tienda colombiana de suplementos deportivos. Escribe UN solo mensaje corto (2 a 4 frases), cálido, cercano y profesional, en español colombiano, tuteando. Usa únicamente los datos entregados: nunca inventes montos, fechas ni productos. Formatea el dinero como $1.234.567. Si el motivo es un cobro y hay cuotas pendientes, menciona el monto pendiente sin sonar agresivo. Saluda por el primer nombre. Sin hashtags ni firmas largas. Devuelve SOLO el texto del mensaje, sin comillas ni explicaciones.',
        messages: [
          {
            role: 'user',
            content: `Datos del cliente:\n${JSON.stringify(contexto)}\n\nMotivo del mensaje: ${motivos[body.motivo] ?? String(body.motivo)}`,
          },
        ],
      })
      const texto = respuesta.content.find((b) => b.type === 'text')?.text ?? ''
      return json({ respuesta: texto })
    }

    // ---- Modo 2: pregunta libre sobre el negocio ----
    const contexto = {
      hoy,
      resumen: resumen.data,
      caja_por_medio: porMedio.data,
      clientes: (clientes.data ?? []).map(
        (c: {
          nombre: string
          telefono: string | null
          deuda: number
          total_comprado: number
          fecha_recompra: string | null
        }) => ({
          nombre: c.nombre,
          telefono: c.telefono,
          deuda: c.deuda,
          total_comprado: c.total_comprado,
          se_le_acaba_el_producto: c.fecha_recompra,
        }),
      ),
      cuotas_no_pagadas: cuotasPendientes,
    }

    const respuesta = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system:
        'Eres el asistente interno de WF Control, el centro de control de Warpath Forge (tienda colombiana de suplementos deportivos). Respondes preguntas de los tres socios sobre su negocio usando ÚNICAMENTE los datos entregados en la consulta; el campo "hoy" trae la fecha actual de Colombia. Responde en español, corto y directo, con nombres y montos concretos. Formatea el dinero como $1.234.567 (pesos colombianos, sin decimales). Si la respuesta no está en los datos, dilo claramente en vez de inventar.',
      messages: [
        {
          role: 'user',
          content: `Datos del negocio:\n${JSON.stringify(contexto)}\n\nPregunta: ${String(body.pregunta ?? '')}`,
        },
      ],
    })
    const texto = respuesta.content.find((b) => b.type === 'text')?.text ?? ''
    return json({ respuesta: texto })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Error inesperado' }, 500)
  }
})

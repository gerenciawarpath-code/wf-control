// WF Control — Edge Function "asistente"
// Corre en Supabase (Deno). La clave de Anthropic vive aquí como secreto,
// nunca en el navegador. Solo responde a socios con sesión iniciada (RLS).
import Anthropic from 'npm:@anthropic-ai/sdk@0.65.0'
import { createClient } from 'npm:@supabase/supabase-js@2'

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Cuántos datos enviamos a Anthropic por pregunta. Sin límite, el contexto
// crece con el negocio y la API rechaza la petición con 400 por tamaño.
const MAX_CLIENTES = 50
const MAX_CUOTAS = 50

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

interface ClienteDetalle {
  id: string
  nombre: string
  telefono: string | null
  deuda: number
  total_comprado: number
  fecha_recompra: string | null
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

    // .trim() por si al pegar el secreto quedó un espacio o salto de línea:
    // eso produce un 401 inmediato de Anthropic (~1s), sin timeout.
    const apiKey = Deno.env.get('ANTHROPIC_API_KEY')?.trim()
    if (!apiKey) {
      return json(
        { error: 'Falta el secreto ANTHROPIC_API_KEY en la configuración de la función' },
        500,
      )
    }

    // Cuerpo de la petición: si llega vacío o mal formado, req.json() lanza.
    let body: { tipo?: string; cliente_id?: string; motivo?: string; pregunta?: string }
    try {
      body = await req.json()
    } catch {
      return json(
        { error: 'El cuerpo de la petición está vacío o mal formado (se esperaba JSON)' },
        400,
      )
    }
    if (!body || typeof body !== 'object') {
      return json({ error: 'El cuerpo de la petición debe ser un objeto JSON' }, 400)
    }

    const hoy = hoyBogota()

    // ---- Datos reales (las vistas ya traen las fórmulas del dinero) ----
    const [resumen, clientes, cuotas, pedidos, porMedio] = await Promise.all([
      supabase.from('resumen_general').select('*').single(),
      supabase.from('clientes_detalle').select('*'),
      supabase.from('cuotas_detalle').select('*'),
      supabase.from('pedido_totales').select('*'),
      supabase.from('caja_por_medio').select('*'),
    ])

    // Validar CADA consulta: si una falla, no le mandamos datos vacíos a
    // Anthropic — devolvemos un error claro indicando cuál falló.
    // Ojo: .single() en resumen_general pone error si devuelve 0 o >1 filas.
    const errores: string[] = []
    if (resumen.error) errores.push(`resumen_general: ${resumen.error.message}`)
    if (clientes.error) errores.push(`clientes_detalle: ${clientes.error.message}`)
    if (cuotas.error) errores.push(`cuotas_detalle: ${cuotas.error.message}`)
    if (pedidos.error) errores.push(`pedido_totales: ${pedidos.error.message}`)
    if (porMedio.error) errores.push(`caja_por_medio: ${porMedio.error.message}`)
    if (errores.length > 0) {
      console.error('[asistente] Consultas a Supabase fallaron:', errores)
      return json({ error: `No se pudieron leer los datos: ${errores.join('; ')}` }, 500)
    }
    if (!resumen.data) {
      console.error('[asistente] resumen_general no devolvió exactamente una fila')
      return json({ error: 'resumen_general no devolvió exactamente una fila' }, 500)
    }

    const clientesData = (clientes.data ?? []) as ClienteDetalle[]

    const nombrePorCliente = new Map(clientesData.map((c) => [c.id, c.nombre]))
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
      const cliente = clientesData.find((c) => c.id === body.cliente_id)
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
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system:
          'Redactas mensajes de WhatsApp para los clientes de Warpath Forge, una tienda colombiana de suplementos deportivos. Escribe UN solo mensaje corto (2 a 4 frases), cálido, cercano y profesional, en español colombiano, tuteando. Usa únicamente los datos entregados: nunca inventes montos, fechas ni productos. Formatea el dinero como $1.234.567. Si el motivo es un cobro y hay cuotas pendientes, menciona el monto pendiente sin sonar agresivo. Saluda por el primer nombre. Sin hashtags ni firmas largas. Devuelve SOLO el texto del mensaje, sin comillas ni explicaciones.',
        messages: [
          {
            role: 'user',
            content: `Datos del cliente:\n${JSON.stringify(contexto)}\n\nMotivo del mensaje: ${motivos[body.motivo ?? ''] ?? String(body.motivo)}`,
          },
        ],
      })
      const texto = respuesta.content.find((b) => b.type === 'text')?.text ?? ''
      return json({ respuesta: texto })
    }

    // ---- Modo 2: pregunta libre sobre el negocio ----
    // Recortamos el contexto para no pasarnos del límite de la API:
    // clientes por relevancia (primero los que deben), cuotas por urgencia.
    const clientesRelevantes = [...clientesData]
      .sort((a, b) => {
        const da = a.deuda ?? 0
        const db = b.deuda ?? 0
        if (db !== da) return db - da // primero mayor deuda
        return (b.total_comprado ?? 0) - (a.total_comprado ?? 0)
      })
      .slice(0, MAX_CLIENTES)

    const cuotasUrgentes = [...cuotasPendientes]
      .sort((a, b) => a.fecha.localeCompare(b.fecha)) // más antiguas/vencidas primero
      .slice(0, MAX_CUOTAS)

    const contexto = {
      hoy,
      resumen: resumen.data,
      caja_por_medio: porMedio.data,
      // Sin teléfono: no se necesita para responder preguntas del negocio.
      clientes: clientesRelevantes.map((c) => ({
        nombre: c.nombre,
        deuda: c.deuda,
        total_comprado: c.total_comprado,
        se_le_acaba_el_producto: c.fecha_recompra,
      })),
      cuotas_no_pagadas: cuotasUrgentes,
    }

    const respuesta = await anthropic.messages.create({
      model: 'claude-sonnet-5',
      max_tokens: 1024,
      system: `Eres el asistente interno de WF Control, el centro de control de Warpath Forge (tienda colombiana de suplementos deportivos). Respondes preguntas de los tres socios usando ÚNICAMENTE los datos entregados; el campo "hoy" trae la fecha actual de Colombia.

Responde SIEMPRE con un único objeto JSON válido, sin texto antes ni después y SIN cercos de código. Esquema:
{
  "summary": string,        // 1 frase directa en español con la conclusión y la cifra clave. Sentence case.
  "highlight": string,      // (opcional) la cifra clave TAL CUAL aparece en summary, ej "$1.015.000"
  "type": string,           // uno de: "clientes_deuda" | "pagos_hoy" | "vencidos" | "recompra" | "general"
  "items": [                // (opcional) filas para la tabla; omite si no aplica
    { "cliente": string, "monto": number, "estado": string }
  ],
  "alert": string,          // (opcional) SOLO si hay algo que vence hoy o está vencido. Ej "Ojo hoy: ..."
  "cta": { "label": string, "action": string }  // (opcional) ruta interna, ej {"label":"Ver deudores","action":"/clientes"}
}

Reglas:
- "monto" es un número ENTERO de pesos, sin formato ni símbolos (ej 285000). El frontend lo formatea.
- "estado" de cada item: "vencido" si su cuota ya pasó sin pagar, "vence_hoy" si vence hoy, "al_dia" si está al día, "pendiente" en otro caso.
- Ordena items de mayor a menor monto y muestra máximo 12.
- Elige "type" según la pregunta: deudas totales -> "clientes_deuda"; quién paga hoy -> "pagos_hoy"; vencidos -> "vencidos"; recompra -> "recompra"; cualquier otra -> "general".
- Para "type":"general" puedes devolver solo "summary" (y "alert" si aplica), sin items.
- Nunca inventes datos: si la respuesta no está en los datos, dilo en "summary" con type "general".
- Nunca uses pipes de tabla ni markdown en los textos.`,
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
    // Logging real: mensaje + stack + detalle de Anthropic (status y body del
    // SDK) para que los logs de Supabase muestren la causa exacta, no solo
    // "booted"/"shutdown".
    const err = e as {
      message?: string
      stack?: string
      name?: string
      status?: number
      error?: unknown
      response?: { status?: number; body?: unknown }
      headers?: unknown
    }
    const anthropicStatus = err.status ?? err.response?.status
    const anthropicBody = err.error ?? err.response?.body
    console.error('[asistente] Error no controlado:', {
      name: err.name,
      message: err.message,
      anthropic_status: anthropicStatus,
      anthropic_body: anthropicBody,
      stack: err.stack,
    })
    return json({ error: err.message ?? 'Error inesperado' }, 500)
  }
})

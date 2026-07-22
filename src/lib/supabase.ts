import { createClient } from '@supabase/supabase-js'

// Lee SIEMPRE de import.meta.env (así lo expone Vite). Nunca process.env:
// en el navegador no existe y rompería la app.
// .trim() para tolerar un espacio o salto de línea pegado por accidente en Vercel.
const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim()
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim()

/**
 * Si el build no recibió las variables (típico en un deploy sin Environment
 * Variables), mostramos un mensaje claro en vez de una pantalla en blanco.
 */
export const configOk = url.length > 0 && key.length > 0
export const configFaltante = [
  !url && 'VITE_SUPABASE_URL',
  !key && 'VITE_SUPABASE_ANON_KEY',
].filter(Boolean) as string[]

// Diagnóstico temporal — quitar cuando producción cargue bien.
// (La clave anon es pública por diseño; no hay secreto expuesto aquí.)
if (!configOk) {
  console.log('[WF Control] Diagnóstico Supabase:', {
    url_presente: Boolean(url),
    url_valor: url,
    key_presente: Boolean(key),
    key_largo: key.length,
    modo: import.meta.env.MODE,
  })
}

// Usar || (no ??) para que un valor vacío TAMBIÉN caiga al placeholder:
// así createClient nunca recibe '' y nunca lanza "supabaseUrl is required"
// al cargar el módulo. La app entonces alcanza a mostrar la pantalla de aviso.
export const supabase = createClient(url || 'http://placeholder.invalid', key || 'placeholder')

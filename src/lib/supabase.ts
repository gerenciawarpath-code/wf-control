import { createClient } from '@supabase/supabase-js'

// Valores públicos de conexión de WF Control.
// La URL y la clave "publishable" NO son secretas: viajan en el bundle del
// navegador por diseño y el acceso real lo protege RLS (solo los 3 socios
// logueados). Se dejan como respaldo para no depender de las variables de
// entorno de Vercel, que no estaban llegando al build.
const URL_POR_DEFECTO = 'https://tidyoslnyyetevkxfwzi.supabase.co'
const KEY_POR_DEFECTO = 'sb_publishable_B6yRW19vQ_lFOsShSABBBg_aiAh2b0F'

// Usa la variable de entorno si existe; si no, cae al valor por defecto.
// .trim() por si en Vercel se coló un espacio o salto de línea.
const url = (import.meta.env.VITE_SUPABASE_URL ?? '').trim() || URL_POR_DEFECTO
const key = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim() || KEY_POR_DEFECTO

export const supabase = createClient(url, key)

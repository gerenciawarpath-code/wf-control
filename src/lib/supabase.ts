import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Si el build no recibió las variables (típico en un deploy sin Environment
 * Variables), mostramos un mensaje claro en vez de una pantalla en blanco.
 */
export const configOk = Boolean(url && key)
export const configFaltante = [
  !url && 'VITE_SUPABASE_URL',
  !key && 'VITE_SUPABASE_ANON_KEY',
].filter(Boolean) as string[]

export const supabase = createClient(url ?? 'http://placeholder.invalid', key ?? 'placeholder')

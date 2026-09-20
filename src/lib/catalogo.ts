import { supabase } from './supabase'
import { redimensionar } from './data'
import type {
  CatalogoFicha,
  CategoriaCatalogo,
  EtiquetaCatalogo,
  Marca,
  ObjetivoCatalogo,
  Producto,
} from './types'

/* ---------- Valores fijos (etiquetas para la interfaz) ---------- */

export const CATEGORIAS: { valor: CategoriaCatalogo; texto: string }[] = [
  { valor: 'proteinas', texto: 'Proteínas' },
  { valor: 'creatina', texto: 'Creatina' },
  { valor: 'pre-entreno', texto: 'Pre-entreno' },
  { valor: 'aminoacidos', texto: 'Aminoácidos' },
  { valor: 'vitaminas', texto: 'Vitaminas' },
  { valor: 'quemadores', texto: 'Quemadores' },
  { valor: 'salud', texto: 'Salud' },
  { valor: 'accesorios', texto: 'Accesorios' },
]

export const OBJETIVOS: { valor: ObjetivoCatalogo; texto: string }[] = [
  { valor: 'masa', texto: 'Masa' },
  { valor: 'definicion', texto: 'Definición' },
  { valor: 'energia', texto: 'Energía' },
  { valor: 'recuperacion', texto: 'Recuperación' },
  { valor: 'salud', texto: 'Salud' },
]

export const ETIQUETAS: { valor: EtiquetaCatalogo; texto: string }[] = [
  { valor: 'mas-vendido', texto: 'Más vendido' },
  { valor: 'recomendado', texto: 'Recomendado' },
  { valor: 'esencial', texto: 'Esencial' },
]

export function textoCategoria(valor: string | null): string {
  return CATEGORIAS.find((c) => c.valor === valor)?.texto ?? '—'
}

export function textoObjetivo(valor: string): string {
  return OBJETIVOS.find((o) => o.valor === valor)?.texto ?? valor
}

export function textoEtiqueta(valor: string | null): string {
  return ETIQUETAS.find((e) => e.valor === valor)?.texto ?? ''
}

/* ---------- Slug ---------- */

/** Genera un slug limpio a partir de un texto: minúsculas, sin acentos, con guiones. */
export function generarSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // quita acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function check<T>(res: { data: T | null; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message)
  if (res.data === null) throw new Error('Sin datos')
  return res.data
}

/* ---------- Marcas ---------- */

export interface MarcaConConteo extends Marca {
  fichas: number
}

export async function getMarcas(): Promise<Marca[]> {
  return check(
    await supabase.from('marcas').select('*').order('orden').order('nombre').returns<Marca[]>(),
  )
}

/** Marcas con el número de fichas de cada una (para la lista). */
export async function getMarcasConConteo(): Promise<MarcaConConteo[]> {
  const [marcas, fichas] = await Promise.all([
    getMarcas(),
    supabase.from('catalogo_fichas').select('marca_id'),
  ])
  const filas = check(fichas) as unknown as { marca_id: string | null }[]
  const conteo = new Map<string, number>()
  for (const f of filas) {
    if (f.marca_id) conteo.set(f.marca_id, (conteo.get(f.marca_id) ?? 0) + 1)
  }
  return marcas.map((m) => ({ ...m, fichas: conteo.get(m.id) ?? 0 }))
}

export interface MarcaInput {
  nombre: string
  slug: string
  pais: string | null
  descripcion: string | null
  orden: number
  visible: boolean
  logo_url: string | null
}

export async function crearMarca(valores: MarcaInput): Promise<void> {
  const { error } = await supabase.from('marcas').insert(valores)
  if (error) throw new Error(error.message)
}

export async function actualizarMarca(id: string, valores: MarcaInput): Promise<void> {
  const { error } = await supabase.from('marcas').update(valores).eq('id', id)
  if (error) throw new Error(error.message)
}

/* ---------- Fichas de catálogo ---------- */

export interface FichaResumen {
  id: string
  nombre: string
  foto_url: string | null
  marca_nombre: string
  tipo: CategoriaCatalogo | null
  presentaciones: number
  precio_desde: number | null
  visible: boolean
  orden: number
}

interface FichaJoin {
  id: string
  nombre: string
  foto_url: string | null
  tipo: CategoriaCatalogo | null
  visible: boolean
  orden: number
  marcas: { nombre: string } | null
}

/** Lista de fichas con marca, #presentaciones y precio desde. */
export async function getFichasResumen(): Promise<FichaResumen[]> {
  const [fichas, productos] = await Promise.all([
    supabase
      .from('catalogo_fichas')
      .select('id, nombre, foto_url, tipo, visible, orden, marcas(nombre)')
      .order('orden')
      .order('nombre'),
    supabase.from('productos').select('ficha_id, precio_venta, activo'),
  ])
  const filas = check(fichas) as unknown as FichaJoin[]
  const prods = check(productos) as unknown as {
    ficha_id: string | null
    precio_venta: number
    activo: boolean
  }[]

  const cuenta = new Map<string, number>()
  const minPrecio = new Map<string, number>()
  for (const p of prods) {
    if (!p.ficha_id) continue
    cuenta.set(p.ficha_id, (cuenta.get(p.ficha_id) ?? 0) + 1)
    if (p.activo) {
      const actual = minPrecio.get(p.ficha_id)
      if (actual === undefined || p.precio_venta < actual) minPrecio.set(p.ficha_id, p.precio_venta)
    }
  }

  return filas.map((f) => ({
    id: f.id,
    nombre: f.nombre,
    foto_url: f.foto_url,
    marca_nombre: f.marcas?.nombre ?? '—',
    tipo: f.tipo,
    presentaciones: cuenta.get(f.id) ?? 0,
    precio_desde: minPrecio.get(f.id) ?? null,
    visible: f.visible,
    orden: f.orden,
  }))
}

export async function getFicha(id: string): Promise<CatalogoFicha> {
  return check(
    await supabase.from('catalogo_fichas').select('*').eq('id', id).single<CatalogoFicha>(),
  )
}

export interface FichaInput {
  slug: string
  nombre: string
  marca_id: string | null
  tipo: CategoriaCatalogo | null
  objetivos: ObjetivoCatalogo[]
  resumen: string | null
  descripcion: string | null
  para_quien: string | null
  contiene: string[]
  uso: string | null
  por_que: string | null
  consideraciones: string[]
  sabores: string[]
  estimulante: boolean
  etiqueta: EtiquetaCatalogo | null
  nuevo: boolean
  destacado: boolean
  visible: boolean
  foto_url: string | null
}

export async function crearFicha(valores: FichaInput): Promise<string> {
  const { data, error } = await supabase
    .from('catalogo_fichas')
    .insert(valores)
    .select('id')
    .single()
  if (error || !data) throw new Error(error?.message ?? 'No se pudo crear la ficha')
  return (data as { id: string }).id
}

export async function actualizarFicha(id: string, valores: FichaInput): Promise<void> {
  const { error } = await supabase.from('catalogo_fichas').update(valores).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function toggleFichaVisible(id: string, visible: boolean): Promise<void> {
  const { error } = await supabase.from('catalogo_fichas').update({ visible }).eq('id', id)
  if (error) throw new Error(error.message)
}

/* ---------- Presentaciones (filas de productos ligadas a una ficha) ---------- */

export async function getPresentaciones(fichaId: string): Promise<Producto[]> {
  return check(
    await supabase
      .from('productos')
      .select('*')
      .eq('ficha_id', fichaId)
      .order('precio_venta')
      .returns<Producto[]>(),
  )
}

export interface PresentacionInput {
  nombre: string
  tamano: string | null
  costo: number
  precio_venta: number
  precio_anterior: number | null
  duracion_dias: number
}

/** Crea un producto de WF Control ligado a la ficha y visible en el catálogo. */
export async function crearPresentacion(fichaId: string, valores: PresentacionInput): Promise<void> {
  const { error } = await supabase.from('productos').insert({
    ...valores,
    ficha_id: fichaId,
    activo: true,
    visible_catalogo: true,
  })
  if (error) throw new Error(error.message)
}

/** Edita una presentación existente. No toca ficha_id ni pedidos pasados. */
export async function actualizarPresentacion(
  id: string,
  valores: PresentacionInput,
): Promise<void> {
  const { error } = await supabase.from('productos').update(valores).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function togglePresentacionActiva(id: string, activo: boolean): Promise<void> {
  const { error } = await supabase.from('productos').update({ activo }).eq('id', id)
  if (error) throw new Error(error.message)
}

export async function togglePresentacionVisible(id: string, visible: boolean): Promise<void> {
  const { error } = await supabase.from('productos').update({ visible_catalogo: visible }).eq('id', id)
  if (error) throw new Error(error.message)
}

/* ---------- Subida de imágenes (bucket público "productos") ---------- */

async function subirA(carpeta: string, file: File): Promise<string> {
  const blob = await redimensionar(file)
  const path = `${carpeta}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`
  const { error } = await supabase.storage
    .from('productos')
    .upload(path, blob, { contentType: 'image/jpeg' })
  if (error) throw new Error('No se pudo subir la imagen: ' + error.message)
  return supabase.storage.from('productos').getPublicUrl(path).data.publicUrl
}

/** Logo de marca → carpeta "marcas". */
export function subirLogoMarca(file: File): Promise<string> {
  return subirA('marcas', file)
}

/** Foto principal de ficha → carpeta "catalogo". */
export function subirFotoCatalogo(file: File): Promise<string> {
  return subirA('catalogo', file)
}

import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import { useData } from '../lib/hooks'
import { cop } from '../lib/format'
import {
  CATEGORIAS,
  ETIQUETAS,
  OBJETIVOS,
  actualizarFicha,
  actualizarPresentacion,
  crearFicha,
  crearPresentacion,
  generarSlug,
  getFicha,
  getMarcas,
  getPresentaciones,
  subirFotoCatalogo,
  togglePresentacionActiva,
  type FichaInput,
} from '../lib/catalogo'
import type {
  CatalogoFicha,
  CategoriaCatalogo,
  EtiquetaCatalogo,
  ObjetivoCatalogo,
  Producto,
} from '../lib/types'
import ProductoThumb from '../components/ProductoThumb'
import { Modal } from '../components/Modal'
import {
  Badge,
  Card,
  Cargando,
  ErrorMsg,
  MoneyInput,
  Switch,
  Vacio,
  btnPrimario,
  btnSecundario,
  inputBase,
} from '../components/ui'

const lineasAArray = (s: string) =>
  s
    .split('\n')
    .map((x) => x.trim())
    .filter(Boolean)
const arrayALineas = (a?: string[] | null) => (a ?? []).join('\n')

export default function CatalogoFicha() {
  const { id } = useParams()
  const esNueva = id === 'nueva'
  const navigate = useNavigate()

  const cargar = useCallback(
    () => (esNueva ? Promise.resolve(null) : getFicha(id as string)),
    [id, esNueva],
  )
  const { data: ficha, loading, error, reload } = useData<CatalogoFicha | null>(cargar, [id])
  const { data: marcas } = useData(getMarcas)

  // ----- Estado del formulario -----
  const [nombre, setNombre] = useState('')
  const [marcaId, setMarcaId] = useState('')
  const [tipo, setTipo] = useState<CategoriaCatalogo | ''>('')
  const [objetivos, setObjetivos] = useState<ObjetivoCatalogo[]>([])
  const [resumen, setResumen] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [paraQuien, setParaQuien] = useState('')
  const [contiene, setContiene] = useState('')
  const [uso, setUso] = useState('')
  const [porQue, setPorQue] = useState('')
  const [consideraciones, setConsideraciones] = useState('')
  const [sabores, setSabores] = useState('')
  const [estimulante, setEstimulante] = useState(false)
  const [etiqueta, setEtiqueta] = useState<EtiquetaCatalogo | ''>('')
  const [nuevo, setNuevo] = useState(false)
  const [destacado, setDestacado] = useState(false)
  const [visible, setVisible] = useState(true)
  const [orden, setOrden] = useState(100)
  const [fotoActual, setFotoActual] = useState<string | null>(null)
  const [fotoNueva, setFotoNueva] = useState<File | null>(null)
  const [fotos, setFotos] = useState<string[]>([])
  const [subiendoGaleria, setSubiendoGaleria] = useState(false)

  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)

  // Rellena el formulario cuando llega la ficha (o la deja vacía si es nueva).
  useEffect(() => {
    if (esNueva) return
    if (!ficha) return
    setNombre(ficha.nombre)
    setMarcaId(ficha.marca_id ?? '')
    setTipo(ficha.tipo ?? '')
    setObjetivos(ficha.objetivos ?? [])
    setResumen(ficha.resumen ?? '')
    setDescripcion(ficha.descripcion ?? '')
    setParaQuien(ficha.para_quien ?? '')
    setContiene(arrayALineas(ficha.contiene))
    setUso(ficha.uso ?? '')
    setPorQue(ficha.por_que ?? '')
    setConsideraciones(arrayALineas(ficha.consideraciones))
    setSabores(arrayALineas(ficha.sabores))
    setEstimulante(ficha.estimulante)
    setEtiqueta(ficha.etiqueta ?? '')
    setNuevo(ficha.nuevo)
    setDestacado(ficha.destacado)
    setVisible(ficha.visible)
    setOrden(ficha.orden)
    setFotoActual(ficha.foto_url)
    setFotos(ficha.fotos ?? [])
  }, [ficha, esNueva])

  // Galería: sube cada archivo al mismo bucket y guarda su URL.
  async function agregarFotos(files: FileList | null) {
    if (!files || files.length === 0) return
    setErrorForm(null)
    setSubiendoGaleria(true)
    try {
      const urls: string[] = []
      for (const f of Array.from(files)) urls.push(await subirFotoCatalogo(f))
      setFotos((prev) => [...prev, ...urls])
    } catch (err) {
      setErrorForm(err instanceof Error ? err.message : 'No se pudieron subir las fotos.')
    } finally {
      setSubiendoGaleria(false)
    }
  }

  function quitarFoto(url: string) {
    setFotos((prev) => prev.filter((u) => u !== url))
  }

  const previewFoto = fotoNueva ? URL.createObjectURL(fotoNueva) : fotoActual
  const slug = esNueva ? generarSlug(nombre) : (ficha?.slug ?? '')

  function alternarObjetivo(o: ObjetivoCatalogo) {
    setObjetivos((prev) => (prev.includes(o) ? prev.filter((x) => x !== o) : [...prev, o]))
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setErrorForm(null)
    if (!nombre.trim()) return setErrorForm('Escribe el nombre de la ficha.')
    if (!marcaId) return setErrorForm('Elige una marca.')
    if (!tipo) return setErrorForm('Elige una categoría.')
    setGuardando(true)
    try {
      let fotoUrl = fotoActual
      if (fotoNueva) fotoUrl = await subirFotoCatalogo(fotoNueva)
      const valores: FichaInput = {
        slug,
        nombre: nombre.trim(),
        marca_id: marcaId,
        tipo,
        objetivos,
        resumen: resumen.trim() || null,
        descripcion: descripcion.trim() || null,
        para_quien: paraQuien.trim() || null,
        contiene: lineasAArray(contiene),
        uso: uso.trim() || null,
        por_que: porQue.trim() || null,
        consideraciones: lineasAArray(consideraciones),
        sabores: lineasAArray(sabores),
        estimulante,
        etiqueta: etiqueta || null,
        nuevo,
        destacado,
        visible,
        foto_url: fotoUrl,
        fotos,
        orden,
      }
      if (esNueva) {
        const nuevoId = await crearFicha(valores)
        navigate(`/catalogo/${nuevoId}`, { replace: true })
      } else {
        await actualizarFicha(id as string, valores)
        setFotoNueva(null)
        await reload()
      }
    } catch (err) {
      setErrorForm(err instanceof Error ? err.message : 'No se pudo guardar la ficha.')
    } finally {
      setGuardando(false)
    }
  }

  if (!esNueva && loading) return <Cargando />
  if (!esNueva && error) return <ErrorMsg>{error}</ErrorMsg>

  return (
    <div className="entra-lista space-y-4 sm:space-y-6">
      <div className="flex items-center gap-3">
        <Link
          to="/catalogo"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-secondary hover:bg-card3"
          aria-label="Volver al catálogo"
        >
          <ArrowLeft size={16} strokeWidth={1.75} />
        </Link>
        <h1 className="titulo-pantalla">{esNueva ? 'Nueva ficha' : nombre || 'Ficha'}</h1>
      </div>

      <Card>
        <form onSubmit={guardar} className="space-y-5">
          {/* Identidad */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-faint mb-1.5 block">Nombre</label>
              <input
                className={inputBase}
                required
                placeholder="Ej: Whey Protein ISO 100"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
              />
              {nombre.trim() && (
                <p className="mt-1 text-xs text-ink-faint">
                  Dirección web: <span className="font-medium">/{slug}</span>
                </p>
              )}
            </div>
            <div>
              <label className="label-faint mb-1.5 block">Marca</label>
              <select
                className={inputBase}
                value={marcaId}
                onChange={(e) => setMarcaId(e.target.value)}
              >
                <option value="">Elige una marca…</option>
                {(marcas ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-faint mb-1.5 block">Categoría</label>
              <select
                className={inputBase}
                value={tipo}
                onChange={(e) => setTipo(e.target.value as CategoriaCatalogo)}
              >
                <option value="">Elige una categoría…</option>
                {CATEGORIAS.map((c) => (
                  <option key={c.valor} value={c.valor}>
                    {c.texto}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-faint mb-1.5 block">Etiqueta (una o ninguna)</label>
              <select
                className={inputBase}
                value={etiqueta}
                onChange={(e) => setEtiqueta(e.target.value as EtiquetaCatalogo | '')}
              >
                <option value="">Sin etiqueta</option>
                {ETIQUETAS.map((et) => (
                  <option key={et.valor} value={et.valor}>
                    {et.texto}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Objetivos */}
          <div>
            <label className="label-faint mb-1.5 block">Objetivos (los que apliquen)</label>
            <div className="flex flex-wrap gap-2">
              {OBJETIVOS.map((o) => {
                const activo = objetivos.includes(o.valor)
                return (
                  <button
                    key={o.valor}
                    type="button"
                    onClick={() => alternarObjetivo(o.valor)}
                    className={`rounded-full border px-3 py-1.5 text-sm transition-colors duration-200 ${
                      activo
                        ? 'border-transparent bg-accent-soft font-medium text-accent'
                        : 'border-line text-ink-secondary hover:bg-card3'
                    }`}
                  >
                    {o.texto}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Textos */}
          <div>
            <label className="label-faint mb-1.5 block">Resumen (una línea)</label>
            <input
              className={inputBase}
              placeholder="Proteína de máxima pureza para masa magra."
              value={resumen}
              onChange={(e) => setResumen(e.target.value)}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-faint mb-1.5 block">Descripción</label>
              <textarea
                className={`${inputBase} h-28 py-2.5`}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>
            <div>
              <label className="label-faint mb-1.5 block">Para quién es</label>
              <textarea
                className={`${inputBase} h-28 py-2.5`}
                value={paraQuien}
                onChange={(e) => setParaQuien(e.target.value)}
              />
            </div>
            <div>
              <label className="label-faint mb-1.5 block">Cómo se usa</label>
              <textarea
                className={`${inputBase} h-28 py-2.5`}
                value={uso}
                onChange={(e) => setUso(e.target.value)}
              />
            </div>
            <div>
              <label className="label-faint mb-1.5 block">Por qué elegirlo</label>
              <textarea
                className={`${inputBase} h-28 py-2.5`}
                value={porQue}
                onChange={(e) => setPorQue(e.target.value)}
              />
            </div>
          </div>

          {/* Listas */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="label-faint mb-1.5 block">Qué contiene (una por línea)</label>
              <textarea
                className={`${inputBase} h-28 py-2.5`}
                placeholder={'24 g de proteína\n5.5 g de BCAA\nSin azúcar'}
                value={contiene}
                onChange={(e) => setContiene(e.target.value)}
              />
            </div>
            <div>
              <label className="label-faint mb-1.5 block">Consideraciones (una por línea)</label>
              <textarea
                className={`${inputBase} h-28 py-2.5`}
                placeholder={'Contiene lácteos\nNo apto para veganos'}
                value={consideraciones}
                onChange={(e) => setConsideraciones(e.target.value)}
              />
            </div>
            <div>
              <label className="label-faint mb-1.5 block">Sabores (uno por línea)</label>
              <textarea
                className={`${inputBase} h-24 py-2.5`}
                placeholder={'Chocolate\nVainilla\nFresa'}
                value={sabores}
                onChange={(e) => setSabores(e.target.value)}
              />
            </div>
            <div>
              <label className="label-faint mb-1.5 block">Foto principal</label>
              <div className="flex items-center gap-3">
                <ProductoThumb url={previewFoto} size={56} />
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-ink-secondary file:mr-3 file:rounded-full file:border file:border-line file:bg-card file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-card3"
                  onChange={(e) => setFotoNueva(e.target.files?.[0] ?? null)}
                />
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                Se redimensiona a máx. 800×800 automáticamente.
              </p>
            </div>
          </div>

          {/* Galería de fotos (adicionales a la principal) */}
          <div>
            <label className="label-faint mb-1.5 block">Galería de fotos (opcional)</label>
            {fotos.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-3">
                {fotos.map((url) => (
                  <div key={url} className="relative">
                    <ProductoThumb url={url} size={64} />
                    <button
                      type="button"
                      onClick={() => quitarFoto(url)}
                      aria-label="Quitar foto"
                      className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full border border-line bg-card text-ink-secondary hover:text-negative"
                    >
                      <X size={12} strokeWidth={2} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={subiendoGaleria}
              className="block w-full text-sm text-ink-secondary file:mr-3 file:rounded-full file:border file:border-line file:bg-card file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-card3"
              onChange={(e) => agregarFotos(e.target.files)}
            />
            <p className="mt-1 text-xs text-ink-faint">
              {subiendoGaleria
                ? 'Subiendo…'
                : 'Fotos adicionales que se muestran en la ficha del producto en la web.'}
            </p>
          </div>

          {/* Orden en la web */}
          <div className="sm:max-w-xs">
            <label className="label-faint mb-1.5 block">Orden en la web</label>
            <input
              type="number"
              className={inputBase}
              value={orden}
              onChange={(e) => setOrden(Number(e.target.value))}
            />
            <p className="mt-1 text-xs text-ink-faint">Menor aparece primero en el catálogo.</p>
          </div>

          {/* Interruptores */}
          <div className="flex flex-wrap gap-x-8 gap-y-3">
            <label className="flex items-center gap-3">
              <Switch activo={estimulante} onChange={setEstimulante} etiqueta="Estimulante" />
              <span className="text-sm">Estimulante</span>
            </label>
            <label className="flex items-center gap-3">
              <Switch activo={nuevo} onChange={setNuevo} etiqueta="Nuevo" />
              <span className="text-sm">Nuevo</span>
            </label>
            <label className="flex items-center gap-3">
              <Switch activo={destacado} onChange={setDestacado} etiqueta="Destacado" />
              <span className="text-sm">Destacado</span>
            </label>
            <label className="flex items-center gap-3">
              <Switch activo={visible} onChange={setVisible} etiqueta="Visible en la web" />
              <span className="text-sm">Visible en la web</span>
            </label>
          </div>

          {errorForm && <ErrorMsg>{errorForm}</ErrorMsg>}
          <div className="flex gap-2">
            <button type="submit" className={btnPrimario} disabled={guardando}>
              {guardando ? 'Guardando…' : esNueva ? 'Crear ficha' : 'Guardar cambios'}
            </button>
            <button type="button" className={btnSecundario} onClick={() => navigate('/catalogo')}>
              {esNueva ? 'Cancelar' : 'Volver'}
            </button>
          </div>
          {esNueva && (
            <p className="text-xs text-ink-faint">
              Primero crea la ficha; después podrás agregar sus presentaciones (tamaños y precios).
            </p>
          )}
        </form>
      </Card>

      {!esNueva && <Presentaciones fichaId={id as string} />}
    </div>
  )
}

/* -------------------- Presentaciones -------------------- */

interface FormPres {
  nombre: string
  tamano: string
  costo: number
  precio: number
  precioAnterior: number
  duracion: number
}

const formVacio: FormPres = {
  nombre: '',
  tamano: '',
  costo: 0,
  precio: 0,
  precioAnterior: 0,
  duracion: 30,
}

function Presentaciones({ fichaId }: { fichaId: string }) {
  const cargar = useCallback(() => getPresentaciones(fichaId), [fichaId])
  const { data, loading, error, reload } = useData<Producto[]>(cargar, [fichaId])

  const [editando, setEditando] = useState<Producto | 'nueva' | null>(null)
  const [f, setF] = useState<FormPres>(formVacio)
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)

  function abrir(p: Producto | 'nueva') {
    setErrorForm(null)
    setEditando(p)
    if (p === 'nueva') setF(formVacio)
    else
      setF({
        nombre: p.nombre,
        tamano: p.tamano ?? '',
        costo: p.costo,
        precio: p.precio_venta,
        precioAnterior: p.precio_anterior ?? 0,
        duracion: p.duracion_dias,
      })
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setErrorForm(null)
    if (!f.nombre.trim()) return setErrorForm('Ponle un nombre a la presentación.')
    if (f.duracion <= 0) return setErrorForm('La duración debe ser mayor a cero días.')
    setGuardando(true)
    try {
      const valores = {
        nombre: f.nombre.trim(),
        tamano: f.tamano.trim() || null,
        costo: f.costo,
        precio_venta: f.precio,
        precio_anterior: f.precioAnterior > 0 ? f.precioAnterior : null,
        duracion_dias: f.duracion,
      }
      if (editando === 'nueva') await crearPresentacion(fichaId, valores)
      else await actualizarPresentacion((editando as Producto).id, valores)
      setEditando(null)
      await reload()
    } catch (err) {
      setErrorForm(err instanceof Error ? err.message : 'No se pudo guardar la presentación.')
    } finally {
      setGuardando(false)
    }
  }

  async function cambiarActivo(p: Producto) {
    await togglePresentacionActiva(p.id, !p.activo)
    reload()
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-medium">Presentaciones</h2>
          <p className="mt-0.5 text-sm text-ink-secondary">
            Cada presentación es un producto de WF Control (un tamaño con su precio).
          </p>
        </div>
        <button className={btnSecundario} onClick={() => abrir('nueva')}>
          Agregar presentación
        </button>
      </div>

      <div className="mt-4">
        {loading ? (
          <Cargando />
        ) : error ? (
          <ErrorMsg>{error}</ErrorMsg>
        ) : (data ?? []).length === 0 ? (
          <Vacio detalle="Agrega la primera (por ejemplo, 5 lb).">
            Esta ficha aún no tiene presentaciones.
          </Vacio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ tableLayout: 'auto' }}>
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="label-faint py-2 pr-4 font-medium">Presentación</th>
                  <th className="label-faint py-2 pr-4 text-right font-medium">Precio</th>
                  <th className="label-faint py-2 pr-4 text-right font-medium">Precio anterior</th>
                  <th className="label-faint py-2 pr-4 text-right font-medium">Costo</th>
                  <th className="label-faint py-2 pr-4 font-medium">Estado</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(data ?? []).map((p) => (
                  <tr key={p.id} className={p.activo ? '' : 'opacity-60'}>
                    <td className="py-3 pr-4">
                      <span className="font-medium">{p.nombre}</span>
                      {p.tamano && <span className="text-ink-faint"> · {p.tamano}</span>}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums">{cop(p.precio_venta)}</td>
                    <td className="py-3 pr-4 text-right tabular-nums text-ink-faint">
                      {p.precio_anterior ? cop(p.precio_anterior) : '—'}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-ink-secondary">
                      {cop(p.costo)}
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tono={p.activo ? 'verde' : 'neutro'}>
                        {p.activo ? 'activa' : 'inactiva'}
                      </Badge>
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-3 whitespace-nowrap">
                        <button
                          className="text-sm text-accent hover:text-accent-hover"
                          onClick={() => abrir(p)}
                        >
                          Editar
                        </button>
                        <button
                          className="text-sm text-ink-secondary hover:text-ink"
                          onClick={() => cambiarActivo(p)}
                        >
                          {p.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editando && (
        <Modal
          titulo={editando === 'nueva' ? 'Nueva presentación' : 'Editar presentación'}
          onCerrar={() => setEditando(null)}
        >
          <form onSubmit={guardar} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-faint mb-1.5 block">Nombre</label>
                <input
                  className={inputBase}
                  required
                  placeholder="Ej: Whey Protein ISO 100"
                  value={f.nombre}
                  onChange={(e) => setF({ ...f, nombre: e.target.value })}
                />
              </div>
              <div>
                <label className="label-faint mb-1.5 block">Tamaño</label>
                <input
                  className={inputBase}
                  placeholder="Ej: 5 lb"
                  value={f.tamano}
                  onChange={(e) => setF({ ...f, tamano: e.target.value })}
                />
              </div>
              <div>
                <label className="label-faint mb-1.5 block">Costo (lo que nos cuesta)</label>
                <MoneyInput value={f.costo} onChange={(n) => setF({ ...f, costo: n })} placeholder="80.000" />
              </div>
              <div>
                <label className="label-faint mb-1.5 block">Precio de venta</label>
                <MoneyInput value={f.precio} onChange={(n) => setF({ ...f, precio: n })} placeholder="120.000" />
              </div>
              <div>
                <label className="label-faint mb-1.5 block">Precio anterior (opcional)</label>
                <MoneyInput
                  value={f.precioAnterior}
                  onChange={(n) => setF({ ...f, precioAnterior: n })}
                  placeholder="Para mostrar un descuento real"
                />
              </div>
              <div>
                <label className="label-faint mb-1.5 block">Duración (días)</label>
                <input
                  type="number"
                  min={1}
                  className={inputBase}
                  value={f.duracion}
                  onChange={(e) => setF({ ...f, duracion: Number(e.target.value) })}
                />
              </div>
            </div>

            <p className="rounded-control bg-card2 px-3 py-2 text-xs text-ink-secondary">
              Cambiar el precio o el costo solo afecta las ventas futuras. Los pedidos ya
              registrados guardan su propio precio y costo, así que no se alteran.
            </p>

            {errorForm && <ErrorMsg>{errorForm}</ErrorMsg>}
            <div className="flex justify-end gap-2">
              <button type="button" className={btnSecundario} onClick={() => setEditando(null)}>
                Cancelar
              </button>
              <button type="submit" className={btnPrimario} disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar presentación'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </Card>
  )
}

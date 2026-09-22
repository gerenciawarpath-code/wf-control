import { useState, type FormEvent } from 'react'
import { Search } from 'lucide-react'
import { useData } from '../lib/hooks'
import {
  actualizarMarca,
  crearMarca,
  generarSlug,
  getMarcasConConteo,
  subirLogoMarca,
  type MarcaConConteo,
} from '../lib/catalogo'
import type { Marca } from '../lib/types'
import ProductoThumb from '../components/ProductoThumb'
import {
  Badge,
  Card,
  Cargando,
  ErrorMsg,
  Switch,
  Vacio,
  btnPrimario,
  btnSecundario,
  inputBase,
} from '../components/ui'

type Filtro = 'todas' | 'visibles' | 'ocultas'

export default function Marcas() {
  const { data, loading, error, reload } = useData(getMarcasConConteo)
  const [editando, setEditando] = useState<Marca | 'nueva' | null>(null)
  const [nombre, setNombre] = useState('')
  const [pais, setPais] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [orden, setOrden] = useState(0)
  const [visible, setVisible] = useState(true)
  const [logoActual, setLogoActual] = useState<string | null>(null)
  const [logoNuevo, setLogoNuevo] = useState<File | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errorForm, setErrorForm] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [q, setQ] = useState('')

  const slug = generarSlug(nombre)
  const previewLogo = logoNuevo ? URL.createObjectURL(logoNuevo) : logoActual

  // Resumen y filtros de solo lectura sobre las marcas ya cargadas.
  const todas = data ?? []
  const nVisibles = todas.filter((m) => m.visible).length
  const nOcultas = todas.length - nVisibles
  const totalFichas = todas.reduce((suma, m) => suma + m.fichas, 0)
  const busca = q.trim().toLowerCase()
  const visibles = todas.filter(
    (m) =>
      (busca === '' || m.nombre.toLowerCase().includes(busca)) &&
      (filtro === 'todas' || (filtro === 'visibles' ? m.visible : !m.visible)),
  )

  function abrirForm(m: Marca | 'nueva') {
    setEditando(m)
    setErrorForm(null)
    setLogoNuevo(null)
    if (m === 'nueva') {
      setNombre('')
      setPais('')
      setDescripcion('')
      setOrden(0)
      setVisible(true)
      setLogoActual(null)
    } else {
      setNombre(m.nombre)
      setPais(m.pais ?? '')
      setDescripcion(m.descripcion ?? '')
      setOrden(m.orden)
      setVisible(m.visible)
      setLogoActual(m.logo_url)
    }
  }

  async function guardar(e: FormEvent) {
    e.preventDefault()
    setErrorForm(null)
    if (!nombre.trim()) return setErrorForm('Escribe el nombre de la marca.')
    setGuardando(true)
    try {
      let logoUrl = logoActual
      if (logoNuevo) logoUrl = await subirLogoMarca(logoNuevo)
      const valores = {
        nombre: nombre.trim(),
        slug,
        pais: pais.trim() || null,
        descripcion: descripcion.trim() || null,
        orden,
        visible,
        logo_url: logoUrl,
      }
      if (editando === 'nueva') await crearMarca(valores)
      else await actualizarMarca((editando as Marca).id, valores)
    } catch (err) {
      setGuardando(false)
      setErrorForm(err instanceof Error ? err.message : 'No se pudo guardar la marca.')
      return
    }
    setGuardando(false)
    setEditando(null)
    reload()
  }

  return (
    <div className="entra-lista space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="titulo-pantalla">Marcas</h1>
        {!editando && (
          <button className={btnPrimario} onClick={() => abrirForm('nueva')}>
            Nueva marca
          </button>
        )}
      </div>

      {editando && (
        <Card>
          <h2 className="text-lg font-medium">
            {editando === 'nueva' ? 'Nueva marca' : `Editar ${(editando as Marca).nombre}`}
          </h2>
          <form onSubmit={guardar} className="mt-4 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-faint mb-1.5 block">Nombre</label>
                <input
                  className={inputBase}
                  required
                  placeholder="Ej: Warpath Forge"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                />
                {nombre.trim() && (
                  <p className="mt-1 text-xs text-ink-faint">
                    Dirección web: <span className="font-medium">/{slug}</span> (se genera sola)
                  </p>
                )}
              </div>
              <div>
                <label className="label-faint mb-1.5 block">País</label>
                <input
                  className={inputBase}
                  placeholder="Ej: Colombia"
                  value={pais}
                  onChange={(e) => setPais(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="label-faint mb-1.5 block">Descripción</label>
              <textarea
                className={`${inputBase} h-24 py-2.5`}
                placeholder="Una línea que explique qué es la marca."
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="label-faint mb-1.5 block">Orden (menor aparece primero)</label>
                <input
                  type="number"
                  className={inputBase}
                  value={orden}
                  onChange={(e) => setOrden(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="label-faint mb-1.5 block">Visible en la web</label>
                <div className="flex h-11 items-center gap-3">
                  <Switch activo={visible} onChange={setVisible} etiqueta="Visible en la web" />
                  <span className="text-sm text-ink-secondary">
                    {visible ? 'Se muestra' : 'Oculta'}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <label className="label-faint mb-1.5 block">Logo</label>
              <div className="flex items-center gap-3">
                <ProductoThumb url={previewLogo} size={56} />
                <input
                  type="file"
                  accept="image/*"
                  className="block w-full text-sm text-ink-secondary file:mr-3 file:rounded-full file:border file:border-line file:bg-card file:px-4 file:py-2 file:text-sm file:font-medium file:text-ink hover:file:bg-card3"
                  onChange={(e) => setLogoNuevo(e.target.files?.[0] ?? null)}
                />
              </div>
              <p className="mt-1 text-xs text-ink-faint">
                Se redimensiona a máx. 800×800 automáticamente.
              </p>
            </div>

            {errorForm && <ErrorMsg>{errorForm}</ErrorMsg>}
            <div className="flex gap-2">
              <button type="submit" className={btnSecundario} disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar marca'}
              </button>
              <button type="button" className={btnSecundario} onClick={() => setEditando(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </Card>
      )}

      {!loading && !error && todas.length > 0 && (
        <>
          <div className="cli-tiles">
            <div className="cli-tile">
              <div className="lab">Marcas</div>
              <div className="val tnum">{todas.length}</div>
              <div className="sub">{nVisibles} visibles en la web</div>
            </div>
            <div className="cli-tile">
              <div className="lab">Visibles</div>
              <div className="val tnum" style={{ color: 'var(--success-fg)' }}>
                {nVisibles}
              </div>
              <div className="sub">en la vitrina web</div>
            </div>
            <div className="cli-tile">
              <div className="lab">Fichas</div>
              <div className="val tnum">{totalFichas}</div>
              <div className="sub">en total, todas las marcas</div>
            </div>
          </div>

          <div className="cli-bar">
            <div className="cli-filtros" role="tablist">
              {(
                [
                  ['todas', 'Todas', todas.length],
                  ['visibles', 'Visibles', nVisibles],
                  ['ocultas', 'Ocultas', nOcultas],
                ] as [Filtro, string, number][]
              ).map(([id, label, n]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={filtro === id}
                  className={filtro === id ? 'on' : ''}
                  onClick={() => setFiltro(id)}
                >
                  {label} <span className="cnt">{n}</span>
                </button>
              ))}
            </div>
            <label className="cli-find">
              <Search size={16} strokeWidth={2} />
              <input
                placeholder="Buscar marca…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </label>
          </div>
        </>
      )}

      {loading ? (
        <Card>
          <Cargando />
        </Card>
      ) : error ? (
        <Card>
          <ErrorMsg>{error}</ErrorMsg>
        </Card>
      ) : todas.length === 0 ? (
        <Card>
          <Vacio>Aún no hay marcas. Crea la primera para agrupar tus fichas.</Vacio>
        </Card>
      ) : visibles.length === 0 ? (
        <Card>
          <Vacio>Ninguna marca coincide con el filtro.</Vacio>
        </Card>
      ) : (
        <div className="marcas-grid">
          {visibles.map((m: MarcaConConteo) => (
            <button
              key={m.id}
              type="button"
              className={`marca-card${m.visible ? '' : ' oculta'}`}
              onClick={() => abrirForm(m)}
            >
              <div className="mc-top">
                <ProductoThumb url={m.logo_url} size={48} />
                <div className="min-w-0">
                  <div className="mc-nombre">{m.nombre}</div>
                  {m.pais && <div className="mc-pais">{m.pais}</div>}
                </div>
              </div>
              <div className="mc-foot">
                <span className="mc-fichas">
                  {m.fichas} {m.fichas === 1 ? 'ficha' : 'fichas'}
                </span>
                <Badge tono={m.visible ? 'verde' : 'neutro'}>
                  {m.visible ? 'visible' : 'oculta'}
                </Badge>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

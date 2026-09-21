import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ImageOff, Plus, Search, TriangleAlert } from 'lucide-react'
import { useData } from '../lib/hooks'
import { getFichasResumen, textoCategoria, toggleFichaVisible, type FichaResumen } from '../lib/catalogo'
import { cop } from '../lib/format'
import { Cargando, ErrorMsg, Switch, Vacio, btnPrimario } from '../components/ui'

type Filtro = 'todas' | 'sinfoto' | 'sindesc' | 'ocultas'

export default function Catalogo() {
  const { data, loading, error, reload } = useData(getFichasResumen)
  const navigate = useNavigate()
  const [cambiando, setCambiando] = useState<string | null>(null)
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [q, setQ] = useState('')

  async function cambiarVisible(f: FichaResumen) {
    setCambiando(f.id)
    try {
      await toggleFichaVisible(f.id, !f.visible)
      await reload()
    } finally {
      setCambiando(null)
    }
  }

  // Conteos y filtros de solo lectura sobre las fichas ya cargadas.
  const fichas = data ?? []
  const sinFoto = (f: FichaResumen) => !f.foto_url
  const sinDesc = (f: FichaResumen) => !f.tiene_descripcion
  const nSinFoto = fichas.filter(sinFoto).length
  const nSinDesc = fichas.filter(sinDesc).length
  const nCompletas = fichas.filter((f) => !sinFoto(f) && !sinDesc(f)).length
  const nOcultas = fichas.filter((f) => !f.visible).length
  const nVisibles = fichas.length - nOcultas

  const busca = q.trim().toLowerCase()
  const visibles = fichas.filter(
    (f) =>
      (busca === '' ||
        f.nombre.toLowerCase().includes(busca) ||
        f.marca_nombre.toLowerCase().includes(busca)) &&
      (filtro === 'todas' ||
        (filtro === 'sinfoto' && sinFoto(f)) ||
        (filtro === 'sindesc' && sinDesc(f)) ||
        (filtro === 'ocultas' && !f.visible)),
  )

  return (
    <div className="entra-lista space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="titulo-pantalla">Catálogo</h1>
        <button className={btnPrimario} onClick={() => navigate('/catalogo/nueva')}>
          <Plus size={16} strokeWidth={2} />
          Nueva ficha
        </button>
      </div>

      {!loading && !error && (
        <div className="cat-tiles">
          <div className="cat-tile">
            <div className="lab">Fichas</div>
            <div className="val tnum">{fichas.length}</div>
            <div className="sub">{nVisibles} visibles en la web</div>
          </div>
          <div className={`cat-tile${nSinFoto > 0 ? ' warn' : ''}`}>
            <div className="lab">Sin foto</div>
            <div className="val tnum">{nSinFoto}</div>
            <div className="sub">necesitan imagen</div>
          </div>
          <div className={`cat-tile${nSinDesc > 0 ? ' warn' : ''}`}>
            <div className="lab">Sin descripción</div>
            <div className="val tnum">{nSinDesc}</div>
            <div className="sub">falta texto</div>
          </div>
          <div className="cat-tile ok">
            <div className="lab">Completas</div>
            <div className="val tnum">{nCompletas}</div>
            <div className="sub">foto + descripción</div>
          </div>
        </div>
      )}

      <div className="cli-bar">
        <div className="cli-filtros" role="tablist">
          {(
            [
              ['todas', 'Todas', fichas.length],
              ['sinfoto', 'Sin foto', nSinFoto],
              ['sindesc', 'Sin descripción', nSinDesc],
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
            placeholder="Buscar ficha o marca…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
      </div>

      <div className="cli-lista">
        {loading ? (
          <div className="p-5">
            <Cargando />
          </div>
        ) : error ? (
          <div className="p-5">
            <ErrorMsg>{error}</ErrorMsg>
          </div>
        ) : fichas.length === 0 ? (
          <Vacio detalle="Crea la primera para mostrarla en la web.">Aún no hay fichas.</Vacio>
        ) : (
          <>
            {(nSinFoto > 0 || nSinDesc > 0) && (
              <div className="cat-hint">
                <TriangleAlert size={16} strokeWidth={1.8} />
                {nSinFoto} {nSinFoto === 1 ? 'ficha no tiene' : 'fichas no tienen'} foto y {nSinDesc}{' '}
                no {nSinDesc === 1 ? 'tiene' : 'tienen'} descripción.
              </div>
            )}
            {visibles.length === 0 && <Vacio>Ninguna ficha coincide con el filtro.</Vacio>}
            {visibles.map((f) => (
              <div key={f.id} className={`cat-row${f.visible ? '' : ' oculta'}`}>
                <Link to={`/catalogo/${f.id}`} className="cat-main">
                  {f.foto_url ? (
                    <img src={f.foto_url} alt="" className="cat-thumb" />
                  ) : (
                    <span className="cat-thumb no">
                      <ImageOff size={19} strokeWidth={1.7} />
                    </span>
                  )}
                  <div className="who">
                    <b>{f.nombre}</b>
                    <div className="meta">
                      {f.marca_nombre} · {textoCategoria(f.tipo)} · {f.presentaciones}{' '}
                      {f.presentaciones === 1 ? 'presentación' : 'presentaciones'}
                    </div>
                  </div>
                </Link>
                <div className="cat-badges">
                  {sinFoto(f) && <span className="bdg warn">Sin foto</span>}
                  {sinDesc(f) && <span className="bdg warn">Sin descripción</span>}
                  {!sinFoto(f) && !sinDesc(f) && <span className="bdg ok">Completa</span>}
                </div>
                <div className="cat-right">
                  <div className="price tnum">{f.precio_desde !== null ? cop(f.precio_desde) : '—'}</div>
                  <div className="flex items-center gap-2">
                    <Switch
                      activo={f.visible}
                      onChange={() => cambiarVisible(f)}
                      etiqueta={`Mostrar ${f.nombre} en la web`}
                    />
                    {cambiando === f.id && <span className="text-xs text-ink-faint">guardando…</span>}
                  </div>
                  <Link to={`/catalogo/${f.id}`} className="text-sm text-accent hover:text-accent-hover">
                    Editar
                  </Link>
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  )
}

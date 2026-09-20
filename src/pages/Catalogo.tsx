import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useData } from '../lib/hooks'
import { getFichasResumen, textoCategoria, toggleFichaVisible, type FichaResumen } from '../lib/catalogo'
import { cop } from '../lib/format'
import ProductoThumb from '../components/ProductoThumb'
import { Card, Cargando, ErrorMsg, Switch, Vacio, btnPrimario } from '../components/ui'

export default function Catalogo() {
  const { data, loading, error, reload } = useData(getFichasResumen)
  const navigate = useNavigate()
  const [cambiando, setCambiando] = useState<string | null>(null)

  async function cambiarVisible(f: FichaResumen) {
    setCambiando(f.id)
    try {
      await toggleFichaVisible(f.id, !f.visible)
      await reload()
    } finally {
      setCambiando(null)
    }
  }

  return (
    <div className="entra-lista space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="titulo-pantalla">Catálogo</h1>
        <button className={btnPrimario} onClick={() => navigate('/catalogo/nueva')}>
          Nueva ficha
        </button>
      </div>

      <Card>
        {loading ? (
          <Cargando />
        ) : error ? (
          <ErrorMsg>{error}</ErrorMsg>
        ) : (data ?? []).length === 0 ? (
          <Vacio detalle="Crea la primera para mostrarla en la web.">Aún no hay fichas.</Vacio>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ tableLayout: 'auto' }}>
              <thead>
                <tr className="border-b border-line text-left">
                  <th className="label-faint py-2 pr-4 font-medium">Ficha</th>
                  <th className="label-faint py-2 pr-4 font-medium">Marca</th>
                  <th className="label-faint py-2 pr-4 font-medium">Categoría</th>
                  <th className="label-faint py-2 pr-4 text-right font-medium">Presentaciones</th>
                  <th className="label-faint py-2 pr-4 text-right font-medium">Precio desde</th>
                  <th className="label-faint py-2 pr-4 font-medium">Visible en la web</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {(data ?? []).map((f) => (
                  <tr key={f.id} className={f.visible ? '' : 'opacity-60'}>
                    <td className="py-3 pr-4">
                      <Link
                        to={`/catalogo/${f.id}`}
                        className="flex items-center gap-3 hover:opacity-70"
                      >
                        <ProductoThumb url={f.foto_url} size={36} />
                        <span className="font-medium">{f.nombre}</span>
                      </Link>
                    </td>
                    <td className="py-3 pr-4 text-ink-secondary">{f.marca_nombre}</td>
                    <td className="py-3 pr-4 text-ink-secondary">{textoCategoria(f.tipo)}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">{f.presentaciones}</td>
                    <td className="py-3 pr-4 text-right tabular-nums">
                      {f.precio_desde !== null ? cop(f.precio_desde) : '—'}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          activo={f.visible}
                          onChange={() => cambiarVisible(f)}
                          etiqueta={`Mostrar ${f.nombre} en la web`}
                        />
                        {cambiando === f.id && (
                          <span className="text-xs text-ink-faint">guardando…</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end whitespace-nowrap">
                        <Link
                          to={`/catalogo/${f.id}`}
                          className="text-sm text-accent hover:text-accent-hover"
                        >
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  )
}

import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useData } from '../lib/hooks'
import { abrirComprobante, getCompraItems, getComprasFull } from '../lib/data'
import { eliminarCompra } from '../lib/mutations'
import { cop, fmtFechaLarga } from '../lib/format'
import type { Medio } from '../lib/types'
import CompraForm, { type ItemCompraUI } from '../components/CompraForm'
import ProductoThumb from '../components/ProductoThumb'
import { ConfirmDialog } from '../components/Modal'
import { Badge, Card, Cargando, ErrorMsg, Label, btnSecundario } from '../components/ui'

const nombresMedio: Record<Medio, string> = {
  bancolombia: 'Bancolombia',
  nequi: 'Nequi',
  efectivo: 'Efectivo',
}

export default function CompraDetalle() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const compras = useData(getComprasFull)
  const items = useData(() => getCompraItems(id!), [id])
  const [editar, setEditar] = useState(false)
  const [borrar, setBorrar] = useState(false)

  if (compras.loading || items.loading) return <Cargando />
  const c = (compras.data ?? []).find((x) => x.id === id)
  if (!c) return <ErrorMsg>No se encontró la compra.</ErrorMsg>

  function recargar() {
    setEditar(false)
    compras.reload()
    items.reload()
  }

  if (editar) {
    return (
      <div className="entra-lista space-y-4 sm:space-y-6">
        <div>
          <Link to="/compras" className="text-sm text-ink-faint hover:text-ink">
            ← Compras
          </Link>
          <h1 className="mt-2 titulo-pantalla">Editar compra</h1>
        </div>
        <CompraForm
          compraId={c.id}
          cabeceraInicial={{
            proveedor_id: c.proveedor_id,
            fecha: c.fecha,
            medio: c.medio,
            pedido_id: c.pedido_id,
            nota: c.nota,
            comprobante_url: c.comprobante_url,
          }}
          itemsIniciales={(items.data ?? [])
            .filter((it) => it.producto_id)
            .map(
              (it): ItemCompraUI => ({
                producto_id: it.producto_id as string,
                cantidad: it.cantidad,
                costo_unitario: it.costo_unitario,
              }),
            )}
          onGuardado={recargar}
          onCancelar={() => setEditar(false)}
        />
      </div>
    )
  }

  return (
    <div className="entra-lista space-y-4 sm:space-y-6">
      <div>
        <Link to="/compras" className="text-sm text-ink-faint hover:text-ink">
          ← Compras
        </Link>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="titulo-pantalla">{c.proveedor_nombre}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <span className="text-sm text-ink-faint">{fmtFechaLarga(c.fecha)}</span>
              <span className="text-sm text-ink-faint">· {nombresMedio[c.medio]}</span>
              {c.es_ajuste ? (
                <Badge tono="neutro">ajuste</Badge>
              ) : c.pedido_id ? (
                <Badge tono="verde">ligada a pedido</Badge>
              ) : (
                <Badge tono="azul">stock en lote</Badge>
              )}
            </div>
          </div>
          {!c.es_ajuste && (
            <button className={btnSecundario} onClick={() => setEditar(true)}>
              Editar compra
            </button>
          )}
        </div>
      </div>

      <Card>
        <Label>Total de la compra</Label>
        <div className="mt-2 text-3xl font-semibold tracking-tight text-negative">
          −{cop(c.total)}
        </div>
        {c.pedido_id && (
          <Link to={`/pedidos/${c.pedido_id}`} className="mt-2 inline-block text-sm text-accent">
            Ver pedido ligado{c.cliente_nombre ? ` · ${c.cliente_nombre}` : ''}
          </Link>
        )}
        {c.comprobante_url && (
          <div className="mt-2">
            <button
              className="text-sm text-accent hover:text-accent-hover"
              onClick={() => abrirComprobante(c.comprobante_url!)}
            >
              Ver comprobante
            </button>
          </div>
        )}
        {c.nota && <p className="mt-3 text-sm text-ink-secondary">{c.nota}</p>}
      </Card>

      <Card>
        <h2 className="text-lg font-medium">Productos comprados</h2>
        <ul className="mt-2 divide-y divide-line">
          {(items.data ?? []).map((it) => (
            <li key={it.id} className="flex items-center gap-3 py-3">
              <ProductoThumb url={it.productos?.foto_url} size={40} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium">
                  {it.productos?.nombre ?? (c.es_ajuste ? 'Ajuste histórico' : '—')}
                </div>
                <div className="text-xs text-ink-faint">
                  {it.cantidad} × {cop(it.costo_unitario)}
                </div>
              </div>
              <div className="text-sm font-medium">{cop(it.costo_total)}</div>
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <h2 className="text-lg font-medium">Eliminar compra</h2>
        <p className="mt-2 text-sm text-ink-secondary">
          Al eliminar esta compra, sus {cop(c.total)} vuelven a la caja. No se puede deshacer.
        </p>
        <button className="btn-peligro mt-4" onClick={() => setBorrar(true)}>
          Eliminar compra
        </button>
      </Card>

      {borrar && (
        <ConfirmDialog
          titulo="Eliminar compra"
          palabraClave="ELIMINAR"
          textoConfirmar="Eliminar compra"
          mensaje={
            <>
              Vas a eliminar la compra a <strong>{c.proveedor_nombre}</strong> por{' '}
              <strong>{cop(c.total)}</strong>. Esa plata <strong>vuelve a la caja</strong>. La acción
              no se puede deshacer.
            </>
          }
          onCancelar={() => setBorrar(false)}
          onConfirmar={async () => {
            await eliminarCompra(c.id)
            navigate('/compras')
          }}
        />
      )}
    </div>
  )
}

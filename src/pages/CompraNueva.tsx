import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useData } from '../lib/hooks'
import CompraForm, { type ItemCompraUI } from '../components/CompraForm'
import { Cargando, ErrorMsg } from '../components/ui'

async function itemsDePedido(pedidoId: string): Promise<ItemCompraUI[]> {
  const { data, error } = await supabase
    .from('pedido_items')
    .select('producto_id, cantidad, costo')
    .eq('pedido_id', pedidoId)
  if (error) throw new Error(error.message)
  return (data ?? []).map((it) => ({
    producto_id: it.producto_id as string,
    cantidad: it.cantidad as number,
    costo_unitario: it.costo as number,
  }))
}

export default function CompraNueva() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const pedidoId = params.get('pedido')
  const pre = useData(() => (pedidoId ? itemsDePedido(pedidoId) : Promise.resolve(undefined)), [pedidoId])

  if (pedidoId && pre.loading) return <Cargando />
  if (pedidoId && pre.error) return <ErrorMsg>No se pudo cargar el pedido: {pre.error}</ErrorMsg>

  return (
    <div className="entra-lista space-y-4 sm:space-y-6">
      <div>
        <Link to="/compras" className="text-sm text-ink-faint hover:text-ink">
          ← Compras
        </Link>
        <h1 className="mt-2 titulo-pantalla">Nueva compra</h1>
      </div>
      <CompraForm
        itemsIniciales={pre.data ?? undefined}
        pedidoFijo={pedidoId}
        onGuardado={(id) => navigate(id ? `/compras/${id}` : '/compras')}
        onCancelar={() => navigate('/compras')}
      />
    </div>
  )
}

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import Layout from './components/Layout'
import Login from './pages/Login'
import Inicio from './pages/Inicio'
import Clientes from './pages/Clientes'
import ClienteDetalle from './pages/ClienteDetalle'
import Pedidos from './pages/Pedidos'
import PedidoNuevo from './pages/PedidoNuevo'
import PedidoDetalle from './pages/PedidoDetalle'
import Caja from './pages/Caja'
import Productos from './pages/Productos'

function Protegido({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth()
  if (loading) return null
  if (!session) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <Protegido>
                <Layout />
              </Protegido>
            }
          >
            <Route index element={<Inicio />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="clientes/:id" element={<ClienteDetalle />} />
            <Route path="pedidos" element={<Pedidos />} />
            <Route path="pedidos/nuevo" element={<PedidoNuevo />} />
            <Route path="pedidos/:id" element={<PedidoDetalle />} />
            <Route path="caja" element={<Caja />} />
            <Route path="productos" element={<Productos />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

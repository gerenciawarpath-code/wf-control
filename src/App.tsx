import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { configFaltante, configOk } from './lib/supabase'
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

function ConfigFaltante() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-card border border-line bg-card p-6 shadow-card">
        <div className="label-faint mb-2">Configuración</div>
        <h1 className="text-xl font-medium tracking-tight">Falta conectar Supabase</h1>
        <p className="mt-3 text-sm text-ink-secondary">
          Este deploy se construyó sin las claves. Agrégalas en Vercel → Settings → Environment
          Variables y vuelve a desplegar:
        </p>
        <ul className="mt-3 space-y-1 text-sm">
          {configFaltante.map((v) => (
            <li key={v} className="font-mono text-negative">
              {v}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

export default function App() {
  if (!configOk) return <ConfigFaltante />

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

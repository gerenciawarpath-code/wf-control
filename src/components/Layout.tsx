import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BookOpen,
  History,
  LayoutDashboard,
  LogOut,
  Bell,
  Menu,
  MessageCircle,
  Moon,
  Package,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sun,
  Tags,
  TrendingUp,
  Users,
  Wallet,
  X,
  type LucideIcon,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { useTema } from '../lib/theme'

const tabs: { to: string; label: string; icono: LucideIcon }[] = [
  { to: '/', label: 'Inicio', icono: LayoutDashboard },
  { to: '/clientes', label: 'Clientes', icono: Users },
  { to: '/pedidos', label: 'Pedidos', icono: ShoppingBag },
  { to: '/caja', label: 'Caja', icono: Wallet },
  { to: '/compras', label: 'Compras', icono: ShoppingCart },
  { to: '/productos', label: 'Productos', icono: Package },
  { to: '/marcas', label: 'Marcas', icono: Tags },
  { to: '/catalogo', label: 'Catálogo', icono: BookOpen },
  { to: '/kpis', label: 'KPIs', icono: TrendingUp },
  { to: '/mensajes', label: 'Mensajes', icono: MessageCircle },
  { to: '/auditoria', label: 'Historial', icono: History },
]

function Escudo() {
  return (
    <svg viewBox="0 0 40 44" aria-hidden="true">
      <path
        d="M20 1 37 7.5v13.2C37 31 29.8 39 20 43 10.2 39 3 31 3 20.7V7.5L20 1Z"
        fill="#12213a"
        stroke="#3b5a8c"
        strokeWidth="1.3"
      />
      <path d="M20 9 25.5 22 20 34 14.5 22 20 9Z" fill="#2E6BFF" />
      <path d="M20 9V34l-5.5-12L20 9Z" fill="#eaf1ff" opacity=".25" />
    </svg>
  )
}

export default function Layout() {
  const { socio } = useAuth()
  const { tema, alternar } = useTema()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const location = useLocation()

  // Cierra el menú móvil al navegar a otra ruta.
  useEffect(() => setMenuAbierto(false), [location.pathname])

  const nombre = socio?.nombre ?? ''
  const iniciales =
    nombre
      .split(/[\s@.]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0].toUpperCase())
      .join('') || 'WF'

  return (
    <div className="app">
      <aside className={`side${menuAbierto ? ' open' : ''}`}>
        <div className="brand">
          <Escudo />
          <div className="bn">WF CONTROL</div>
          <div className="bt">RENDIMIENTO SIN IMPROVISACIÓN</div>
        </div>

        <nav className="side-nav" aria-label="Principal">
          {tabs.map((t) => (
            <NavLink
              key={t.to}
              to={t.to}
              end={t.to === '/'}
              className={({ isActive }) => (isActive ? 'on' : '')}
            >
              <t.icono size={18} strokeWidth={1.7} />
              {t.label}
            </NavLink>
          ))}
        </nav>

        <div className="side-foot">
          <div className="sf-t">
            UN NEGOCIO
            <br />
            MÁS FUERTE
            <br />
            CADA DÍA
          </div>
          <svg className="peak" viewBox="0 0 210 40" preserveAspectRatio="none" aria-hidden="true">
            <path d="M0 40 L45 14 L80 30 L120 6 L160 26 L210 12 L210 40Z" fill="#0a1a33" />
            <path
              d="M0 40 L45 14 L80 30 L120 6 L160 26 L210 12"
              fill="none"
              stroke="#2E6BFF"
              strokeWidth="1.2"
              opacity=".6"
            />
          </svg>
        </div>
        <div className="side-ver">
          <span>WF CONTROL v2.0</span>
          <button className="salir" onClick={() => supabase.auth.signOut()}>
            <LogOut size={14} strokeWidth={1.75} />
            Salir
          </button>
        </div>
      </aside>

      {menuAbierto && <div className="side-scrim" onClick={() => setMenuAbierto(false)} />}

      <div className="main-col">
        <header className="topbar">
          <button
            className="menu-btn"
            onClick={() => setMenuAbierto((v) => !v)}
            aria-label="Menú"
            aria-expanded={menuAbierto}
          >
            {menuAbierto ? <X size={18} strokeWidth={1.75} /> : <Menu size={18} strokeWidth={1.75} />}
          </button>

          {/* Visual por ahora: el buscador global aún no tiene función */}
          <div className="search">
            <Search size={16} strokeWidth={1.8} />
            <input placeholder="Buscar clientes, pedidos, productos..." aria-label="Buscar" readOnly />
            <span className="kbd">⌘K</span>
          </div>
          <div className="top-sp" />

          <button className="icon-btn" aria-label="Notificaciones" type="button">
            <Bell size={18} strokeWidth={1.7} />
          </button>
          <button
            onClick={alternar}
            aria-label={tema === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
            className="icon-btn"
          >
            <span className="switch-icono" key={tema}>
              {tema === 'light' ? (
                <Moon size={17} strokeWidth={1.75} />
              ) : (
                <Sun size={17} strokeWidth={1.75} />
              )}
            </span>
          </button>
          <div className="user">
            <span className="av">{iniciales}</span>
            <div className="who-txt">
              <div className="un">{nombre}</div>
              <div className="ur">Socio</div>
            </div>
          </div>
          <div className="slogan">
            DISCIPLINA
            <br />
            EN CADA DECISIÓN
          </div>
        </header>

        <main className="main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

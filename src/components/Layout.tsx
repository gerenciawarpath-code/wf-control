import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  BookOpen,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageCircle,
  Moon,
  Package,
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
import LogoWF from './LogoWF'

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

export default function Layout() {
  const { socio } = useAuth()
  const { tema, alternar } = useTema()
  const [menuAbierto, setMenuAbierto] = useState(false)
  const location = useLocation()

  // Cierra el menú móvil al navegar a otra ruta.
  useEffect(() => setMenuAbierto(false), [location.pathname])

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-line bg-page/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-5 sm:px-12">
          <span className="flex shrink-0 items-center gap-2.5">
            <LogoWF altura={18} />
            <span className="text-[15px] font-medium tracking-tight">WF Control</span>
          </span>

          {/* Navegación inline: solo en desktop (lg+), sin scroll horizontal */}
          <nav className="hidden flex-1 items-center justify-center gap-0.5 lg:flex">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-colors duration-200 ${
                    isActive
                      ? 'bg-accent-soft font-medium text-accent'
                      : 'text-ink-secondary hover:bg-card3'
                  }`
                }
              >
                <t.icono size={16} strokeWidth={1.75} />
                {t.label}
              </NavLink>
            ))}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-3 lg:flex-none">
            <span className="hidden text-sm text-ink-secondary xl:block">{socio?.nombre}</span>
            <button
              onClick={alternar}
              aria-label={tema === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-secondary transition-colors duration-200 hover:bg-card3"
            >
              <span className="switch-icono" key={tema}>
                {tema === 'light' ? (
                  <Moon size={16} strokeWidth={1.75} />
                ) : (
                  <Sun size={16} strokeWidth={1.75} />
                )}
              </span>
            </button>
            <button onClick={() => supabase.auth.signOut()} className="btn-terciario hidden lg:inline-flex">
              <LogOut size={16} strokeWidth={1.75} />
              Salir
            </button>
            {/* Hamburguesa: solo debajo de lg */}
            <button
              onClick={() => setMenuAbierto((v) => !v)}
              aria-label="Menú"
              aria-expanded={menuAbierto}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-secondary transition-colors duration-200 hover:bg-card3 lg:hidden"
            >
              {menuAbierto ? <X size={18} strokeWidth={1.75} /> : <Menu size={18} strokeWidth={1.75} />}
            </button>
          </div>
        </div>

        {/* Drawer desde arriba en pantallas medianas y móviles */}
        {menuAbierto && (
          <>
            <div
              className="fixed inset-0 top-16 z-10 bg-black/30 lg:hidden"
              onClick={() => setMenuAbierto(false)}
            />
            <div className="drawer-menu absolute inset-x-0 top-16 z-20 border-b border-line bg-card shadow-lg lg:hidden">
              <nav className="mx-auto flex max-w-[1200px] flex-col gap-1 px-5 py-3 sm:px-12">
                {tabs.map((t) => (
                  <NavLink
                    key={t.to}
                    to={t.to}
                    end={t.to === '/'}
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-control px-3 py-2.5 text-sm transition-colors duration-200 ${
                        isActive
                          ? 'bg-accent-soft font-medium text-accent'
                          : 'text-ink-secondary hover:bg-card3'
                      }`
                    }
                  >
                    <t.icono size={18} strokeWidth={1.75} />
                    {t.label}
                  </NavLink>
                ))}
                <div className="mt-1 flex items-center justify-between border-t border-line pt-3">
                  <span className="text-sm text-ink-secondary">{socio?.nombre}</span>
                  <button onClick={() => supabase.auth.signOut()} className="btn-terciario">
                    <LogOut size={16} strokeWidth={1.75} />
                    Salir
                  </button>
                </div>
              </nav>
            </div>
          </>
        )}
      </header>

      <main className="mx-auto max-w-[1200px] px-5 py-6 sm:px-12 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}

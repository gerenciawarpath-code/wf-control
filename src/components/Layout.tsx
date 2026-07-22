import { NavLink, Outlet } from 'react-router-dom'
import {
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Moon,
  Package,
  ShoppingBag,
  Sun,
  TrendingUp,
  Users,
  Wallet,
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
  { to: '/productos', label: 'Productos', icono: Package },
  { to: '/kpis', label: 'KPIs', icono: TrendingUp },
  { to: '/mensajes', label: 'Mensajes', icono: MessageCircle },
]

export default function Layout() {
  const { socio } = useAuth()
  const { tema, alternar } = useTema()

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-page/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-3 px-5 sm:gap-4 sm:px-12">
          <span className="flex shrink-0 items-center gap-2">
            <span className="wf-marca">WF</span>
            <span className="hidden text-[15px] font-medium tracking-tight md:block">
              WF Control
            </span>
          </span>

          <nav className="flex flex-1 gap-1 overflow-x-auto py-1">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.to === '/'}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition-colors duration-200 ${
                    isActive
                      ? 'bg-accent-soft font-medium text-accent'
                      : 'text-ink-secondary hover:bg-card3'
                  }`
                }
              >
                <t.icono size={16} strokeWidth={1.75} />
                <span className="hidden sm:inline">{t.label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-sm text-ink-secondary lg:block">{socio?.nombre}</span>
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
            <button onClick={() => supabase.auth.signOut()} className="btn-terciario">
              <LogOut size={16} strokeWidth={1.75} />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-[1200px] px-5 py-6 sm:px-12 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}

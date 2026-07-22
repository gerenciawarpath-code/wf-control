import { NavLink, Outlet } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth'

const tabs = [
  { to: '/', label: 'Inicio' },
  { to: '/clientes', label: 'Clientes' },
  { to: '/pedidos', label: 'Pedidos' },
  { to: '/caja', label: 'Caja' },
  { to: '/productos', label: 'Productos' },
  { to: '/kpis', label: 'KPIs' },
]

export default function Layout() {
  const { socio } = useAuth()
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-line bg-card">
        <div className="mx-auto flex max-w-5xl items-center gap-4 px-4 py-3 sm:px-6">
          <span className="text-[15px] font-semibold tracking-tight">WF Control</span>
          <nav className="flex flex-1 gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <NavLink
                key={t.to}
                to={t.to}
                end={t.to === '/'}
                className={({ isActive }) =>
                  `whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm transition-colors duration-150 ${
                    isActive
                      ? 'bg-accent-soft font-medium text-accent'
                      : 'text-ink-secondary hover:bg-page'
                  }`
                }
              >
                {t.label}
              </NavLink>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden text-sm text-ink-secondary sm:block">{socio?.nombre}</span>
            <button
              onClick={() => supabase.auth.signOut()}
              className="text-sm text-ink-faint transition-colors duration-150 hover:text-ink"
            >
              Salir
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <Outlet />
      </main>
    </div>
  )
}

import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'

/**
 * Contenedor con pestañas para Productos (interno) y Catálogo (vitrina web).
 * Solo presenta las pantallas existentes; cada una conserva su ruta y lógica.
 */
export default function PestanasProductos({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <div className="tabs-pantalla" role="tablist">
          <NavLink to="/productos" role="tab" className={({ isActive }) => (isActive ? 'on' : '')}>
            Interno · precios
          </NavLink>
          <NavLink to="/catalogo" role="tab" className={({ isActive }) => (isActive ? 'on' : '')}>
            Vitrina web
          </NavLink>
        </div>
        <p className="mt-2 text-xs text-ink-faint">
          Interno = tus precios; Vitrina web = lo que ve el cliente.
        </p>
      </div>
      {children}
    </div>
  )
}

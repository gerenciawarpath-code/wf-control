import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type Tema = 'light' | 'dark'

const ThemeContext = createContext<{ tema: Tema; alternar: () => void }>({
  tema: 'light',
  alternar: () => {},
})

/**
 * Claro por defecto. Un reset de una sola vez (bandera wf-theme-reset) devuelve a
 * claro a quienes tenían oscuro guardado de antes; después el toggle manda.
 * Misma lógica que el script de index.html (evita el flash).
 */
function temaInicial(): Tema {
  try {
    if (!localStorage.getItem('wf-theme-reset')) {
      localStorage.setItem('wf-theme', 'light')
      localStorage.setItem('wf-theme-reset', '1')
      return 'light'
    }
    return localStorage.getItem('wf-theme') === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [tema, setTema] = useState<Tema>(temaInicial)

  useEffect(() => {
    document.documentElement.dataset.theme = tema
    localStorage.setItem('wf-theme', tema)
  }, [tema])

  const alternar = useCallback(() => {
    setTema((t) => (t === 'light' ? 'dark' : 'light'))
  }, [])

  return <ThemeContext.Provider value={{ tema, alternar }}>{children}</ThemeContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useTema() {
  return useContext(ThemeContext)
}

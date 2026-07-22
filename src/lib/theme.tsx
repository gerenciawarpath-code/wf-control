import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type Tema = 'light' | 'dark'

const ThemeContext = createContext<{ tema: Tema; alternar: () => void }>({
  tema: 'light',
  alternar: () => {},
})

function temaInicial(): Tema {
  const guardado = localStorage.getItem('wf-theme')
  if (guardado === 'light' || guardado === 'dark') return guardado
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
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

import { useLayoutEffect, useRef, useState } from 'react'
import { cop, fmtFecha } from '../lib/format'
import type { VentaDia } from '../lib/data'

const H = 210
const X0 = 44
const Y0 = 20
const Y1 = 175

function techoBonito(max: number): number {
  if (max <= 0) return 40_000
  const exp = Math.pow(10, Math.floor(Math.log10(max)))
  for (const m of [1, 2, 2.5, 4, 5, 8, 10]) if (max <= m * exp) return m * exp
  return 10 * exp
}

function corto(n: number): string {
  if (n === 0) return '$0'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1).replace('.0', '')}M`
  return `$${Math.round(n / 1000)}k`
}

/** Área azul de ventas por día. Solo presentación: recibe los datos ya calculados. */
export default function VentasChart({ datos }: { datos: VentaDia[] }) {
  const [sel, setSel] = useState<number | null>(null)
  const caja = useRef<HTMLDivElement>(null)
  const [W, setW] = useState(560)
  // El SVG usa el ancho real de la tarjeta para que los textos no se encojan.
  useLayoutEffect(() => {
    const el = caja.current
    if (!el) return
    const medir = () => setW(Math.max(280, Math.round(el.clientWidth)))
    medir()
    const ro = new ResizeObserver(medir)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const X1 = W - 40
  const techo = techoBonito(Math.max(...datos.map((d) => d.total)))
  const n = datos.length
  const x = (i: number) => X0 + (i * (X1 - X0)) / (n - 1)
  const y = (v: number) => Y1 - (v / techo) * (Y1 - Y0)
  const puntos = datos.map((d, i) => `${x(i).toFixed(1)} ${y(d.total).toFixed(1)}`)
  const linea = 'M' + puntos.join(' L')
  const area = `${linea} L${x(n - 1)} ${Y1} L${x(0)} ${Y1} Z`
  const activo = sel ?? n - 1
  const d = datos[activo]
  const tip = `${cop(d.total)} · ${fmtFecha(d.fecha)}`
  const tipW = tip.length * 6.6 + 18
  const tipX = Math.min(Math.max(x(activo) - tipW / 2, X0), W - tipW)
  const tipY = Math.max(y(d.total) - 38, 2)
  const ticksY = [0, 1, 2, 3, 4].map((k) => (techo * k) / 4)
  const ticksX = [0, 10, 20, n - 1]

  function mover(e: React.PointerEvent<SVGSVGElement>) {
    const r = e.currentTarget.getBoundingClientRect()
    const px = ((e.clientX - r.left) / r.width) * W
    const i = Math.round(((px - X0) / (X1 - X0)) * (n - 1))
    setSel(Math.min(Math.max(i, 0), n - 1))
  }

  return (
    <div ref={caja}>
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      style={{ display: 'block', touchAction: 'pan-y' }}
      onPointerMove={mover}
      onPointerLeave={() => setSel(null)}
      role="img"
      aria-label="Ventas por día de los últimos 30 días"
    >
      <defs>
        <linearGradient id="ventas-area" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="var(--accent)" stopOpacity="0.28" />
          <stop offset="1" stopColor="var(--accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g stroke="var(--border-subtle)" strokeWidth="1">
        {ticksY.map((t) => (
          <line key={t} x1={X0} x2={X1 + 10} y1={y(t)} y2={y(t)} />
        ))}
      </g>
      <g fill="var(--text-tertiary)" fontFamily="Inter" fontSize="11" style={{ fontVariantNumeric: 'tabular-nums' }}>
        {ticksY.map((t) => (
          <text key={t} x={X0 - 8} y={y(t) + 4} textAnchor="end">
            {corto(t)}
          </text>
        ))}
        {ticksX.map((i, k) => (
          <text
            key={i}
            x={x(i)}
            y={198}
            textAnchor={k === 0 ? 'start' : k === ticksX.length - 1 ? 'end' : 'middle'}
          >
            {fmtFecha(datos[i].fecha)}
          </text>
        ))}
      </g>
      <path d={area} fill="url(#ventas-area)" />
      <path d={linea} fill="none" stroke="var(--accent)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <line x1={x(activo)} x2={x(activo)} y1={y(d.total)} y2={Y1} stroke="var(--accent)" strokeOpacity="0.25" strokeDasharray="3 3" />
      <circle cx={x(activo)} cy={y(d.total)} r="4.5" fill="var(--accent)" stroke="var(--surface-1)" strokeWidth="2" />
      <g>
        <rect x={tipX} y={tipY} width={tipW} height="26" rx="6" fill="#0e1626" />
        <text
          x={tipX + tipW / 2}
          y={tipY + 17}
          fill="#fff"
          fontFamily="Inter"
          fontSize="11.5"
          fontWeight="600"
          textAnchor="middle"
        >
          {tip}
        </text>
      </g>
    </svg>
    </div>
  )
}

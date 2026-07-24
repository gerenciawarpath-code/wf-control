/**
 * Logo WF forjado: letras con gradiente #4DA6FF → #1466FF → #0052E0,
 * trazos con esquinas en inglete (afiladas, no redondeadas) y brillo azul.
 */
export default function LogoWF({ altura = 24 }: { altura?: number }) {
  const ancho = (altura * 48) / 24
  return (
    <svg
      width={ancho}
      height={altura}
      viewBox="0 0 48 24"
      fill="none"
      className="wf-logo"
      role="img"
      aria-label="Warpath Forge"
    >
      <defs>
        <linearGradient id="wf-grad" x1="0" y1="0" x2="48" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4DA6FF" />
          <stop offset="0.5" stopColor="#1466FF" />
          <stop offset="1" stopColor="#0052E0" />
        </linearGradient>
      </defs>
      {/* W — trazo continuo con uniones en inglete */}
      <path
        d="M4 3 L9.5 21 L16 7.5 L22.5 21 L28 3"
        stroke="url(#wf-grad)"
        strokeWidth="4"
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
      {/* F — barras rectas, extremos rectos */}
      <path d="M36 21 V3 H46" stroke="url(#wf-grad)" strokeWidth="4" strokeLinecap="butt" strokeLinejoin="miter" />
      <path d="M36 11.5 H44" stroke="url(#wf-grad)" strokeWidth="4" strokeLinecap="butt" />
    </svg>
  )
}

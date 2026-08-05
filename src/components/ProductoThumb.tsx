import { Package } from 'lucide-react'

/** Miniatura de producto; si no hay foto, placeholder elegante con Package. */
export default function ProductoThumb({
  url,
  size = 40,
}: {
  url?: string | null
  size?: number
}) {
  if (url) {
    return (
      <img
        src={url}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-control object-cover"
        style={{ width: size, height: size }}
      />
    )
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-control bg-card2 text-ink-faint"
      style={{ width: size, height: size }}
    >
      <Package size={Math.round(size * 0.5)} strokeWidth={1.75} />
    </div>
  )
}

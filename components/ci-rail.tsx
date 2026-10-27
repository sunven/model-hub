import type { CSSProperties } from 'react'
import type { CiDomain, CiStat } from '@/lib/types'

function clamp(value: number) {
  return Math.min(1, Math.max(0, value))
}

export function CiRail({
  stat,
  domain,
  width = 40,
}: {
  stat: CiStat
  domain: CiDomain | null
  width?: number
}) {
  if (!domain) return null
  const span = Math.max(domain.max - domain.min, 0.001)
  const start = clamp((stat.ciLow - domain.min) / span)
  const end = clamp((stat.ciHigh - domain.min) / span)
  const dot = clamp((stat.rating - domain.min) / span)
  const style = {
    width,
    '--ci-start': `${start * 100}%`,
    '--ci-width': `${Math.max((end - start) * 100, 0.5)}%`,
    '--ci-dot': `${dot * 100}%`,
  } as CSSProperties

  return (
    <span className="ci-rail" style={style} aria-hidden="true">
      <span className="ci-range" />
      <span className="ci-dot" />
    </span>
  )
}

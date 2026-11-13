import { Badge } from '@astryxdesign/core/Badge'
import { Tooltip } from '@astryxdesign/core/Tooltip'
import { availabilityLabel } from '@/lib/format'
import type { Availability, ModelRow } from '@/lib/types'

type BadgeItem = {
  label: string
  variant: 'success' | 'warning' | 'error' | 'info' | 'blue' | 'neutral'
  hint?: string
}

const AVAILABILITY_BADGE: Record<Availability, BadgeItem> = {
  available: { label: '可用', variant: 'success' },
  mixed: { label: '混合', variant: 'warning' },
  deprecated: { label: '已弃用', variant: 'error' },
  open_weights_only: { label: '可自托管', variant: 'info' },
  unknown: { label: '未知', variant: 'neutral' },
}

export function StatusBadges({
  availability,
  releaseBadges,
  openWeights,
  unmarked = false,
  exceptionsOnly = false,
}: {
  availability: Availability
  releaseBadges: string[]
  openWeights: boolean
  unmarked?: boolean
  exceptionsOnly?: boolean
}) {
  const items: BadgeItem[] = []
  if (availability === 'available') {
    if (releaseBadges.length === 0 && !exceptionsOnly) {
      items.push({
        ...AVAILABILITY_BADGE[availability],
        label: availabilityLabel(availability),
        hint: unmarked ? '可用（上游未标记状态）' : '可用',
      })
    }
  } else {
    items.push({ ...AVAILABILITY_BADGE[availability], label: availabilityLabel(availability) })
  }
  for (const badge of releaseBadges) {
    items.push({
      label: badge === 'beta' ? 'Beta' : badge === 'alpha' ? 'Alpha' : badge,
      variant: 'warning',
    })
  }
  if (openWeights) items.push({ label: '开源', variant: 'blue' })

  return (
    <>
      {items.map(item => {
        const badge = <Badge key={`${item.label}-${item.variant}`} label={item.label} variant={item.variant} />
        return item.hint ? (
          <Tooltip key={`${item.label}-${item.variant}`} content={item.hint}>
            {badge}
          </Tooltip>
        ) : (
          badge
        )
      })}
    </>
  )
}

export function RowBadges({ row, exceptionsOnly = false }: { row: ModelRow; exceptionsOnly?: boolean }) {
  return (
    <StatusBadges
      availability={row.availability}
      releaseBadges={row.releaseBadges}
      openWeights={row.openWeights}
      unmarked={row.unmarked}
      exceptionsOnly={exceptionsOnly}
    />
  )
}

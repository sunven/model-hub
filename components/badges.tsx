import { Badge } from '@astryxdesign/core/Badge'
import { Tooltip } from '@astryxdesign/core/Tooltip'
import { availabilityLabel, availabilityVariant, offerStatusLabel } from '@/lib/format'
import type { Availability, ModelRow } from '@/lib/types'

type BadgeItem = {
  label: string
  variant: 'success' | 'warning' | 'error' | 'info' | 'blue' | 'neutral'
  hint?: string
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
        label: availabilityLabel(availability),
        variant: availabilityVariant(availability),
        hint: unmarked ? '可用（上游未标记状态）' : '可用',
      })
    }
  } else {
    items.push({ label: availabilityLabel(availability), variant: availabilityVariant(availability) })
  }
  for (const badge of releaseBadges) {
    items.push({ label: offerStatusLabel(badge as 'beta' | 'alpha'), variant: 'warning' })
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

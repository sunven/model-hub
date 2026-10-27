import { availabilityClass, availabilityLabel } from '@/lib/format'
import type { Availability, ModelRow } from '@/lib/types'

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
  const items: { label: string; className: string; title?: string; dashed?: boolean }[] = []
  if (availability === 'available') {
    if (releaseBadges.length === 0 && !exceptionsOnly) {
      items.push({
        label: availabilityLabel(availability),
        className: availabilityClass(availability),
        title: unmarked ? '可用（上游未标记状态）' : '可用',
        dashed: unmarked,
      })
    }
  } else {
    items.push({ label: availabilityLabel(availability), className: availabilityClass(availability) })
  }
  for (const badge of releaseBadges) {
    items.push({ label: badge === 'beta' ? 'Beta' : badge === 'alpha' ? 'Alpha' : badge, className: 'beta' })
  }
  if (openWeights) items.push({ label: '开源', className: 'ow' })
  return (
    <>
      {items.map(item => (
        <span
          key={`${item.label}-${item.className}`}
          className={`badge ${item.className}`}
          title={item.title}
          style={item.dashed ? { borderStyle: 'dashed' } : undefined}
        >
          {item.label}
        </span>
      ))}
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

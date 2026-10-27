import { availabilityClass, availabilityLabel } from '@/lib/format'
import type { Availability, ModelRow } from '@/lib/types'

export function StatusBadges({
  availability,
  releaseBadges,
  openWeights,
  unmarked = false,
}: {
  availability: Availability
  releaseBadges: string[]
  openWeights: boolean
  unmarked?: boolean
}) {
  const items: { label: string; className: string; title?: string; dashed?: boolean }[] = []
  if (availability === 'mixed') items.push({ label: '混合', className: 'mixed' })
  if (availability === 'deprecated') items.push({ label: '已弃用', className: 'deprecated' })
  if (availability === 'open_weights_only') items.push({ label: '可自托管', className: 'ow' })
  if (availability === 'unknown') items.push({ label: '未知', className: 'mixed' })
  if (availability === 'available' && releaseBadges.length === 0) {
    items.push({
      label: availabilityLabel(availability),
      className: availabilityClass(availability),
      title: unmarked ? '可用（上游未标记状态）' : '可用',
      dashed: unmarked,
    })
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

export function RowBadges({ row }: { row: ModelRow }) {
  return (
    <StatusBadges
      availability={row.availability}
      releaseBadges={row.releaseBadges}
      openWeights={row.openWeights}
      unmarked={row.unmarked}
    />
  )
}

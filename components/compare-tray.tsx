'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { useCompare } from './compare-provider'
import { COMPARE_LIMIT, compareHref } from '@/lib/compare-set'

export function CompareTray() {
  const { selected, modelIndex, remove, clear, showToast } = useCompare()
  const pathname = usePathname()
  const byId = useMemo(() => new Map(modelIndex.map(m => [m.id, m])), [modelIndex])

  if (pathname.startsWith('/compare') || selected.length === 0) return null
  const href = compareHref(selected)

  return (
    <div className="compare-tray" role="region" aria-label="对比托盘">
      <span className="tray-label">对比 {selected.length}/{COMPARE_LIMIT}</span>
      {selected.map(id => (
        <span className="tray-chip" key={id}>
          {byId.get(id)?.name ?? id}
          <button type="button" onClick={() => remove(id)} aria-label={`移除 ${byId.get(id)?.name ?? id}`}>
            ×
          </button>
        </span>
      ))}
      {selected.length >= 2 ? (
        <Link className="tray-btn" href={href}>去对比</Link>
      ) : (
        <button type="button" className="tray-btn" onClick={() => showToast('再选一个模型就能对比')}>
          去对比
        </button>
      )}
      <button type="button" className="tray-clear" onClick={clear}>清空</button>
    </div>
  )
}

export function CompareButton({
  modelId,
  small = false,
  primary = false,
  short = false,
}: {
  modelId: string
  small?: boolean
  primary?: boolean
  short?: boolean
}) {
  const { selected, ready, toggle } = useCompare()
  const active = selected.includes(modelId)
  const className = ['btn', small && 'small', (active || primary) && 'primary'].filter(Boolean).join(' ')
  const label = active ? (short ? '已加入' : '已加入对比') : short ? '对比' : '加入对比'
  return (
    <button type="button" className={className} onClick={() => toggle(modelId)} disabled={!ready}>
      {label}
    </button>
  )
}

export function CompareCheckbox({ modelId, label }: { modelId: string; label: string }) {
  const { selected, ready, toggle } = useCompare()
  return (
    <input
      type="checkbox"
      checked={selected.includes(modelId)}
      disabled={!ready}
      onChange={() => toggle(modelId)}
      aria-label={label}
    />
  )
}

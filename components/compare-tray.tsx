'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCompare } from './compare-provider'

export function CompareTray() {
  const { selected, modelIndex, remove, clear, showToast } = useCompare()
  const pathname = usePathname()

  if (pathname.startsWith('/compare') || selected.length === 0) return null
  const byId = new Map(modelIndex.map(m => [m.id, m]))
  const compareHref = `/compare?models=${selected.map(encodeURIComponent).join(',')}`

  return (
    <div className="compare-tray" role="region" aria-label="对比托盘">
      <span className="tray-label">对比 {selected.length}/3</span>
      {selected.map(id => (
        <span className="tray-chip" key={id}>
          {byId.get(id)?.name ?? id}
          <button type="button" onClick={() => remove(id)} aria-label={`移除 ${byId.get(id)?.name ?? id}`}>
            ×
          </button>
        </span>
      ))}
      {selected.length >= 2 ? (
        <Link className="tray-btn" href={compareHref}>去对比</Link>
      ) : (
        <button type="button" className="tray-btn" onClick={() => showToast('再选一个模型就能对比')}>
          去对比
        </button>
      )}
      <button
        type="button"
        style={{ border: 'none', background: 'transparent', color: '#a3a3a3', fontSize: 10, padding: '0 3px' }}
        onClick={clear}
      >
        清空
      </button>
    </div>
  )
}

export function CompareButton({ modelId, small = false }: { modelId: string; small?: boolean }) {
  const { selected, toggle } = useCompare()
  const active = selected.includes(modelId)
  return (
    <button
      type="button"
      className={`btn ${active ? 'primary' : ''}`}
      style={small ? { padding: '4px 8px', fontSize: 10.5 } : undefined}
      onClick={() => toggle(modelId)}
    >
      {active ? '已加入对比' : '加入对比'}
    </button>
  )
}

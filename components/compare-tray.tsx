'use client'

import { usePathname } from 'next/navigation'
import { useMemo } from 'react'
import { Button } from '@astryxdesign/core/Button'
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput'
import { HStack } from '@astryxdesign/core/HStack'
import { Text } from '@astryxdesign/core/Text'
import { Token } from '@astryxdesign/core/Token'
import { useCompare } from './compare-provider'
import { COMPARE_LIMIT, compareHref } from '@/lib/compare-set'

export function CompareTray() {
  const { selected, modelIndex, remove, clear, showToast } = useCompare()
  const pathname = usePathname()
  const byId = useMemo(() => new Map(modelIndex.map(m => [m.id, m])), [modelIndex])

  if (pathname.startsWith('/compare') || selected.length === 0) return null
  const href = compareHref(selected)

  return (
    <HStack
      className="compare-tray"
      role="region"
      aria-label="对比托盘"
      gap={2}
      vAlign="center"
      wrap="wrap"
    >
      <Text type="label">对比 {selected.length}/{COMPARE_LIMIT}</Text>
      {selected.map(id => (
        <Token
          key={id}
          label={byId.get(id)?.name ?? id}
          size="sm"
          onRemove={() => remove(id)}
        />
      ))}
      {selected.length >= 2 ? (
        <Button label="去对比" href={href} size="sm" variant="primary" />
      ) : (
        <Button label="去对比" size="sm" variant="primary" onClick={() => showToast('再选一个模型就能对比')} />
      )}
      <Button label="清空" size="sm" variant="ghost" onClick={clear} />
    </HStack>
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
  const label = active ? (short ? '已加入' : '已加入对比') : short ? '对比' : '加入对比'
  return (
    <Button
      label={label}
      size={small ? 'sm' : 'md'}
      variant={active || primary ? 'primary' : 'secondary'}
      isDisabled={!ready}
      onClick={() => toggle(modelId)}
    />
  )
}

export function CompareCheckbox({ modelId, label }: { modelId: string; label: string }) {
  const { selected, ready, toggle } = useCompare()
  return (
    <CheckboxInput
      label={label}
      isLabelHidden
      size="sm"
      value={selected.includes(modelId)}
      isDisabled={!ready}
      onChange={() => toggle(modelId)}
    />
  )
}

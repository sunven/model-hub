'use client'

import { useMemo, useState } from 'react'
import { Button } from '@astryxdesign/core/Button'
import { CheckboxList, CheckboxListItem } from '@astryxdesign/core/CheckboxList'
import { Collapsible } from '@astryxdesign/core/Collapsible'
import { Divider } from '@astryxdesign/core/Divider'
import { HStack } from '@astryxdesign/core/HStack'
import { MultiSelector } from '@astryxdesign/core/MultiSelector'
import { Stack } from '@astryxdesign/core/Stack'
import { Switch } from '@astryxdesign/core/Switch'
import { Text } from '@astryxdesign/core/Text'
import type { ExploreQuery } from '@/lib/explore-query'
import type { ModelRow } from '@/lib/types'

const primaryLabs = ['Anthropic', 'OpenAI', 'Google', 'Alibaba / Qwen', 'Meta', 'DeepSeek', 'Moonshot / Kimi']

export default function ExploreFilters({ models, query, update, reset, onClose }: {
  models: ModelRow[]
  query: ExploreQuery
  update: (patch: Partial<ExploreQuery>) => void
  reset: () => void
  onClose: () => void
}) {
  const allLabs = useMemo(() => [...new Set(models.map(m => m.lab))].sort((a, b) => a.localeCompare(b, 'zh')), [models])
  const allProviders = useMemo(
    () => [...new Set(models.flatMap(m => m.providerNames))].sort((a, b) => a.localeCompare(b)),
    [models],
  )
  const [showAllLabs, setShowAllLabs] = useState(false)
  const labCounts = useMemo(() => {
    const counts = new Map<string, number>()
    for (const model of models) counts.set(model.lab, (counts.get(model.lab) ?? 0) + 1)
    return counts
  }, [models])
  const visibleLabs = showAllLabs ? allLabs : [
    ...primaryLabs.filter(lab => labCounts.has(lab)),
    ...allLabs.filter(lab => query.labs.includes(lab) && !primaryLabs.includes(lab)),
  ]

  return (
    <>
      <HStack justify="between" vAlign="center">
        <Text type="label" weight="semibold">筛选</Text>
        <HStack gap={1}>
          <Button label="清除" size="sm" variant="ghost" onClick={reset} />
          <Button
            label="关闭"
            size="sm"
            variant="secondary"
            className="mobile-only"
            onClick={onClose}
          />
        </HStack>
      </HStack>

      <CheckboxList
        label="实验室"
        density="compact"
        value={query.labs}
        onChange={labs => update({ labs })}
      >
        {visibleLabs.map(lab => (
          <CheckboxListItem key={lab} value={lab} label={lab} endContent={<Text type="supporting" hasTabularNumbers>{labCounts.get(lab)}</Text>} />
        ))}
      </CheckboxList>
      <Button label={showAllLabs ? '收起实验室' : `查看全部 ${allLabs.length} 家实验室`} variant="ghost" size="sm" onClick={() => setShowAllLabs(value => !value)} aria-expanded={showAllLabs} />
      <Divider />

      <Collapsible trigger="托管商（更多）" defaultIsOpen={false}>
        <Stack gap={3}>
          <Text type="supporting">有任一选中托管商的报价</Text>
          <MultiSelector
            label="托管商"
            options={allProviders.map(provider => ({ value: provider, label: provider }))}
            value={query.providers}
            onChange={providers => update({ providers })}
            hasSearch
            hasClear
            triggerDisplay="count"
            placeholder="不限"
            searchPlaceholder="搜索托管商"
          />
          <Switch
            label="仅网关（无第一方 / 云报价）"
            size="sm"
            value={query.gatewayOnly}
            onChange={gatewayOnly => update({ gatewayOnly })}
          />
        </Stack>
      </Collapsible>

    </>
  )
}

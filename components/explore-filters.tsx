'use client'

import { useMemo } from 'react'
import { Button } from '@astryxdesign/core/Button'
import { CheckboxList, CheckboxListItem } from '@astryxdesign/core/CheckboxList'
import { Collapsible } from '@astryxdesign/core/Collapsible'
import { HStack } from '@astryxdesign/core/HStack'
import { MultiSelector } from '@astryxdesign/core/MultiSelector'
import { Selector } from '@astryxdesign/core/Selector'
import { Stack } from '@astryxdesign/core/Stack'
import { Switch } from '@astryxdesign/core/Switch'
import { Text } from '@astryxdesign/core/Text'
import { CONTEXT_OPTIONS, PRICE_OPTIONS, type ExploreQuery } from '@/lib/explore-query'
import { fmtContext } from '@/lib/format'
import type { ModelRow } from '@/lib/types'

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
        {allLabs.map(lab => (
          <CheckboxListItem key={lab} value={lab} label={lab} />
        ))}
      </CheckboxList>

      <Collapsible trigger="托管商（更多）" defaultIsOpen={false}>
        <Stack gap={2}>
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

      <Selector
        label="最高输出价"
        options={PRICE_OPTIONS.map(value => ({ value: String(value), label: `≤ $${value} / 1M` }))}
        value={query.maxOutput === null ? null : String(query.maxOutput)}
        onChange={value => update({ maxOutput: value ? Number(value) : null })}
        hasClear
        placeholder="不限"
      />

      <Selector
        label="最低上下文"
        options={CONTEXT_OPTIONS.map(value => ({ value: String(value), label: `≥ ${fmtContext(value)}` }))}
        value={query.minContext === null ? null : String(query.minContext)}
        onChange={value => update({ minContext: value ? Number(value) : null })}
        hasClear
        placeholder="不限"
      />

      <Stack gap={2}>
        <Text type="label">能力 / 状态</Text>
        <Switch
          label="支持推理"
          size="sm"
          labelPosition="start"
          labelSpacing="spread"
          width="100%"
          value={query.reasoning}
          onChange={reasoning => update({ reasoning })}
        />
        <Switch
          label="开源权重"
          size="sm"
          labelPosition="start"
          labelSpacing="spread"
          width="100%"
          value={query.openWeights}
          onChange={openWeights => update({ openWeights })}
        />
        <Switch
          label="仅稳定版"
          size="sm"
          labelPosition="start"
          labelSpacing="spread"
          width="100%"
          value={query.stableOnly}
          onChange={stableOnly => update({ stableOnly })}
        />
        <Switch
          label="只看有评测"
          size="sm"
          labelPosition="start"
          labelSpacing="spread"
          width="100%"
          value={query.hasArena}
          onChange={hasArena => update({ hasArena })}
        />
      </Stack>
    </>
  )
}

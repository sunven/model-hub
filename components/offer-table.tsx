'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@astryxdesign/core/Badge'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack } from '@astryxdesign/core/HStack'
import { Section } from '@astryxdesign/core/Section'
import { Stack } from '@astryxdesign/core/Stack'
import { Switch } from '@astryxdesign/core/Switch'
import { Table, proportional, type TableColumn } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import type { Offer } from '@/lib/types'
import type { OfferStatus } from '@/lib/snapshot'
import { compareOffers } from '@/lib/offers'
import {
  fmtContext,
  fmtMoney,
  offerStatusLabel,
  providerKindLabel,
  reasoningText,
} from '@/lib/format'

type StatusVariant = 'success' | 'warning' | 'error'

const STATUS_VARIANT: Record<OfferStatus, StatusVariant> = {
  available_unmarked: 'success',
  beta: 'warning',
  alpha: 'warning',
  deprecated: 'error',
}

interface OfferRow extends Record<string, unknown> {
  id: string
  providerName: string
  providerModelId: string
  kind: string
  statusLabel: string
  statusVariant: StatusVariant
  input: string
  output: string
  cache: string
  context: string
  reason: string
}

const COLUMNS: TableColumn<OfferRow>[] = [
  {
    key: 'provider',
    header: '托管商',
    width: proportional(1.4, { minWidth: 160 }),
    renderCell: row => (
      <Stack gap={0}>
        <Text weight="medium">{row.providerName}</Text>
        <Text type="supporting">{row.providerModelId}</Text>
      </Stack>
    ),
  },
  { key: 'kind', header: '类型', width: proportional(0.8, { minWidth: 80 }) },
  {
    key: 'status',
    header: '状态',
    width: proportional(0.8, { minWidth: 80 }),
    renderCell: row => <Badge label={row.statusLabel} variant={row.statusVariant} />,
  },
  {
    key: 'input',
    header: '输入',
    align: 'end',
    width: proportional(0.8, { minWidth: 80 }),
    renderCell: row => <Text hasTabularNumbers>{row.input}</Text>,
  },
  {
    key: 'output',
    header: '输出',
    align: 'end',
    width: proportional(0.8, { minWidth: 80 }),
    renderCell: row => <Text hasTabularNumbers>{row.output}</Text>,
  },
  {
    key: 'cache',
    header: '缓存',
    align: 'end',
    width: proportional(0.8, { minWidth: 80 }),
    renderCell: row => <Text hasTabularNumbers>{row.cache}</Text>,
  },
  {
    key: 'context',
    header: '上下文',
    align: 'end',
    width: proportional(0.8, { minWidth: 80 }),
    renderCell: row => <Text hasTabularNumbers>{row.context}</Text>,
  },
  { key: 'reason', header: '推理', width: proportional(1.4, { minWidth: 160 }) },
]

export function OfferTable({ offers, hasPrimary }: { offers: Offer[]; hasPrimary: boolean }) {
  const [showGateways, setShowGateways] = useState(!hasPrimary)
  const [showDeprecated, setShowDeprecated] = useState(false)

  const rows = useMemo(
    () =>
      offers
        .filter(o => (showGateways || o.providerKind !== 'gateway') && (showDeprecated || o.status !== 'deprecated'))
        .sort(compareOffers)
        .map<OfferRow>(offer => ({
          id: offer.id,
          providerName: offer.providerName,
          providerModelId: offer.providerModelId,
          kind: providerKindLabel(offer.providerKind),
          statusLabel: offerStatusLabel(offer.status),
          statusVariant: STATUS_VARIANT[offer.status],
          input: fmtMoney(offer.price?.input),
          output: fmtMoney(offer.price?.output),
          cache: fmtMoney(offer.price?.cacheRead),
          context: fmtContext(offer.limits.context),
          reason: reasoningText(offer.capabilities.reasoningOptions, offer.capabilities.reasoning),
        })),
    [offers, showGateways, showDeprecated],
  )

  return (
    <Section padding={4} role="region" aria-label="托管报价">
      <Stack gap={3}>
        <HStack justify="between" align="start" wrap="wrap" gap={3}>
          <Stack gap={0.5}>
            <Heading level={2}>托管报价</Heading>
            <Text type="supporting">{rows.length} 条可见 · 默认隐藏网关 / 已弃用</Text>
          </Stack>
          <HStack gap={3} wrap="wrap">
            <Switch
              label="显示网关报价"
              size="sm"
              value={showGateways}
              onChange={setShowGateways}
            />
            <Switch
              label="显示已弃用报价"
              size="sm"
              value={showDeprecated}
              onChange={setShowDeprecated}
            />
          </HStack>
        </HStack>

        {!hasPrimary && (
          <Text type="supporting">
            该模型目前只有网关报价；默认展示，避免误以为没有可用报价。
          </Text>
        )}

        {rows.length ? (
          <Table
            data={rows}
            columns={COLUMNS}
            idKey="id"
            density="compact"
            dividers="rows"
            hasHover
            aria-label="托管报价，按第一方、云平台、网关排序"
          />
        ) : (
          <EmptyState
            title="当前筛选下没有可见报价"
            description="打开上面的开关查看网关 / 已弃用报价。"
            isCompact
          />
        )}

        <Text type="supporting">
          价格单位 USD / 1M tokens；“未公布”不是 $0；“免费”才表示 0。默认只展示第一方 + 主要云平台。
        </Text>
      </Stack>
    </Section>
  )
}

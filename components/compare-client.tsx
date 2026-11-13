'use client'

import { useMemo, type ReactNode } from 'react'
import { Button } from '@astryxdesign/core/Button'
import { Card } from '@astryxdesign/core/Card'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack } from '@astryxdesign/core/HStack'
import { Link } from '@astryxdesign/core/Link'
import { List, ListItem } from '@astryxdesign/core/List'
import { Spinner } from '@astryxdesign/core/Spinner'
import { Stack } from '@astryxdesign/core/Stack'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
} from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import { useCompare } from './compare-provider'
import { RowBadges } from './badges'
import { ScorePill } from './score-pill'
import { CnyRange } from './cny-price'
import { COMPARE_LIMIT } from '@/lib/compare-set'
import { fmtContext, fmtDate, fmtRange, scoreMeta } from '@/lib/format'
import { AA_LEADERBOARD_URL, modelHref } from '@/lib/site'
import type { FxConfig } from '@/lib/snapshot'
import type { BoardDomains, ModelRow } from '@/lib/types'

type Field = {
  label: string
  value: (model: ModelRow) => string
  render: (model: ModelRow, fx: FxConfig, domains: BoardDomains) => ReactNode
  numeric?: boolean
}

const FIELDS: Field[] = [
  {
    label: '实验室',
    value: m => m.lab,
    render: m => m.lab,
  },
  {
    label: '状态',
    value: m => `${m.availability}|${m.releaseBadges.join(',')}|${m.openWeights}`,
    render: m => <RowBadges row={m} />,
  },
  {
    label: '输入价格',
    numeric: true,
    value: m => (m.price ? `${fmtRange(m.price.inputMin, m.price.inputMax)}/1M` : '未公布'),
    render: (m, fx) => {
      if (!m.price) return '未公布'
      return (
        <Stack gap={0}>
          <Text hasTabularNumbers>{fmtRange(m.price.inputMin, m.price.inputMax)} / 1M</Text>
          <CnyRange min={m.price.inputMin} max={m.price.inputMax} fx={fx} className="cell-block" />
        </Stack>
      )
    },
  },
  {
    label: '输出价格',
    numeric: true,
    value: m => (m.price ? `${fmtRange(m.price.outputMin, m.price.outputMax)}/1M` : '未公布'),
    render: (m, fx) => {
      if (!m.price) return '未公布'
      return (
        <Stack gap={0}>
          <Text hasTabularNumbers>{fmtRange(m.price.outputMin, m.price.outputMax)} / 1M</Text>
          <CnyRange min={m.price.outputMin} max={m.price.outputMax} fx={fx} className="cell-block" />
        </Stack>
      )
    },
  },
  {
    label: '上下文',
    numeric: true,
    value: m => fmtContext(m.context),
    render: m => <Text hasTabularNumbers>{fmtContext(m.context)}</Text>,
  },
  {
    label: '推理',
    value: m => m.reasoningLabel,
    render: m => m.reasoningLabel,
  },
  {
    label: 'Arena text',
    value: m => (m.text ? `${m.text.rating.toFixed(1)}|${m.text.rank}|${m.text.condition}` : '未收录'),
    render: (m, fx, domains) => (
      <Stack gap={0}>
        <ScorePill score={m.text} domain={domains.text} />
        {m.text && <Text type="supporting">{scoreMeta(m.text)}</Text>}
      </Stack>
    ),
  },
  {
    label: 'Arena webdev',
    value: m => (m.webdev ? `${m.webdev.rating.toFixed(1)}|${m.webdev.rank}|${m.webdev.condition}` : '未收录'),
    render: (m, fx, domains) => (
      <Stack gap={0}>
        <ScorePill score={m.webdev} domain={domains.webdev} />
        {m.webdev && <Text type="supporting">{scoreMeta(m.webdev)}</Text>}
      </Stack>
    ),
  },
  {
    label: '开源权重',
    value: m => (m.openWeights ? '是' : '否'),
    render: m => (m.openWeights ? '是' : '否'),
  },
  {
    label: '发布',
    value: m => fmtDate(m.releaseDate),
    render: m => fmtDate(m.releaseDate),
  },
  {
    label: 'AA',
    value: () => 'external',
    render: () => (
      <Button
        label="外部链接"
        href={AA_LEADERBOARD_URL}
        target="_blank"
        rel="noopener noreferrer"
        size="sm"
        variant="secondary"
      />
    ),
  },
]

export function CompareClient({
  models,
  domains,
  fx,
  picks,
}: {
  models: ModelRow[]
  domains: BoardDomains
  fx: FxConfig
  picks: ModelRow[]
}) {
  const compare = useCompare()
  const byId = useMemo(() => new Map(models.map(m => [m.id, m])), [models])

  if (!compare.ready) {
    return (
      <Stack className="sheet-inner" gap={2} hAlign="center">
        <Spinner />
        <Text type="supporting">正在加载对比…</Text>
      </Stack>
    )
  }

  const selected = compare.selected.map(id => byId.get(id)).filter(Boolean) as ModelRow[]

  if (!selected.length) {
    return (
      <Stack className="sheet-inner" gap={4}>
        <EmptyState
          headingLevel={1}
          title="先选两个模型"
          description={`从模型表勾选，或在详情页点「加入对比」。最多 ${COMPARE_LIMIT} 个。`}
          actions={<Button label="去模型表" href="/" variant="primary" />}
        />
        <Card padding={4}>
          <Stack gap={2}>
            <HStack justify="between" vAlign="center" gap={2} wrap="wrap">
              <Heading level={2}>从 Arena text 排名开始</Heading>
              <Text type="supporting">最多选择 {COMPARE_LIMIT} 个</Text>
            </HStack>
            <List hasDividers density="compact">
              {picks.map(model => (
                <ListItem
                  key={model.id}
                  label={model.name}
                  description={model.lab}
                  startContent={<Text weight="medium" hasTabularNumbers>#{model.text!.rank}</Text>}
                  endContent={
                    <HStack gap={2} vAlign="center">
                      <Text weight="semibold" hasTabularNumbers>{model.text!.rating.toFixed(1)}</Text>
                      <Text color="accent" weight="medium">加入</Text>
                    </HStack>
                  }
                  onClick={() => compare.toggle(model.id)}
                />
              ))}
            </List>
          </Stack>
        </Card>
      </Stack>
    )
  }

  const values = FIELDS.map(field => selected.map(m => field.value(m)))
  const diffs = values.map(vals => new Set(vals).size > 1)
  const diffCount = diffs.filter(Boolean).length
  const finding =
    selected.length >= 2
      ? `已选 ${selected.length}/${COMPARE_LIMIT} 个模型；${FIELDS.length} 个字段中 ${diffCount} 个不同。差异只表示取值不同，不判定优劣。`
      : `已选 1/${COMPARE_LIMIT} 个模型；再选一个就能对比。`

  return (
    <Stack className="sheet-inner" gap={4}>
      <HStack className="compare-head" justify="between" align="start" wrap="wrap" gap={3}>
        <Stack gap={1}>
          <Heading level={1}>并排比较</Heading>
          <Text type="large">{finding}</Text>
        </Stack>
        <HStack gap={2} wrap="wrap">
          <Button label="清空全部" variant="ghost" onClick={() => compare.clear()} />
          <Button
            label={selected.length < COMPARE_LIMIT ? '添加模型' : '模型目录'}
            href="/"
            variant="secondary"
          />
        </HStack>
      </HStack>

      <Table
        density="compact"
        dividers="rows"
        aria-label="所选模型并排对比"
        className="compare-table"
      >
        <colgroup>
          <col style={{ width: '14%' }} />
          {selected.map(m => <col key={m.id} />)}
        </colgroup>
        <TableHeader>
          <TableRow>
            <TableHeaderCell>字段</TableHeaderCell>
            {selected.map(m => (
              <TableHeaderCell key={m.id}>
                <Stack gap={1}>
                  <Link href={modelHref(m.canonicalId)} weight="medium">{m.name}</Link>
                  <HStack gap={2} vAlign="center" wrap="wrap">
                    <Text type="supporting">{m.lab}</Text>
                    <Button label="移除" size="sm" variant="ghost" onClick={() => compare.remove(m.id)} />
                  </HStack>
                </Stack>
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {FIELDS.map((field, i) => (
            <TableRow key={field.label}>
              <TableCell>
                <Text weight={diffs[i] ? 'semibold' : 'normal'}>{field.label}</Text>
              </TableCell>
              {selected.map((m, j) => (
                <TableCell key={m.id}>
                  <Text as="div" hasTabularNumbers={field.numeric}>
                    {field.render(m, fx, domains)}
                  </Text>
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Text type="supporting">
        价格 USD / 1M tokens；CNY 由本地汇率表折算，仅供参考。完整报价见模型详情。Arena text / webdev
        不可跨榜比较；加粗只表示取值不同，不判定赢家。
      </Text>
    </Stack>
  )
}

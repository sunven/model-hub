'use client'

import { memo, useMemo, useState, useSyncExternalStore, type ComponentProps } from 'react'
import dynamic from 'next/dynamic'
import { Badge } from '@astryxdesign/core/Badge'
import { Button } from '@astryxdesign/core/Button'
import { Card } from '@astryxdesign/core/Card'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack } from '@astryxdesign/core/HStack'
import { Icon } from '@astryxdesign/core/Icon'
import { Link } from '@astryxdesign/core/Link'
import { Selector } from '@astryxdesign/core/Selector'
import { Stack, StackItem } from '@astryxdesign/core/Stack'
import { Table, proportional, type TableColumn } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import { TextInput } from '@astryxdesign/core/TextInput'
import { Token } from '@astryxdesign/core/Token'
import { RowBadges } from './badges'
import { CiRail } from './ci-rail'
import { ScoreCell } from './score-pill'
import { CompareButton, CompareCheckbox } from './compare-tray'
import { useExploreQuery } from './use-explore-query'
import { DesktopHydration } from './desktop-hydration'
import {
  SORT_OPTIONS,
  describeActiveFilters,
  selectModels,
  type SortKey,
} from '@/lib/explore-query'
import { fmtContext, fmtPriceLines, scoreMeta } from '@/lib/format'
import { modelHref } from '@/lib/site'
import type { BoardDomains, CiDomain, ModelRow, ScoreView } from '@/lib/types'

const ExploreFilters = dynamic(() => import('./explore-filters'), {
  loading: () => <Text type="supporting">正在加载筛选…</Text>,
})
const filterMedia = '(min-width: 1240px)'
const serverFilters = () => false
const desktopFilters = () => window.matchMedia(filterMedia).matches
function subscribeFilters(notify: () => void) {
  const media = window.matchMedia(filterMedia)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}

function FilterPanel({ open, ...props }: ComponentProps<typeof ExploreFilters> & { open: boolean }) {
  const desktop = useSyncExternalStore(subscribeFilters, desktopFilters, serverFilters)
  const [shown, setShown] = useState(false)
  if ((desktop || open) && !shown) setShown(true)
  return shown ? <ExploreFilters {...props} /> : null
}

function MobileScore({ label, score, domain }: { label: string; score: ScoreView | null; domain: CiDomain | null }) {
  return (
    <Stack gap={0.5}>
      <Text type="supporting">{label}</Text>
      {score ? (
        <>
          <HStack gap={1} vAlign="center">
            <Text weight="semibold" hasTabularNumbers>{score.rating.toFixed(1)}</Text>
            <CiRail stat={score} domain={domain} width={48} />
          </HStack>
          <Text type="supporting">{scoreMeta(score)}</Text>
        </>
      ) : (
        <Text type="supporting">未收录</Text>
      )}
    </Stack>
  )
}

interface ModelView extends Record<string, unknown> {
  id: string
  model: ModelRow
}

type ExploreClientProps = {
  models: ModelRow[]
  domains: BoardDomains
  dataDate: string
}

export function ExploreClient(props: ExploreClientProps) {
  const { query, update, reset, removeFilter, urlReady } = useExploreQuery()
  return (
    <HStack className="workbench" data-url-ready={urlReady ? 'true' : 'false'} gap={4} align="start">
      <ExploreContent {...props} query={query} update={update} reset={reset} removeFilter={removeFilter} />
    </HStack>
  )
}

// URL readiness changes during hydration without changing the default results.
const ExploreContent = memo(function ExploreContent({
  models, domains, dataDate, query, update, reset, removeFilter,
}: ExploreClientProps & Omit<ReturnType<typeof useExploreQuery>, 'urlReady'>) {
  const [filtersOpen, setFiltersOpen] = useState(false)

  const rows = useMemo(() => selectModels(models, query), [models, query])
  const activeChips = describeActiveFilters(query)
  const data = useMemo<ModelView[]>(() => rows.map(model => ({ id: model.id, model })), [rows])

  function sortHeader(key: SortKey, label: string, sub: string) {
    const active = query.sortKey === key
    return (
      <Stack gap={0}>
        <Button
          label={label}
          size="sm"
          variant="ghost"
          onClick={() => update({ sortKey: key })}
          endContent={
            active ? <Icon icon={key === 'price' ? 'arrowUp' : 'arrowDown'} size="xsm" /> : undefined
          }
        />
        <Text type="supporting">{sub}</Text>
      </Stack>
    )
  }

  const columns: TableColumn<ModelView>[] = [
    {
      key: 'compare',
      header: <Text as="span" type="supporting">对比</Text>,
      width: proportional(0.4, { minWidth: 56 }),
      renderCell: ({ model }) => <CompareCheckbox modelId={model.id} label={`加入对比 ${model.name}`} />,
    },
    {
      key: 'model',
      header: '模型',
      width: proportional(2, { minWidth: 220 }),
      renderCell: ({ model }) => (
        <Stack gap={0.5}>
          <HStack gap={1} wrap="wrap" vAlign="center">
            <Link href={modelHref(model.canonicalId)} weight="medium">{model.name}</Link>
            <RowBadges row={model} exceptionsOnly />
          </HStack>
          <Text type="supporting">
            {model.lab} · {model.canonicalId}
          </Text>
        </Stack>
      ),
    },
    {
      key: 'context',
      header: sortHeader('context', '上下文', 'tokens'),
      align: 'end',
      width: proportional(0.9, { minWidth: 100 }),
      renderCell: ({ model }) => <Text hasTabularNumbers>{fmtContext(model.context)}</Text>,
    },
    {
      key: 'price',
      header: sortHeader('price', '价格', '输入 / 输出 · USD / 1M'),
      align: 'end',
      width: proportional(1.2, { minWidth: 150 }),
      renderCell: ({ model }) => {
        const prices = fmtPriceLines(model.price)
        return (
          <Stack gap={0.5}>
            <HStack gap={1} justify="between">
              <Text type="supporting">输入</Text>
              <Text hasTabularNumbers>{prices.input}</Text>
            </HStack>
            <HStack gap={1} justify="between">
              <Text type="supporting">输出</Text>
              <Text hasTabularNumbers>{prices.output}</Text>
            </HStack>
            {model.price?.gatewayOnly && <Badge label="仅网关" variant="neutral" />}
          </Stack>
        )
      },
    },
    {
      key: 'reasoning',
      header: '推理',
      width: proportional(0.9, { minWidth: 100 }),
      renderCell: ({ model }) => <Token label={model.reasoningLabel} size="sm" />,
    },
    {
      key: 'arena_text',
      header: sortHeader('arena_text', 'Arena text', 'CI 共享刻度'),
      align: 'end',
      width: proportional(1.1, { minWidth: 130 }),
      renderCell: ({ model }) => <ScoreCell score={model.text} domain={domains.text} label="Arena text" />,
    },
    {
      key: 'arena_webdev',
      header: sortHeader('arena_webdev', 'Arena webdev', 'CI 共享刻度'),
      align: 'end',
      width: proportional(1.1, { minWidth: 130 }),
      renderCell: ({ model }) => <ScoreCell score={model.webdev} domain={domains.webdev} label="Arena webdev" />,
    },
  ]

  return (
    <>
      <Stack
        as="aside"
        className={`filters ${filtersOpen ? 'open' : ''}`}
        id="filters-panel"
        aria-label="筛选"
        gap={3}
        width={220}
      >
        <FilterPanel models={models} query={query} update={update} reset={reset} open={filtersOpen} onClose={() => setFiltersOpen(false)} />
      </Stack>

      <StackItem size="fill">
        <Stack className="results" gap={3}>
          <HStack className="toolbar" gap={2} wrap="wrap" vAlign="end">
            <TextInput
              label="搜索模型、实验室或家族"
              isLabelHidden
              type="search"
              startIcon="search"
              placeholder="搜索模型 / 实验室 / 家族"
              value={query.q}
              onChange={q => update({ q })}
              hasClear
              width={280}
            />
            <Selector
              label="排序"
              isLabelHidden
              options={SORT_OPTIONS}
              value={query.sortKey}
              onChange={sortKey => update({ sortKey: sortKey as SortKey })}
              width={200}
            />
            <Button
              label="筛选"
              size="sm"
              variant="secondary"
              className="mobile-only"
              aria-expanded={filtersOpen}
              aria-controls="filters-panel"
              onClick={() => setFiltersOpen(v => !v)}
            />
            <Text type="supporting">{rows.length} 个结果</Text>
          </HStack>

          {activeChips.length > 0 && (
            <HStack gap={1} wrap="wrap" vAlign="center">
              {activeChips.map(chip => (
                <Token
                  key={`${chip.kind}:${chip.value ?? ''}`}
                  label={chip.label}
                  size="sm"
                  onRemove={() => removeFilter(chip)}
                />
              ))}
              <Button label="清除全部" size="sm" variant="ghost" onClick={reset} />
            </HStack>
          )}

          {rows.length ? (
            <>
              <Stack className="desktop-only">
                <DesktopHydration>
                  <Table
                    data={data}
                    columns={columns}
                    idKey="id"
                    density="compact"
                    dividers="rows"
                    hasHover
                    aria-label="模型目录，按当前筛选和排序显示"
                  />
                </DesktopHydration>
              </Stack>

              <Stack className="mobile-list" gap={3}>
                {rows.map(row => {
                  const prices = fmtPriceLines(row.price)
                  return (
                    <Card key={row.id} padding={3}>
                      <Stack gap={2}>
                        <HStack justify="between" align="start" gap={2}>
                          <Stack gap={0.5}>
                            <Text type="supporting">{row.lab}</Text>
                            <Heading level={3}>
                              <Link href={modelHref(row.canonicalId)}>{row.name}</Link>
                            </Heading>
                            <HStack gap={1} wrap="wrap">
                              <RowBadges row={row} exceptionsOnly />
                            </HStack>
                            <Text type="supporting">{row.canonicalId}</Text>
                          </Stack>
                          <CompareButton modelId={row.id} small short />
                        </HStack>
                        <HStack gap={4} wrap="wrap">
                          <MobileScore label="Arena text" score={row.text} domain={domains.text} />
                          <MobileScore label="Arena webdev" score={row.webdev} domain={domains.webdev} />
                        </HStack>
                        <HStack gap={3} wrap="wrap">
                          <Text type="supporting">上下文 <Text weight="semibold">{fmtContext(row.context)}</Text></Text>
                          <Text type="supporting">价格 <Text weight="semibold">{prices.input} / {prices.output}</Text></Text>
                          <Text type="supporting">推理 <Text weight="semibold">{row.reasoningLabel}</Text></Text>
                        </HStack>
                      </Stack>
                    </Card>
                  )
                })}
              </Stack>

              <HStack className="table-foot" justify="between" wrap="wrap" gap={2}>
                <Text type="supporting">显示 {rows.length} / {models.length} 个模型 · 价格 USD / 1M tokens</Text>
                <Text type="supporting">价格快照 {dataDate} · Arena latest</Text>
              </HStack>
            </>
          ) : (
            <EmptyState
              title="没有符合条件的模型"
              description="删掉一两个筛选条件，或者清除全部筛选再看。"
              actions={<Button label="清除筛选" variant="primary" onClick={reset} />}
            />
          )}
        </Stack>
      </StackItem>
    </>
  )
})

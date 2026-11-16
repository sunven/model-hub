'use client'

import { memo, useMemo, useState, useSyncExternalStore, type ComponentProps } from 'react'
import dynamic from 'next/dynamic'
import { Badge } from '@astryxdesign/core/Badge'
import { Button } from '@astryxdesign/core/Button'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Grid } from '@astryxdesign/core/Grid'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack } from '@astryxdesign/core/HStack'
import { Icon } from '@astryxdesign/core/Icon'
import { Link } from '@astryxdesign/core/Link'
import { Selector } from '@astryxdesign/core/Selector'
import { Stack, StackItem } from '@astryxdesign/core/Stack'
import { Switch } from '@astryxdesign/core/Switch'
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
  CONTEXT_OPTIONS,
  PRICE_OPTIONS,
  defaultSortDirection,
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
const MobileSortControls = dynamic(() => import('./explore-sort'), { loading: () => null })
const mobileSortMedia = '(max-width: 979px)'
const mobileSortSnapshot = () => window.matchMedia(mobileSortMedia).matches
function subscribeMobileSort(notify: () => void) {
  const media = window.matchMedia(mobileSortMedia)
  media.addEventListener('change', notify)
  return () => media.removeEventListener('change', notify)
}

function MobileSort(props: ComponentProps<typeof MobileSortControls>) {
  const mobile = useSyncExternalStore(subscribeMobileSort, mobileSortSnapshot, serverFilters)
  return <Stack className="mobile-sort">{mobile ? <MobileSortControls {...props} /> : null}</Stack>
}
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
    <HStack className="workbench" data-url-ready={urlReady ? 'true' : 'false'} gap={6} align="start">
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
    const nextDirection = active
      ? query.sortDirection === 'asc' ? 'desc' : 'asc'
      : defaultSortDirection(key)
    return (
      <Stack gap={0}>
        <Button
          label={label}
          size="sm"
          variant="ghost"
          className="px-1"
          onClick={() => update({ sortKey: key, sortDirection: nextDirection })}
          aria-description={active ? `当前${query.sortDirection === 'asc' ? '升序' : '降序'}，点击切换为${nextDirection === 'asc' ? '升序' : '降序'}` : undefined}
          endContent={
            active ? <Icon icon={query.sortDirection === 'asc' ? 'arrowUp' : 'arrowDown'} size="xsm" /> : undefined
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
      width: proportional(0.4, { minWidth: 44 }),
      renderCell: ({ model }) => <CompareCheckbox modelId={model.id} label={`加入对比 ${model.name}`} />,
    },
    {
      key: 'model',
      header: '模型',
      width: proportional(2, { minWidth: 192 }),
      renderCell: ({ model }) => (
        <Stack gap={0.5}>
          <HStack gap={1} wrap="wrap" vAlign="center">
            <Link href={modelHref(model.canonicalId)} color="primary" weight="medium" tooltip={model.canonicalId}>{model.name}</Link>
            <RowBadges row={model} exceptionsOnly />
          </HStack>
          <Text type="supporting">
            {model.lab}
          </Text>
        </Stack>
      ),
    },
    {
      key: 'context',
      header: sortHeader('context', '上下文', 'tokens'),
      align: 'end',
      width: proportional(0.9, { minWidth: 72 }),
      renderCell: ({ model }) => <Text hasTabularNumbers>{fmtContext(model.context)}</Text>,
    },
    {
      key: 'price',
      header: sortHeader('price', '价格', '输入 / 输出 · USD / 1M'),
      align: 'end',
      width: proportional(1.2, { minWidth: 120 }),
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
            {model.price?.gatewayOnly && <Token label="仅网关" size="sm" />}
          </Stack>
        )
      },
    },
    {
      key: 'reasoning',
      header: '推理',
      width: proportional(0.9, { minWidth: 80 }),
      renderCell: ({ model }) => <Token label={model.reasoningLabel} size="sm" />,
    },
    {
      key: 'arena_text',
      header: sortHeader('arena_text', 'Arena text', 'CI 共享刻度'),
      align: 'end',
      width: proportional(1.1, { minWidth: 116 }),
      renderCell: ({ model }) => <ScoreCell score={model.text} domain={domains.text} label="Arena text" />,
    },
    {
      key: 'arena_webdev',
      header: sortHeader('arena_webdev', 'Arena webdev', 'CI 共享刻度'),
      align: 'end',
      width: proportional(1.1, { minWidth: 116 }),
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

      <StackItem size="fill" className="results-column">
        <Stack className="results" gap={3}>
          <HStack className="toolbar" gap={3} wrap="wrap" vAlign="center" justify="between">
            <HStack gap={2} vAlign="center">
              <Heading level={1} className="text-2xl" weight="semibold">全部模型</Heading>
              <Stack role="status" aria-label={`${rows.length} 个结果`}>
                <Badge label={String(rows.length)} variant="neutral" />
              </Stack>
            </HStack>
            <HStack className="search-actions" gap={2} vAlign="center">
              <TextInput
                label="搜索模型、实验室或家族"
                isLabelHidden
                type="search"
                startIcon="search"
                placeholder="搜索模型、实验室或家族…"
                value={query.q}
                onChange={q => update({ q })}
                hasClear
                width="100%"
                containerClassName="model-search"
              />
              <Button
                label="筛选"
                variant="secondary"
                className="mobile-only"
                aria-expanded={filtersOpen}
                aria-controls="filters-panel"
                onClick={() => setFiltersOpen(v => !v)}
              />
            </HStack>
          </HStack>

          <HStack gap={4} wrap="wrap" align="end" justify="between">
            <Grid columns={2} gap={3} className="w-full sm:w-96" role="group" aria-label="价格与上下文">
              <Selector
                label="最高输出价"
                options={PRICE_OPTIONS.map(value => ({ value: String(value), label: `≤ $${value} / 1M` }))}
                value={query.maxOutput === null ? null : String(query.maxOutput)}
                onChange={value => update({ maxOutput: value ? Number(value) : null })}
                hasClear
                placeholder="不限"
                width="100%"
                containerClassName="min-w-0"
              />
              <Selector
                label="最低上下文"
                options={CONTEXT_OPTIONS.map(value => ({ value: String(value), label: `≥ ${fmtContext(value)}` }))}
                value={query.minContext === null ? null : String(query.minContext)}
                onChange={value => update({ minContext: value ? Number(value) : null })}
                hasClear
                placeholder="不限"
                width="100%"
                containerClassName="min-w-0"
              />
            </Grid>
            <HStack className="capability-filters" gap={4} wrap="wrap" vAlign="center" role="group" aria-label="能力 / 状态">
              <Switch
                label="支持推理"
                size="sm"
                labelPosition="start"
                value={query.reasoning}
                onChange={reasoning => update({ reasoning })}
              />
              <Switch
                label="开源权重"
                size="sm"
                labelPosition="start"
                value={query.openWeights}
                onChange={openWeights => update({ openWeights })}
              />
              <Switch
                label="仅稳定版"
                size="sm"
                labelPosition="start"
                value={query.stableOnly}
                onChange={stableOnly => update({ stableOnly })}
              />
              <Switch
                label="只看有评测"
                size="sm"
                labelPosition="start"
                value={query.hasArena}
                onChange={hasArena => update({ hasArena })}
              />
            </HStack>
          </HStack>

          <MobileSort query={query} update={update} />

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
              <Stack className="desktop-only model-table">
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

              <Stack className="mobile-list" gap={0}>
                {rows.map(row => {
                  const prices = fmtPriceLines(row.price)
                  return (
                    <Stack as="article" key={row.id} className="model-list-row" gap={3} paddingBlock={4} aria-label={row.name}>
                      <HStack justify="between" align="start" gap={2}>
                        <Stack className="model-identity" gap={1}>
                          <Text type="supporting">{row.lab}</Text>
                          <Heading level={2} className="text-base" weight="medium">
                            <Link href={modelHref(row.canonicalId)} color="primary" weight="medium">{row.name}</Link>
                          </Heading>
                          <HStack gap={1} wrap="wrap">
                            <RowBadges row={row} exceptionsOnly />
                          </HStack>
                        </Stack>
                        <CompareButton modelId={row.id} small short />
                      </HStack>
                      <Grid columns={2} gap={3}>
                        <MobileScore label="Arena text" score={row.text} domain={domains.text} />
                        <MobileScore label="Arena webdev" score={row.webdev} domain={domains.webdev} />
                      </Grid>
                      <Grid columns={2} gap={3}>
                        <Stack gap={0.5}>
                          <Text type="supporting">输入 / 输出 · USD / 1M</Text>
                          <Text hasTabularNumbers>{prices.input} / {prices.output}</Text>
                        </Stack>
                        <Stack gap={0.5}>
                          <Text type="supporting">上下文 <Text weight="semibold">{fmtContext(row.context)}</Text></Text>
                          <Text type="supporting">推理 <Text weight="semibold">{row.reasoningLabel}</Text></Text>
                        </Stack>
                      </Grid>
                    </Stack>
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

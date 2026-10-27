'use client'

import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState, useCallback } from 'react'
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { RowBadges } from './badges'
import { ScoreCell } from './score-pill'
import { useCompare } from './compare-provider'
import { fmtContext, fmtPriceLines, fmtRange } from '@/lib/format'
import type { ModelRow } from '@/lib/types'

type SortKey = 'arena_text' | 'arena_webdev' | 'newest' | 'price' | 'context'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'arena_text', label: 'Arena text（默认）' },
  { value: 'arena_webdev', label: 'Arena webdev' },
  { value: 'newest', label: '最新发布' },
  { value: 'price', label: '输出价格' },
  { value: 'context', label: '上下文' },
]

const SORT_COLUMN: Record<SortKey, string> = {
  arena_text: 'text',
  arena_webdev: 'webdev',
  newest: 'releaseDate',
  price: 'price',
  context: 'context',
}

const CONTEXT_OPTIONS = [32000, 128000, 256000, 1000000]
const PRICE_OPTIONS = [1, 5, 15]

function parseLabs(value: string | null): string[] {
  return (value ?? '').split(',').filter(Boolean)
}

export function ExploreClient({ models, dataDate }: { models: ModelRow[]; dataDate: string }) {
  const params = useSearchParams()
  const router = useRouter()
  const compare = useCompare()

  const [q, setQ] = useState(() => params.get('q') ?? '')
  const [labs, setLabs] = useState<string[]>(() => parseLabs(params.get('labs')))
  const [providers, setProviders] = useState<string[]>(() => parseLabs(params.get('providers')))
  const [maxOutput, setMaxOutput] = useState(() => params.get('maxOutput') ?? '')
  const [minContext, setMinContext] = useState(() => params.get('minContext') ?? '')
  const [reasoning, setReasoning] = useState(() => params.get('reasoning') === '1')
  const [openWeights, setOpenWeights] = useState(() => params.get('openWeights') === '1')
  const [stableOnly, setStableOnly] = useState(() => params.get('stableOnly') === '1')
  const [hasArena, setHasArena] = useState(() => params.get('hasArena') === '1')
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    const value = params.get('sort')
    return SORT_OPTIONS.some(o => o.value === value) ? (value as SortKey) : 'arena_text'
  })
  const [filtersOpen, setFiltersOpen] = useState(false)

  const allLabs = useMemo(() => [...new Set(models.map(m => m.lab))].sort((a, b) => a.localeCompare(b, 'zh')), [models])
  const allProviders = useMemo(
    () => [...new Set(models.flatMap(m => m.providerNames))].sort((a, b) => a.localeCompare(b)),
    [models],
  )

  useEffect(() => {
    if (window.location.pathname !== '/') return
    const p = new URLSearchParams()
    if (q) p.set('q', q)
    if (labs.length) p.set('labs', labs.join(','))
    if (providers.length) p.set('providers', providers.join(','))
    if (maxOutput) p.set('maxOutput', maxOutput)
    if (minContext) p.set('minContext', minContext)
    if (reasoning) p.set('reasoning', '1')
    if (openWeights) p.set('openWeights', '1')
    if (stableOnly) p.set('stableOnly', '1')
    if (hasArena) p.set('hasArena', '1')
    if (sortKey !== 'arena_text') p.set('sort', sortKey)
    const query = p.toString()
    window.history.replaceState({}, '', query ? `${window.location.pathname}?${query}` : window.location.pathname)
  }, [q, labs, providers, maxOutput, minContext, reasoning, openWeights, stableOnly, hasArena, sortKey])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    const max = maxOutput ? Number(maxOutput) : null
    const min = minContext ? Number(minContext) : null
    return models.filter(m => {
      if (query) {
        const hay = `${m.name} ${m.lab} ${m.canonicalId}`.toLowerCase()
        if (!hay.includes(query)) return false
      }
      if (labs.length && !labs.includes(m.lab)) return false
      if (providers.length) {
        const match = providers.some(p =>
          p === '__gateway_only__' ? m.gatewayOnly : m.providerNames.includes(p),
        )
        if (!match) return false
      }
      if (max !== null) {
        if (!m.price || m.price.outputMin > max) return false
      }
      if (min !== null) {
        if (!m.context || m.context < min) return false
      }
      if (reasoning && m.reasoningLabel === '不支持') return false
      if (openWeights && !m.openWeights) return false
      if (stableOnly && (m.availability !== 'available' || m.releaseBadges.length > 0)) return false
      if (hasArena && !m.text && !m.webdev) return false
      return true
    })
  }, [models, q, labs, providers, maxOutput, minContext, reasoning, openWeights, stableOnly, hasArena])

  const sorting = useMemo<SortingState>(
    () => [{ id: SORT_COLUMN[sortKey], desc: sortKey !== 'price' }],
    [sortKey],
  )
  const handleSortingChange = useCallback(
    (updater: SortingState | ((old: SortingState) => SortingState)) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      const column = next[0]?.id
      const found = (Object.entries(SORT_COLUMN) as [SortKey, string][]).find(([, id]) => id === column)
      if (found) setSortKey(found[0])
    },
    [sorting],
  )
  const columns = useMemo<ColumnDef<ModelRow>[]>(
    () => [
      { id: 'select', accessorFn: row => row.id },
      { id: 'model', accessorFn: row => row.name },
      { id: 'context', accessorFn: row => row.context ?? undefined, sortUndefined: 'last' },
      { id: 'price', accessorFn: row => row.price?.outputMin ?? undefined, sortUndefined: 'last' },
      { id: 'reasoning', accessorFn: row => row.reasoningLabel },
      { id: 'text', accessorFn: row => row.text?.rating ?? undefined, sortUndefined: 'last' },
      { id: 'webdev', accessorFn: row => row.webdev?.rating ?? undefined, sortUndefined: 'last' },
      { id: 'releaseDate', accessorFn: row => row.releaseDate ?? undefined, sortUndefined: 'last' },
    ],
    [],
  )

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: handleSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  const rows = table.getRowModel().rows.map(r => r.original)
  const activeChips: { label: string; remove: () => void }[] = []
  if (q) activeChips.push({ label: `搜索“${q}”`, remove: () => setQ('') })
  for (const lab of labs) {
    activeChips.push({
      label: lab,
      remove: () => setLabs(prev => prev.filter(x => x !== lab)),
    })
  }
  for (const provider of providers) {
    activeChips.push({
      label: provider === '__gateway_only__' ? '仅网关' : provider,
      remove: () => setProviders(prev => prev.filter(x => x !== provider)),
    })
  }
  if (maxOutput) activeChips.push({ label: `输出 ≤ $${maxOutput}`, remove: () => setMaxOutput('') })
  if (minContext) activeChips.push({ label: `上下文 ≥ ${fmtContext(Number(minContext))}`, remove: () => setMinContext('') })
  if (reasoning) activeChips.push({ label: '支持推理', remove: () => setReasoning(false) })
  if (openWeights) activeChips.push({ label: '开源权重', remove: () => setOpenWeights(false) })
  if (stableOnly) activeChips.push({ label: '仅稳定版', remove: () => setStableOnly(false) })
  if (hasArena) activeChips.push({ label: '只看有评测', remove: () => setHasArena(false) })

  function clearFilters() {
    setQ('')
    setLabs([])
    setProviders([])
    setMaxOutput('')
    setMinContext('')
    setReasoning(false)
    setOpenWeights(false)
    setStableOnly(false)
    setHasArena(false)
    setSortKey('arena_text')
  }

  function toggleLab(lab: string, checked: boolean) {
    setLabs(prev => (checked ? [...new Set([...prev, lab])] : prev.filter(x => x !== lab)))
  }

  function toggleProvider(provider: string, checked: boolean) {
    setProviders(prev => (checked ? [...new Set([...prev, provider])] : prev.filter(x => x !== provider)))
  }

  function sortButton(key: SortKey, label: string) {
    return (
      <button type="button" className="th-sort" onClick={() => setSortKey(key)}>
        {label}
        {sortKey === key && <span className="arrow">{key === 'price' ? '↑' : '↓'}</span>}
      </button>
    )
  }

  return (
    <div className="workbench">
      <aside className={`filters ${filtersOpen ? 'open' : ''}`} id="filters-panel">
        <div className="filters-head">
          <strong>筛选</strong>
          <div style={{ display: 'flex', gap: 4 }}>
            <button type="button" className="btn tiny" onClick={clearFilters}>清除</button>
            <button type="button" className="btn tiny mobile-only" onClick={() => setFiltersOpen(false)}>关闭</button>
          </div>
        </div>
        <div className="filter-group" id="lab-filter">
          <div className="filter-title">实验室</div>
          {allLabs.map(lab => (
            <label className="check" key={lab}>
              <input type="checkbox" checked={labs.includes(lab)} onChange={e => toggleLab(lab, e.target.checked)} />
              <span>{lab}</span>
            </label>
          ))}
        </div>
        <details className="filter-group" id="provider-filter">
          <summary className="filter-title" style={{ cursor: 'pointer' }}>托管商（更多）</summary>
          <div style={{ marginTop: 6 }}>
            <p className="small muted" style={{ marginBottom: 4 }}>有任一选中托管商的报价</p>
            {allProviders.map(provider => (
              <label className="check" key={provider}>
                <input
                  type="checkbox"
                  checked={providers.includes(provider)}
                  onChange={e => toggleProvider(provider, e.target.checked)}
                />
                <span>{provider}</span>
              </label>
            ))}
            <label className="check">
              <input
                type="checkbox"
                checked={providers.includes('__gateway_only__')}
                onChange={e => toggleProvider('__gateway_only__', e.target.checked)}
              />
              <span>仅网关（无第一方 / 云报价）</span>
            </label>
          </div>
        </details>
        <div className="filter-group">
          <label className="filter-title" htmlFor="max-output">最高输出价</label>
          <select id="max-output" value={maxOutput} onChange={e => setMaxOutput(e.target.value)}>
            <option value="">不限</option>
            {PRICE_OPTIONS.map(v => <option key={v} value={v}>≤ ${v} / 1M</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label className="filter-title" htmlFor="min-context">最低上下文</label>
          <select id="min-context" value={minContext} onChange={e => setMinContext(e.target.value)}>
            <option value="">不限</option>
            {CONTEXT_OPTIONS.map(v => <option key={v} value={v}>≥ {fmtContext(v)}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <div className="filter-title">能力 / 状态</div>
          <label className="switch-row"><span>支持推理</span><input type="checkbox" checked={reasoning} onChange={e => setReasoning(e.target.checked)} /></label>
          <label className="switch-row"><span>开源权重</span><input type="checkbox" checked={openWeights} onChange={e => setOpenWeights(e.target.checked)} /></label>
          <label className="switch-row"><span>仅稳定版</span><input type="checkbox" checked={stableOnly} onChange={e => setStableOnly(e.target.checked)} /></label>
          <label className="switch-row"><span>只看有评测</span><input type="checkbox" checked={hasArena} onChange={e => setHasArena(e.target.checked)} /></label>
        </div>
        <button type="button" className="btn ghost wide" onClick={clearFilters}>清除筛选</button>
      </aside>

      <section className="results">
        <div className="toolbar">
          <div className="search-wrap">
            <input className="search" type="search" placeholder="搜索模型 / 实验室 / 别名" value={q} onChange={e => setQ(e.target.value)} />
          </div>
          <button type="button" className="btn mobile-only" onClick={() => setFiltersOpen(v => !v)}>筛选</button>
          <select className="sort-select" value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} aria-label="排序">
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {activeChips.length > 0 && (
          <div className="chips">
            {activeChips.map(chip => (
              <span className="chip" key={chip.label}>
                {chip.label}
                <button type="button" onClick={chip.remove} aria-label={`移除 ${chip.label}`}>×</button>
              </span>
            ))}
            <button type="button" className="chip clear" onClick={clearFilters}>清除全部</button>
          </div>
        )}

        {rows.length ? (
          <>
            <div className="table-wrap desktop-only">
              <table className="model-table">
                <thead>
                  <tr>
                    <th className="col-check" />
                    <th>Model</th>
                    <th>{sortButton('context', 'Context')}</th>
                    <th>{sortButton('price', 'Price in / out')}</th>
                    <th>Reasoning</th>
                    <th>{sortButton('arena_text', 'Arena text')}</th>
                    <th>{sortButton('arena_webdev', 'Arena webdev')}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => {
                    const prices = fmtPriceLines(row.price)
                    return (
                      <tr className="model-row" key={row.id} onClick={() => router.push(`/models/${row.canonicalId}`)}>
                        <td className="col-check" onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={compare.selected.includes(row.id)}
                            onChange={() => compare.toggle(row.id)}
                            aria-label={`加入对比 ${row.name}`}
                          />
                        </td>
                        <td>
                          <div className="model-name">
                            <Link href={`/models/${row.canonicalId}`} onClick={e => e.stopPropagation()}>{row.name}</Link>
                            <RowBadges row={row} />
                          </div>
                          <div className="model-sub">{row.lab} · {row.canonicalId}</div>
                        </td>
                        <td className="num">{fmtContext(row.context)}</td>
                        <td className="price-cell">
                          <div><span className="lab">in</span>{prices.input}</div>
                          <div><span className="lab">out</span>{prices.output}</div>
                          {row.price?.gatewayOnly && <div className="small muted">仅网关</div>}
                        </td>
                        <td><span className="reasoning-pill">{row.reasoningLabel}</span></td>
                        <td><ScoreCell score={row.text} label="Arena text" /></td>
                        <td><ScoreCell score={row.webdev} label="Arena webdev" /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mobile-list">
              {rows.map(row => (
                <article className="mobile-card" key={row.id}>
                  <div className="mobile-card-top">
                    <div>
                      <div className="lab">{row.lab}</div>
                      <h3><Link href={`/models/${row.canonicalId}`}>{row.name}</Link></h3>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <RowBadges row={row} />
                    </div>
                  </div>
                  <div className="mobile-scores">
                    <div className="mobile-score">
                      <span>Arena text</span>
                      <strong>{row.text ? row.text.rating.toFixed(1) : '未收录'}</strong>
                      <small>{row.text ? `#${row.text.rank} · ${row.text.condition}` : '—'}</small>
                    </div>
                    <div className="mobile-score">
                      <span>Arena webdev</span>
                      <strong>{row.webdev ? row.webdev.rating.toFixed(1) : '未收录'}</strong>
                      <small>{row.webdev ? `#${row.webdev.rank} · ${row.webdev.condition}` : '—'}</small>
                    </div>
                  </div>
                  <div className="mobile-facts">
                    <span>Context <b>{fmtContext(row.context)}</b></span>
                    <span>Price <b>{fmtRange(row.price?.inputMin, row.price?.inputMax)} / {fmtRange(row.price?.outputMin, row.price?.outputMax)}</b></span>
                    <span>Reasoning <b>{row.reasoningLabel}</b></span>
                  </div>
                  <div className="mobile-actions">
                    <button type="button" className="btn" onClick={() => router.push(`/models/${row.canonicalId}`)}>查看详情</button>
                    <button
                      type="button"
                      className={`btn ${compare.selected.includes(row.id) ? 'primary' : ''}`}
                      onClick={() => compare.toggle(row.id)}
                    >
                      {compare.selected.includes(row.id) ? '已加入' : '加入对比'}
                    </button>
                  </div>
                </article>
              ))}
            </div>

            <div className="table-foot">
              <span>显示 {rows.length} 个模型 · 价格 USD / 1M tokens</span>
              <span>数据 {dataDate} · Arena latest</span>
            </div>
          </>
        ) : (
          <div className="empty">
            <strong>没有符合条件的模型</strong>
            <p>删掉一两个筛选条件，或者清除全部筛选再看。</p>
            <button type="button" className="btn primary" style={{ marginTop: 12 }} onClick={clearFilters}>清除筛选</button>
          </div>
        )}
      </section>
    </div>
  )
}

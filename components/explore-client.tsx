'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { RowBadges } from './badges'
import { CiRail, ciDomain, type CiDomain } from './ci-rail'
import { ScoreCell } from './score-pill'
import { useCompare } from './compare-provider'
import { ciHalf, fmtContext, fmtPriceLines } from '@/lib/format'
import { modelHref } from '@/lib/site'
import type { ModelRow, ScoreView } from '@/lib/types'

type SortKey = 'arena_text' | 'arena_webdev' | 'newest' | 'price' | 'context'

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'arena_text', label: 'Arena text（默认）' },
  { value: 'arena_webdev', label: 'Arena webdev' },
  { value: 'newest', label: '最新发布' },
  { value: 'price', label: '输出价格' },
  { value: 'context', label: '上下文' },
]

const CONTEXT_OPTIONS = [32000, 128000, 256000, 1000000]
const PRICE_OPTIONS = [1, 5, 15]
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

type Filters = {
  q: string
  labs: string[]
  providers: string[]
  maxOutput: string
  minContext: string
  reasoning: boolean
  openWeights: boolean
  stableOnly: boolean
  hasArena: boolean
  sortKey: SortKey
}

const DEFAULT_FILTERS: Filters = {
  q: '',
  labs: [],
  providers: [],
  maxOutput: '',
  minContext: '',
  reasoning: false,
  openWeights: false,
  stableOnly: false,
  hasArena: false,
  sortKey: 'arena_text',
}

function parseLabs(value: string | null): string[] {
  return (value ?? '').split(',').filter(Boolean)
}

function parseFilters(params: URLSearchParams): Filters {
  const sort = params.get('sort')
  return {
    q: params.get('q') ?? '',
    labs: parseLabs(params.get('labs')),
    providers: parseLabs(params.get('providers')),
    maxOutput: params.get('maxOutput') ?? '',
    minContext: params.get('minContext') ?? '',
    reasoning: params.get('reasoning') === '1',
    openWeights: params.get('openWeights') === '1',
    stableOnly: params.get('stableOnly') === '1',
    hasArena: params.get('hasArena') === '1',
    sortKey: SORT_OPTIONS.some(o => o.value === sort) ? (sort as SortKey) : DEFAULT_FILTERS.sortKey,
  }
}

function filtersToParams(filters: Filters): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q) params.set('q', filters.q)
  if (filters.labs.length) params.set('labs', filters.labs.join(','))
  if (filters.providers.length) params.set('providers', filters.providers.join(','))
  if (filters.maxOutput) params.set('maxOutput', filters.maxOutput)
  if (filters.minContext) params.set('minContext', filters.minContext)
  if (filters.reasoning) params.set('reasoning', '1')
  if (filters.openWeights) params.set('openWeights', '1')
  if (filters.stableOnly) params.set('stableOnly', '1')
  if (filters.hasArena) params.set('hasArena', '1')
  if (filters.sortKey !== DEFAULT_FILTERS.sortKey) params.set('sort', filters.sortKey)
  return params
}

function hasActiveFilters(filters: Filters): boolean {
  return (
    Boolean(filters.q || filters.labs.length || filters.providers.length || filters.maxOutput || filters.minContext) ||
    filters.reasoning ||
    filters.openWeights ||
    filters.stableOnly ||
    filters.hasArena ||
    filters.sortKey !== DEFAULT_FILTERS.sortKey
  )
}

function MobileScore({ label, score, domain }: { label: string; score: ScoreView | null; domain: CiDomain | null }) {
  return (
    <div className="mobile-score">
      <span>{label}</span>
      {score ? (
        <>
          <strong>{score.rating.toFixed(1)}</strong>
          <div className="score-top">
            <CiRail stat={score} domain={domain} width={48} />
            <span className="lb-ci">±{ciHalf(score).toFixed(1)}</span>
          </div>
          <small>#{score.rank} · {score.condition}</small>
        </>
      ) : (
        <>
          <span className="missing">未收录</span>
          <small>Arena 未收录</small>
        </>
      )}
    </div>
  )
}

export function ExploreClient({ models, dataDate }: { models: ModelRow[]; dataDate: string }) {
  const router = useRouter()
  const compare = useCompare()

  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [urlReady, setUrlReady] = useState(false)

  const update = (patch: Partial<Filters>) => setFilters(prev => ({ ...prev, ...patch }))

  useIsoLayoutEffect(() => {
    setFilters(parseFilters(new URLSearchParams(window.location.search)))
    setUrlReady(true)
  }, [])

  const allLabs = useMemo(() => [...new Set(models.map(m => m.lab))].sort((a, b) => a.localeCompare(b, 'zh')), [models])
  const allProviders = useMemo(
    () => [...new Set(models.flatMap(m => m.providerNames))].sort((a, b) => a.localeCompare(b)),
    [models],
  )

  useEffect(() => {
    const metas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="robots"]'))
    const previous = metas.map(meta => meta.getAttribute('content'))
    const content = hasActiveFilters(filters) ? 'noindex,follow' : 'index,follow'
    for (const meta of metas) meta.setAttribute('content', content)
    return () => {
      metas.forEach((meta, i) => {
        if (previous[i]) meta.setAttribute('content', previous[i]!)
      })
    }
  }, [filters])

  useEffect(() => {
    if (!urlReady || window.location.pathname !== '/') return
    const query = filtersToParams(filters).toString()
    window.history.replaceState({}, '', query ? `${window.location.pathname}?${query}` : window.location.pathname)
  }, [urlReady, filters])

  const filtered = useMemo(() => {
    const query = filters.q.trim().toLowerCase()
    const max = filters.maxOutput ? Number(filters.maxOutput) : null
    const min = filters.minContext ? Number(filters.minContext) : null
    return models.filter(m => {
      if (query) {
        const hay = `${m.name} ${m.lab} ${m.canonicalId}`.toLowerCase()
        if (!hay.includes(query)) return false
      }
      if (filters.labs.length && !filters.labs.includes(m.lab)) return false
      if (filters.providers.length) {
        const match = filters.providers.some(p =>
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
      if (filters.reasoning && m.reasoningLabel === '不支持') return false
      if (filters.openWeights && !m.openWeights) return false
      if (filters.stableOnly && (m.availability !== 'available' || m.releaseBadges.length > 0)) return false
      if (filters.hasArena && !m.text && !m.webdev) return false
      return true
    })
  }, [models, filters])

  const rows = useMemo(() => {
    const value = (model: ModelRow): number | string | null => {
      switch (filters.sortKey) {
        case 'arena_text':
          return model.text?.rating ?? null
        case 'arena_webdev':
          return model.webdev?.rating ?? null
        case 'newest':
          return model.releaseDate
        case 'price':
          return model.price?.outputMin ?? null
        case 'context':
          return model.context
      }
    }
    const direction = filters.sortKey === 'price' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = value(a)
      const bv = value(b)
      if (av == null) return bv == null ? a.name.localeCompare(b.name, 'zh') : 1
      if (bv == null) return -1
      if (av === bv) return a.name.localeCompare(b.name, 'zh')
      return (av < bv ? -1 : 1) * direction
    })
  }, [filtered, filters.sortKey])

  const domains = useMemo(
    () => ({
      text: ciDomain(models.map(m => m.text)),
      webdev: ciDomain(models.map(m => m.webdev)),
    }),
    [models],
  )

  const activeChips: { label: string; remove: () => void }[] = []
  if (filters.q) activeChips.push({ label: `搜索“${filters.q}”`, remove: () => update({ q: '' }) })
  for (const lab of filters.labs) {
    activeChips.push({
      label: lab,
      remove: () => setFilters(prev => ({ ...prev, labs: prev.labs.filter(x => x !== lab) })),
    })
  }
  for (const provider of filters.providers) {
    activeChips.push({
      label: provider === '__gateway_only__' ? '仅网关' : provider,
      remove: () => setFilters(prev => ({ ...prev, providers: prev.providers.filter(x => x !== provider) })),
    })
  }
  if (filters.maxOutput) activeChips.push({ label: `输出 ≤ $${filters.maxOutput}`, remove: () => update({ maxOutput: '' }) })
  if (filters.minContext) activeChips.push({ label: `上下文 ≥ ${fmtContext(Number(filters.minContext))}`, remove: () => update({ minContext: '' }) })
  if (filters.reasoning) activeChips.push({ label: '支持推理', remove: () => update({ reasoning: false }) })
  if (filters.openWeights) activeChips.push({ label: '开源权重', remove: () => update({ openWeights: false }) })
  if (filters.stableOnly) activeChips.push({ label: '仅稳定版', remove: () => update({ stableOnly: false }) })
  if (filters.hasArena) activeChips.push({ label: '只看有评测', remove: () => update({ hasArena: false }) })

  function toggleLab(lab: string, checked: boolean) {
    setFilters(prev => ({
      ...prev,
      labs: checked ? [...new Set([...prev.labs, lab])] : prev.labs.filter(x => x !== lab),
    }))
  }

  function toggleProvider(provider: string, checked: boolean) {
    setFilters(prev => ({
      ...prev,
      providers: checked ? [...new Set([...prev.providers, provider])] : prev.providers.filter(x => x !== provider),
    }))
  }

  function sortButton(key: SortKey, label: string) {
    return (
      <button type="button" className="th-sort" onClick={() => update({ sortKey: key })}>
        {label}
        {filters.sortKey === key && <span className="arrow">{key === 'price' ? '↑' : '↓'}</span>}
      </button>
    )
  }

  function ariaSort(key: SortKey) {
    if (filters.sortKey !== key) return 'none' as const
    return key === 'price' ? ('ascending' as const) : ('descending' as const)
  }

  return (
    <div className="workbench" data-url-ready={urlReady ? 'true' : 'false'}>
      <aside className={`filters ${filtersOpen ? 'open' : ''}`} id="filters-panel" aria-label="筛选">
        <div className="filters-head">
          <strong>筛选</strong>
          <div className="head-actions">
            <button type="button" className="btn small ghost" onClick={() => setFilters(DEFAULT_FILTERS)}>清除</button>
            <button type="button" className="btn small mobile-only" onClick={() => setFiltersOpen(false)}>关闭</button>
          </div>
        </div>

        <div className="filter-group" id="lab-filter">
          <div className="filter-title">实验室</div>
          {allLabs.map(lab => (
            <label className="check" key={lab}>
              <input type="checkbox" checked={filters.labs.includes(lab)} onChange={e => toggleLab(lab, e.target.checked)} />
              <span>{lab}</span>
            </label>
          ))}
        </div>

        <details className="filter-group" id="provider-filter">
          <summary className="filter-title">托管商（更多）</summary>
          <div style={{ marginTop: 6 }}>
            <p className="small muted" style={{ marginBottom: 4 }}>有任一选中托管商的报价</p>
            {allProviders.map(provider => (
              <label className="check" key={provider}>
                <input
                  type="checkbox"
                  checked={filters.providers.includes(provider)}
                  onChange={e => toggleProvider(provider, e.target.checked)}
                />
                <span>{provider}</span>
              </label>
            ))}
            <label className="check">
              <input
                type="checkbox"
                checked={filters.providers.includes('__gateway_only__')}
                onChange={e => toggleProvider('__gateway_only__', e.target.checked)}
              />
              <span>仅网关（无第一方 / 云报价）</span>
            </label>
          </div>
        </details>

        <div className="filter-group">
          <label className="filter-title" htmlFor="max-output">最高输出价</label>
          <select id="max-output" value={filters.maxOutput} onChange={e => update({ maxOutput: e.target.value })}>
            <option value="">不限</option>
            {PRICE_OPTIONS.map(v => <option key={v} value={v}>≤ ${v} / 1M</option>)}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-title" htmlFor="min-context">最低上下文</label>
          <select id="min-context" value={filters.minContext} onChange={e => update({ minContext: e.target.value })}>
            <option value="">不限</option>
            {CONTEXT_OPTIONS.map(v => <option key={v} value={v}>≥ {fmtContext(v)}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <div className="filter-title">能力 / 状态</div>
          <label className="switch-row"><span>支持推理</span><input type="checkbox" checked={filters.reasoning} onChange={e => update({ reasoning: e.target.checked })} /></label>
          <label className="switch-row"><span>开源权重</span><input type="checkbox" checked={filters.openWeights} onChange={e => update({ openWeights: e.target.checked })} /></label>
          <label className="switch-row"><span>仅稳定版</span><input type="checkbox" checked={filters.stableOnly} onChange={e => update({ stableOnly: e.target.checked })} /></label>
          <label className="switch-row"><span>只看有评测</span><input type="checkbox" checked={filters.hasArena} onChange={e => update({ hasArena: e.target.checked })} /></label>
        </div>
      </aside>

      <section className="results">
        <div className="toolbar">
          <div className="search-wrap">
            <div className="search-field">
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <circle cx="7" cy="7" r="4.5" stroke="currentColor" strokeWidth="1.5" />
                <path d="m10.5 10.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              <input
                className="search"
                type="search"
                aria-label="搜索模型、实验室或别名"
                placeholder="搜索模型 / 实验室 / 别名"
                value={filters.q}
                onChange={e => update({ q: e.target.value })}
              />
            </div>
          </div>
          <select
            className="sort-select"
            value={filters.sortKey}
            onChange={e => update({ sortKey: e.target.value as SortKey })}
            aria-label="排序"
          >
            {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <button
            type="button"
            className="btn mobile-only"
            aria-expanded={filtersOpen}
            aria-controls="filters-panel"
            onClick={() => setFiltersOpen(v => !v)}
          >
            筛选
          </button>
          <span className="count">{rows.length} 个结果</span>
        </div>

        {activeChips.length > 0 && (
          <div className="chips">
            {activeChips.map(chip => (
              <span className="chip" key={chip.label}>
                {chip.label}
                <button type="button" onClick={chip.remove} aria-label={`移除 ${chip.label}`}>×</button>
              </span>
            ))}
            <button type="button" className="chip clear" onClick={() => setFilters(DEFAULT_FILTERS)}>清除全部</button>
          </div>
        )}

        {rows.length ? (
          <>
            <div className="table-wrap desktop-only">
              <table className="model-table">
                <caption className="sr-only">模型目录，按当前筛选和排序显示</caption>
                <thead>
                  <tr>
                    <th className="col-check"><span className="sr-only">对比</span></th>
                    <th>模型</th>
                    <th className="num" aria-sort={ariaSort('context')}>{sortButton('context', '上下文')}</th>
                    <th className="num" aria-sort={ariaSort('price')}>
                      {sortButton('price', '价格')}
                      <span className="th-sub">输入 / 输出 · USD / 1M</span>
                    </th>
                    <th>推理</th>
                    <th className="num" aria-sort={ariaSort('arena_text')}>
                      {sortButton('arena_text', 'Arena text')}
                      <span className="th-sub">CI 共享刻度</span>
                    </th>
                    <th className="num" aria-sort={ariaSort('arena_webdev')}>
                      {sortButton('arena_webdev', 'Arena webdev')}
                      <span className="th-sub">CI 共享刻度</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(row => {
                    const prices = fmtPriceLines(row.price)
                    return (
                      <tr className="model-row" key={row.id} onClick={() => router.push(modelHref(row.canonicalId))}>
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
                            <Link href={modelHref(row.canonicalId)} onClick={e => e.stopPropagation()}>{row.name}</Link>
                            <RowBadges row={row} exceptionsOnly />
                          </div>
                          <div className="model-sub">
                            {row.lab} · <span className="id">{row.canonicalId}</span>
                          </div>
                        </td>
                        <td className="num">{fmtContext(row.context)}</td>
                        <td className="price-cell">
                          <div><span className="lab">输入</span><b>{prices.input}</b></div>
                          <div><span className="lab">输出</span><b>{prices.output}</b></div>
                          {row.price?.gatewayOnly && <div className="gateway-note">仅网关</div>}
                        </td>
                        <td><span className="reasoning-pill">{row.reasoningLabel}</span></td>
                        <td><ScoreCell score={row.text} domain={domains.text} label="Arena text" /></td>
                        <td><ScoreCell score={row.webdev} domain={domains.webdev} label="Arena webdev" /></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="mobile-list">
              {rows.map(row => {
                const prices = fmtPriceLines(row.price)
                return (
                  <article className="mobile-card" key={row.id}>
                    <div className="mobile-card-top">
                      <div>
                        <div className="lab">{row.lab}</div>
                        <h3><Link href={modelHref(row.canonicalId)}>{row.name}</Link></h3>
                        <div className="mobile-badges">
                          <RowBadges row={row} exceptionsOnly />
                        </div>
                        <div className="mobile-id">{row.canonicalId}</div>
                      </div>
                      <button
                        type="button"
                        className={`btn small ${compare.selected.includes(row.id) ? 'primary' : ''}`}
                        onClick={() => compare.toggle(row.id)}
                      >
                        {compare.selected.includes(row.id) ? '已加入' : '对比'}
                      </button>
                    </div>
                    <div className="mobile-scores">
                      <MobileScore label="Arena text" score={row.text} domain={domains.text} />
                      <MobileScore label="Arena webdev" score={row.webdev} domain={domains.webdev} />
                    </div>
                    <div className="mobile-facts">
                      <span>上下文 <b>{fmtContext(row.context)}</b></span>
                      <span>价格 <b>{prices.input} / {prices.output}</b></span>
                      <span>推理 <b>{row.reasoningLabel}</b></span>
                    </div>
                  </article>
                )
              })}
            </div>

            <div className="table-foot">
              <span>显示 {rows.length} / {models.length} 个模型 · 价格 USD / 1M tokens</span>
              <span>价格快照 {dataDate} · Arena latest</span>
            </div>
          </>
        ) : (
          <div className="empty">
            <strong>没有符合条件的模型</strong>
            <p>删掉一两个筛选条件，或者清除全部筛选再看。</p>
            <button type="button" className="btn primary" onClick={() => setFilters(DEFAULT_FILTERS)}>清除筛选</button>
          </div>
        )}
      </section>
    </div>
  )
}

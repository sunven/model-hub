'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { RowBadges } from './badges'
import { CiRail, ciDomain } from './ci-rail'
import { ScoreCell } from './score-pill'
import { useCompare } from './compare-provider'
import { ciHalf, fmtContext, fmtPriceLines, fmtRange } from '@/lib/format'
import type { ModelRow } from '@/lib/types'

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

function parseLabs(value: string | null): string[] {
  return (value ?? '').split(',').filter(Boolean)
}

export function ExploreClient({ models, dataDate }: { models: ModelRow[]; dataDate: string }) {
  const router = useRouter()
  const compare = useCompare()

  const [q, setQ] = useState('')
  const [labs, setLabs] = useState<string[]>([])
  const [providers, setProviders] = useState<string[]>([])
  const [maxOutput, setMaxOutput] = useState('')
  const [minContext, setMinContext] = useState('')
  const [reasoning, setReasoning] = useState(false)
  const [openWeights, setOpenWeights] = useState(false)
  const [stableOnly, setStableOnly] = useState(false)
  const [hasArena, setHasArena] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('arena_text')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [urlReady, setUrlReady] = useState(false)

  useIsoLayoutEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sort = params.get('sort')
    setQ(params.get('q') ?? '')
    setLabs(parseLabs(params.get('labs')))
    setProviders(parseLabs(params.get('providers')))
    setMaxOutput(params.get('maxOutput') ?? '')
    setMinContext(params.get('minContext') ?? '')
    setReasoning(params.get('reasoning') === '1')
    setOpenWeights(params.get('openWeights') === '1')
    setStableOnly(params.get('stableOnly') === '1')
    setHasArena(params.get('hasArena') === '1')
    setSortKey(SORT_OPTIONS.some(o => o.value === sort) ? (sort as SortKey) : 'arena_text')
    setUrlReady(true)
  }, [])

  const allLabs = useMemo(() => [...new Set(models.map(m => m.lab))].sort((a, b) => a.localeCompare(b, 'zh')), [models])
  const allProviders = useMemo(
    () => [...new Set(models.flatMap(m => m.providerNames))].sort((a, b) => a.localeCompare(b)),
    [models],
  )

  useEffect(() => {
    const filteredView = Boolean(
      q ||
        labs.length ||
        providers.length ||
        maxOutput ||
        minContext ||
        reasoning ||
        openWeights ||
        stableOnly ||
        hasArena ||
        sortKey !== 'arena_text',
    )
    const metas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="robots"]'))
    const previous = metas.map(meta => meta.getAttribute('content'))
    for (const meta of metas) meta.setAttribute('content', filteredView ? 'noindex,follow' : 'index,follow')
    return () => {
      metas.forEach((meta, i) => {
        if (previous[i]) meta.setAttribute('content', previous[i]!)
      })
    }
  }, [q, labs, providers, maxOutput, minContext, reasoning, openWeights, stableOnly, hasArena, sortKey])

  useEffect(() => {
    if (!urlReady || window.location.pathname !== '/') return
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
  }, [urlReady, q, labs, providers, maxOutput, minContext, reasoning, openWeights, stableOnly, hasArena, sortKey])

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

  const rows = useMemo(() => {
    const value = (model: ModelRow): number | string | null => {
      switch (sortKey) {
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
    const direction = sortKey === 'price' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const av = value(a)
      const bv = value(b)
      if (av == null) return bv == null ? a.name.localeCompare(b.name, 'zh') : 1
      if (bv == null) return -1
      if (av === bv) return a.name.localeCompare(b.name, 'zh')
      return (av < bv ? -1 : 1) * direction
    })
  }, [filtered, sortKey])

  const domains = useMemo(
    () => ({
      text: ciDomain(models.map(m => m.text)),
      webdev: ciDomain(models.map(m => m.webdev)),
    }),
    [models],
  )

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

  function ariaSort(key: SortKey) {
    if (sortKey !== key) return 'none' as const
    return key === 'price' ? ('ascending' as const) : ('descending' as const)
  }

  return (
    <div className="workbench" data-url-ready={urlReady ? 'true' : 'false'}>
      <aside className={`filters ${filtersOpen ? 'open' : ''}`} id="filters-panel" aria-label="筛选">
        <div className="filters-head">
          <strong>筛选</strong>
          <div className="head-actions">
            <button type="button" className="btn small ghost" onClick={clearFilters}>清除</button>
            <button type="button" className="btn small mobile-only" onClick={() => setFiltersOpen(false)}>关闭</button>
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
          <summary className="filter-title">托管商（更多）</summary>
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
                value={q}
                onChange={e => setQ(e.target.value)}
              />
            </div>
          </div>
          <select className="sort-select" value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} aria-label="排序">
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
            <button type="button" className="chip clear" onClick={clearFilters}>清除全部</button>
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
              {rows.map(row => (
                <article className="mobile-card" key={row.id}>
                  <div className="mobile-card-top">
                    <div>
                      <div className="lab">{row.lab}</div>
                      <h3><Link href={`/models/${row.canonicalId}`}>{row.name}</Link></h3>
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
                    <div className="mobile-score">
                      <span>Arena text</span>
                      {row.text ? (
                        <>
                          <strong>{row.text.rating.toFixed(1)}</strong>
                          <div className="score-top">
                            <CiRail stat={row.text} domain={domains.text} width={48} />
                            <span className="lb-ci">±{ciHalf(row.text).toFixed(1)}</span>
                          </div>
                          <small>#{row.text.rank} · {row.text.condition}</small>
                        </>
                      ) : (
                        <>
                          <span className="missing">未收录</span>
                          <small>Arena 未收录</small>
                        </>
                      )}
                    </div>
                    <div className="mobile-score">
                      <span>Arena webdev</span>
                      {row.webdev ? (
                        <>
                          <strong>{row.webdev.rating.toFixed(1)}</strong>
                          <div className="score-top">
                            <CiRail stat={row.webdev} domain={domains.webdev} width={48} />
                            <span className="lb-ci">±{ciHalf(row.webdev).toFixed(1)}</span>
                          </div>
                          <small>#{row.webdev.rank} · {row.webdev.condition}</small>
                        </>
                      ) : (
                        <>
                          <span className="missing">未收录</span>
                          <small>Arena 未收录</small>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="mobile-facts">
                    <span>上下文 <b>{fmtContext(row.context)}</b></span>
                    <span>价格 <b>{fmtRange(row.price?.inputMin, row.price?.inputMax)} / {fmtRange(row.price?.outputMin, row.price?.outputMax)}</b></span>
                    <span>推理 <b>{row.reasoningLabel}</b></span>
                  </div>
                </article>
              ))}
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
            <button type="button" className="btn primary" onClick={clearFilters}>清除筛选</button>
          </div>
        )}
      </section>
    </div>
  )
}

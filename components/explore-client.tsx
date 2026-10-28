'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { RowBadges } from './badges'
import { CiRail } from './ci-rail'
import { ScoreCell } from './score-pill'
import { CompareButton, CompareCheckbox } from './compare-tray'
import { useExploreQuery } from './use-explore-query'
import {
  CONTEXT_OPTIONS,
  PRICE_OPTIONS,
  SORT_OPTIONS,
  describeActiveFilters,
  selectModels,
  type SortKey,
} from '@/lib/explore-query'
import { ciHalf, fmtContext, fmtPriceLines } from '@/lib/format'
import { modelHref } from '@/lib/site'
import type { BoardDomains, CiDomain, ModelRow, ScoreView } from '@/lib/types'

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

export function ExploreClient({
  models,
  domains,
  dataDate,
}: {
  models: ModelRow[]
  domains: BoardDomains
  dataDate: string
}) {
  const router = useRouter()
  const { query, update, reset, toggleInList, removeFilter, urlReady } = useExploreQuery()
  const [filtersOpen, setFiltersOpen] = useState(false)

  const allLabs = useMemo(() => [...new Set(models.map(m => m.lab))].sort((a, b) => a.localeCompare(b, 'zh')), [models])
  const allProviders = useMemo(
    () => [...new Set(models.flatMap(m => m.providerNames))].sort((a, b) => a.localeCompare(b)),
    [models],
  )

  const rows = useMemo(() => selectModels(models, query), [models, query])
  const activeChips = describeActiveFilters(query)

  function sortButton(key: SortKey, label: string) {
    return (
      <button type="button" className="th-sort" onClick={() => update({ sortKey: key })}>
        {label}
        {query.sortKey === key && <span className="arrow">{key === 'price' ? '↑' : '↓'}</span>}
      </button>
    )
  }

  function ariaSort(key: SortKey) {
    if (query.sortKey !== key) return 'none' as const
    return key === 'price' ? ('ascending' as const) : ('descending' as const)
  }

  return (
    <div className="workbench" data-url-ready={urlReady ? 'true' : 'false'}>
      <aside className={`filters ${filtersOpen ? 'open' : ''}`} id="filters-panel" aria-label="筛选">
        <div className="filters-head">
          <strong>筛选</strong>
          <div className="head-actions">
            <button type="button" className="btn small ghost" onClick={reset}>清除</button>
            <button type="button" className="btn small mobile-only" onClick={() => setFiltersOpen(false)}>关闭</button>
          </div>
        </div>

        <div className="filter-group" id="lab-filter">
          <div className="filter-title">实验室</div>
          {allLabs.map(lab => (
            <label className="check" key={lab}>
              <input type="checkbox" checked={query.labs.includes(lab)} onChange={() => toggleInList('labs', lab)} />
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
                  checked={query.providers.includes(provider)}
                  onChange={() => toggleInList('providers', provider)}
                />
                <span>{provider}</span>
              </label>
            ))}
            <label className="check">
              <input
                type="checkbox"
                checked={query.gatewayOnly}
                onChange={e => update({ gatewayOnly: e.target.checked })}
              />
              <span>仅网关（无第一方 / 云报价）</span>
            </label>
          </div>
        </details>

        <div className="filter-group">
          <label className="filter-title" htmlFor="max-output">最高输出价</label>
          <select
            id="max-output"
            value={query.maxOutput === null ? '' : String(query.maxOutput)}
            onChange={e => update({ maxOutput: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">不限</option>
            {PRICE_OPTIONS.map(v => <option key={v} value={v}>≤ ${v} / 1M</option>)}
          </select>
        </div>

        <div className="filter-group">
          <label className="filter-title" htmlFor="min-context">最低上下文</label>
          <select
            id="min-context"
            value={query.minContext === null ? '' : String(query.minContext)}
            onChange={e => update({ minContext: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">不限</option>
            {CONTEXT_OPTIONS.map(v => <option key={v} value={v}>≥ {fmtContext(v)}</option>)}
          </select>
        </div>

        <div className="filter-group">
          <div className="filter-title">能力 / 状态</div>
          <label className="switch-row"><span>支持推理</span><input type="checkbox" checked={query.reasoning} onChange={e => update({ reasoning: e.target.checked })} /></label>
          <label className="switch-row"><span>开源权重</span><input type="checkbox" checked={query.openWeights} onChange={e => update({ openWeights: e.target.checked })} /></label>
          <label className="switch-row"><span>仅稳定版</span><input type="checkbox" checked={query.stableOnly} onChange={e => update({ stableOnly: e.target.checked })} /></label>
          <label className="switch-row"><span>只看有评测</span><input type="checkbox" checked={query.hasArena} onChange={e => update({ hasArena: e.target.checked })} /></label>
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
                aria-label="搜索模型、实验室或家族"
                placeholder="搜索模型 / 实验室 / 家族"
                value={query.q}
                onChange={e => update({ q: e.target.value })}
              />
            </div>
          </div>
          <select
            className="sort-select"
            value={query.sortKey}
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
              <span className="chip" key={`${chip.kind}:${chip.value ?? ''}`}>
                {chip.label}
                <button type="button" onClick={() => removeFilter(chip)} aria-label={`移除 ${chip.label}`}>×</button>
              </span>
            ))}
            <button type="button" className="chip clear" onClick={reset}>清除全部</button>
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
                          <CompareCheckbox modelId={row.id} label={`加入对比 ${row.name}`} />
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
                      <CompareButton modelId={row.id} small short />
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
            <button type="button" className="btn primary" onClick={reset}>清除筛选</button>
          </div>
        )}
      </section>
    </div>
  )
}

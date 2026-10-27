'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { CiRail, ciDomain } from './ci-rail'
import type { LeaderboardRow } from '@/lib/types'

const PAGE = 50

export function LeaderboardClient({
  board,
  rows,
  dataDate,
}: {
  board: 'text' | 'webdev'
  rows: LeaderboardRow[]
  dataDate: string
}) {
  const [q, setQ] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE)

  useEffect(() => {
    const metas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="robots"]'))
    if (!metas.length) return
    const previous = metas.map(meta => meta.getAttribute('content'))
    for (const meta of metas) meta.setAttribute('content', q ? 'noindex,follow' : 'index,follow')
    return () => {
      metas.forEach((meta, i) => {
        if (previous[i]) meta.setAttribute('content', previous[i]!)
      })
    }
  }, [q])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return rows
    return rows.filter(row => `${row.name} ${row.lab} ${row.organization} ${row.condition}`.toLowerCase().includes(query))
  }, [rows, q])

  const visible = filtered.slice(0, visibleCount)
  const boardLabel = board === 'text' ? 'Arena text' : 'Arena webdev'
  const domains = ciDomain(visible)
  const [first, second] = rows
  const topGap =
    first && second
      ? Math.round((parseFloat(first.rating.toFixed(1)) - parseFloat(second.rating.toFixed(1))) * 10) / 10
      : null
  const topOverlap = Boolean(
    first && second && first.ciLow <= second.ciHigh && second.ciLow <= first.ciHigh,
  )

  const finding =
    first && second && topGap !== null
      ? `rating 是偏好评分，不是准确率。${first.name} 与 ${second.name} 相差 ${topGap.toFixed(1)} 分，置信区间${
          topOverlap ? '重叠' : '不重叠'
        }；text / webdev 不可跨榜比较。`
      : 'rating 是偏好评分，不是准确率；text / webdev 不可跨榜比较。'

  return (
    <div className="lb-wrap sheet-inner">
      <div className="lb-head">
        <div>
          <h1>Arena 榜单</h1>
          <p>{finding}</p>
        </div>
        <div className="detail-actions">
          <Link className="btn" href="/">模型目录</Link>
        </div>
      </div>

      <nav className="tabs" aria-label="榜单类型">
        <Link
          className={`tab ${board === 'text' ? 'active' : ''}`}
          href="/leaderboards/text"
          aria-current={board === 'text' ? 'page' : undefined}
        >
          Arena text
        </Link>
        <Link
          className={`tab ${board === 'webdev' ? 'active' : ''}`}
          href="/leaderboards/webdev"
          aria-current={board === 'webdev' ? 'page' : undefined}
        >
          Arena webdev
        </Link>
      </nav>

      <div className="lb-toolbar">
        <input
          className="search"
          type="search"
          aria-label="搜索模型、组织或条件"
          placeholder="搜索模型 / 组织 / 条件"
          value={q}
          onChange={e => { setQ(e.target.value); setVisibleCount(PAGE) }}
        />
      </div>

      <p className="lb-source">
        {boardLabel} · 来源{' '}
        <a
          href="https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset"
          target="_blank"
          rel="noopener noreferrer"
        >
          LMArena Leaderboard Dataset
        </a>
        （CC BY 4.0）· 数据 {dataDate} · 已显示 {visible.length} / {filtered.length} 条 · 未匹配行保留在榜单，不链模型页。
      </p>

      {visible.length ? (
        <>
          <div className="lb-table-wrap desktop-only">
            <table className="lb-table">
              <caption className="sr-only">{boardLabel} 榜单，按 rank 排序</caption>
              <colgroup>
                <col style={{ width: '5%' }} />
                <col style={{ width: '36%' }} />
                <col style={{ width: '18%' }} />
                <col style={{ width: '12%' }} />
                <col style={{ width: '15%' }} />
                <col style={{ width: '14%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>排名</th>
                  <th>模型</th>
                  <th>
                    评分区间
                    <span className="th-sub">CI 共享刻度 · 当前 {visible.length} 条</span>
                  </th>
                  <th className="num">评分</th>
                  <th>条件</th>
                  <th className="num">票数</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(row => (
                  <tr className={row.kind === 'model' ? 'lb-row' : ''} key={row.id}>
                    <td className="lb-rank">#{row.rank}</td>
                    <td>
                      {row.href ? (
                        <Link className="lb-name" href={row.href}>{row.name}</Link>
                      ) : (
                        <span className="lb-name">{row.name}</span>
                      )}
                      {row.kind === 'unmatched' && <span className="lb-badge">未匹配</span>}
                      <div className="lb-org">{row.lab}</div>
                    </td>
                    <td className="lb-range">
                      <CiRail stat={row} domain={domains} width={144} />
                    </td>
                    <td className="num">
                      <div className="lb-score">
                        <span className="lb-rating">{row.rating.toFixed(1)}</span>
                        <span className="lb-ci">±{((row.ciHigh - row.ciLow) / 2).toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="lb-condition">{row.condition}</td>
                    <td className="num">{row.votes.toLocaleString('en-US')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mobile-list">
            {visible.map(row => (
              <article className="mobile-card" key={row.id}>
                <div className="mobile-card-top">
                  <div>
                    <div className="lab">#{row.rank} · {row.lab}</div>
                    <h3>
                      {row.href ? <Link href={row.href}>{row.name}</Link> : row.name}
                      {row.kind === 'unmatched' && <span className="lb-badge">未匹配</span>}
                    </h3>
                  </div>
                  <div className="lb-rating-cell">
                    <div className="lb-rating-line">
                      <CiRail stat={row} domain={domains} width={44} />
                      <span className="lb-rating">{row.rating.toFixed(1)}</span>
                    </div>
                    <span className="lb-ci">±{((row.ciHigh - row.ciLow) / 2).toFixed(1)}</span>
                  </div>
                </div>
                <div className="mobile-facts" style={{ marginTop: 8 }}>
                  <span>条件 <b>{row.condition}</b></span>
                  <span>票数 <b>{row.votes.toLocaleString('en-US')}</b></span>
                </div>
              </article>
            ))}
          </div>

          {visible.length < filtered.length && (
            <div className="lb-more">
              <button type="button" className="btn" onClick={() => setVisibleCount(count => count + PAGE)}>显示更多</button>
            </div>
          )}
        </>
      ) : (
        <div className="empty">
          <strong>没有找到模型</strong>
          <p>清空搜索，或者换一个关键词。</p>
          <button type="button" className="btn primary" onClick={() => setQ('')}>清空搜索</button>
        </div>
      )}
    </div>
  )
}

'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
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

  return (
    <div className="lb-wrap">
      <div className="lb-head">
        <div>
          <div className="kicker">LEADERBOARD · {boardLabel}</div>
          <h1>Arena 榜单</h1>
          <p>rating 是偏好评分，不是准确率；text / webdev 不可直接比较；未匹配行保留在榜单，不链模型页。</p>
        </div>
        <div className="detail-actions">
          <Link className="btn" href="/">← 模型表</Link>
        </div>
      </div>

      <div className="board-tabs">
        <Link className={`board-tab ${board === 'text' ? 'active' : ''}`} href="/leaderboards/text">Arena text</Link>
        <Link className={`board-tab ${board === 'webdev' ? 'active' : ''}`} href="/leaderboards/webdev">Arena webdev</Link>
      </div>

      <div className="lb-toolbar">
        <input
          className="search"
          type="search"
          placeholder="搜索模型 / 组织 / condition"
          value={q}
          onChange={e => { setQ(e.target.value); setVisibleCount(PAGE) }}
        />
      </div>

      <div className="lb-source">
        来源：Arena HuggingFace leaderboard-dataset · CC BY 4.0 · 数据 {dataDate} · 当前显示 {visible.length}/{filtered.length} 条
        · 首批 50 条 + 每次「显示更多」+50。
      </div>

      {visible.length ? (
        <>
          <div className="lb-table-wrap desktop-only">
            <table className="lb-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Model</th>
                  <th>Organization</th>
                  <th>Rating</th>
                  <th>Condition</th>
                  <th>Votes</th>
                </tr>
              </thead>
              <tbody>
                {visible.map(row => (
                  <tr className={row.kind === 'model' ? 'lb-row' : 'lb-unmatched'} key={row.id}>
                    <td className="lb-rank">#{row.rank}</td>
                    <td>
                      {row.href ? (
                        <Link className="lb-name" href={row.href}>{row.name}</Link>
                      ) : (
                        <span className="lb-name">{row.name}</span>
                      )}
                      {row.kind === 'unmatched' && <span className="lb-badge" style={{ marginLeft: 6 }}>未匹配</span>}
                      <div className="lb-org">{row.lab}</div>
                    </td>
                    <td>{row.organization}</td>
                    <td><span className="lb-rating">{row.rating.toFixed(1)}</span> <span className="lb-ci">±{((row.ciHigh - row.ciLow) / 2).toFixed(1)}</span></td>
                    <td>{row.condition}</td>
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
                      {row.kind === 'unmatched' && <span className="lb-badge" style={{ marginLeft: 6 }}>未匹配</span>}
                    </h3>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div className="lb-rating">{row.rating.toFixed(1)}</div>
                    <div className="lb-ci">±{((row.ciHigh - row.ciLow) / 2).toFixed(1)}</div>
                  </div>
                </div>
                <div className="mobile-facts" style={{ marginTop: 8 }}>
                  <span>Condition <b>{row.condition}</b></span>
                  <span>Votes <b>{row.votes.toLocaleString('en-US')}</b></span>
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
          <button type="button" className="btn primary" style={{ marginTop: 12 }} onClick={() => setQ('')}>清空搜索</button>
        </div>
      )}
    </div>
  )
}

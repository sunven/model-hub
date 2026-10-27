'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useEffect, useMemo, type ReactNode } from 'react'
import { useCompare } from './compare-provider'
import { RowBadges } from './badges'
import { ScorePill } from './score-pill'
import {
  fmtCnyRange,
  fmtContext,
  fmtRange,
} from '@/lib/format'
import type { FxConfig } from '@/scripts/types'
import type { ModelRow } from '@/lib/types'

const AA_URL = 'https://artificialanalysis.ai/leaderboards/models'

type Field = {
  label: string
  value: (model: ModelRow) => string
  render: (model: ModelRow, fx: FxConfig) => ReactNode
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
    value: m => (m.price ? `${fmtRange(m.price.inputMin, m.price.inputMax)}/1M` : '未公布'),
    render: (m, fx) => {
      if (!m.price) return '未公布'
      const cny = fmtCnyRange(m.price.inputMin, m.price.inputMax, fx)
      return (
        <span>
          {fmtRange(m.price.inputMin, m.price.inputMax)} / 1M
          {cny && <span className="small muted" style={{ display: 'block' }}>{cny}</span>}
        </span>
      )
    },
  },
  {
    label: '输出价格',
    value: m => (m.price ? `${fmtRange(m.price.outputMin, m.price.outputMax)}/1M` : '未公布'),
    render: (m, fx) => {
      if (!m.price) return '未公布'
      const cny = fmtCnyRange(m.price.outputMin, m.price.outputMax, fx)
      return (
        <span>
          {fmtRange(m.price.outputMin, m.price.outputMax)} / 1M
          {cny && <span className="small muted" style={{ display: 'block' }}>{cny}</span>}
        </span>
      )
    },
  },
  {
    label: '上下文',
    value: m => fmtContext(m.context),
    render: m => fmtContext(m.context),
  },
  {
    label: '推理',
    value: m => m.reasoningLabel,
    render: m => m.reasoningLabel,
  },
  {
    label: 'Arena text',
    value: m => (m.text ? `${m.text.rating.toFixed(1)}|${m.text.rank}|${m.text.condition}` : '未收录'),
    render: m => (
      <span>
        <ScorePill score={m.text} />
        {m.text && <span className="small muted" style={{ display: 'block' }}>{m.text.condition}</span>}
      </span>
    ),
  },
  {
    label: 'Arena webdev',
    value: m => (m.webdev ? `${m.webdev.rating.toFixed(1)}|${m.webdev.rank}|${m.webdev.condition}` : '未收录'),
    render: m => (
      <span>
        <ScorePill score={m.webdev} />
        {m.webdev && <span className="small muted" style={{ display: 'block' }}>{m.webdev.condition}</span>}
      </span>
    ),
  },
  {
    label: '开源权重',
    value: m => (m.openWeights ? '是' : '否'),
    render: m => (m.openWeights ? '是' : '否'),
  },
  {
    label: '发布',
    value: m => m.releaseDate ?? '—',
    render: m => m.releaseDate ?? '—',
  },
  {
    label: 'AA',
    value: () => 'external',
    render: () => <a className="btn tiny" href={AA_URL} target="_blank" rel="noopener noreferrer">外部链接</a>,
  },
]

export function CompareClient({ models, fx }: { models: ModelRow[]; fx: FxConfig }) {
  const params = useSearchParams()
  const compare = useCompare()
  const byId = useMemo(() => new Map(models.map(m => [m.id, m])), [models])

  useEffect(() => {
    const fromUrl = (params.get('models') ?? '').split(',').filter(Boolean).slice(0, 3)
    if (fromUrl.length) compare.setSelected(fromUrl)
    // Only initialize from URL on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const selected = compare.selected.map(id => byId.get(id)).filter(Boolean) as ModelRow[]

  if (!selected.length) {
    return (
      <div className="compare-empty">
        <div className="kicker">COMPARE SET</div>
        <h1>先选两个模型</h1>
        <p>从模型表勾选，或在详情页点「加入对比」。最多 3 个。</p>
        <Link className="btn primary" href="/">去模型表</Link>
      </div>
    )
  }

  const values = FIELDS.map(field => selected.map(m => field.value(m)))
  const diffs = values.map(vals => new Set(vals).size > 1)

  return (
    <div className="compare-wrap">
      <div className="compare-head">
        <div>
          <div className="kicker">COMPARE SET · {selected.length}/3</div>
          <h1>并排比较</h1>
          <p>差异高亮只表示不同，不判定赢家；缺失用「—」表示。</p>
        </div>
        <div className="detail-actions">
          <button type="button" className="btn ghost" onClick={() => compare.clear()}>清空全部</button>
          <Link className="btn ghost" href="/">← 返回模型表</Link>
        </div>
      </div>

      {selected.length < 2 && (
        <p className="source-box" style={{ marginBottom: 10 }}>再选一个模型就能对比。当前只有 1 个。</p>
      )}

      <div className="compare-table-wrap">
        <table className="compare-table">
          <thead>
            <tr>
              <th>字段</th>
              {selected.map(m => (
                <th key={m.id}>
                  <Link href={`/models/${m.canonicalId}`}>{m.name}</Link>
                  <span className="cell-sub">
                    {m.lab} {' '}
                    <button type="button" className="btn tiny" onClick={() => compare.remove(m.id)}>移除</button>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {FIELDS.map((field, i) => (
              <tr key={field.label}>
                <td>{field.label}</td>
                {selected.map((m, j) => (
                  <td key={m.id} className={diffs[i] ? 'diff' : ''}>{field.render(m, fx)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="source-box" style={{ marginTop: 10 }}>
        价格 USD / 1M tokens；CNY 由本地汇率表折算，仅供参考。完整报价见模型详情。Arena text / webdev 不可跨榜比较。
      </p>
    </div>
  )
}

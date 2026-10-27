'use client'

import Link from 'next/link'
import { useMemo, type ReactNode } from 'react'
import { useCompare } from './compare-provider'
import { RowBadges } from './badges'
import { ScorePill } from './score-pill'
import { CnyRange } from './cny-price'
import { fmtContext, fmtRange, scoreMeta } from '@/lib/format'
import { modelHref } from '@/lib/site'
import type { FxConfig } from '@/lib/snapshot'
import type { BoardDomains, ModelRow } from '@/lib/types'

const AA_URL = 'https://artificialanalysis.ai/leaderboards/models'

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
        <span>
          {fmtRange(m.price.inputMin, m.price.inputMax)} / 1M
          <CnyRange min={m.price.inputMin} max={m.price.inputMax} fx={fx} className="small muted cell-block" />
        </span>
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
        <span>
          {fmtRange(m.price.outputMin, m.price.outputMax)} / 1M
          <CnyRange min={m.price.outputMin} max={m.price.outputMax} fx={fx} className="small muted cell-block" />
        </span>
      )
    },
  },
  {
    label: '上下文',
    numeric: true,
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
    render: (m, fx, domains) => (
      <span className="compare-score">
        <ScorePill score={m.text} domain={domains.text} />
        {m.text && <span className="cell-sub">{scoreMeta(m.text)}</span>}
      </span>
    ),
  },
  {
    label: 'Arena webdev',
    value: m => (m.webdev ? `${m.webdev.rating.toFixed(1)}|${m.webdev.rank}|${m.webdev.condition}` : '未收录'),
    render: (m, fx, domains) => (
      <span className="compare-score">
        <ScorePill score={m.webdev} domain={domains.webdev} />
        {m.webdev && <span className="cell-sub">{scoreMeta(m.webdev)}</span>}
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
    render: () => <a className="btn small" href={AA_URL} target="_blank" rel="noopener noreferrer">外部链接</a>,
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

  if (!compare.ready) return <div className="sheet-inner"><div className="empty">正在加载对比…</div></div>

  const selected = compare.selected.map(id => byId.get(id)).filter(Boolean) as ModelRow[]

  if (!selected.length) {
    return (
      <div className="sheet-inner">
        <div className="compare-empty">
          <div className="compare-intro">
            <h1>先选两个模型</h1>
            <p>从模型表勾选，或在详情页点「加入对比」。最多 3 个。</p>
            <div className="detail-actions">
              <Link className="btn primary" href="/">去模型表</Link>
            </div>
          </div>
          <div className="pick-list">
            <div className="pick-head">
              <h2>从 Arena text 排名开始</h2>
              <span>最多选择 3 个</span>
            </div>
            {picks.map(model => (
              <div className="pick-row" key={model.id}>
                <span className="pick-rank">#{model.text!.rank}</span>
                <div className="pick-name">
                  {model.name}
                  <small>{model.lab}</small>
                </div>
                <span className="pick-rating">{model.text!.rating.toFixed(1)}</span>
                <button type="button" className="btn small" onClick={() => compare.toggle(model.id)}>加入</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const values = FIELDS.map(field => selected.map(m => field.value(m)))
  const diffs = values.map(vals => new Set(vals).size > 1)
  const diffCount = diffs.filter(Boolean).length
  const finding =
    selected.length >= 2
      ? `已选 ${selected.length}/3 个模型；${FIELDS.length} 个字段中 ${diffCount} 个不同。差异只表示取值不同，不判定优劣。`
      : '已选 1/3 个模型；再选一个就能对比。'

  return (
    <div className="sheet-inner">
      <div className="compare-head">
        <div>
          <h1>并排比较</h1>
          <p>{finding}</p>
        </div>
        <div className="detail-actions">
          <button type="button" className="btn ghost" onClick={() => compare.clear()}>清空全部</button>
          <Link className="btn" href="/">{selected.length < 3 ? '添加模型' : '模型目录'}</Link>
        </div>
      </div>

      <div className="compare-table-wrap">
        <table className="compare-table">
          <caption className="sr-only">所选模型并排对比</caption>
          <thead>
            <tr>
              <th>字段</th>
              {selected.map(m => (
                <th key={m.id}>
                  <Link href={modelHref(m.canonicalId)}>{m.name}</Link>
                  <span className="cell-sub">
                    {m.lab}
                    <button type="button" className="btn small" onClick={() => compare.remove(m.id)}>移除</button>
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
                  <td
                    key={m.id}
                    className={[diffs[i] ? 'diff' : '', field.numeric ? 'num' : ''].filter(Boolean).join(' ')}
                  >
                    {field.render(m, fx, domains)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="source-box" style={{ marginTop: 10 }}>
        价格 USD / 1M tokens；CNY 由本地汇率表折算，仅供参考。完整报价见模型详情。Arena text / webdev
        不可跨榜比较；底色只表示取值不同，不判定赢家。
      </p>
    </div>
  )
}

import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StatusBadges } from '@/components/badges'
import { CompareButton } from '@/components/compare-tray'
import { JsonLd } from '@/components/json-ld'
import { OfferTable } from '@/components/offer-table'
import { OG_IMAGE } from '@/lib/site'
import { breadcrumbLd, webPageLd } from '@/lib/structured-data'
import {
  fmtCnyRange,
  fmtContext,
  fmtDate,
  fmtPrice,
  fmtRange,
} from '@/lib/format'
import {
  getModelByParams,
  getModelOffers,
  getModelScores,
  manifest,
  modelRows,
  models,
  primaryScore,
} from '@/lib/data'
import type { Offer, Score } from '@/lib/types'

type Props = { params: Promise<{ lab: string; model: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return models.map(model => {
    const [lab, ...rest] = model.canonicalModelId.split('/')
    return { lab, model: rest.join('/') }
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lab, model } = await params
  const found = getModelByParams(lab, model)
  if (!found) return { title: '模型未找到', robots: { index: false, follow: false } }
  const title = `${found.name} — 价格、上下文、推理等级与 Arena 评分`
  const description = found.description ?? `${found.name} 的价格、上下文、推理等级和 Arena 评分。`
  const path = `/models/${found.canonicalModelId}`
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      title: `${title} | Model Hub`,
      description,
      url: path,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: found.name }],
    },
    twitter: { card: 'summary_large_image', title: `${title} | Model Hub`, description, images: [OG_IMAGE] },
    robots: { index: true, follow: true },
  }
}

const AA_FALLBACK = 'https://artificialanalysis.ai/leaderboards/models'

function scoreHalf(score: Score) {
  return (score.ciHigh - score.ciLow) / 2
}

function ArenaCard({
  board,
  label,
  primary,
  scores,
}: {
  board: 'text' | 'webdev'
  label: string
  primary: Score | null
  scores: Score[]
}) {
  return (
    <div className="arena-card">
      <div className="arena-label">
        {label}
        <span className="badge">{primary?.condition ?? '未收录'}</span>
      </div>
      {primary ? (
        <>
          <div className="arena-big">{primary.rating.toFixed(1)}</div>
          <div className="arena-meta">
            <span>CI {primary.ciLow.toFixed(1)}–{primary.ciHigh.toFixed(1)}</span>
            <span>#{primary.rank}</span>
            <span>{primary.votes.toLocaleString('en-US')} votes</span>
          </div>
          <div className="arena-note">
            {primary.condition} · {primary.snapshotDate} · Arena HF
          </div>
          {scores.length > 1 && (
            <div className="arena-list">
              {scores.map(s => (
                <div className="arena-row" key={s.id}>
                  <span className="cond">{s.condition}</span>
                  <span className="rating">{s.rating.toFixed(1)}</span>
                  <span>#{s.rank} · ±{scoreHalf(s).toFixed(1)}</span>
                  <span className="votes">{s.votes.toLocaleString('en-US')} votes</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="arena-missing">Arena 未收录。这不代表能力差。</div>
          <Link className="btn tiny" href={`/leaderboards/${board}`}>查看 Arena {board} 榜</Link>
        </>
      )}
    </div>
  )
}

export default async function ModelPage({ params }: Props) {
  const { lab, model } = await params
  const found = getModelByParams(lab, model)
  if (!found) notFound()
  const row = modelRows.find(m => m.id === found.id)
  if (!row) notFound()

  const offers: Offer[] = getModelOffers(found.id)
  const allScores = getModelScores(found.id)
  const textScores = allScores.filter(s => s.board === 'text')
  const webdevScores = allScores.filter(s => s.board === 'webdev')
  const textPrimary = primaryScore(found.id, 'text')
  const webdevPrimary = primaryScore(found.id, 'webdev')
  const aaUrl = found.aaUrl ?? AA_FALLBACK
  const fx = manifest.fx
  const cnyIn = row.price ? fmtCnyRange(row.price.inputMin, row.price.inputMax, fx) : null
  const cnyOut = row.price ? fmtCnyRange(row.price.outputMin, row.price.outputMax, fx) : null
  const modalities = `${(found.modalities.input ?? []).join(' / ') || '未提供'} → ${(found.modalities.output ?? []).join(' / ') || '未提供'}`
  const modelDate = manifest.sources?.modelsDev?.files?.api?.fetchedAt
    ? new Date(manifest.sources.modelsDev.files.api.fetchedAt).toISOString().slice(0, 10)
    : '2026-10-26'

  const path = `/models/${found.canonicalModelId}`
  const pageDescription = found.description ?? `${found.name} 的价格、上下文、推理等级和 Arena 评分。`

  return (
    <div className="detail-wrap">
      <JsonLd data={webPageLd({ name: found.name, description: pageDescription, path })} />
      <JsonLd
        data={breadcrumbLd([
          { name: '模型目录', path: '/' },
          { name: found.name, path },
        ])}
      />
      <Link className="back" href="/">← 返回模型表</Link>
      <div className="detail-head">
        <div className="detail-title">
          <h1>{found.name}</h1>
          <div className="detail-sub">{found.lab} · {found.canonicalModelId}</div>
          <div className="detail-badges">
            <StatusBadges
              availability={found.availability}
              releaseBadges={found.releaseBadges}
              openWeights={found.openWeights}
              unmarked={row.unmarked}
            />
          </div>
        </div>
        <div className="detail-actions">
          <CompareButton modelId={found.id} />
          <a className="btn ghost" href={aaUrl} target="_blank" rel="noopener noreferrer">外部评测 · AA</a>
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <OfferTable offers={offers} />

          <section className="panel">
            <h2>Arena 评测 <span className="sub">分榜展示 · 不跨榜比较</span></h2>
            <div className="arena-grid">
              <ArenaCard board="text" label="Arena text" primary={textPrimary} scores={textScores} />
              <ArenaCard board="webdev" label="Arena webdev" primary={webdevPrimary} scores={webdevScores} />
            </div>
            <p className="source-box" style={{ marginTop: 9 }}>
              Arena rating 是偏好评分，不是准确率；置信区间重叠时不宣称显著优劣。text / webdev 是两个独立 Board。
            </p>
          </section>

          <section className="panel">
            <h2>能力与模态</h2>
            {found.description && <p className="source-box" style={{ marginBottom: 9 }}>{found.description}</p>}
            <div className="cap-list">
              <div><span>输入 / 输出模态</span><strong>{modalities}</strong></div>
              <div><span>工具调用</span><strong>{offers.some(o => o.capabilities.toolCall) ? '支持' : '未提供'}</strong></div>
              <div><span>结构化输出</span><strong>{offers.some(o => o.capabilities.structuredOutput) ? '支持' : '未提供'}</strong></div>
              <div><span>知识截止</span><strong>{found.knowledgeCutoff || '未提供'}</strong></div>
              <div><span>开源权重</span><strong>{found.openWeights ? '是' : '否'}</strong></div>
              <div><span>推理等级</span><strong>{found.reasoningLabel}</strong></div>
            </div>
          </section>

          <section className="panel">
            <div className="aa-card">
              <div>
                <strong>外部评测 · Artificial Analysis</strong>
                <p>站内不展示 AA 分数，也不调用 AA API。需要 Intelligence / Coding / 速度等指标时，请到 AA 查看。</p>
              </div>
              <a className="btn ghost" href={aaUrl} target="_blank" rel="noopener noreferrer">打开 AA</a>
            </div>
          </section>

          <section className="panel">
            <h2>来源与更新时间</h2>
            <div className="source-box">
              models.dev（MIT）· Arena HuggingFace（CC BY 4.0）· 快照 {modelDate}<br />
              价格以供应商官网为准；Arena 分数为 latest 快照，详情保留 condition 与日期。<br />
              本站非官方，模型与商标归各自所有者。<Link href="/about" style={{ color: 'var(--accent)', marginLeft: 4 }}>数据说明</Link>
            </div>
          </section>
        </div>

        <aside className="detail-side">
          <div className="panel">
            <h2>关键事实</h2>
            <div className="facts">
              <div className="fact">
                <span>价格 in / out</span>
                <strong>{fmtPrice(row.price)}</strong>
                <small className="small">{cnyIn && cnyOut ? `${cnyIn} / ${cnyOut} · 汇率 ${fx.as_of}` : 'USD / 1M tokens'}</small>
              </div>
              <div className="fact">
                <span>上下文</span>
                <strong>{fmtContext(row.context)}</strong>
                <small className="small">输出上限 {fmtContext(row.outputLimit)}</small>
              </div>
              <div className="fact">
                <span>推理</span>
                <strong>{found.reasoningLabel}</strong>
                <small className="small">详情见报价表</small>
              </div>
              <div className="fact">
                <span>发布 / 状态</span>
                <strong>{fmtDate(found.releaseDate)}</strong>
                <small className="small">
                  {found.availability === 'available' ? (row.unmarked ? '可用（未标记）' : '可用') : found.availability}
                  {found.openWeights ? ' · 开源权重' : ''}
                </small>
              </div>
            </div>
          </div>
          <div className="panel">
            <h2>快速操作</h2>
            <div style={{ display: 'grid', gap: 6 }}>
              <CompareButton modelId={found.id} />
              <Link className="btn" href="/">返回模型表</Link>
              <a className="btn ghost" href={aaUrl} target="_blank" rel="noopener noreferrer">在 AA 查看</a>
            </div>
          </div>
          <div className="panel">
            <h2>价格说明</h2>
            <p className="source-box">
              input {row.price ? fmtRange(row.price.inputMin, row.price.inputMax) : '未公布'} · output{' '}
              {row.price ? fmtRange(row.price.outputMin, row.price.outputMax) : '未公布'} · 1M tokens
              {row.price?.gatewayOnly ? ' · 仅网关报价' : ''}
            </p>
            <p className="source-box" style={{ marginTop: 6 }}>
              报价条目 {offers.length} 条，默认折叠网关与已弃用；完整明细见托管报价。
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}

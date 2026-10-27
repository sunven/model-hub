import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { StatusBadges } from '@/components/badges'
import { CiRail, ciDomain, type CiDomain } from '@/components/ci-rail'
import { CompareButton } from '@/components/compare-tray'
import { JsonLd } from '@/components/json-ld'
import { OfferTable } from '@/components/offer-table'
import { modelHref, OG_IMAGE } from '@/lib/site'
import { breadcrumbLd, webPageLd } from '@/lib/structured-data'
import {
  ciHalf,
  fmtCnyRange,
  fmtContext,
  fmtDate,
  fmtRange,
  fmtVotes,
  scoreMeta,
} from '@/lib/format'
import {
  fx,
  getModelByParams,
  getModelOffers,
  getModelScores,
  modelsDevDate,
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
  const path = modelHref(found.canonicalModelId)
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

function ScoreSpec({ label, score, domain }: { label: string; score: Score | null; domain: CiDomain | null }) {
  return (
    <div className="spec-cell spec-score">
      <div className="spec-label">{label}</div>
      {score ? (
        <>
          <div className="score-top">
            <CiRail stat={score} domain={domain} width={64} />
            <span className="spec-value">{score.rating.toFixed(1)}</span>
          </div>
          <div className="spec-sub">
            {scoreMeta(score)} · {fmtVotes(score.votes)} 票
          </div>
        </>
      ) : (
        <>
          <div className="spec-value spec-missing">未收录</div>
          <div className="spec-sub">Arena 未收录，不代表能力差</div>
        </>
      )}
    </div>
  )
}

function ArenaCard({
  board,
  label,
  primary,
  scores,
  domain,
}: {
  board: 'text' | 'webdev'
  label: string
  primary: Score | null
  scores: Score[]
  domain: CiDomain | null
}) {
  return (
    <div className="arena-card">
      <div className="arena-label">
        <span>{label}</span>
        <span className="badge mixed">{primary?.condition ?? '未收录'}</span>
      </div>
      {primary ? (
        <>
          <div className="arena-score-row">
            <CiRail stat={primary} domain={domain} width={96} />
            <span className="arena-big">{primary.rating.toFixed(1)}</span>
          </div>
          <div className="arena-meta">
            <span>
              CI {primary.ciLow.toFixed(1)}–{primary.ciHigh.toFixed(1)}
            </span>
            <span>#{primary.rank}</span>
            <span>{fmtVotes(primary.votes)} 票</span>
          </div>
          <div className="arena-note">
            {primary.condition} · {primary.snapshotDate} · Arena HF
          </div>
          {scores.length > 1 && (
            <div className="arena-list">
              {scores.map(score => (
                <div className="arena-row" key={score.id}>
                  <span className="cond">{score.condition}</span>
                  <span className="rating">{score.rating.toFixed(1)}</span>
                  <span>#{score.rank} · ±{ciHalf(score).toFixed(1)}</span>
                  <span className="votes">{fmtVotes(score.votes)} 票</span>
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <div className="arena-missing">Arena 未收录。这不代表能力差。</div>
          <Link className="btn small" href={`/leaderboards/${board}`}>查看 Arena {board} 榜</Link>
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
  const textDomain = ciDomain(modelRows.map(m => m.text))
  const webdevDomain = ciDomain(modelRows.map(m => m.webdev))
  const aaUrl = found.aaUrl ?? AA_FALLBACK
  const cnyIn = row.price ? fmtCnyRange(row.price.inputMin, row.price.inputMax, fx) : null
  const cnyOut = row.price ? fmtCnyRange(row.price.outputMin, row.price.outputMax, fx) : null
  const modalities = `${(found.modalities.input ?? []).join(' / ') || '未提供'} → ${(found.modalities.output ?? []).join(' / ') || '未提供'}`

  const path = modelHref(found.canonicalModelId)
  const pageDescription = found.description ?? `${found.name} 的价格、上下文、推理等级和 Arena 评分。`

  return (
    <div className="sheet-inner">
      <JsonLd data={webPageLd({ name: found.name, description: pageDescription, path })} />
      <JsonLd
        data={breadcrumbLd([
          { name: '模型目录', path: '/' },
          { name: found.name, path },
        ])}
      />
      <nav className="crumbs" aria-label="面包屑">
        <Link href="/">模型目录</Link>
        <span className="sep">/</span>
        <span>{found.name}</span>
      </nav>

      <div className="detail-head">
        <div className="detail-title">
          <h1>{found.name}</h1>
          <div className="detail-sub">
            <span>{found.lab}</span>
            <span className="sep">·</span>
            <span className="id">{found.canonicalModelId}</span>
          </div>
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
          <CompareButton modelId={found.id} primary />
          <a className="btn" href={aaUrl} target="_blank" rel="noopener noreferrer">外部评测 · AA</a>
        </div>
      </div>

      <section className="spec-band" aria-label="关键规格">
        <div className="spec-cell lead">
          <div className="spec-label">价格 · 输入 / 输出</div>
          {row.price ? (
            <div className="price-pair">
              <span>输入 <b>{fmtRange(row.price.inputMin, row.price.inputMax)}</b></span>
              <span>输出 <b>{fmtRange(row.price.outputMin, row.price.outputMax)}</b></span>
            </div>
          ) : (
            <div className="spec-value">未公布</div>
          )}
          <div className="spec-sub">
            {row.price ? 'USD / 1M tokens' : 'models.dev 未提供价格'}
            {row.price && cnyIn && cnyOut ? (
              <>
                {' · '}
                <span className="cny-pair">
                  <span className="cny-range">{cnyIn}</span>
                  <span className="cny-sep"> / </span>
                  <span className="cny-range">{cnyOut}</span>
                </span>
              </>
            ) : null}
          </div>
        </div>
        <div className="spec-cell">
          <div className="spec-label">上下文</div>
          <div className="spec-value">{fmtContext(row.context)}</div>
          <div className="spec-sub">输出上限 {fmtContext(row.outputLimit)}</div>
        </div>
        <ScoreSpec label="Arena text" score={textPrimary} domain={textDomain} />
        <ScoreSpec label="Arena webdev" score={webdevPrimary} domain={webdevDomain} />
      </section>

      <div className="detail-layout">
        <div className="detail-main">
          <OfferTable offers={offers} />

          <section className="section-block" aria-labelledby="arena-title">
            <h2 className="section-title" id="arena-title">
              Arena 评测 <span className="sub">分榜展示 · 不跨榜比较</span>
            </h2>
            <div className="arena-grid">
              <ArenaCard board="text" label="Arena text" primary={textPrimary} scores={textScores} domain={textDomain} />
              <ArenaCard board="webdev" label="Arena webdev" primary={webdevPrimary} scores={webdevScores} domain={webdevDomain} />
            </div>
            <p className="source-box">
              Arena rating 是偏好评分，不是准确率；置信区间重叠时不宣称显著优劣。text / webdev 是两个独立 Board。
            </p>
          </section>
        </div>

        <aside className="detail-side">
          <section className="panel">
            <h2>能力与模态</h2>
            {found.description && <p className="source-box" style={{ marginTop: 8 }}>{found.description}</p>}
            <div className="cap-list">
              <div><span>输入 / 输出模态</span><strong>{modalities}</strong></div>
              <div><span>工具调用</span><strong>{offers.some(o => o.capabilities.toolCall) ? '支持' : '未提供'}</strong></div>
              <div><span>结构化输出</span><strong>{offers.some(o => o.capabilities.structuredOutput) ? '支持' : '未提供'}</strong></div>
              <div><span>知识截止</span><strong>{found.knowledgeCutoff || '未提供'}</strong></div>
              <div><span>开源权重</span><strong>{found.openWeights ? '是' : '否'}</strong></div>
              <div><span>推理等级</span><strong>{found.reasoningLabel}</strong></div>
              <div><span>发布</span><strong>{fmtDate(found.releaseDate)}</strong></div>
              <div><span>输出上限</span><strong>{fmtContext(row.outputLimit)}</strong></div>
              <div><span>报价条目</span><strong>{offers.length} 条</strong></div>
              <div><span>数据快照</span><strong>{modelsDevDate}</strong></div>
            </div>
          </section>
        </aside>
      </div>

      <p className="detail-source">
        models.dev（MIT）· Arena HuggingFace（CC BY 4.0）· 快照 {modelsDevDate} · 汇率 ECB / Frankfurter {fx.as_of} ·
        价格以供应商官网为准；Arena 分数为 latest 快照，保留 condition 与日期 · Artificial Analysis 仅外链，不嵌入分数 ·
        本站非官方，模型与商标归各自所有者 · <Link href="/about">数据说明</Link>
      </p>
    </div>
  )
}

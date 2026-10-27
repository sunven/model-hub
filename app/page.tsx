import type { Metadata } from 'next'
import { ExploreClient } from '@/components/explore-client'
import { JsonLd } from '@/components/json-ld'
import { manifest, modelRows, models } from '@/lib/data'
import { OG_IMAGE } from '@/lib/site'
import { itemListLd, webPageLd } from '@/lib/structured-data'

const title = '选型工作台'
const description = '比较模型版本的价格、上下文、推理等级和 Arena 评分。'

export const metadata: Metadata = {
  title,
  description,
  alternates: { canonical: '/' },
  openGraph: {
    title: `${title} | Model Hub`,
    description,
    url: '/',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Model Hub 模型信息市场' }],
  },
  twitter: { card: 'summary_large_image', title: `${title} | Model Hub`, description, images: [OG_IMAGE] },
}

const rawDate = manifest.sources?.modelsDev?.files?.api?.fetchedAt
const dataDate = rawDate ? new Date(rawDate).toISOString().slice(0, 10) : '2026-10-26'

export default function HomePage() {
  return (
    <>
      <JsonLd data={webPageLd({ name: title, description, path: '/', type: 'CollectionPage' })} />
      <JsonLd
        data={itemListLd({
          name: 'Model Hub 模型目录',
          items: models.map(model => ({ name: model.name, path: `/models/${model.canonicalModelId}` })),
        })}
      />
      <section className="page-head">
        <div>
          <div className="kicker">MODEL DIRECTORY · {modelRows.length} 个模型</div>
          <h1>选型工作台</h1>
          <p>先看价格和上下文，再按 Arena 评测比较。所有分数都标来源和日期；缺失不隐藏。</p>
        </div>
        <div className="head-stat">
          <strong>{modelRows.length}</strong>
          <span>Model Version</span>
        </div>
      </section>
      <ExploreClient models={modelRows} dataDate={dataDate} />
    </>
  )
}

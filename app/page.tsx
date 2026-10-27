import type { Metadata } from 'next'
import { Suspense } from 'react'
import { ExploreClient } from '@/components/explore-client'
import { manifest, modelRows } from '@/lib/data'

export const metadata: Metadata = {
  title: '选型工作台',
  description: '比较模型版本的价格、上下文、推理等级和 Arena 评分。',
}

const rawDate = manifest.sources?.modelsDev?.files?.api?.fetchedAt
const dataDate = rawDate ? new Date(rawDate).toISOString().slice(0, 10) : '2026-10-26'

export default function HomePage() {
  return (
    <>
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
      <Suspense fallback={<div className="container"><div className="empty">正在加载模型表…</div></div>}>
        <ExploreClient models={modelRows} dataDate={dataDate} />
      </Suspense>
    </>
  )
}

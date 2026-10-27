import type { Metadata } from 'next'
import { Suspense } from 'react'
import { CompareClient } from '@/components/compare-client'
import { fx, modelRows, topTextModels } from '@/lib/data'

export const metadata: Metadata = {
  title: '并排比较',
  alternates: { canonical: '/compare' },
  robots: { index: false, follow: false },
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="container"><div className="empty">正在加载对比…</div></div>}>
      <CompareClient models={modelRows} fx={fx} picks={topTextModels(6)} />
    </Suspense>
  )
}

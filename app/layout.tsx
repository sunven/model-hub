import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './globals.css'
import { CompareProvider } from '@/components/compare-provider'
import { CompareTray } from '@/components/compare-tray'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { manifest, modelIndex } from '@/lib/data'

export const metadata: Metadata = {
  title: {
    default: 'Model Hub — 模型信息市场',
    template: '%s | Model Hub',
  },
  description:
    '面向中文开发者的只读模型信息市场：比较模型版本的价格、上下文、推理等级和 Arena 偏好评分。',
  applicationName: 'Model Hub',
  robots: { index: true, follow: true },
}

const rawDate = manifest.sources?.modelsDev?.files?.api?.fetchedAt
const dataDate = rawDate ? new Date(rawDate).toISOString().slice(0, 10) : '2026-10-26'

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <CompareProvider modelIndex={modelIndex}>
          <SiteHeader dataDate={dataDate} />
          <main>{children}</main>
          <SiteFooter />
          <CompareTray />
        </CompareProvider>
      </body>
    </html>
  )
}

import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import './globals.css'
import { CompareProvider } from '@/components/compare-provider'
import { CompareTray } from '@/components/compare-tray'
import { DataFreshness } from '@/components/data-freshness'
import { JsonLd } from '@/components/json-ld'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { manifest, modelIndex } from '@/lib/data'
import { LOCALE, OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site'
import { websiteLd } from '@/lib/structured-data'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Model Hub — 模型信息市场',
    template: '%s | Model Hub',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: LOCALE,
    siteName: SITE_NAME,
    title: 'Model Hub — 模型信息市场',
    description: SITE_DESCRIPTION,
    url: '/',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Model Hub 模型信息市场' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Model Hub — 模型信息市场',
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <JsonLd data={websiteLd()} />
        <a className="skip-link" href="#main-content">跳到主要内容</a>
        <CompareProvider modelIndex={modelIndex}>
          <SiteHeader />
          <div className="sheet">
            <DataFreshness freshness={manifest.freshness} />
            <main id="main-content" tabIndex={-1}>{children}</main>
            <SiteFooter />
          </div>
          <CompareTray />
        </CompareProvider>
      </body>
    </html>
  )
}

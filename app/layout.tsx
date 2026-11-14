import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import '@astryxdesign/core/reset.css'
import '@fontsource/ibm-plex-sans/latin-400.css'
import '@fontsource/ibm-plex-sans/latin-500.css'
import '@fontsource/ibm-plex-sans/latin-600.css'
import '@fontsource/ibm-plex-mono/latin-400.css'
import './globals.css'
import '@astryxdesign/core/astryx.css'
import { Stack } from '@astryxdesign/core/Stack'
import { AstryxLinkProvider } from '@/components/astryx-link-provider'
import { AstryxThemeProvider } from '@/components/astryx-theme-provider'
import { CompareProvider } from '@/components/compare-provider'
import { CompareTray } from '@/components/compare-tray'
import { DataFreshness } from '@/components/data-freshness'
import { FreshnessProvider } from '@/components/freshness-provider'
import { JsonLd } from '@/components/json-ld'
import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { catalog, manifest } from '@/lib/data'
import { snapshotFreshness } from '@/lib/freshness'
import { LOCALE, OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site'
import { websiteLd } from '@/lib/structured-data'

const fontPreloads = [
  new URL('../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-400-normal.woff2', import.meta.url).pathname,
  new URL('../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-500-normal.woff2', import.meta.url).pathname,
  new URL('../node_modules/@fontsource/ibm-plex-sans/files/ibm-plex-sans-latin-600-normal.woff2', import.meta.url).pathname,
]

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${SITE_NAME} — 模型信息市场`,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: LOCALE,
    siteName: SITE_NAME,
    title: `${SITE_NAME} — 模型信息市场`,
    description: SITE_DESCRIPTION,
    url: '/',
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: `${SITE_NAME} 模型信息市场` }],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${SITE_NAME} — 模型信息市场`,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
}

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  const initialFreshness = snapshotFreshness({
    modelsDev: manifest.freshness.modelsDev.fetchedAt,
    arena: [manifest.freshness.arena.fetchedAt],
    fx: manifest.freshness.fx.asOf,
  })
  return (
    <html lang="zh-CN">
      <head>
        {fontPreloads.map(href => <link key={href} rel="preload" href={href} as="font" type="font/woff2" crossOrigin="anonymous" />)}
      </head>
      <body>
        <JsonLd data={websiteLd()} />
        <a className="skip-link" href="#main-content">跳到主要内容</a>
        <AstryxThemeProvider>
          <AstryxLinkProvider>
            <CompareProvider modelIndex={catalog.index}>
              <FreshnessProvider freshness={manifest.freshness}>
                <SiteHeader />
                <Stack className="sheet" gap={0}>
                  <DataFreshness initialFreshness={initialFreshness} />
                  <main id="main-content" tabIndex={-1}>{children}</main>
                  <SiteFooter />
                </Stack>
                <CompareTray />
              </FreshnessProvider>
            </CompareProvider>
          </AstryxLinkProvider>
        </AstryxThemeProvider>
      </body>
    </html>
  )
}

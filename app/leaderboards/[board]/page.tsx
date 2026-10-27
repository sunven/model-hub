import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { LeaderboardClient } from '@/components/leaderboard-client'
import { leaderboardRows, manifest } from '@/lib/data'
import { OG_IMAGE } from '@/lib/site'
import { breadcrumbLd, itemListLd, webPageLd } from '@/lib/structured-data'

type Props = { params: Promise<{ board: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return [{ board: 'text' }, { board: 'webdev' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { board } = await params
  if (board !== 'text' && board !== 'webdev') {
    return { title: '榜单未找到', robots: { index: false, follow: false } }
  }
  const title = board === 'text' ? 'Arena text 榜单' : 'Arena webdev 榜单'
  const description = 'Arena 偏好评分榜单；text 与 webdev 分开展示，不跨榜比较。'
  const path = `/leaderboards/${board}`
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title: `${title} | Model Hub`,
      description,
      url: path,
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: 'summary_large_image', title: `${title} | Model Hub`, description, images: [OG_IMAGE] },
    robots: { index: true, follow: true },
  }
}

export default async function LeaderboardPage({ params }: Props) {
  const { board } = await params
  if (board !== 'text' && board !== 'webdev') notFound()
  const rows = leaderboardRows(board)
  const raw = board === 'text'
    ? manifest.sources?.arena?.files?.text?.fetchedAt
    : manifest.sources?.arena?.files?.webdev?.fetchedAt
  const dataDate = raw ? new Date(raw).toISOString().slice(0, 10) : '2026-10-27'
  const path = `/leaderboards/${board}`
  const title = board === 'text' ? 'Arena text 榜单' : 'Arena webdev 榜单'
  return (
    <>
      <JsonLd data={webPageLd({ name: title, description: 'Arena 偏好评分榜单。', path })} />
      <JsonLd
        data={breadcrumbLd([
          { name: '模型目录', path: '/' },
          { name: 'Arena 榜单', path: '/leaderboards/text' },
          { name: title, path },
        ])}
      />
      <JsonLd
        data={itemListLd({
          name: title,
          items: rows.slice(0, 100).map(row => ({
            name: row.kind === 'model' ? row.name : `${row.name}（未匹配）`,
            path: row.href,
          })),
        })}
      />
      <LeaderboardClient board={board} rows={rows} dataDate={dataDate} />
    </>
  )
}

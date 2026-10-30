import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { JsonLd } from '@/components/json-ld'
import { LeaderboardClient } from '@/components/leaderboard-client'
import { BOARDS, boardTitle, isBoard } from '@/lib/boards'
import { arenaDate, leaderboardRows } from '@/lib/data'
import { pageMetadata } from '@/lib/site'
import { breadcrumbLd, itemListLd, webPageLd } from '@/lib/structured-data'

type Props = { params: Promise<{ board: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return BOARDS.map(board => ({ board }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { board } = await params
  if (!isBoard(board)) {
    return { title: '榜单未找到', robots: { index: false, follow: false } }
  }
  const title = boardTitle(board)
  const description = 'Arena 偏好评分榜单；text 与 webdev 分开展示，不跨榜比较。'
  const path = `/leaderboards/${board}`
  return {
    ...pageMetadata({ title, description, path }),
    robots: { index: true, follow: true },
  }
}

export default async function LeaderboardPage({ params }: Props) {
  const { board } = await params
  if (!isBoard(board)) notFound()
  const rows = leaderboardRows(board)
  const dataDate = arenaDate(board)
  const path = `/leaderboards/${board}`
  const title = boardTitle(board)
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

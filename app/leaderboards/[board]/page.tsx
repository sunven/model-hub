import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { LeaderboardClient } from '@/components/leaderboard-client'
import { leaderboardRows, manifest } from '@/lib/data'

type Props = { params: Promise<{ board: string }> }

export const dynamicParams = false

export function generateStaticParams() {
  return [{ board: 'text' }, { board: 'webdev' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { board } = await params
  if (board !== 'text' && board !== 'webdev') return { title: '榜单未找到' }
  return {
    title: board === 'text' ? 'Arena text 榜单' : 'Arena webdev 榜单',
    description: 'Arena 偏好评分榜单；text 与 webdev 分开展示，不跨榜比较。',
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
  return <LeaderboardClient board={board} rows={rows} dataDate={dataDate} />
}

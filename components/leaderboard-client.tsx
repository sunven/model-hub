'use client'

import { useMemo, useState } from 'react'
import { Badge } from '@astryxdesign/core/Badge'
import { Button } from '@astryxdesign/core/Button'
import { Card } from '@astryxdesign/core/Card'
import { EmptyState } from '@astryxdesign/core/EmptyState'
import { Heading } from '@astryxdesign/core/Heading'
import { HStack } from '@astryxdesign/core/HStack'
import { Link } from '@astryxdesign/core/Link'
import { Stack } from '@astryxdesign/core/Stack'
import { Tab, TabList } from '@astryxdesign/core/TabList'
import { Table, proportional, type TableColumn } from '@astryxdesign/core/Table'
import { Text } from '@astryxdesign/core/Text'
import { TextInput } from '@astryxdesign/core/TextInput'
import { CiRail } from './ci-rail'
import { useNoindex } from './use-noindex'
import { BOARDS, BOARD_LABELS } from '@/lib/boards'
import { ciDomain, ciHalf, ciOverlaps, fmtVotes } from '@/lib/format'
import type { Board } from '@/lib/snapshot'
import type { LeaderboardRow } from '@/lib/types'

const PAGE = 50

interface BoardView extends Record<string, unknown> {
  id: string
  row: LeaderboardRow
}

export function LeaderboardClient({
  board,
  rows,
  dataDate,
}: {
  board: Board
  rows: LeaderboardRow[]
  dataDate: string
}) {
  const [q, setQ] = useState('')
  const [visibleCount, setVisibleCount] = useState(PAGE)

  useNoindex(q.trim() !== '')

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    if (!query) return rows
    return rows.filter(row => `${row.name} ${row.lab} ${row.condition}`.toLowerCase().includes(query))
  }, [rows, q])

  const visible = filtered.slice(0, visibleCount)
  const boardLabel = BOARD_LABELS[board]
  const domains = ciDomain(visible)
  const [first, second] = rows
  const topGap =
    first && second
      ? Math.round((parseFloat(first.rating.toFixed(1)) - parseFloat(second.rating.toFixed(1))) * 10) / 10
      : null
  const topOverlap = Boolean(first && second && ciOverlaps(first, second))

  const finding =
    first && second && topGap !== null
      ? `rating 是偏好评分，不是准确率。${first.name} 与 ${second.name} 相差 ${topGap.toFixed(1)} 分，置信区间${
          topOverlap ? '重叠' : '不重叠'
        }；text / webdev 不可跨榜比较。`
      : 'rating 是偏好评分，不是准确率；text / webdev 不可跨榜比较。'

  const data = useMemo<BoardView[]>(() => visible.map(row => ({ id: row.id, row })), [visible])

  const columns: TableColumn<BoardView>[] = [
    {
      key: 'rank',
      header: '排名',
      width: proportional(0.4, { minWidth: 64 }),
      renderCell: ({ row }) => <Text hasTabularNumbers>#{row.rank}</Text>,
    },
    {
      key: 'model',
      header: '模型',
      width: proportional(2, { minWidth: 220 }),
      renderCell: ({ row }) => (
        <Stack gap={0}>
          <HStack gap={1} wrap="wrap" vAlign="center">
            {row.href ? (
              <Link href={row.href} weight="medium">{row.name}</Link>
            ) : (
              <Text weight="medium">{row.name}</Text>
            )}
            {row.kind === 'unmatched' && <Badge label="未匹配" variant="neutral" />}
          </HStack>
          <Text type="supporting">{row.lab}</Text>
        </Stack>
      ),
    },
    {
      key: 'range',
      header: '评分区间',
      width: proportional(1.4, { minWidth: 160 }),
      renderCell: ({ row }) => <CiRail stat={row} domain={domains} width={144} />,
    },
    {
      key: 'rating',
      header: '评分',
      align: 'end',
      width: proportional(0.8, { minWidth: 110 }),
      renderCell: ({ row }) => (
        <HStack gap={1} justify="end" vAlign="center">
          <Text weight="medium" hasTabularNumbers>{row.rating.toFixed(1)}</Text>
          <Text type="supporting">±{ciHalf(row).toFixed(1)}</Text>
        </HStack>
      ),
    },
    {
      key: 'condition',
      header: '条件',
      width: proportional(0.9, { minWidth: 120 }),
      renderCell: ({ row }) => <Text>{row.condition}</Text>,
    },
    {
      key: 'votes',
      header: '票数',
      align: 'end',
      width: proportional(0.7, { minWidth: 100 }),
      renderCell: ({ row }) => <Text hasTabularNumbers>{fmtVotes(row.votes)}</Text>,
    },
  ]

  return (
    <Stack className="sheet-inner" gap={4}>
      <HStack justify="between" align="start" wrap="wrap" gap={3}>
        <Stack gap={1}>
          <Heading level={1}>Arena 榜单</Heading>
          <Text type="large">{finding}</Text>
        </Stack>
        <Button label="模型目录" href="/" variant="secondary" />
      </HStack>

      <TabList value={board} onChange={() => {}} aria-label="榜单类型">
        {BOARDS.map(value => (
          <Tab key={value} value={value} label={BOARD_LABELS[value]} href={`/leaderboards/${value}`} />
        ))}
      </TabList>

      <TextInput
        label="搜索模型、组织或条件"
        isLabelHidden
        type="search"
        startIcon="search"
        placeholder="搜索模型 / 组织 / 条件"
        value={q}
        onChange={value => { setQ(value); setVisibleCount(PAGE) }}
        hasClear
        width={320}
      />

      <Text type="supporting">
        {boardLabel} · 来源{' '}
        <Link
          href="https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset"
          isExternalLink
        >
          LMArena Leaderboard Dataset
        </Link>
        （CC BY 4.0）· 数据 {dataDate} · 已显示 {visible.length} / {filtered.length} 条 · 未匹配行保留在榜单，不链模型页。
      </Text>

      {visible.length ? (
        <>
          <Stack className="desktop-only">
            <Table
              data={data}
              columns={columns}
              idKey="id"
              density="compact"
              dividers="rows"
              hasHover
              aria-label={`${boardLabel} 榜单，按 rank 排序`}
            />
          </Stack>

          <Stack className="mobile-list" gap={3}>
            {visible.map(row => (
              <Card key={row.id} padding={3}>
                <Stack gap={2}>
                  <HStack justify="between" align="start" gap={2}>
                    <Stack gap={0.5}>
                      <Text type="supporting">#{row.rank} · {row.lab}</Text>
                      <HStack gap={1} wrap="wrap" vAlign="center">
                        {row.href ? (
                          <Heading level={3}><Link href={row.href}>{row.name}</Link></Heading>
                        ) : (
                          <Heading level={3}>{row.name}</Heading>
                        )}
                        {row.kind === 'unmatched' && <Badge label="未匹配" variant="neutral" />}
                      </HStack>
                    </Stack>
                    <Stack gap={0.5}>
                      <HStack gap={1} vAlign="center">
                        <CiRail stat={row} domain={domains} width={44} />
                        <Text weight="semibold" hasTabularNumbers>{row.rating.toFixed(1)}</Text>
                      </HStack>
                      <Text type="supporting">±{ciHalf(row).toFixed(1)}</Text>
                    </Stack>
                  </HStack>
                  <HStack gap={3} wrap="wrap">
                    <Text type="supporting">条件 <Text weight="semibold">{row.condition}</Text></Text>
                    <Text type="supporting">票数 <Text weight="semibold">{fmtVotes(row.votes)}</Text></Text>
                  </HStack>
                </Stack>
              </Card>
            ))}
          </Stack>

          {visible.length < filtered.length && (
            <HStack justify="center">
              <Button label="显示更多" onClick={() => setVisibleCount(count => count + PAGE)} />
            </HStack>
          )}
        </>
      ) : (
        <EmptyState
          title="没有找到模型"
          description="清空搜索，或者换一个关键词。"
          actions={<Button label="清空搜索" variant="primary" onClick={() => setQ('')} />}
        />
      )}
    </Stack>
  )
}

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Spinner } from '@astryxdesign/core/Spinner'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'

export default function LeaderboardsIndexPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/leaderboards/text')
  }, [router])
  return (
    <Stack className="sheet-inner" gap={2} hAlign="center" padding={6}>
      <Spinner />
      <Text type="supporting">正在前往 Arena text 榜单…</Text>
    </Stack>
  )
}

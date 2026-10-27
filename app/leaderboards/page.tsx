'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LeaderboardsIndexPage() {
  const router = useRouter()
  useEffect(() => {
    router.replace('/leaderboards/text')
  }, [router])
  return (
    <div className="container">
      <div className="empty" style={{ marginTop: 30 }}>正在前往 Arena text 榜单…</div>
    </div>
  )
}

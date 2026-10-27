'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import type { Manifest } from '@/lib/types'

export function DataFreshness({ freshness }: { freshness: Manifest['freshness'] }) {
  const [messages, setMessages] = useState<string[]>([])

  useEffect(() => {
    const check = () => {
      const now = Date.now()
      const next: string[] = []
      const modelsAge = (now - Date.parse(freshness.modelsDev.fetchedAt)) / 3_600_000
      const arenaAge = (now - Date.parse(freshness.arena.fetchedAt)) / 3_600_000
      const fxAge = (now - Date.parse(freshness.fx.asOf)) / 86_400_000

      if (modelsAge > freshness.modelsDev.thresholdHours) {
        next.push(
          `models.dev 快照已超过 ${freshness.modelsDev.thresholdHours} 小时（获取于 ${freshness.modelsDev.fetchedAt.slice(0, 10)}）。`,
        )
      }
      if (arenaAge > freshness.arena.thresholdHours) {
        next.push(
          `Arena 快照已超过 ${freshness.arena.thresholdHours} 小时（获取于 ${freshness.arena.fetchedAt.slice(0, 10)}）。`,
        )
      }
      if (fxAge > freshness.fx.thresholdDays) {
        next.push(`汇率已超过 ${freshness.fx.thresholdDays} 天，页面仅显示 USD。`)
      }
      setMessages(next)
    }

    check()
    const timer = window.setInterval(check, 3_600_000)
    return () => window.clearInterval(timer)
  }, [freshness])

  if (!messages.length) return null

  return (
    <div className="data-banner" role="status">
      <strong>数据可能已过期</strong>
      <span>{messages.join(' ')} 页面仍显示最近一次通过校验的快照，不会隐藏数据。</span>
      <Link href="/about#freshness">查看数据说明</Link>
    </div>
  )
}

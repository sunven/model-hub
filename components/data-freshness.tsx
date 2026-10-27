'use client'

import Link from 'next/link'
import { useFreshness } from './freshness-provider'

export function DataFreshness() {
  const state = useFreshness()
  if (!state) return null
  const { freshness } = state
  const messages: string[] = []
  if (freshness.modelsDev.stale) {
    messages.push(`models.dev 快照已超过 ${freshness.modelsDev.thresholdHours} 小时（获取于 ${freshness.modelsDev.fetchedAt.slice(0, 10)}）。`)
  }
  if (freshness.arena.stale) {
    messages.push(`Arena 快照已超过 ${freshness.arena.thresholdHours} 小时（获取于 ${freshness.arena.fetchedAt.slice(0, 10)}）。`)
  }
  if (freshness.fx.stale) {
    messages.push(`汇率已超过 ${freshness.fx.thresholdDays} 天，页面仅显示 USD。`)
  }

  if (!messages.length) return null

  return (
    <div className="data-banner" role="status">
      <strong>数据可能已过期</strong>
      <span>{messages.join(' ')} 页面仍显示最近一次通过校验的快照，不会隐藏数据。</span>
      <Link href="/about#freshness">查看数据说明</Link>
    </div>
  )
}

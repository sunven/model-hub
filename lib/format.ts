import type { Availability, FxConfig } from './snapshot'
import type { CiDomain, CiStat, PriceSummary } from './types'

export function fmtMoney(value: number | null | undefined): string {
  if (value === null || value === undefined) return '未公布'
  if (value === 0) return '免费'
  const rounded = Math.round(value * 100) / 100
  return `$${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(2).replace(/0$/, '')}`
}

export function fmtRange(min: number | null | undefined, max: number | null | undefined): string {
  if (min === null || min === undefined || max === null || max === undefined) return '未公布'
  return min === max ? fmtMoney(min) : `${fmtMoney(min)}–${fmtMoney(max)}`
}

export function fmtPriceLines(price: PriceSummary | null): { input: string; output: string } {
  if (!price) return { input: '未公布', output: '未公布' }
  return {
    input: fmtRange(price.inputMin, price.inputMax),
    output: fmtRange(price.outputMin, price.outputMax),
  }
}

export function fmtContext(value: number | null | undefined): string {
  if (!value) return '—'
  if (value >= 1_000_000) {
    const m = value / 1_000_000
    return `${(Math.round(m * 100) / 100).toString().replace(/\.0+$/, '')}M`
  }
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`
  return String(value)
}

export function fmtDate(value: string | null | undefined): string {
  return value || '—'
}

const votesFormat = new Intl.NumberFormat('en-US')

export function fmtVotes(votes: number): string {
  return votesFormat.format(votes)
}

export function ciDomain(items: (CiStat | null | undefined)[]): CiDomain | null {
  const valid = items.filter(
    (item): item is CiStat =>
      Boolean(item && Number.isFinite(item.ciLow) && Number.isFinite(item.ciHigh) && Number.isFinite(item.rating)),
  )
  if (!valid.length) return null
  const low = Math.min(...valid.map(item => item.ciLow), ...valid.map(item => item.rating))
  const high = Math.max(...valid.map(item => item.ciHigh), ...valid.map(item => item.rating))
  const pad = Math.max((high - low) * 0.04, 0.4)
  return { min: low - pad, max: high + pad }
}

export function ciHalf(score: CiStat): number {
  return (score.ciHigh - score.ciLow) / 2
}

export function ciOverlaps(a: CiStat, b: CiStat): boolean {
  return a.ciLow <= b.ciHigh && b.ciLow <= a.ciHigh
}

export function scoreMeta(score: CiStat & { rank: number; condition: string }): string {
  return `#${score.rank} · ${score.condition} · ±${ciHalf(score).toFixed(1)}`
}

export function availabilityLabel(availability: Availability): string {
  switch (availability) {
    case 'available':
      return '可用'
    case 'mixed':
      return '混合'
    case 'deprecated':
      return '已弃用'
    case 'open_weights_only':
      return '可自托管'
    default:
      return '未知'
  }
}

export function availabilityClass(availability: Availability): string {
  switch (availability) {
    case 'available':
      return 'stable'
    case 'mixed':
      return 'mixed'
    case 'deprecated':
      return 'deprecated'
    case 'open_weights_only':
      return 'ow'
    default:
      return 'mixed'
  }
}

export function providerKindLabel(kind: string): string {
  if (kind === 'first_party') return '第一方'
  if (kind === 'cloud') return '云平台'
  return '网关'
}

export function offerStatusLabel(status: string): string {
  if (status === 'deprecated') return '已弃用'
  if (status === 'beta') return 'Beta'
  if (status === 'alpha') return 'Alpha'
  return '可用'
}

export function offerStatusClass(status: string): string {
  if (status === 'deprecated') return 'deprecated'
  if (status === 'beta' || status === 'alpha') return 'beta'
  return 'stable'
}

export function reasoningText(options: any[] | undefined, supported: boolean): string {
  if (!supported) return '不支持'
  if (!Array.isArray(options) || options.length === 0) return '支持，未标档'
  const parts: string[] = []
  const effort = options.find(o => o?.type === 'effort')
  if (effort?.values?.length) parts.push(effort.values.join(' / '))
  if (options.some(o => o?.type === 'toggle')) parts.push('开关')
  const budget = options.find(o => o?.type === 'budget_tokens')
  if (budget) {
    if (budget.min !== undefined && budget.max !== undefined) parts.push(`预算 ${budget.min}–${budget.max}`)
    else if (budget.min !== undefined) parts.push(`预算 ≥${budget.min}`)
    else if (budget.max !== undefined) parts.push(`预算 ≤${budget.max}`)
    else parts.push('预算可调')
  }
  return parts.length ? [...new Set(parts)].join(' + ') : '支持，未标档'
}

export function fxIsFresh(fx: FxConfig, now = new Date()): boolean {
  const t = Date.parse(fx.as_of)
  if (!Number.isFinite(t)) return false
  return Math.floor((now.getTime() - t) / 86_400_000) <= 14
}

export function fmtCnyRange(min: number, max: number, fx: FxConfig): string | null {
  if (!fxIsFresh(fx)) return null
  const a = (min * fx.usd_to_cny).toFixed(2)
  const b = (max * fx.usd_to_cny).toFixed(2)
  return min === max ? `≈¥${a}` : `≈¥${a}–${b}`
}

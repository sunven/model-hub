import type { Availability, FxConfig, OfferStatus } from './snapshot'
import { checkFreshness } from './freshness'
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

const AVAILABILITY: Record<Availability, { label: string; className: string }> = {
  available: { label: '可用', className: 'stable' },
  mixed: { label: '混合', className: 'mixed' },
  deprecated: { label: '已弃用', className: 'deprecated' },
  open_weights_only: { label: '可自托管', className: 'ow' },
  unknown: { label: '未知', className: 'mixed' },
}

export function availabilityLabel(availability: Availability): string {
  return AVAILABILITY[availability].label
}

export function availabilityClass(availability: Availability): string {
  return AVAILABILITY[availability].className
}

export function providerKindLabel(kind: string): string {
  if (kind === 'first_party') return '第一方'
  if (kind === 'cloud') return '云平台'
  return '网关'
}

const OFFER_STATUS: Record<OfferStatus, { label: string; className: string }> = {
  available_unmarked: { label: '可用', className: 'stable' },
  beta: { label: 'Beta', className: 'beta' },
  alpha: { label: 'Alpha', className: 'beta' },
  deprecated: { label: '已弃用', className: 'deprecated' },
}

export function offerStatusLabel(status: OfferStatus): string {
  return OFFER_STATUS[status].label
}

export function offerStatusClass(status: OfferStatus): string {
  return OFFER_STATUS[status].className
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

export function fmtCnyRange(min: number, max: number, fx: FxConfig, now = Date.now()): string | null {
  if (checkFreshness('fx', fx.as_of, now).stale) return null
  const a = (min * fx.usd_to_cny).toFixed(2)
  const b = (max * fx.usd_to_cny).toFixed(2)
  return min === max ? `≈¥${a}` : `≈¥${a}–${b}`
}

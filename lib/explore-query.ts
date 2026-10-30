import type { ModelRow } from './types'
import { fmtContext } from './format'

export type SortKey = 'arena_text' | 'arena_webdev' | 'newest' | 'price' | 'context'

export type ExploreListField = 'labs' | 'providers'

export type ExploreQuery = {
  q: string
  labs: string[]
  providers: string[]
  gatewayOnly: boolean
  maxOutput: number | null
  minContext: number | null
  reasoning: boolean
  openWeights: boolean
  stableOnly: boolean
  hasArena: boolean
  sortKey: SortKey
}

export type ActiveFilterKind =
  | 'q'
  | 'lab'
  | 'provider'
  | 'gatewayOnly'
  | 'maxOutput'
  | 'minContext'
  | 'reasoning'
  | 'openWeights'
  | 'stableOnly'
  | 'hasArena'

export type ActiveFilter = {
  kind: ActiveFilterKind
  value?: string
  label: string
}

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'arena_text', label: 'Arena text（默认）' },
  { value: 'arena_webdev', label: 'Arena webdev' },
  { value: 'newest', label: '最新发布' },
  { value: 'price', label: '输出价格' },
  { value: 'context', label: '上下文' },
]

export const CONTEXT_OPTIONS = [32000, 128000, 256000, 1000000]
export const PRICE_OPTIONS = [1, 5, 15]

const SORT_VALUES = new Set(SORT_OPTIONS.map(option => option.value))
const GATEWAY_ONLY = '__gateway_only__'

export const DEFAULT_EXPLORE_QUERY: ExploreQuery = {
  q: '',
  labs: [],
  providers: [],
  gatewayOnly: false,
  maxOutput: null,
  minContext: null,
  reasoning: false,
  openWeights: false,
  stableOnly: false,
  hasArena: false,
  sortKey: 'arena_text',
}

function parseList(value: string | null): string[] {
  return [...new Set((value ?? '').split(',').filter(Boolean))]
}

function parseNumber(value: string | null): number | null {
  if (value === null || value === '') return null
  const number = Number(value)
  return Number.isFinite(number) && number >= 0 ? number : null
}

export function parseExploreQuery(params: URLSearchParams): ExploreQuery {
  const providers = parseList(params.get('providers'))
  const sort = params.get('sort')

  return {
    q: params.get('q') ?? '',
    labs: parseList(params.get('labs')),
    providers: providers.filter(provider => provider !== GATEWAY_ONLY),
    gatewayOnly: providers.includes(GATEWAY_ONLY),
    maxOutput: parseNumber(params.get('maxOutput')),
    minContext: parseNumber(params.get('minContext')),
    reasoning: params.get('reasoning') === '1',
    openWeights: params.get('openWeights') === '1',
    stableOnly: params.get('stableOnly') === '1',
    hasArena: params.get('hasArena') === '1',
    sortKey: sort && SORT_VALUES.has(sort as SortKey) ? (sort as SortKey) : DEFAULT_EXPLORE_QUERY.sortKey,
  }
}

export function serializeExploreQuery(query: ExploreQuery): URLSearchParams {
  const params = new URLSearchParams()
  if (query.q) params.set('q', query.q)
  if (query.labs.length) params.set('labs', query.labs.join(','))
  const providers = query.gatewayOnly ? [...query.providers, GATEWAY_ONLY] : query.providers
  if (providers.length) params.set('providers', providers.join(','))
  if (query.maxOutput !== null) params.set('maxOutput', String(query.maxOutput))
  if (query.minContext !== null) params.set('minContext', String(query.minContext))
  if (query.reasoning) params.set('reasoning', '1')
  if (query.openWeights) params.set('openWeights', '1')
  if (query.stableOnly) params.set('stableOnly', '1')
  if (query.hasArena) params.set('hasArena', '1')
  if (query.sortKey !== DEFAULT_EXPLORE_QUERY.sortKey) params.set('sort', query.sortKey)
  return params
}

function compareNames(a: ModelRow, b: ModelRow): number {
  return a.name.localeCompare(b.name, 'zh')
}

function compareReleaseDate(a: ModelRow, b: ModelRow): number {
  if (!a.releaseDate && !b.releaseDate) return 0
  if (!a.releaseDate) return 1
  if (!b.releaseDate) return -1
  if (a.releaseDate === b.releaseDate) return 0
  return a.releaseDate < b.releaseDate ? 1 : -1
}

function compareArena(a: ModelRow, b: ModelRow, board: 'text' | 'webdev'): number {
  const left = a[board]
  const right = b[board]
  if (!left || !right) {
    if (!left && !right) return compareNames(a, b)
    return left ? -1 : 1
  }
  if (left.rating !== right.rating) return right.rating - left.rating
  if (left.rank !== right.rank) return left.rank - right.rank
  return compareReleaseDate(a, b) || compareNames(a, b)
}

function compareNewest(a: ModelRow, b: ModelRow): number {
  return compareReleaseDate(a, b) || compareNames(a, b)
}

function comparePrice(a: ModelRow, b: ModelRow): number {
  const left = a.price?.outputMin ?? null
  const right = b.price?.outputMin ?? null
  if (left === null && right === null) return compareNames(a, b)
  if (left === null) return 1
  if (right === null) return -1
  return left - right || compareNames(a, b)
}

function compareContext(a: ModelRow, b: ModelRow): number {
  if (a.context === null && b.context === null) return compareNames(a, b)
  if (a.context === null) return 1
  if (b.context === null) return -1
  return b.context - a.context || compareNames(a, b)
}

const COMPARATORS: Record<SortKey, (a: ModelRow, b: ModelRow) => number> = {
  arena_text: (a, b) => compareArena(a, b, 'text'),
  arena_webdev: (a, b) => compareArena(a, b, 'webdev'),
  newest: compareNewest,
  price: comparePrice,
  context: compareContext,
}

function matchesQuery(model: ModelRow, query: ExploreQuery): boolean {
  const needle = query.q.trim().toLowerCase()
  if (needle) {
    const haystack = `${model.name} ${model.lab} ${model.canonicalId} ${model.family ?? ''}`.toLowerCase()
    if (!haystack.includes(needle)) return false
  }
  if (query.labs.length && !query.labs.includes(model.lab)) return false
  if (query.providers.length || query.gatewayOnly) {
    const providerMatch = query.providers.some(provider => model.providerNames.includes(provider))
    if (!providerMatch && !(query.gatewayOnly && model.gatewayOnly)) return false
  }
  if (query.maxOutput !== null) {
    if (!model.price || model.price.outputMin > query.maxOutput) return false
  }
  if (query.minContext !== null) {
    if (!model.context || model.context < query.minContext) return false
  }
  if (query.reasoning && model.reasoningLabel === '不支持') return false
  if (query.openWeights && !model.openWeights) return false
  if (query.stableOnly && (model.availability !== 'available' || model.releaseBadges.length > 0)) return false
  if (query.hasArena && !model.text && !model.webdev) return false
  return true
}

export function selectModels(models: ModelRow[], query: ExploreQuery): ModelRow[] {
  return models.filter(model => matchesQuery(model, query)).sort(COMPARATORS[query.sortKey])
}

export function describeActiveFilters(query: ExploreQuery): ActiveFilter[] {
  const filters: ActiveFilter[] = []
  if (query.q) filters.push({ kind: 'q', label: `搜索“${query.q}”` })
  for (const lab of query.labs) filters.push({ kind: 'lab', value: lab, label: lab })
  for (const provider of query.providers) filters.push({ kind: 'provider', value: provider, label: provider })
  if (query.gatewayOnly) filters.push({ kind: 'gatewayOnly', label: '仅网关' })
  if (query.maxOutput !== null) filters.push({ kind: 'maxOutput', label: `输出 ≤ $${query.maxOutput}` })
  if (query.minContext !== null) {
    filters.push({ kind: 'minContext', label: `上下文 ≥ ${fmtContext(query.minContext)}` })
  }
  if (query.reasoning) filters.push({ kind: 'reasoning', label: '支持推理' })
  if (query.openWeights) filters.push({ kind: 'openWeights', label: '开源权重' })
  if (query.stableOnly) filters.push({ kind: 'stableOnly', label: '仅稳定版' })
  if (query.hasArena) filters.push({ kind: 'hasArena', label: '只看有评测' })
  return filters
}

export function removeFilter(query: ExploreQuery, filter: ActiveFilter): ExploreQuery {
  switch (filter.kind) {
    case 'q':
      return { ...query, q: '' }
    case 'lab':
      return { ...query, labs: query.labs.filter(lab => lab !== filter.value) }
    case 'provider':
      return { ...query, providers: query.providers.filter(provider => provider !== filter.value) }
    case 'gatewayOnly':
      return { ...query, gatewayOnly: false }
    case 'maxOutput':
      return { ...query, maxOutput: null }
    case 'minContext':
      return { ...query, minContext: null }
    case 'reasoning':
      return { ...query, reasoning: false }
    case 'openWeights':
      return { ...query, openWeights: false }
    case 'stableOnly':
      return { ...query, stableOnly: false }
    case 'hasArena':
      return { ...query, hasArena: false }
  }
}

export function isDefaultExploreQuery(query: ExploreQuery): boolean {
  return serializeExploreQuery(query).toString() === ''
}

import type { ModelRow } from './types'
import { fmtContext } from './format'

export type SortKey = 'arena_text' | 'arena_webdev' | 'newest' | 'price' | 'context'
export type SortDirection = 'asc' | 'desc'

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
  sortDirection: SortDirection
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

export const CONTEXT_OPTIONS = [32000, 128000, 256000, 1000000]
export const PRICE_OPTIONS = [1, 5, 15]

const SORT_VALUES = new Set<SortKey>(['arena_text', 'arena_webdev', 'newest', 'price', 'context'])
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
  sortDirection: 'desc',
}

export function defaultSortDirection(key: SortKey): SortDirection {
  return key === 'price' ? 'asc' : 'desc'
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
  const sortKey = sort && SORT_VALUES.has(sort as SortKey) ? (sort as SortKey) : DEFAULT_EXPLORE_QUERY.sortKey
  const order = params.get('order')

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
    sortKey,
    sortDirection: order === 'asc' || order === 'desc' ? order : defaultSortDirection(sortKey),
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
  if (query.sortDirection !== defaultSortDirection(query.sortKey)) params.set('order', query.sortDirection)
  return params
}

function compareNames(a: ModelRow, b: ModelRow): number {
  return a.name.localeCompare(b.name, 'zh')
}

function compareValues(left: number | string | null, right: number | string | null, direction: SortDirection): number {
  // Missing data stays at the end in either direction.
  if (left === null && right === null) return 0
  if (left === null) return 1
  if (right === null) return -1
  const order = left < right ? -1 : left > right ? 1 : 0
  return direction === 'asc' ? order : -order
}

function compareReleaseDate(a: ModelRow, b: ModelRow, direction: SortDirection = 'desc'): number {
  return compareValues(a.releaseDate || null, b.releaseDate || null, direction)
}

function compareArena(a: ModelRow, b: ModelRow, board: 'text' | 'webdev', direction: SortDirection): number {
  const left = a[board]
  const right = b[board]
  if (!left || !right) {
    if (!left && !right) return compareNames(a, b)
    return left ? -1 : 1
  }
  if (left.rating !== right.rating) return compareValues(left.rating, right.rating, direction)
  if (left.rank !== right.rank) return left.rank - right.rank
  return compareReleaseDate(a, b) || compareNames(a, b)
}

function compareNewest(a: ModelRow, b: ModelRow, direction: SortDirection): number {
  return compareReleaseDate(a, b, direction) || compareNames(a, b)
}

function comparePrice(a: ModelRow, b: ModelRow, direction: SortDirection): number {
  const left = a.price?.outputMin ?? null
  const right = b.price?.outputMin ?? null
  return compareValues(left, right, direction) || compareNames(a, b)
}

function compareContext(a: ModelRow, b: ModelRow, direction: SortDirection): number {
  return compareValues(a.context, b.context, direction) || compareNames(a, b)
}

const COMPARATORS: Record<SortKey, (a: ModelRow, b: ModelRow, direction: SortDirection) => number> = {
  arena_text: (a, b, direction) => compareArena(a, b, 'text', direction),
  arena_webdev: (a, b, direction) => compareArena(a, b, 'webdev', direction),
  newest: compareNewest,
  price: comparePrice,
  context: compareContext,
}

function matchesQuery(model: ModelRow, query: ExploreQuery, needle: string): boolean {
  if (needle) {
    const haystack = `${model.name} ${model.lab} ${model.canonicalId} ${model.family ?? ''}`.toLowerCase()
    if (!haystack.includes(needle)) return false
  }
  if (query.labs.length && !query.labs.includes(model.lab)) return false
  if (query.providers.length || query.gatewayOnly) {
    const providerMatch = query.providers.some(provider => model.providerNames.includes(provider))
    if (!providerMatch && !(query.gatewayOnly && model.gatewayOnly)) return false
  }
  if (query.maxOutput !== null && (!model.price || model.price.outputMin > query.maxOutput)) return false
  if (query.minContext !== null && (!model.context || model.context < query.minContext)) return false
  if (query.reasoning && model.reasoningLabel === '不支持') return false
  if (query.openWeights && !model.openWeights) return false
  if (query.stableOnly && (model.availability !== 'available' || model.releaseBadges.length > 0)) return false
  if (query.hasArena && !model.text && !model.webdev) return false
  return true
}

export function selectModels(models: ModelRow[], query: ExploreQuery): ModelRow[] {
  const needle = query.q.trim().toLowerCase()
  const compare = COMPARATORS[query.sortKey]
  return models.filter(model => matchesQuery(model, query, needle)).sort((a, b) => compare(a, b, query.sortDirection))
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

const FILTER_RESETS: Record<string, Partial<ExploreQuery>> = {
  q: { q: '' },
  gatewayOnly: { gatewayOnly: false },
  maxOutput: { maxOutput: null },
  minContext: { minContext: null },
  reasoning: { reasoning: false },
  openWeights: { openWeights: false },
  stableOnly: { stableOnly: false },
  hasArena: { hasArena: false },
}

export function removeFilter(query: ExploreQuery, filter: ActiveFilter): ExploreQuery {
  if (filter.kind === 'lab') return { ...query, labs: query.labs.filter(lab => lab !== filter.value) }
  if (filter.kind === 'provider') return { ...query, providers: query.providers.filter(provider => provider !== filter.value) }
  return { ...query, ...FILTER_RESETS[filter.kind] }
}

export function isDefaultExploreQuery(query: ExploreQuery): boolean {
  return serializeExploreQuery(query).size === 0
}

import assert from 'node:assert/strict'
import test from 'node:test'
import {
  DEFAULT_EXPLORE_QUERY,
  describeActiveFilters,
  isDefaultExploreQuery,
  parseExploreQuery,
  removeFilter,
  selectModels,
  serializeExploreQuery,
  type ExploreQuery,
  type SortKey,
} from '../../lib/explore-query'
import type { ModelRow, PriceSummary, ScoreView } from '../../lib/types'

function price(output: number): PriceSummary {
  return { inputMin: output, inputMax: output, outputMin: output, outputMax: output, gatewayOnly: false }
}

function score(rating: number, rank: number): ScoreView {
  return { rating, ciLow: rating - 1, ciHigh: rating + 1, rank, votes: 100, condition: 'default' }
}

function row(overrides: Partial<ModelRow> & Pick<ModelRow, 'id' | 'name'>): ModelRow {
  return {
    id: overrides.id,
    canonicalId: overrides.canonicalId ?? `test/${overrides.id}`,
    name: overrides.name,
    lab: overrides.lab ?? 'Test Lab',
    family: overrides.family ?? null,
    availability: overrides.availability ?? 'available',
    releaseBadges: overrides.releaseBadges ?? [],
    openWeights: overrides.openWeights ?? false,
    reasoningLabel: overrides.reasoningLabel ?? '可调',
    context: overrides.context ?? null,
    outputLimit: overrides.outputLimit ?? null,
    releaseDate: overrides.releaseDate ?? null,
    price: overrides.price ?? null,
    text: overrides.text ?? null,
    webdev: overrides.webdev ?? null,
    providerNames: overrides.providerNames ?? [],
    gatewayOnly: overrides.gatewayOnly ?? false,
    unmarked: overrides.unmarked ?? false,
  }
}

const alpha = row({
  id: 'mv_alpha',
  canonicalId: 'acme/alpha',
  name: 'Alpha',
  lab: 'Acme',
  family: 'claude-opus',
  reasoningLabel: '可调',
  context: 128000,
  outputLimit: 8192,
  releaseDate: '2026-01-01',
  price: price(5),
  text: score(1200, 2),
  providerNames: ['Acme'],
})

const beta = row({
  id: 'mv_beta',
  canonicalId: 'beta/beta',
  name: 'Beta',
  lab: 'Beta Labs',
  family: 'gpt-luna',
  context: 32000,
  outputLimit: 4096,
  releaseDate: '2026-02-01',
  price: price(1),
  text: score(1200, 1),
  providerNames: ['Cloud'],
})

const gamma = row({
  id: 'mv_gamma',
  canonicalId: 'sakana/fugu',
  name: 'Gamma',
  lab: 'Acme',
  family: 'fugu',
  availability: 'open_weights_only',
  openWeights: true,
  reasoningLabel: '不支持',
  gatewayOnly: true,
  providerNames: [],
})

const delta = row({
  id: 'mv_delta',
  canonicalId: 'delta/delta',
  name: 'Delta',
  lab: 'Delta Labs',
  family: 'gemini-pro',
  context: 1000000,
  outputLimit: 65536,
  releaseDate: '2026-03-01',
  price: price(15),
  webdev: score(1300, 1),
  providerNames: ['Delta'],
})

const epsilon = row({
  id: 'mv_epsilon',
  canonicalId: 'acme/epsilon',
  name: 'Epsilon',
  lab: 'Acme',
  family: 'qwen-max',
  releaseBadges: ['beta'],
  context: 256000,
  outputLimit: 16384,
  releaseDate: '2025-12-01',
  price: price(10),
  text: score(1100, 3),
  webdev: score(1250, 2),
  providerNames: ['Acme'],
})

const models = [alpha, beta, gamma, delta, epsilon]

function query(patch: Partial<ExploreQuery> = {}): ExploreQuery {
  return { ...DEFAULT_EXPLORE_QUERY, ...patch }
}

function ids(rows: ModelRow[]): string[] {
  return rows.map(model => model.id)
}

test('parses an empty query as the default', () => {
  assert.deepEqual(parseExploreQuery(new URLSearchParams()), DEFAULT_EXPLORE_QUERY)
})

test('parses every supported parameter and maps the gateway sentinel', () => {
  const parsed = parseExploreQuery(
    new URLSearchParams(
      'q=Claude&labs=Acme,OpenAI&providers=Anthropic,__gateway_only__,OpenAI&maxOutput=5&minContext=128000&reasoning=1&openWeights=1&stableOnly=1&hasArena=1&sort=price',
    ),
  )

  assert.deepEqual(parsed, {
    q: 'Claude',
    labs: ['Acme', 'OpenAI'],
    providers: ['Anthropic', 'OpenAI'],
    gatewayOnly: true,
    maxOutput: 5,
    minContext: 128000,
    reasoning: true,
    openWeights: true,
    stableOnly: true,
    hasArena: true,
    sortKey: 'price',
  })
})

test('normalizes invalid, duplicate, and unknown parameters', () => {
  assert.deepEqual(
    parseExploreQuery(new URLSearchParams('labs=Acme,Acme,&providers=Anthropic,,Anthropic&sort=nope')),
    {
      ...DEFAULT_EXPLORE_QUERY,
      labs: ['Acme'],
      providers: ['Anthropic'],
    },
  )
  assert.deepEqual(
    parseExploreQuery(new URLSearchParams('reasoning=true&openWeights=0&maxOutput=-1&minContext=abc&foo=bar')),
    DEFAULT_EXPLORE_QUERY,
  )
  assert.equal(parseExploreQuery(new URLSearchParams('maxOutput=0')).maxOutput, 0)
  assert.deepEqual(parseExploreQuery(new URLSearchParams('providers=__gateway_only__')), {
    ...DEFAULT_EXPLORE_QUERY,
    gatewayOnly: true,
  })
})

test('serializes the frozen URL contract and round-trips', () => {
  const full = query({
    q: 'Claude',
    labs: ['Acme', 'OpenAI'],
    providers: ['Anthropic', 'OpenAI'],
    gatewayOnly: true,
    maxOutput: 5,
    minContext: 128000,
    reasoning: true,
    openWeights: true,
    stableOnly: true,
    hasArena: true,
    sortKey: 'price',
  })
  const serialized = serializeExploreQuery(full)

  assert.equal(
    serialized.toString(),
    'q=Claude&labs=Acme%2COpenAI&providers=Anthropic%2COpenAI%2C__gateway_only__&maxOutput=5&minContext=128000&reasoning=1&openWeights=1&stableOnly=1&hasArena=1&sort=price',
  )
  assert.deepEqual(parseExploreQuery(serialized), full)
  assert.equal(serializeExploreQuery(DEFAULT_EXPLORE_QUERY).toString(), '')
  assert.equal(serializeExploreQuery(query({ sortKey: 'arena_text' })).toString(), '')
  assert.equal(serializeExploreQuery(query({ maxOutput: 0 })).toString(), 'maxOutput=0')
})

test('detects the default query, including sort-only differences', () => {
  assert.equal(isDefaultExploreQuery(DEFAULT_EXPLORE_QUERY), true)
  const patches: Partial<ExploreQuery>[] = [
    { q: 'x' },
    { q: ' ' },
    { labs: ['Acme'] },
    { providers: ['Acme'] },
    { gatewayOnly: true },
    { maxOutput: 5 },
    { minContext: 128000 },
    { reasoning: true },
    { openWeights: true },
    { stableOnly: true },
    { hasArena: true },
    { sortKey: 'price' },
  ]
  for (const patch of patches) {
    assert.equal(isDefaultExploreQuery(query(patch)), false)
  }
})

test('searches name, lab, canonical id, and family', () => {
  assert.deepEqual(ids(selectModels(models, query({ q: 'opus' }))), ['mv_alpha'])
  assert.deepEqual(ids(selectModels(models, query({ q: 'acme' }))), ['mv_alpha', 'mv_epsilon', 'mv_gamma'])
  assert.deepEqual(ids(selectModels(models, query({ q: 'acme/alpha' }))), ['mv_alpha'])
  assert.deepEqual(ids(selectModels(models, query({ q: '  BETA  ' }))), ['mv_beta'])
  assert.deepEqual(ids(selectModels(models, query({ q: 'not-found' }))), [])
})

test('filters by lab, provider, gateway-only, price, context, capability, and availability', () => {
  assert.deepEqual(ids(selectModels(models, query({ labs: ['Acme'] }))), ['mv_alpha', 'mv_epsilon', 'mv_gamma'])
  assert.deepEqual(ids(selectModels(models, query({ providers: ['Acme'] }))), ['mv_alpha', 'mv_epsilon'])
  assert.deepEqual(ids(selectModels(models, query({ providers: ['Cloud'] }))), ['mv_beta'])
  assert.deepEqual(ids(selectModels(models, query({ gatewayOnly: true }))), ['mv_gamma'])
  assert.deepEqual(
    ids(selectModels(models, query({ providers: ['Acme'], gatewayOnly: true }))),
    ['mv_alpha', 'mv_epsilon', 'mv_gamma'],
  )
  assert.deepEqual(ids(selectModels(models, query({ maxOutput: 5 }))), ['mv_beta', 'mv_alpha'])
  assert.deepEqual(ids(selectModels(models, query({ minContext: 128000 }))), ['mv_alpha', 'mv_epsilon', 'mv_delta'])
  assert.deepEqual(
    ids(selectModels(models, query({ reasoning: true }))),
    ['mv_beta', 'mv_alpha', 'mv_epsilon', 'mv_delta'],
  )
  assert.deepEqual(ids(selectModels(models, query({ openWeights: true }))), ['mv_gamma'])
  assert.deepEqual(ids(selectModels(models, query({ stableOnly: true }))), ['mv_beta', 'mv_alpha', 'mv_delta'])
  assert.deepEqual(
    ids(selectModels(models, query({ hasArena: true }))),
    ['mv_beta', 'mv_alpha', 'mv_epsilon', 'mv_delta'],
  )
})

test('sorts by every key with missing values last', () => {
  assert.deepEqual(ids(selectModels(models, query({ sortKey: 'arena_text' }))), [
    'mv_beta',
    'mv_alpha',
    'mv_epsilon',
    'mv_delta',
    'mv_gamma',
  ])
  assert.deepEqual(ids(selectModels(models, query({ sortKey: 'arena_webdev' }))), [
    'mv_delta',
    'mv_epsilon',
    'mv_alpha',
    'mv_beta',
    'mv_gamma',
  ])
  assert.deepEqual(ids(selectModels(models, query({ sortKey: 'newest' }))), [
    'mv_delta',
    'mv_beta',
    'mv_alpha',
    'mv_epsilon',
    'mv_gamma',
  ])
  assert.deepEqual(ids(selectModels(models, query({ sortKey: 'price' }))), [
    'mv_beta',
    'mv_alpha',
    'mv_epsilon',
    'mv_delta',
    'mv_gamma',
  ])
  assert.deepEqual(ids(selectModels(models, query({ sortKey: 'context' }))), [
    'mv_delta',
    'mv_epsilon',
    'mv_alpha',
    'mv_beta',
    'mv_gamma',
  ])
})

test('uses rank, newest release, then name for Arena ties', () => {
  const older = row({ id: 'older', name: 'Older', text: score(1000, 5), releaseDate: '2025-01-01' })
  const newer = row({ id: 'newer', name: 'Newer', text: score(1000, 5), releaseDate: '2026-01-01' })
  const missing = row({ id: 'missing', name: 'Missing', text: score(1000, 5) })

  assert.deepEqual(ids(selectModels([older, newer, missing], query())), ['newer', 'older', 'missing'])
})

test('does not mutate the input models', () => {
  const original = [...models]
  selectModels(models, query({ sortKey: 'price' }))
  assert.deepEqual(ids(models), ids(original))
  assert.notStrictEqual(selectModels(models, query()), models)
})

test('describes chips in order without a sort chip', () => {
  const withEverything = query({
    q: 'Claude',
    labs: ['Acme'],
    providers: ['Anthropic'],
    gatewayOnly: true,
    maxOutput: 5,
    minContext: 128000,
    reasoning: true,
    openWeights: true,
    stableOnly: true,
    hasArena: true,
    sortKey: 'price',
  })

  assert.deepEqual(describeActiveFilters(withEverything), [
    { kind: 'q', label: '搜索“Claude”' },
    { kind: 'lab', value: 'Acme', label: 'Acme' },
    { kind: 'provider', value: 'Anthropic', label: 'Anthropic' },
    { kind: 'gatewayOnly', label: '仅网关' },
    { kind: 'maxOutput', label: '输出 ≤ $5' },
    { kind: 'minContext', label: '上下文 ≥ 128K' },
    { kind: 'reasoning', label: '支持推理' },
    { kind: 'openWeights', label: '开源权重' },
    { kind: 'stableOnly', label: '仅稳定版' },
    { kind: 'hasArena', label: '只看有评测' },
  ])
  assert.deepEqual(describeActiveFilters(query({ sortKey: 'price' })), [])
})

test('removes each chip kind and clears the query', () => {
  let current = query({
    q: 'Claude',
    labs: ['Acme'],
    providers: ['Anthropic'],
    gatewayOnly: true,
    maxOutput: 5,
    minContext: 128000,
    reasoning: true,
    openWeights: true,
    stableOnly: true,
    hasArena: true,
  })

  for (const filter of describeActiveFilters(current)) {
    current = removeFilter(current, filter)
  }

  assert.equal(isDefaultExploreQuery(current), true)
})

test('removes one list value and preserves the other filters', () => {
  const twoLabs = query({ labs: ['Acme', 'Other'], reasoning: true })
  const oneLab = removeFilter(twoLabs, { kind: 'lab', value: 'Acme', label: 'Acme' })
  assert.deepEqual(oneLab.labs, ['Other'])
  assert.equal(oneLab.reasoning, true)

  const twoProviders = query({ providers: ['Anthropic', 'Cloud'], gatewayOnly: true })
  const oneProvider = removeFilter(twoProviders, { kind: 'provider', value: 'Cloud', label: 'Cloud' })
  assert.deepEqual(oneProvider.providers, ['Anthropic'])
  assert.equal(oneProvider.gatewayOnly, true)
})

test('parses a non-default sort key as a SortKey', () => {
  const parsed = parseExploreQuery(new URLSearchParams('sort=context'))
  const sortKey: SortKey = parsed.sortKey
  assert.equal(sortKey, 'context')
})

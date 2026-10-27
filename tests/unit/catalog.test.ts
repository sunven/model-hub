import assert from 'node:assert/strict'
import test from 'node:test'
import { buildCatalog } from '../../lib/catalog'
import { ciDomain } from '../../lib/format'
import type { ModelVersion, Offer, Score } from '../../lib/types'

function price(input: number | null, output: number | null): NonNullable<Offer['price']> {
  return { input, output, cacheRead: null, cacheWrite: null, currency: 'USD', tiers: [] }
}

function limits(context: number | null, output: number | null) {
  return { context, input: null, output }
}

function model(
  overrides: Partial<ModelVersion> & Pick<ModelVersion, 'id' | 'canonicalModelId' | 'name' | 'lab'>,
): ModelVersion {
  return {
    id: overrides.id,
    canonicalModelId: overrides.canonicalModelId,
    name: overrides.name,
    lab: overrides.lab,
    family: overrides.family ?? null,
    releaseDate: overrides.releaseDate ?? null,
    knowledgeCutoff: overrides.knowledgeCutoff ?? null,
    modalities: overrides.modalities ?? { input: ['text'], output: ['text'] },
    openWeights: overrides.openWeights ?? false,
    description: overrides.description ?? null,
    aaUrl: overrides.aaUrl ?? null,
    availability: overrides.availability ?? 'available',
    releaseBadges: overrides.releaseBadges ?? [],
    reasoningLabel: overrides.reasoningLabel ?? '可调',
    sourceRefs: overrides.sourceRefs ?? [`models.dev:${overrides.canonicalModelId}`],
    snapshotId: overrides.snapshotId ?? 'test',
  }
}

function offer(
  overrides: Partial<Offer> &
    Pick<Offer, 'id' | 'modelVersionId' | 'providerId' | 'providerName' | 'providerKind'>,
): Offer {
  return {
    id: overrides.id,
    modelVersionId: overrides.modelVersionId,
    providerId: overrides.providerId,
    providerName: overrides.providerName,
    providerKind: overrides.providerKind,
    providerModelId: overrides.providerModelId ?? overrides.id,
    providerModelName: overrides.providerModelName ?? 'Test Model',
    status: overrides.status ?? 'beta',
    price: overrides.price === undefined ? price(1, 2) : overrides.price,
    limits: overrides.limits ?? limits(128000, 8192),
    capabilities: overrides.capabilities ?? {
      reasoning: false,
      reasoningOptions: [],
      toolCall: false,
      structuredOutput: false,
      attachment: false,
      temperature: true,
      interleaved: null,
    },
    sourceRefs: overrides.sourceRefs ?? ['models.dev:test'],
    snapshotId: overrides.snapshotId ?? 'test',
  }
}

function score(
  overrides: Partial<Score> &
    Pick<Score, 'id' | 'modelVersionId' | 'board' | 'condition' | 'rating' | 'rank'>,
): Score {
  return {
    id: overrides.id,
    modelVersionId: overrides.modelVersionId,
    source: 'arena_hf',
    board: overrides.board,
    condition: overrides.condition,
    rating: overrides.rating,
    ciLow: overrides.ciLow ?? overrides.rating - 10,
    ciHigh: overrides.ciHigh ?? overrides.rating + 10,
    rank: overrides.rank,
    votes: overrides.votes ?? 100,
    snapshotDate: overrides.snapshotDate ?? '2026-10-01',
    sourceRef: overrides.sourceRef ?? 'arena:test',
  }
}

const alpha = model({
  id: 'mv_alpha',
  canonicalModelId: 'acme/alpha',
  name: 'Alpha',
  lab: 'Acme',
  family: 'alpha-family',
  releaseDate: '2026-01-01',
})

const beta = model({
  id: 'mv_beta',
  canonicalModelId: 'beta/beta',
  name: 'Beta',
  lab: 'Beta Labs',
  family: 'beta-family',
  releaseDate: '2026-02-01',
})

const gamma = model({
  id: 'mv_gamma',
  canonicalModelId: 'gamma/gamma',
  name: 'Gamma',
  lab: 'Gamma Labs',
  family: 'gamma-family',
})

const delta = model({
  id: 'mv_delta',
  canonicalModelId: 'delta/delta',
  name: 'Delta',
  lab: 'Delta Labs',
  family: 'delta-family',
  availability: 'open_weights_only',
  openWeights: true,
})

const offers = [
  offer({
    id: 'a1',
    modelVersionId: alpha.id,
    providerId: 'acme',
    providerName: 'Acme',
    providerKind: 'first_party',
    price: price(2, 5),
    limits: limits(200000, 8192),
    status: 'available_unmarked',
  }),
  offer({
    id: 'a2',
    modelVersionId: alpha.id,
    providerId: 'cloudco',
    providerName: 'CloudCo',
    providerKind: 'cloud',
    price: price(1, 4),
    limits: limits(100000, 4096),
  }),
  offer({
    id: 'a3',
    modelVersionId: alpha.id,
    providerId: 'gateway',
    providerName: 'Gateway',
    providerKind: 'gateway',
    price: price(0.5, 2),
    limits: limits(500000, 16384),
  }),
  offer({
    id: 'b1',
    modelVersionId: beta.id,
    providerId: 'gateway',
    providerName: 'Gateway',
    providerKind: 'gateway',
    price: price(3, 6),
    limits: limits(128000, 4096),
  }),
  offer({
    id: 'g1',
    modelVersionId: gamma.id,
    providerId: 'gamma',
    providerName: 'Gamma',
    providerKind: 'first_party',
    price: null,
    limits: limits(null, null),
    status: 'available_unmarked',
  }),
  offer({
    id: 'g2',
    modelVersionId: gamma.id,
    providerId: 'gateway',
    providerName: 'Gateway',
    providerKind: 'gateway',
    price: price(4, 8),
    limits: limits(256000, 8192),
  }),
]

const scores = [
  score({ id: 'a-text-default', modelVersionId: alpha.id, board: 'text', condition: 'default', rating: 1200, rank: 2 }),
  score({ id: 'a-text-high', modelVersionId: alpha.id, board: 'text', condition: 'high', rating: 1300, rank: 1, votes: 300 }),
  score({ id: 'a-webdev-default', modelVersionId: alpha.id, board: 'webdev', condition: 'default', rating: 1100, rank: 3 }),
  score({ id: 'b-text-old', modelVersionId: beta.id, board: 'text', condition: 'high', rating: 1160, rank: 3, votes: 50 }),
  score({ id: 'b-text-voted', modelVersionId: beta.id, board: 'text', condition: 'medium', rating: 1150, rank: 4, votes: 200 }),
  score({ id: 'd-webdev-default', modelVersionId: delta.id, board: 'webdev', condition: 'default', rating: 1000, rank: 5 }),
]

const catalog = buildCatalog({ models: [alpha, beta, gamma, delta], offers, scores })

function rowById(id: string) {
  const row = catalog.rows.find(candidate => candidate.id === id)
  assert.ok(row)
  return row
}

function approx(actual: number, expected: number) {
  assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} !== ${expected}`)
}

test('summarizes primary offers and falls back to gateways only when needed', () => {
  assert.deepEqual(rowById(alpha.id).price, {
    inputMin: 1,
    inputMax: 2,
    outputMin: 4,
    outputMax: 5,
    gatewayOnly: false,
  })
  assert.equal(rowById(alpha.id).context, 200000)
  assert.equal(rowById(alpha.id).outputLimit, 8192)
  assert.deepEqual(rowById(alpha.id).providerNames, ['Acme', 'CloudCo'])
  assert.equal(rowById(alpha.id).gatewayOnly, false)
  assert.equal(rowById(alpha.id).unmarked, true)

  assert.deepEqual(rowById(beta.id).price, {
    inputMin: 3,
    inputMax: 3,
    outputMin: 6,
    outputMax: 6,
    gatewayOnly: true,
  })
  assert.deepEqual(rowById(beta.id).providerNames, [])
  assert.equal(rowById(beta.id).gatewayOnly, true)
  assert.equal(rowById(beta.id).unmarked, false)

  assert.deepEqual(rowById(gamma.id).price, {
    inputMin: 4,
    inputMax: 4,
    outputMin: 8,
    outputMax: 8,
    gatewayOnly: true,
  })
  assert.equal(rowById(gamma.id).context, 256000)
  assert.equal(rowById(gamma.id).outputLimit, 8192)
  assert.deepEqual(rowById(gamma.id).providerNames, ['Gamma'])
  assert.equal(rowById(gamma.id).gatewayOnly, false)

  assert.equal(rowById(delta.id).price, null)
  assert.equal(rowById(delta.id).context, null)
  assert.equal(rowById(delta.id).outputLimit, null)
  assert.deepEqual(rowById(delta.id).providerNames, [])
  assert.equal(rowById(delta.id).gatewayOnly, true)
  assert.equal(rowById(delta.id).unmarked, false)
})

test('selects the primary Score per Board', () => {
  assert.equal(rowById(alpha.id).text?.rating, 1200)
  assert.equal(rowById(alpha.id).text?.condition, 'default')
  assert.equal(rowById(alpha.id).text?.rank, 2)
  assert.equal(rowById(delta.id).text, null)
  assert.equal(rowById(delta.id).webdev?.rating, 1000)

  assert.equal(rowById(beta.id).text?.rating, 1150)
  assert.equal(rowById(beta.id).text?.rank, 4)
  assert.equal(rowById(beta.id).text?.votes, 200)
})

test('builds a self-contained ModelDetail', () => {
  const detail = catalog.getDetail(alpha.canonicalModelId)
  assert.ok(detail)
  assert.equal(detail.model, alpha)
  assert.equal(detail.row, rowById(alpha.id))
  assert.deepEqual(detail.offers.map(item => item.id), ['a1', 'a2', 'a3'])
  assert.deepEqual(detail.textScores.map(item => item.condition), ['high', 'default'])
  assert.equal(detail.textPrimary?.condition, 'default')
  assert.equal(detail.textPrimary?.rating, 1200)
  assert.equal(detail.webdevPrimary?.rating, 1100)
  assert.equal(detail.textDomain, catalog.domains.text)
  assert.equal(detail.webdevDomain, catalog.domains.webdev)
  assert.equal(catalog.getDetail('missing/model'), null)
})

test('builds the catalog index in model order', () => {
  assert.deepEqual(
    catalog.index.map(entry => entry.canonicalId),
    ['acme/alpha', 'beta/beta', 'gamma/gamma', 'delta/delta'],
  )
})

test('computes shared Board domains from primary Score views', () => {
  const text = catalog.domains.text
  const webdev = catalog.domains.webdev
  assert.ok(text)
  assert.ok(webdev)
  approx(text.min, 1137.2)
  approx(text.max, 1212.8)
  approx(webdev.min, 985.2)
  approx(webdev.max, 1114.8)
})

test('returns the highest-rated text models', () => {
  assert.deepEqual(catalog.topText(1).map(row => row.id), [alpha.id])
  assert.deepEqual(catalog.topText(10).map(row => row.id), [alpha.id, beta.id])
})

test('computes a padded CI domain', () => {
  assert.equal(ciDomain([]), null)

  const single = ciDomain([{ rating: 10, ciLow: 9, ciHigh: 11 }])
  assert.ok(single)
  approx(single.min, 8.6)
  approx(single.max, 11.4)

  const pair = ciDomain([
    { rating: 10, ciLow: 9, ciHigh: 11 },
    { rating: 11, ciLow: 10, ciHigh: 12 },
  ])
  assert.ok(pair)
  approx(pair.min, 8.6)
  approx(pair.max, 12.4)
})

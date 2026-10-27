import assert from 'node:assert/strict'
import test from 'node:test'
import modelsJson from '../../data/latest/models.json'
import offersJson from '../../data/latest/offers.json'
import scoresJson from '../../data/latest/scores.json'
import unmatchedJson from '../../data/latest/unmatched.json'
import manifestJson from '../../data/latest/manifest.json'
import {
  aaUrlSchema,
  hasCompletePrice,
  manifestSchema,
  modelVersionSchema,
  offerSchema,
  scoreSchema,
  unmatchedSchema,
  validateSnapshot,
} from '../../lib/snapshot'
import { buildModelsData } from '../../scripts/models'
import { applyOverrides } from '../../scripts/overrides'
import type { LaunchEntry, RawCatalog } from '../../scripts/types'

function fixture() {
  const model = modelVersionSchema.parse(modelsJson[0])
  const offer = offerSchema.parse(offersJson.find(offer => offer.modelVersionId === model.id))
  const score = scoreSchema.parse(scoresJson.find(score => score.modelVersionId === model.id))
  const unmatched = unmatchedSchema.parse(unmatchedJson[0])
  return {
    snapshotId: model.snapshotId,
    expectedCanonicalIds: [model.canonicalModelId],
    models: [model],
    offers: [offer],
    scores: [score],
    unmatched: [unmatched],
    fx: { ...manifestJson.fx, as_of: new Date().toISOString().slice(0, 10) },
  }
}

const launch: LaunchEntry[] = [{
  canonicalId: 'test/model', name: 'Test', lab: 'Test', status: 'active', openWeights: false,
}]

function rawCatalog(cost?: { input: number; output: number }): RawCatalog {
  return { test: { models: { model: { canonical_model_id: 'test/model', cost } } } }
}

test('accepts the checked-in Snapshot and Manifest without mutating inputs', () => {
  const input = {
    snapshotId: manifestJson.snapshotId,
    expectedCanonicalIds: modelsJson.map(model => model.canonicalModelId),
    models: modelsJson, offers: offersJson, scores: scoresJson, unmatched: unmatchedJson,
    fx: manifestJson.fx,
  }
  const before = structuredClone(input)
  const report = validateSnapshot(input)
  assert.equal(report.status, 'passed', report.hardFailures.join('\n'))
  assert.equal(report.stats.models, 43)
  assert.deepEqual(report.stats.byBoard, { text: 30, webdev: 31 })
  assert.equal(manifestSchema.safeParse(manifestJson).success, true)
  assert.deepEqual(input, before)
})

test('reports malformed JSON structures before checking relationships', () => {
  const report = validateSnapshot({ ...fixture(), offers: [{ price: null }], scores: null })
  assert.equal(report.status, 'failed')
  assert.match(report.hardFailures.join('\n'), /schema offers.json/)
  assert.match(report.hardFailures.join('\n'), /schema scores.json/)
})

test('rejects invalid price, context, provider kind, and status through the contract', () => {
  for (const patch of [
    { price: { ...fixture().offers[0].price, input: -1 } },
    { limits: { context: 0, input: null, output: null } },
    { providerKind: 'reseller' },
    { status: 'active' },
  ]) {
    const input = fixture()
    const report = validateSnapshot({ ...input, offers: [{ ...input.offers[0], ...patch }] })
    assert.equal(report.status, 'failed')
    assert.match(report.hardFailures.join('\n'), /schema offers.json/)
  }
})

test('rejects duplicate identities, missing references, and missing expected models', () => {
  const input = fixture()
  input.models.push({ ...input.models[0] })
  input.offers[0].modelVersionId = 'missing'
  input.scores[0].modelVersionId = 'missing'
  input.expectedCanonicalIds = ['test/missing']
  const failures = validateSnapshot(input).hardFailures.join('\n')
  assert.match(failures, /duplicate or empty model id/)
  assert.match(failures, /duplicate or empty canonicalModelId/)
  assert.match(failures, /offer references missing model/)
  assert.match(failures, /score references missing model/)
  assert.match(failures, /launch canonicalId missing/)
})

test('rejects duplicate matched and unmatched Score identities', () => {
  const input = fixture()
  input.scores.push({ ...input.scores[0] })
  input.unmatched.push({ ...input.unmatched[0] })
  const failures = validateSnapshot(input).hardFailures.join('\n')
  assert.match(failures, /duplicate or empty score id/)
  assert.match(failures, /duplicate or empty unmatched id/)
})

test('checks CI relationships for both matched and unmatched Scores', () => {
  const input = fixture()
  input.scores[0].rating = input.scores[0].ciHigh + 1
  input.unmatched[0].rating = input.unmatched[0].ciLow - 1
  const report = validateSnapshot(input)
  assert.equal(report.status, 'failed')
  assert.equal(report.hardFailures.filter(failure => failure.includes('rating outside CI')).length, 2)
})

test('keeps missing prices and Scores, unusual context, and stale FX as warnings', () => {
  const input = fixture()
  input.offers[0].price = null
  input.offers[0].limits.context = 500
  input.scores = []
  input.fx.as_of = '2000-01-01'
  const report = validateSnapshot(input)
  assert.equal(report.status, 'passed')
  const warnings = report.warnings.join('\n')
  assert.match(warnings, /no priced offer/)
  assert.match(warnings, /no Arena score/)
  assert.match(warnings, /unusual context/)
  assert.match(warnings, /CNY should be hidden/)
})

test('allows self-hosting only when a model without Offers has open weights', () => {
  const input = fixture()
  input.offers = []
  input.models[0].openWeights = false
  assert.match(validateSnapshot(input).hardFailures.join('\n'), /no offers and no open weights/)
  input.models[0].openWeights = true
  input.models[0].availability = 'open_weights_only'
  assert.equal(validateSnapshot(input).status, 'passed')
})

test('uses the same AA model URL rule for crosswalks, Overrides, and output schemas', () => {
  for (const [url, accepted] of [
    ['https://artificialanalysis.ai/models/test', true],
    ['https://www.artificialanalysis.ai/models/test/', true],
    ['https://artificialanalysis.ai/models/test?ref=hub', true],
    ['https://artificialanalysis.ai/', false],
    ['https://artificialanalysis.ai/models/', false],
    ['https://artificialanalysis.ai/models/test/extra', false],
    ['https://artificialanalysis.ai/models/..', false],
    ['https://artificialanalysis.ai/models/%2e%2e', false],
    ['http://artificialanalysis.ai/models/test', false],
    ['https://artificialanalysis.ai.evil.test/models/test', false],
    ['https://evil.test/models/test', false],
    ['not a URL', false],
  ] as const) {
    const built = buildModelsData(rawCatalog(), launch, 'test', [
      { canonicalId: launch[0].canonicalId, aaUrl: url, verified: true },
    ])
    const overridden = applyOverrides(built.models, built.offers, [{
      target_type: 'model', target_id: built.models[0].id, field: 'aaUrl', value: url,
      reason: 'verified source', author: 'reviewer', created_at: '2026-10-27T00:00:00Z',
    }], 'test')
    assert.equal(aaUrlSchema.safeParse(url).success, accepted, url)
    assert.equal(modelVersionSchema.safeParse({ ...built.models[0], aaUrl: url }).success, accepted, url)
    assert.equal(built.models[0].aaUrl, accepted ? url : null, url)
    assert.equal(overridden.applied.length, accepted ? 1 : 0, url)
  }
})

test('treats absent and partial prices as missing and zero prices as complete', () => {
  const missing = buildModelsData(rawCatalog(), launch, 'test')
  assert.equal(hasCompletePrice(missing.offers[0]), false)
  assert.match(missing.warnings.join('\n'), /no priced offer/)

  const free = buildModelsData(rawCatalog({ input: 0, output: 0 }), launch, 'test')
  assert.equal(hasCompletePrice(free.offers[0]), true)
  assert.equal(free.warnings.some(warning => warning.includes('no priced offer')), false)
  free.offers[0].price!.output = null
  assert.equal(hasCompletePrice(free.offers[0]), false)
})

test('rejects invalid price patches without applying or auditing them', () => {
  for (const value of [{ input: -1 }, { output: Infinity }, { input: '1' }, { tiers: {} }, {}, { currency: 'CNY' }]) {
    const input = fixture()
    const before = structuredClone(input.offers)
    const result = applyOverrides(input.models, input.offers, [{
      target_type: 'offer', target_id: input.offers[0].id, field: 'price', value,
      reason: 'verified source', author: 'reviewer', created_at: '2026-10-27T00:00:00Z',
    }], 'test')
    assert.equal(result.applied.length, 0)
    assert.equal(result.hardFailures.length, 1)
    assert.deepEqual(result.offers, before)
  }
})

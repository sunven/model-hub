import assert from 'node:assert/strict'
import test from 'node:test'
import { applyOverrides } from '../../scripts/overrides'
import { overrideEntrySchema } from '../../lib/snapshot'
import type { ModelVersion, Offer, OverrideEntry } from '../../lib/snapshot'

const model: ModelVersion = {
  id: 'mv_test__model',
  canonicalModelId: 'test/model',
  name: 'Test Model',
  lab: 'Test Lab',
  family: null,
  releaseDate: null,
  knowledgeCutoff: null,
  modalities: { input: ['text'], output: ['text'] },
  openWeights: false,
  description: null,
  aaUrl: null,
  availability: 'available',
  releaseBadges: [],
  reasoningLabel: '固定',
  sourceRefs: ['models.dev:test/model'],
  snapshotId: 'test',
}

const offer: Offer = {
  id: 'of_test__model',
  modelVersionId: model.id,
  providerId: 'test',
  providerName: 'Test',
  providerKind: 'gateway',
  providerModelId: 'model',
  providerModelName: 'Test Model',
  status: 'available_unmarked',
  price: {
    input: 1,
    output: 2,
    cacheRead: null,
    cacheWrite: null,
    currency: 'USD',
    tiers: [],
  },
  limits: { context: 128000, input: null, output: 8192 },
  capabilities: {
    reasoning: false,
    reasoningOptions: [],
    toolCall: false,
    structuredOutput: false,
    attachment: false,
    temperature: true,
    interleaved: null,
  },
  sourceRefs: ['models.dev:test/model'],
  snapshotId: 'test',
}

function entry(partial: Partial<OverrideEntry>): OverrideEntry {
  return {
    target_type: 'model',
    target_id: 'test/model',
    field: 'name',
    value: 'Corrected Model',
    reason: 'official source',
    author: 'reviewer',
    created_at: '2026-10-27T00:00:00Z',
    source_url: 'https://example.com/source',
    ...partial,
  }
}

test('applies model and offer overrides with audit', () => {
  const result = applyOverrides(
    [model],
    [offer],
    [entry({}), entry({ target_type: 'offer', target_id: offer.id, field: 'price', value: { input: 3 } })],
    'abc',
  )
  assert.deepEqual(result.hardFailures, [])
  assert.equal(result.models[0].name, 'Corrected Model')
  assert.equal(result.offers[0].price?.input, 3)
  assert.equal(result.offers[0].price?.output, 2)
  assert.equal(result.applied.length, 2)
  assert.equal(result.hash, 'abc')
  assert.equal(result.models[0].id, model.id)
})

test('reports conflicting duplicate overrides and applies the first', () => {
  const result = applyOverrides(
    [model],
    [],
    [entry({ value: 'First' }), entry({ value: 'Second' })],
    'hash',
  )
  assert.equal(result.models[0].name, 'First')
  assert.equal(result.applied.length, 1)
  assert.match(result.warnings.join('\n'), /override conflict/)
})

test('rejects unallowed fields and invalid values', () => {
  const result = applyOverrides(
    [model],
    [],
    [entry({ field: 'madeUp', value: true }), entry({ field: 'openWeights', value: 'yes' })],
    'hash',
  )
  assert.equal(result.applied.length, 0)
  assert.equal(result.hardFailures.length, 2)
  assert.match(result.hardFailures.join('\n'), /unallowed field/)
  assert.match(result.hardFailures.join('\n'), /expected boolean/)
})

test('warns when a target no longer exists', () => {
  const result = applyOverrides([model], [], [entry({ target_id: 'gone/model' })], 'hash')
  assert.equal(result.applied.length, 0)
  assert.match(result.warnings.join('\n'), /target not found/)
})

test('validates override entry structure and timestamps', () => {
  assert.equal(overrideEntrySchema.safeParse(entry({})).success, true)
  assert.equal(overrideEntrySchema.safeParse(entry({ created_at: 'yesterday' })).success, false)
  assert.equal(overrideEntrySchema.safeParse(entry({ source_url: 'not-a-url' })).success, false)
})

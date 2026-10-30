import assert from 'node:assert/strict'
import test from 'node:test'
import { checkFreshness, snapshotFreshness } from '../../lib/freshness'
import { fmtCnyRange } from '../../lib/format'
import { manifestSchema } from '../../lib/snapshot'
import manifest from '../../data/latest/manifest.json'

const timestamp = '2026-10-27T00:00:00.000Z'
const start = Date.parse(timestamp)
const hour = 3_600_000

for (const [source, hours] of [['modelsDev', 48], ['arena', 72], ['fx', 14 * 24]] as const) {
  test(`${source} stays fresh at the threshold and expires one millisecond later`, () => {
    const expiry = start + hours * hour
    assert.equal(checkFreshness(source, timestamp, expiry - 1).stale, false)
    assert.equal(checkFreshness(source, timestamp, expiry).stale, false)
    assert.equal(checkFreshness(source, timestamp, expiry + 1).stale, true)
    assert.equal(checkFreshness(source, timestamp, expiry).expiresAt, expiry)
  })
}

test('rounded Manifest ages never decide staleness, and Arena uses its oldest source', () => {
  const times = {
    modelsDev: new Date(start - 48 * hour - 1).toISOString(),
    arena: [timestamp, new Date(start - 72 * hour - 1).toISOString()],
    fx: new Date(start - 14 * 24 * hour - 1).toISOString(),
  }
  const before = structuredClone(times)
  const freshness = snapshotFreshness(times, start)
  assert.deepEqual(freshness.modelsDev, {
    fetchedAt: times.modelsDev, ageHours: 48, thresholdHours: 48, stale: true,
  })
  assert.deepEqual(freshness.arena, {
    fetchedAt: times.arena[1], ageHours: 72, thresholdHours: 72, stale: true,
  })
  assert.deepEqual(freshness.fx, {
    asOf: times.fx, ageDays: 14, thresholdDays: 14, stale: true,
  })
  assert.deepEqual(times, before)
})

test('FX formatting and freshness agree at the UTC date-only expiry', () => {
  const fx = { ...manifest.fx, as_of: '2026-10-27', usd_to_cny: 7 }
  const expiry = Date.parse('2026-11-10T00:00:00.000Z')
  assert.equal(checkFreshness('fx', fx.as_of, expiry).stale, false)
  assert.equal(fmtCnyRange(1, 2, fx, expiry), '≈¥7.00–14.00')
  assert.equal(fmtCnyRange(0, 0, fx, expiry), '≈¥0.00')
  assert.equal(checkFreshness('fx', fx.as_of, expiry + 1).stale, true)
  assert.equal(fmtCnyRange(1, 2, fx, expiry + 1), null)
})

test('future timestamps have zero age; unknown times are stale and fail the Manifest contract', () => {
  for (const source of ['modelsDev', 'arena', 'fx'] as const) {
    assert.deepEqual(checkFreshness(source, timestamp, start - 1), {
      ...checkFreshness(source, timestamp, start), ageDays: 0, ageHours: 0, stale: false,
    })
    const invalid = checkFreshness(source, 'unknown', start)
    assert.equal(invalid.stale, true)
    assert.equal(invalid.ageDays, null)
    assert.equal(invalid.expiresAt, null)
  }
  assert.equal(fmtCnyRange(1, 2, { ...manifest.fx, as_of: 'unknown' }, start), null)
  for (const arena of [['unknown', timestamp], [timestamp, 'unknown'], []]) {
    const freshness = snapshotFreshness({ modelsDev: timestamp, arena, fx: timestamp }, start)
    assert.equal(freshness.arena.stale, true)
    assert.equal(manifestSchema.safeParse({ ...manifest, freshness }).success, false)
  }
  assert.throws(() => checkFreshness('fx', timestamp, NaN), /clock must be finite/)
})

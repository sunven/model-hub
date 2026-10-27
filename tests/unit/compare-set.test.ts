import assert from 'node:assert/strict'
import test from 'node:test'
import { compareHref, normalizeCompareSet, restoreCompareSet, updateCompareSet } from '../../lib/compare-set'

const known = new Set(['a', 'b', 'c', 'd', 'with/slash', 'with space'])

test('normalizes arbitrary persisted values without mutating them', () => {
  for (const value of [null, undefined, {}, 3, 'a,b', true]) {
    assert.deepEqual(normalizeCompareSet(value, known), [])
  }
  const value = ['missing', 'a', null, 'a', 2, 'b', 'c', 'd']
  const before = [...value]
  assert.deepEqual(normalizeCompareSet(value, known), ['a', 'b', 'c'])
  assert.deepEqual(value, before)
})

test('uses explicit URL selections before storage, including empty and invalid selections', () => {
  assert.deepEqual(restoreCompareSet(new URLSearchParams(), ['b', 'c'], known), ['b', 'c'])
  assert.deepEqual(restoreCompareSet(new URLSearchParams('models=a'), ['b', 'c'], known), ['a'])
  assert.deepEqual(restoreCompareSet(new URLSearchParams('models='), ['b', 'c'], known), [])
  assert.deepEqual(restoreCompareSet(new URLSearchParams('models=gone'), ['b', 'c'], known), [])
})

test('normalizes all URL values before applying the limit and preserves selection order', () => {
  const params = new URLSearchParams('models=gone,b,b,a&models=c,d')
  const before = params.toString()
  assert.deepEqual(restoreCompareSet(params, ['d'], known), ['b', 'a', 'c'])
  assert.equal(params.toString(), before)
})

test('toggles valid IDs and reports a rejected fourth selection', () => {
  let selected: string[] = []
  for (const id of ['a', 'b', 'c']) {
    const result = updateCompareSet(selected, { type: 'toggle', id }, known)
    assert.equal(result.limitReached, false)
    selected = result.selected
  }
  assert.deepEqual(updateCompareSet(selected, { type: 'toggle', id: 'd' }, known), {
    selected: ['a', 'b', 'c'], limitReached: true,
  })
  assert.deepEqual(updateCompareSet(selected, { type: 'toggle', id: 'b' }, known), {
    selected: ['a', 'c'], limitReached: false,
  })
  assert.deepEqual(selected, ['a', 'b', 'c'])
})

test('ignores unknown IDs and normalizes the current selection before any transition', () => {
  assert.deepEqual(updateCompareSet(['a', 'a', 'gone', 'b'], { type: 'toggle', id: 'c' }, known), {
    selected: ['a', 'b', 'c'], limitReached: false,
  })
  assert.deepEqual(updateCompareSet(['a', 'b', 'c'], { type: 'toggle', id: 'gone' }, known), {
    selected: ['a', 'b', 'c'], limitReached: false,
  })
})

test('removes a selection, appends new selections in order, and clears the set', () => {
  const removed = updateCompareSet(['a', 'b', 'c'], { type: 'remove', id: 'b' }, known)
  const added = updateCompareSet(removed.selected, { type: 'toggle', id: 'd' }, known)
  assert.deepEqual(added.selected, ['a', 'c', 'd'])
  assert.deepEqual(updateCompareSet(added.selected, { type: 'clear' }, known), { selected: [], limitReached: false })
})

test('builds shareable links that round-trip encoded IDs and empty selections', () => {
  const selected = ['with/slash', 'with space']
  assert.deepEqual(restoreCompareSet(new URL(compareHref(selected), 'https://example.test').searchParams, [], known), selected)
  assert.equal(compareHref([]), '/compare')
})

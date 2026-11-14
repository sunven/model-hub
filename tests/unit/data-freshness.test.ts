import assert from 'node:assert/strict'
import test from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { DataFreshness } from '../../components/data-freshness'
import { snapshotFreshness } from '../../lib/freshness'

const timestamps = {
  modelsDev: '2026-11-01T00:00:00.000Z',
  arena: ['2026-11-01T00:00:00.000Z'],
  fx: '2026-11-01',
}

test('renders known stale warnings in the initial HTML before the browser clock is available', () => {
  const initialFreshness = snapshotFreshness(timestamps, Date.parse('2026-11-16T00:00:00.000Z'))
  const html = renderToStaticMarkup(createElement(DataFreshness, { initialFreshness }))
  assert.match(html, /data-testid="freshness-banner"/)
  assert.match(html, /models.dev 快照已超过 48 小时/)
  assert.match(html, /Arena 快照已超过 72 小时/)
  assert.match(html, /汇率已超过 14 天/)
})

test('omits the initial warning when the build-time snapshot is fresh', () => {
  const initialFreshness = snapshotFreshness(timestamps, Date.parse('2026-11-01T12:00:00.000Z'))
  assert.equal(renderToStaticMarkup(createElement(DataFreshness, { initialFreshness })), '')
})

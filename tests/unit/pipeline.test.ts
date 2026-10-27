import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test, { type TestContext } from 'node:test'
import manifestJson from '../../data/latest/manifest.json'
import { generateJsonSchemas } from '../../lib/snapshot'
import { createSnapshotSource } from '../../scripts/fetch'
import { runSnapshot, type SnapshotInput, type SnapshotSource } from '../../scripts/snapshot'

const execFile = promisify(execFileCallback)
const now = new Date('2026-10-27T12:00:00.000Z')
const hash = (value: string | Buffer) => createHash('sha256').update(value).digest('hex')

function fixture(): SnapshotInput {
  const row = {
    model_name: 'Test Model', organization: 'Test', rating: 1400, rating_lower: 1390,
    rating_upper: 1410, rank: 1, vote_count: 100, leaderboard_publish_date: '2026-10-26',
  }
  const sources = structuredClone(manifestJson.sources)
  for (const file of [sources.modelsDev.files.api, sources.modelsDev.files.models, sources.arena.files.text, sources.arena.files.webdev]) {
    if (file) file.fetchedAt = '2026-10-27T10:00:00.000Z'
  }
  return {
    catalog: { test: { name: 'Test', models: { model: {
      canonical_model_id: 'test/model', name: 'Test Model', cost: { input: 1, output: 2 },
      limit: { context: 128000 }, modalities: { input: ['text'], output: ['text'] },
    } } } },
    launch: [{ canonicalId: 'test/model', name: 'Test Model', lab: 'Test', status: 'active', openWeights: false }],
    crosswalk: [{ canonicalId: 'test/model', textPatterns: ['^Test Model$'], webdevPatterns: ['^Test Model$'], confidence: 'verified' }],
    aaCrosswalk: [], overrides: { entries: [], hash: null },
    fx: { usd_to_cny: 7.1, as_of: '2026-10-27', source: 'fixture' }, sources,
    arenaRows: {
      text: [
        { ...row, category: 'overall' },
        { ...row, category: 'overall', leaderboard_publish_date: '2026-10-25', vote_count: 500, rating: 1405 },
        { ...row, category: 'overall', vote_count: 10, rating: 1406 },
        { ...row, category: 'coding', rating: 1407 },
        { ...row, category: 'overall', model_name: 'Unmatched' },
      ],
      webdev: [{ ...row, category: 'webdev' }],
    },
  }
}

function source(input = fixture()): SnapshotSource {
  return { load: async () => structuredClone(input) }
}

async function tempDir(t: TestContext): Promise<string> {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'model-hub-pipeline-'))
  t.after(() => fs.rm(directory, { recursive: true, force: true }))
  return directory
}

async function tree(directory: string): Promise<Record<string, string>> {
  const files: Record<string, string> = {}
  for (const entry of await fs.readdir(directory, { withFileTypes: true }).catch(error => {
    if (error.code === 'ENOENT') return []
    throw error
  })) {
    if (entry.isDirectory()) {
      for (const [name, content] of Object.entries(await tree(path.join(directory, entry.name)))) {
        files[`${entry.name}/${name}`] = content
      }
    } else files[entry.name] = await fs.readFile(path.join(directory, entry.name), 'utf8')
  }
  return files
}

async function lastGood(directory: string) {
  for (const name of ['latest', 'schema']) {
    await fs.mkdir(path.join(directory, name), { recursive: true })
    await fs.writeFile(path.join(directory, name, 'old.json'), `previous ${name}\n`)
  }
  const before = { latest: await tree(path.join(directory, 'latest')), schema: await tree(path.join(directory, 'schema')) }
  return async () => {
    assert.deepEqual(await tree(path.join(directory, 'latest')), before.latest)
    assert.deepEqual(await tree(path.join(directory, 'schema')), before.schema)
    assert.equal((await fs.readdir(directory)).some(name => name.startsWith('tmp-')), false)
    const report = JSON.parse(await fs.readFile(path.join(directory, 'validation-report.json'), 'utf8'))
    assert.equal(report.status, 'failed')
  }
}

test('publishes a complete Snapshot with correct hashes, filtering, provenance, and audit', async t => {
  const dataDir = await tempDir(t)
  await lastGood(dataDir)
  const input = fixture()
  input.overrides = { hash: 'override-hash', entries: [{
    target_type: 'model', target_id: 'test/model', field: 'name', value: 'Corrected',
    author: 'reviewer', reason: 'verified', created_at: now.toISOString(),
  }] }
  const before = structuredClone(input)
  const result = await runSnapshot({ source: source(input), now, dataDir })
  assert.equal(result.status, 'passed', result.report.hardFailures.join('\n'))
  if (result.status !== 'passed') return
  assert.deepEqual(result.manifest.counts, { models: 1, offers: 1, scores: 2, unmatched: 1 })
  assert.equal(result.manifest.generatedAt, now.toISOString())
  assert.equal(result.report.generatedAt, now.toISOString())
  assert.equal(result.manifest.freshness.modelsDev.ageHours, 2)
  assert.equal(result.manifest.overrides.applied.length, 1)
  const files = await tree(path.join(dataDir, 'latest'))
  assert.equal(Object.keys(files).length, 6)
  assert.equal(JSON.parse(files['models.json'])[0].name, 'Corrected')
  const scores = JSON.parse(files['scores.json'])
  assert.equal(scores.find((score: { board: string }) => score.board === 'text').rating, 1400)
  for (const [name, expected] of Object.entries(result.manifest.files)) assert.equal(hash(files[name]), expected)
  assert.deepEqual(JSON.parse(files['validation-report.json']), result.report)
  assert.deepEqual(JSON.parse(files['manifest.json']), result.manifest)
  const schemas = await tree(path.join(dataDir, 'schema'))
  assert.deepEqual(Object.fromEntries(Object.entries(schemas).map(([name, content]) => [name, JSON.parse(content)])), generateJsonSchemas())
  assert.deepEqual(input, before)
  assert.equal((await fs.readdir(dataDir)).some(name => name.startsWith('tmp-')), false)
})

test('is byte reproducible with a fixed clock and isolates concurrent output directories', async t => {
  const firstDir = await tempDir(t)
  const secondDir = await tempDir(t)
  const [first, second] = await Promise.all([
    runSnapshot({ source: source(), now, dataDir: firstDir }),
    runSnapshot({ source: source(), now, dataDir: secondDir }),
  ])
  assert.equal(first.status, 'passed')
  assert.deepEqual(second, first)
  assert.deepEqual(await tree(secondDir), await tree(firstDir))
})

test('Manifest and validation agree just across all freshness thresholds without hiding data', async t => {
  const dataDir = await tempDir(t)
  const input = fixture()
  const expiry = new Date('2026-11-10T00:00:00.000Z')
  input.sources.modelsDev.files.api.fetchedAt = '2026-11-08T00:00:00.000Z'
  input.sources.arena.files.text.fetchedAt = '2026-11-09T00:00:00.000Z'
  input.sources.arena.files.webdev.fetchedAt = '2026-11-07T00:00:00.000Z'
  for (const offset of [0, 1]) {
    const result = await runSnapshot({ source: source(input), now: new Date(expiry.getTime() + offset), dataDir })
    assert.equal(result.status, 'passed', result.report.hardFailures.join('\n'))
    if (result.status !== 'passed') return
    const { freshness } = result.manifest
    assert.equal(freshness.modelsDev.ageHours, 48)
    assert.equal(freshness.arena.ageHours, 72)
    assert.equal(freshness.arena.fetchedAt, input.sources.arena.files.webdev.fetchedAt)
    assert.equal(freshness.fx.ageDays, 14)
    for (const check of Object.values(freshness)) assert.equal(check.stale, offset === 1)
    assert.equal(result.report.warnings.some(message => message.includes('CNY should be hidden')), offset === 1)
    assert.equal(result.report.stats.fxAgeDays, 14)
    assert.equal(result.manifest.counts.models, 1)
    assert.equal(result.manifest.counts.scores, 2)
  }
})

test('IDs follow content rather than fetch timestamps or the output path', async t => {
  const dataDir = await tempDir(t)
  const input = fixture()
  const first = await runSnapshot({ source: source(input), now, dataDir })
  input.sources.modelsDev.files.api.fetchedAt = '2026-10-27T09:00:00.000Z'
  const touched = await runSnapshot({ source: source(input), now: new Date(now.getTime() + 1000), dataDir })
  assert.equal(touched.report.snapshotId, first.report.snapshotId)
  input.catalog.test.models!.model.cost!.input = 3
  const changed = await runSnapshot({ source: source(input), now, dataDir })
  assert.notEqual(changed.report.snapshotId, first.report.snapshotId)
})

test('source acquisition failures return a failed report and preserve last good', async t => {
  const dataDir = await tempDir(t)
  const preserved = await lastGood(dataDir)
  const result = await runSnapshot({ source: { load: async () => { throw new Error('source unavailable') } }, now, dataDir })
  assert.equal(result.status, 'failed')
  assert.match(result.report.hardFailures.join('\n'), /source: source unavailable/)
  await preserved()
})

test('invalid Overrides, crosswalks, and Manifests never replace either published directory', async t => {
  for (const corrupt of [
    (input: SnapshotInput) => { input.overrides.entries = [{ created_at: 'yesterday' }] },
    (input: SnapshotInput) => { input.crosswalk[0].textPatterns = ['['] },
    (input: SnapshotInput) => { input.sources.modelsDev.files.api.bytes = -1 },
    (input: SnapshotInput) => { input.sources.modelsDev.files.api.fetchedAt = 'unknown' },
    (input: SnapshotInput) => { input.sources.arena.files.text.fetchedAt = 'unknown' },
    (input: SnapshotInput) => { input.sources.arena.files.webdev.fetchedAt = 'unknown' },
    (input: SnapshotInput) => { input.fx.as_of = 'unknown' },
  ]) {
    const dataDir = await tempDir(t)
    const preserved = await lastGood(dataDir)
    const input = fixture(); corrupt(input)
    const result = await runSnapshot({ source: source(input), now, dataDir })
    assert.equal(result.status, 'failed')
    assert.ok(result.report.hardFailures.length > 0)
    await preserved()
  }
})

test('staging write failures preserve last good and remove partial output', async t => {
  const dataDir = await tempDir(t)
  const preserved = await lastGood(dataDir)
  const writeFile = fs.writeFile
  t.mock.method(fs, 'writeFile', async (...args: Parameters<typeof fs.writeFile>) => {
    if (String(args[0]).includes('tmp-snapshot-') && String(args[0]).endsWith('offers.json')) throw new Error('disk full')
    return await writeFile(...args)
  })
  const result = await runSnapshot({ source: source(), now, dataDir })
  assert.equal(result.status, 'failed')
  assert.match(result.report.hardFailures.join('\n'), /publish: disk full/)
  await preserved()
})

test('promotion failures roll back both latest and schemas, including a first publication', async t => {
  for (const existing of [true, false]) {
    const dataDir = await tempDir(t)
    const preserved = existing ? await lastGood(dataDir) : null
    const rename = fs.rename
    const mock = t.mock.method(fs, 'rename', async (...args: Parameters<typeof fs.rename>) => {
      if (String(args[0]).includes('tmp-snapshot-') && path.basename(String(args[0])) === 'latest') {
        throw new Error('promotion denied')
      }
      return await rename(...args)
    })
    try {
      const result = await runSnapshot({ source: source(), now, dataDir })
      assert.equal(result.status, 'failed')
      assert.match(result.report.hardFailures.join('\n'), /publish: promotion denied/)
      if (preserved) await preserved()
      else assert.deepEqual(await fs.readdir(dataDir), ['validation-report.json'])
    } finally { mock.mock.restore() }
  }
})

test('retains previous files for recovery if the filesystem also rejects rollback', async t => {
  const dataDir = await tempDir(t)
  await lastGood(dataDir)
  const rename = fs.rename
  t.mock.method(fs, 'rename', async (...args: Parameters<typeof fs.rename>) => {
    const name = path.basename(String(args[0]))
    if (String(args[0]).includes('tmp-snapshot-') && (name === 'latest' || name === 'previous-schema')) {
      throw new Error('filesystem denied rename')
    }
    return await rename(...args)
  })
  const result = await runSnapshot({ source: source(), now, dataDir })
  assert.equal(result.status, 'failed')
  assert.match(result.report.hardFailures.join('\n'), /backups retained/)
  const staging = (await fs.readdir(dataDir)).find(name => name.startsWith('tmp-snapshot-'))!
  assert.equal(await fs.readFile(path.join(dataDir, staging, 'previous-schema/old.json'), 'utf8'), 'previous schema\n')
  assert.equal(await fs.readFile(path.join(dataDir, 'latest/old.json'), 'utf8'), 'previous latest\n')
})

// Valid zero-row Parquet: PAR1, compact-Thrift metadata (one root schema, no row groups), length, PAR1.
const emptyParquet = Buffer.from('504152311502191c4806736368656d611500001600190c001400000050415231', 'hex')

async function cachedSource(dataDir: string) {
  const input = fixture()
  const files = [
    ['raw/models-dev/api.json', JSON.stringify(input.catalog), input.sources.modelsDev.files.api.url],
    ['raw/models-dev/models.json', '{}', input.sources.modelsDev.files.models!.url],
    ['raw/arena/text-latest.parquet', emptyParquet, input.sources.arena.files.text.url],
    ['raw/arena/webdev-latest.parquet', emptyParquet, input.sources.arena.files.webdev.url],
  ] as const
  for (const [name, bytes, url] of files) {
    const file = path.join(dataDir, name)
    await fs.mkdir(path.dirname(file), { recursive: true })
    await fs.writeFile(file, bytes)
    await fs.writeFile(`${file}.metadata.json`, JSON.stringify({
      url, hash: hash(bytes), bytes: Buffer.byteLength(bytes), fetchedAt: '2026-10-20T00:00:00.000Z',
    }))
  }
  await fs.mkdir(path.join(dataDir, 'crosswalk'))
  for (const [name, value] of Object.entries({
    'launch-set.yml': input.launch, 'crosswalk/arena.yml': input.crosswalk,
    'crosswalk/aa.yml': input.aaCrosswalk, 'fx.yml': input.fx,
  })) await fs.writeFile(path.join(dataDir, name), JSON.stringify(value))
  return files
}

test('production source uses durable fetch times even when cache mtime changes', async t => {
  const dataDir = await tempDir(t)
  const files = await cachedSource(dataDir)
  const backend = createSnapshotSource({ dataDir, offline: true })
  const first = await runSnapshot({ source: backend, now, dataDir })
  assert.equal(first.status, 'passed', first.report.hardFailures.join('\n'))
  for (const [name] of files) await fs.utimes(path.join(dataDir, name), now, now)
  const second = await runSnapshot({ source: backend, now, dataDir })
  assert.deepEqual(second, first)
  if (second.status === 'passed') {
    assert.equal(second.manifest.sources.modelsDev.files.api.fetchedAt, '2026-10-20T00:00:00.000Z')
    assert.equal(second.manifest.freshness.modelsDev.stale, true)
  }
})

test('recovers missing metadata only from a Manifest whose source hash matches', async t => {
  const dataDir = await tempDir(t)
  const files = await cachedSource(dataDir)
  const backend = createSnapshotSource({ dataDir, offline: true })
  const first = await runSnapshot({ source: backend, now, dataDir })
  assert.equal(first.status, 'passed')
  for (const [name] of files) await fs.rm(path.join(dataDir, `${name}.metadata.json`))
  const recovered = await backend.load(now)
  assert.equal(recovered.sources.modelsDev.files.api.fetchedAt, '2026-10-20T00:00:00.000Z')
  await fs.writeFile(path.join(dataDir, files[0][0]), JSON.stringify({ ...fixture().catalog, extra: {} }))
  const unknown = await backend.load(now)
  assert.equal(unknown.sources.modelsDev.files.api.fetchedAt, '1970-01-01T00:00:00.000Z')
  assert.match(unknown.warnings!.join('\n'), /fetch time unknown/)
})

test('import is inert and the CLI can fail offline from any working directory', async t => {
  const dataDir = await tempDir(t)
  await execFile(process.execPath, ['--import', import.meta.resolve('tsx'), '--input-type=module', '-e',
    `await import(${JSON.stringify(new URL('../../scripts/snapshot.ts', import.meta.url).href)})`,
  ], { cwd: dataDir })
  assert.deepEqual(await fs.readdir(dataDir), [])
  const preserved = await lastGood(dataDir)
  await assert.rejects(execFile(process.execPath, ['--import', import.meta.resolve('tsx'),
    fileURLToPath(new URL('../../scripts/pipeline.ts', import.meta.url)), '--offline', '--data-dir', dataDir,
  ], { cwd: os.tmpdir() }), (error: unknown) => {
    const failure = error as Error & { code: number; stderr: string }
    assert.equal(failure.code, 1)
    assert.match(failure.stderr, /missing and --offline was used/)
    return true
  })
  await preserved()
})

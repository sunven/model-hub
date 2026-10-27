import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  ARENA_TEXT_URL,
  ARENA_WEBDEV_URL,
  DATA_DIR,
  LATEST_DIR,
  MODELS_DEV_API_URL,
  MODELS_DEV_MODELS_URL,
  RAW_ARENA,
  RAW_MODELS,
  ensureRaw,
  fileInfo,
  loadModelsDev,
  makeSnapshotId,
  parseCliOptions,
  readAaCrosswalk,
  readCrosswalk,
  readFx,
  readLaunchSet,
  readOverrides,
  refreshFx,
} from './fetch'
import { buildModelsData } from './models'
import { buildArenaData } from './arena'
import { applyOverrides } from './overrides'
import { generateJsonSchemas, manifestSchema, modelVersionSchema, offerSchema, overrideEntrySchema, scoreSchema, unmatchedSchema, validateSchema, validationReportSchema } from './schema'
import { validateSnapshot } from './validate'
import type { FreshnessCheck, Manifest, ModelVersion, Offer, OverrideEntry, ValidationReport } from './types'

async function writeJson(file: string, value: unknown): Promise<string> {
  const content = JSON.stringify(value, null, 2) + '\n'
  await writeFile(file, content)
  return createHash('sha256').update(content).digest('hex')
}

async function promote(tmpDir: string, latestDir: string): Promise<void> {
  const prev = `${latestDir}.prev`
  await rm(prev, { recursive: true, force: true })
  const hadLatest = existsSync(latestDir)
  if (hadLatest) await rename(latestDir, prev)
  try {
    await rename(tmpDir, latestDir)
    await rm(prev, { recursive: true, force: true })
  } catch (err) {
    if (hadLatest && existsSync(prev) && !existsSync(latestDir)) {
      await rename(prev, latestDir)
    }
    throw err
  }
}

function ageHours(iso: string, now = Date.now()): number {
  const time = Date.parse(iso)
  if (!Number.isFinite(time)) return Number.POSITIVE_INFINITY
  return Math.max(0, Math.round(((now - time) / 3_600_000) * 10) / 10)
}

function freshnessCheck(fetchedAt: string, thresholdHours: number, now: number): FreshnessCheck {
  const age = ageHours(fetchedAt, now)
  return { fetchedAt, ageHours: age, thresholdHours, stale: age > thresholdHours }
}

async function main(): Promise<void> {
  const opts = parseCliOptions(process.argv.slice(2))
  await ensureRaw(opts)

  const currentFx = await readFx()
  const { fx, warning: fxWarning } = await refreshFx(currentFx, opts)
  const { entries: rawOverrides, hash: overrideHash } = await readOverrides()
  const parsedOverrides = overrideEntrySchema.array().safeParse(rawOverrides)
  const overrideSchemaFailures = parsedOverrides.success
    ? []
    : parsedOverrides.error.issues.map(issue => `schema overrides.yml: ${issue.path.join('.') || '(root)'} ${issue.message}`)
  const overrideEntries: OverrideEntry[] = parsedOverrides.success ? parsedOverrides.data : []

  const launch = await readLaunchSet()
  const crosswalk = await readCrosswalk()
  const aaCrosswalk = await readAaCrosswalk()
  const catalog = await loadModelsDev()
  const snapshotId = await makeSnapshotId()

  console.log(`snapshot ${snapshotId}`)
  const baseBuilt = buildModelsData(catalog, launch, snapshotId, aaCrosswalk)
  const overrideResult = applyOverrides(baseBuilt.models, baseBuilt.offers, overrideEntries, overrideHash ?? '')
  const built: { models: ModelVersion[]; offers: Offer[]; warnings: string[] } = {
    models: overrideResult.models,
    offers: overrideResult.offers,
    warnings: [...baseBuilt.warnings, ...overrideResult.warnings],
  }
  const modelIds = new Set(built.models.map(m => m.id))
  const arena = await buildArenaData({
    textFile: path.join(RAW_ARENA, 'text-latest.parquet'),
    webdevFile: path.join(RAW_ARENA, 'webdev-latest.parquet'),
    crosswalk,
    launch,
    modelIds,
  })

  const report: ValidationReport = validateSnapshot({
    snapshotId,
    launch,
    models: built.models,
    offers: built.offers,
    scores: arena.scores,
    unmatched: arena.unmatched,
    fx,
  })
  report.hardFailures.push(...arena.hardFailures, ...overrideResult.hardFailures, ...overrideSchemaFailures)
  report.warnings.push(...built.warnings, ...arena.warnings)
  if (fxWarning) report.warnings.push(fxWarning)
  report.stats.arena = arena.stats
  report.stats.overrides = {
    count: rawOverrides.length,
    applied: overrideResult.applied.length,
    hash: overrideHash,
  }
  validateSchema(modelVersionSchema.array(), built.models, 'models.json', report.hardFailures)
  validateSchema(offerSchema.array(), built.offers, 'offers.json', report.hardFailures)
  validateSchema(scoreSchema.array(), arena.scores, 'scores.json', report.hardFailures)
  validateSchema(unmatchedSchema.array(), arena.unmatched, 'unmatched.json', report.hardFailures)
  validateSchema(validationReportSchema, report, 'validation-report.json', report.hardFailures)
  report.status = report.hardFailures.length ? 'failed' : 'passed'

  if (report.status === 'failed') {
    await mkdir(DATA_DIR, { recursive: true })
    await writeFile(path.join(DATA_DIR, 'validation-report.json'), JSON.stringify(report, null, 2) + '\n')
    console.error('\nVALIDATION FAILED')
    for (const f of report.hardFailures.slice(0, 80)) console.error(`- ${f}`)
    if (report.hardFailures.length > 80) console.error(`... ${report.hardFailures.length - 80} more`)
    console.error('\nlatest was not updated. Report: data/validation-report.json')
    process.exitCode = 1
    return
  }

  const tmpDir = path.join(DATA_DIR, `tmp-${snapshotId}`)
  await rm(tmpDir, { recursive: true, force: true })
  await mkdir(tmpDir, { recursive: true })

  const files: Record<string, string> = {}
  files['models.json'] = await writeJson(path.join(tmpDir, 'models.json'), built.models)
  files['offers.json'] = await writeJson(path.join(tmpDir, 'offers.json'), built.offers)
  files['scores.json'] = await writeJson(path.join(tmpDir, 'scores.json'), arena.scores)
  files['unmatched.json'] = await writeJson(path.join(tmpDir, 'unmatched.json'), arena.unmatched)
  files['validation-report.json'] = await writeJson(path.join(tmpDir, 'validation-report.json'), report)

  const apiRaw = await fileInfo(path.join(RAW_MODELS, 'api.json'))
  const modelsRaw = existsSync(path.join(RAW_MODELS, 'models.json'))
    ? await fileInfo(path.join(RAW_MODELS, 'models.json'))
    : null
  const textRaw = await fileInfo(path.join(RAW_ARENA, 'text-latest.parquet'))
  const webdevRaw = await fileInfo(path.join(RAW_ARENA, 'webdev-latest.parquet'))

  const now = Date.now()
  const arenaFetchedAt =
    Date.parse(textRaw.fetchedAt) <= Date.parse(webdevRaw.fetchedAt) ? textRaw.fetchedAt : webdevRaw.fetchedAt
  const fxAgeDays = Number.isFinite(Date.parse(fx.as_of))
    ? Math.max(0, Math.floor((now - Date.parse(fx.as_of)) / 86_400_000))
    : 999_999

  const manifest: Manifest = {
    snapshotId,
    generatedAt: new Date().toISOString(),
    sources: {
      modelsDev: {
        license: 'MIT',
        url: MODELS_DEV_API_URL,
        files: {
          api: { url: MODELS_DEV_API_URL, hash: apiRaw.hash, fetchedAt: apiRaw.fetchedAt, bytes: apiRaw.bytes },
          ...(modelsRaw ? { models: { url: MODELS_DEV_MODELS_URL, hash: modelsRaw.hash, fetchedAt: modelsRaw.fetchedAt, bytes: modelsRaw.bytes } } : {}),
        },
      },
      arena: {
        license: 'CC BY 4.0',
        attribution: 'LMArena Leaderboard Dataset (lmarena-ai/leaderboard-dataset)',
        filters: { text: 'category=overall', webdev: 'category=webdev' },
        files: {
          text: { url: ARENA_TEXT_URL, hash: textRaw.hash, fetchedAt: textRaw.fetchedAt, bytes: textRaw.bytes },
          webdev: { url: ARENA_WEBDEV_URL, hash: webdevRaw.hash, fetchedAt: webdevRaw.fetchedAt, bytes: webdevRaw.bytes },
        },
      },
    },
    fx,
    counts: {
      models: built.models.length,
      offers: built.offers.length,
      scores: arena.scores.length,
      unmatched: arena.unmatched.length,
    },
    files,
    overrides: {
      count: rawOverrides.length,
      hash: overrideHash,
      applied: overrideResult.applied,
    },
    crosswalk: {
      verified: crosswalk.filter(c => c.confidence === 'verified').length,
      tentative: crosswalk.filter(c => c.confidence === 'tentative').length,
      none: crosswalk.filter(c => c.confidence === 'none').length,
    },
    aaLinks: {
      verified: aaCrosswalk.filter(c => c.verified && c.aaUrl).length,
      unverified: aaCrosswalk.filter(c => !c.verified || !c.aaUrl).length,
    },
    freshness: {
      modelsDev: freshnessCheck(apiRaw.fetchedAt, 48, now),
      arena: freshnessCheck(arenaFetchedAt, 72, now),
      fx: { asOf: fx.as_of, ageDays: fxAgeDays, thresholdDays: 14, stale: fxAgeDays > 14 },
    },
    validation: { status: 'passed', report: 'validation-report.json' },
    notes: [
      'Local pipeline run. Site deployment is out of scope for this step.',
      `models.dev snapshot fetchedAt=${apiRaw.fetchedAt}`,
      `Arena text/webdev fetchedAt=${textRaw.fetchedAt}/${webdevRaw.fetchedAt}`,
      'Arena text filtered to category=overall; webdev filtered to category=webdev; latest publish date, highest vote_count per model/org.',
      'No AA data embedded; AA links are external-only.',
      `FX ${fx.usd_to_cny} ${fx.as_of} from ${fx.source}.`,
      `Overrides: ${rawOverrides.length} entries, ${overrideResult.applied.length} applied.`,
      'Output JSON Schema lives in data/schema and is validated before promotion.',
    ],
  }
  const manifestFailures: string[] = []
  validateSchema(manifestSchema, manifest, 'manifest.json', manifestFailures)
  if (manifestFailures.length) {
    report.status = 'failed'
    report.hardFailures.push(...manifestFailures)
    await writeFile(path.join(DATA_DIR, 'validation-report.json'), JSON.stringify(report, null, 2) + '\n')
    console.error('\nVALIDATION FAILED (manifest)')
    for (const failure of manifestFailures) console.error(`- ${failure}`)
    console.error('\nlatest was not updated. Report: data/validation-report.json')
    process.exitCode = 1
    return
  }

  await writeJson(path.join(tmpDir, 'manifest.json'), manifest)

  const schemaDir = path.join(DATA_DIR, 'schema')
  await mkdir(schemaDir, { recursive: true })
  for (const [file, schema] of Object.entries(generateJsonSchemas())) {
    await writeFile(path.join(schemaDir, file), JSON.stringify(schema, null, 2) + '\n')
  }

  await promote(tmpDir, LATEST_DIR)

  console.log('\nPASSED')
  console.log(`models=${built.models.length} offers=${built.offers.length} scores=${arena.scores.length} unmatched=${arena.unmatched.length}`)
  console.log(`scores by board: text=${report.stats.byBoard.text} webdev=${report.stats.byBoard.webdev}`)
  console.log(`models with/without scores: ${report.stats.modelsWithScores}/${report.stats.modelsWithoutScores}`)
  console.log(`warnings: ${report.warnings.length} (see data/latest/validation-report.json)`)
  if (report.warnings.length) {
    for (const w of report.warnings.slice(0, 12)) console.log(`  - ${w}`)
    if (report.warnings.length > 12) console.log(`  ... ${report.warnings.length - 12} more`)
  }
  console.log(`\nwrote ${path.relative(process.cwd(), LATEST_DIR)}`)
}

await main()

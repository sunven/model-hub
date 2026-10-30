import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { buildModelsData } from './models'
import { buildArenaData } from './arena'
import { applyOverrides } from './overrides'
import { publishSnapshot } from './publish-snapshot'
import { generateJsonSchemas, manifestSchema, overrideEntrySchema, validateSchema, validationReportSchema, validateSnapshot } from '../lib/snapshot'
import type { FxConfig, Manifest, ModelVersion, Offer, OverrideEntry, ValidationReport } from '../lib/snapshot'
import { snapshotFreshness } from '../lib/freshness'
import type { AaCrosswalkEntry, CrosswalkEntry, LaunchEntry, RawCatalog } from './types'

export interface SnapshotInput {
  catalog: RawCatalog
  launch: LaunchEntry[]
  crosswalk: CrosswalkEntry[]
  aaCrosswalk: AaCrosswalkEntry[]
  overrides: { entries: unknown[]; hash: string | null }
  fx: FxConfig
  sources: Manifest['sources']
  arenaRows: { text: Record<string, unknown>[]; webdev: Record<string, unknown>[] }
  warnings?: string[]
}

export interface SnapshotSource {
  load(now: Date): Promise<SnapshotInput>
}

export type SnapshotResult =
  | { status: 'passed'; report: ValidationReport; manifest: Manifest }
  | { status: 'failed'; report: ValidationReport; manifest: null }

function json(value: unknown): string {
  return JSON.stringify(value, null, 2) + '\n'
}

async function makeSnapshotId(input: SnapshotInput, now: Date): Promise<string> {
  const hash = createHash('sha256')
  // Hash the recipe as well as its inputs; no manually maintained pipeline version.
  for (const file of ['snapshot.ts', 'fetch.ts', 'publish-snapshot.ts', 'models.ts', 'arena.ts', 'overrides.ts', 'config.ts', '../lib/snapshot.ts', '../lib/freshness.ts', '../package-lock.json']) {
    hash.update(file).update(await readFile(new URL(file, import.meta.url)))
  }
  const { warnings, sources, ...content } = input
  const sourceHashes = {
    api: sources.modelsDev.files.api.hash,
    models: sources.modelsDev.files.models?.hash ?? null,
    text: sources.arena.files.text.hash,
    webdev: sources.arena.files.webdev.hash,
  }
  hash.update(JSON.stringify({ ...content, sourceHashes }, (_key, value) => {
    if (typeof value === 'bigint') return { bigint: value.toString() }
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]]))
    }
    return value
  }))
  return `${now.toISOString().slice(0, 10).replace(/-/g, '')}-${hash.digest('hex').slice(0, 8)}`
}

/**
 * Importing this module performs no work. Calls publish on success and save a report on failure.
 * Use one writer per dataDir. Source, build, and publication errors return status=failed;
 * errors that prevent saving the failure report reject the promise.
 */
export async function runSnapshot({ source, now = new Date(), dataDir }: {
  source: SnapshotSource
  now?: Date
  dataDir: string
}): Promise<SnapshotResult> {
  // Capture the supplied instant; the source cannot change the clock used by later stages.
  now = new Date(now.getTime())
  const generatedAt = now.toISOString()
  let snapshotId = 'unavailable'
  let phase = 'source'
  let report: ValidationReport = { status: 'failed', hardFailures: [], warnings: [], stats: {}, generatedAt, snapshotId }
  async function failed(report: ValidationReport): Promise<SnapshotResult> {
    await mkdir(dataDir, { recursive: true })
    await writeFile(path.join(dataDir, 'validation-report.json'), json(report))
    return { status: 'failed', report, manifest: null }
  }
  try {
    const input = await source.load(new Date(now.getTime()))
    const { catalog, launch, crosswalk, aaCrosswalk, fx, overrides: overrideFile } = input
    phase = 'build'
    const { entries: rawOverrides, hash: overrideHash } = overrideFile
    const overrideSchemaFailures: string[] = []
    const overrideEntries: OverrideEntry[] =
      validateSchema(overrideEntrySchema.array(), rawOverrides, 'overrides.yml', overrideSchemaFailures) ?? []

    snapshotId = await makeSnapshotId(input, now)

    const baseBuilt = buildModelsData(catalog, launch, snapshotId, aaCrosswalk)
    const overrideResult = applyOverrides(baseBuilt.models, baseBuilt.offers, overrideEntries, overrideHash ?? '')
    const built: { models: ModelVersion[]; offers: Offer[]; warnings: string[] } = {
      models: overrideResult.models,
      offers: overrideResult.offers,
      warnings: [...baseBuilt.warnings, ...overrideResult.warnings],
    }
    const modelIds = new Set(built.models.map(m => m.id))
    const arena = buildArenaData({
      textRows: input.arenaRows.text,
      webdevRows: input.arenaRows.webdev,
      crosswalk,
      launch,
      modelIds,
    })

    report = validateSnapshot({
      now: now.getTime(),
      snapshotId,
      expectedCanonicalIds: launch.map(entry => entry.canonicalId),
      models: built.models,
      offers: built.offers,
      scores: arena.scores,
      unmatched: arena.unmatched,
      fx,
    })
    report.hardFailures.push(...arena.hardFailures, ...overrideResult.hardFailures, ...overrideSchemaFailures)
    report.warnings.push(...built.warnings, ...arena.warnings)
    report.warnings.push(...(input.warnings ?? []))
    report.stats.arena = arena.stats
    report.stats.overrides = {
      count: rawOverrides.length,
      applied: overrideResult.applied.length,
      hash: overrideHash,
    }
    validateSchema(validationReportSchema, report, 'validation-report.json', report.hardFailures)
    report.status = report.hardFailures.length ? 'failed' : 'passed'

    if (report.status === 'failed') return await failed(report)

    const files: Record<string, string> = {}
    const snapshot: Record<string, string> = {}
    for (const [name, value] of Object.entries({
      'models.json': built.models,
      'offers.json': built.offers,
      'scores.json': arena.scores,
      'unmatched.json': arena.unmatched,
      'validation-report.json': report,
    })) {
      const content = json(value)
      snapshot[name] = content
      files[name] = createHash('sha256').update(content).digest('hex')
    }
    const apiRaw = input.sources.modelsDev.files.api
    const textRaw = input.sources.arena.files.text
    const webdevRaw = input.sources.arena.files.webdev
    phase = 'manifest'
    const manifest: Manifest = {
      snapshotId,
      generatedAt: now.toISOString(),
      sources: input.sources,
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
      freshness: snapshotFreshness({
        modelsDev: apiRaw.fetchedAt,
        arena: [textRaw.fetchedAt, webdevRaw.fetchedAt],
        fx: fx.as_of,
      }, now.getTime()),
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
      return await failed(report)
    }
    snapshot['manifest.json'] = json(manifest)
    const schemas = Object.fromEntries(Object.entries(generateJsonSchemas()).map(([name, schema]) => [name, json(schema)]))
    phase = 'publish'
    await publishSnapshot(dataDir, snapshot, schemas)
    return { status: 'passed', report, manifest }
  } catch (error) {
    report.status = 'failed'
    report.snapshotId = snapshotId
    report.hardFailures.push(`${phase}: ${error instanceof Error ? error.message : String(error)}`)
    return await failed(report)
  }
}

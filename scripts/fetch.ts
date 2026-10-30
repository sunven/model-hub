import { createHash } from 'node:crypto'
import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parse, stringify } from 'yaml'
import { asyncBufferFromFile, parquetReadObjects } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import { FRESHNESS_POLICY } from '../lib/freshness'
import { manifestSchema, sourceFileSchema } from '../lib/snapshot'
import type { FxConfig, SourceFile } from '../lib/snapshot'
import type { SnapshotSource } from './snapshot'
import type { RawCatalog, LaunchEntry, CrosswalkEntry, AaCrosswalkEntry } from './types'

const execFile = promisify(execFileCallback)
const MODELS_DEV_API_URL = 'https://models.dev/api.json'
const MODELS_DEV_MODELS_URL = 'https://models.dev/models.json'
const ARENA_TEXT_URL = 'https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset/resolve/main/text/latest-00000-of-00001.parquet'
const ARENA_WEBDEV_URL = 'https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset/resolve/main/webdev/latest-00000-of-00001.parquet'
const FX_URL = 'https://api.frankfurter.dev/v1/latest?base=USD&symbols=CNY'
const UNKNOWN_FETCH_TIME = '1970-01-01T00:00:00.000Z'

async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, 'utf8')) as T
}

async function readYaml<T>(file: string): Promise<T> {
  return parse(await readFile(file, 'utf8')) as T
}

async function exists(file: string): Promise<boolean> {
  try { await access(file); return true }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return false
    throw error
  }
}

async function writeAtomic(file: string, content: string | Buffer): Promise<void> {
  const tmp = `${file}.part`
  try {
    await writeFile(tmp, content)
    await rename(tmp, file)
  } finally {
    await rm(tmp, { force: true })
  }
}

async function download(url: string, dest: string): Promise<void> {
  await mkdir(path.dirname(dest), { recursive: true })
  const tmp = `${dest}.part`
  try {
    await execFile('curl', [
      '--http1.1', '-fsSL', '--retry', '5', '--retry-delay', '2', '--max-time', '240', '-o', tmp, url,
    ])
    await rename(tmp, dest)
  } catch (error) {
    throw new Error(`download failed: ${url}\n${(error as Error).message.slice(0, 500)}`)
  } finally {
    await rm(tmp, { force: true })
  }
}

async function refreshFx(file: string, current: FxConfig, now: Date): Promise<{ fx: FxConfig; warning?: string }> {
  try {
    const { stdout } = await execFile('curl', [
      '--http1.1', '-fsSL', '--retry', '3', '--retry-delay', '2', '--max-time', '30', FX_URL,
    ])
    const payload = JSON.parse(stdout) as { date?: string; rates?: { CNY?: number } }
    const rate = payload.rates?.CNY
    const date = payload.date
    if (typeof rate !== 'number' || !Number.isFinite(rate) || rate <= 0 || !date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error('unexpected FX response shape')
    }
    const fx: FxConfig = {
      usd_to_cny: Math.round(rate * 10000) / 10000,
      as_of: date,
      source: 'ECB reference rate via Frankfurter',
      source_url: FX_URL,
      fetched_at: now.toISOString(),
    }
    await writeAtomic(file,
      '# USD→CNY display-only conversion, fetched from the ECB reference rate via Frankfurter.\n' +
      `# The pipeline refreshes this on --refresh; CNY is hidden when as_of is older than ${FRESHNESS_POLICY.fx.thresholdDays} days.\n` + stringify(fx))
    return { fx }
  } catch (error) {
    return {
      fx: current,
      warning: `FX refresh failed; kept existing ${current.as_of} rate (${current.usd_to_cny}): ${(error as Error).message.slice(0, 240)}`,
    }
  }
}

async function readParquet(file: string): Promise<Record<string, unknown>[]> {
  return await parquetReadObjects({ file: await asyncBufferFromFile(file), compressors })
}

/** Downloads or reuses cached sources. No I/O occurs until load is called. */
export function createSnapshotSource({ dataDir, refresh = false, offline = false, log = () => {} }: {
  dataDir: string
  refresh?: boolean
  offline?: boolean
  log?: (message: string) => void
}): SnapshotSource {
  dataDir = path.resolve(dataDir)
  return {
    async load(now) {
      const rawModels = path.join(dataDir, 'raw/models-dev')
      const rawArena = path.join(dataDir, 'raw/arena')
      const files = [
        { key: 'api', file: path.join(rawModels, 'api.json'), url: MODELS_DEV_API_URL, label: 'models.dev api.json' },
        { key: 'models', file: path.join(rawModels, 'models.json'), url: MODELS_DEV_MODELS_URL, label: 'models.dev models.json' },
        { key: 'text', file: path.join(rawArena, 'text-latest.parquet'), url: ARENA_TEXT_URL, label: 'Arena text latest' },
        { key: 'webdev', file: path.join(rawArena, 'webdev-latest.parquet'), url: ARENA_WEBDEV_URL, label: 'Arena webdev latest' },
      ] as const
      const previous = manifestSchema.safeParse(await readJson(path.join(dataDir, 'latest/manifest.json')).catch(() => null))
      const previousFiles = previous.success ? {
        api: previous.data.sources.modelsDev.files.api,
        models: previous.data.sources.modelsDev.files.models,
        text: previous.data.sources.arena.files.text,
        webdev: previous.data.sources.arena.files.webdev,
      } : null
      const settled = await Promise.allSettled(files.map(async ({ key, file, url, label }): Promise<{ info: SourceFile; warning?: string }> => {
        const cached = await exists(file)
        if (!cached && offline) throw new Error(`${label} missing and --offline was used: ${file}`)
        if (!offline && (refresh || !cached)) {
          log(`downloading ${url}`)
          await download(url, file)
          const bytes = await readFile(file)
          const info: SourceFile = {
            url, hash: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, fetchedAt: now.toISOString(),
          }
          await writeAtomic(`${file}.metadata.json`, JSON.stringify(info, null, 2) + '\n')
          return { info }
        }
        log(`using cached ${label}`)
        const bytes = await readFile(file)
        const hash = createHash('sha256').update(bytes).digest('hex')
        const stored = sourceFileSchema.safeParse(await readJson(`${file}.metadata.json`).catch(() => null))
        const known = stored.success && stored.data.hash === hash && stored.data.url === url
          ? stored.data : previousFiles?.[key]
        const fetchedAt = known?.hash === hash && known.url === url && Number.isFinite(Date.parse(known.fetchedAt))
          ? known.fetchedAt : UNKNOWN_FETCH_TIME
        return {
          info: { url, hash, bytes: bytes.length, fetchedAt },
          ...(fetchedAt === UNKNOWN_FETCH_TIME
            ? { warning: `${label}: fetch time unknown for cached hash ${hash}; treating it as stale. Refresh to record provenance.` }
            : {}),
        }
      }))
      // Wait for every acquisition before returning a failure; no download may outlive this run.
      const metadata = settled.map(result => {
        if (result.status === 'rejected') throw result.reason
        return result.value
      })
      const fxFile = path.join(dataDir, 'fx.yml')
      const currentFx = await readYaml<FxConfig>(fxFile)
      // Start the FX request before parsing the large local sources.
      const fxRefresh = refresh && !offline ? refreshFx(fxFile, currentFx, now) : null
      const [launch, crosswalk, aaCrosswalk, catalog, textRows, webdevRows, overrideBytes] = await Promise.all([
        readYaml<LaunchEntry[]>(path.join(dataDir, 'launch-set.yml')),
        readYaml<CrosswalkEntry[]>(path.join(dataDir, 'crosswalk/arena.yml')),
        readYaml<AaCrosswalkEntry[]>(path.join(dataDir, 'crosswalk/aa.yml')),
        readJson<RawCatalog>(files[0].file),
        readParquet(files[2].file),
        readParquet(files[3].file),
        readFile(path.join(dataDir, 'overrides/overrides.yml')).catch(error => {
          if (error.code === 'ENOENT') return null
          throw error
        }),
      ])
      const entries = overrideBytes ? parse(overrideBytes.toString('utf8')) ?? [] : []
      if (!Array.isArray(entries)) throw new Error('data/overrides/overrides.yml must contain a YAML array')
      const { fx, warning } = fxRefresh ? await fxRefresh : { fx: currentFx }
      const [api, models, text, webdev] = metadata.map(item => item.info)
      return {
        catalog, launch, crosswalk, aaCrosswalk, fx,
        overrides: { entries, hash: overrideBytes ? createHash('sha256').update(overrideBytes).digest('hex') : null },
        arenaRows: { text: textRows, webdev: webdevRows },
        sources: {
          modelsDev: { license: 'MIT', url: MODELS_DEV_API_URL, files: { api, models } },
          arena: {
            license: 'CC BY 4.0', attribution: 'LMArena Leaderboard Dataset (lmarena-ai/leaderboard-dataset)',
            filters: { text: 'category=overall', webdev: 'category=webdev' }, files: { text, webdev },
          },
        },
        warnings: [...metadata.flatMap(item => item.warning ? [item.warning] : []), ...(warning ? [warning] : [])],
      }
    },
  }
}

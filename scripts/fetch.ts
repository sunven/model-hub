import { createHash } from 'node:crypto'
import { execFile as execFileCallback } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, readFile, rename, rm, stat } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { parse } from 'yaml'
import type { RawCatalog, LaunchEntry, CrosswalkEntry, AaCrosswalkEntry, FxConfig } from './types'

const execFile = promisify(execFileCallback)

export const ROOT = process.cwd()
export const RAW_MODELS = path.join(ROOT, 'data/raw/models-dev')
export const RAW_ARENA = path.join(ROOT, 'data/raw/arena')
export const DATA_DIR = path.join(ROOT, 'data')
export const LATEST_DIR = path.join(DATA_DIR, 'latest')

export const MODELS_DEV_API_URL = 'https://models.dev/api.json'
export const MODELS_DEV_MODELS_URL = 'https://models.dev/models.json'
export const ARENA_TEXT_URL = 'https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset/resolve/main/text/latest-00000-of-00001.parquet'
export const ARENA_WEBDEV_URL = 'https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset/resolve/main/webdev/latest-00000-of-00001.parquet'

export interface CliOptions {
  refresh: boolean
  offline: boolean
}

export function parseCliOptions(argv: string[]): CliOptions {
  return {
    refresh: argv.includes('--refresh'),
    offline: argv.includes('--offline'),
  }
}

async function downloadWithCurl(url: string, dest: string): Promise<void> {
  await mkdir(path.dirname(dest), { recursive: true })
  const tmp = `${dest}.part`
  await rm(tmp, { force: true })
  try {
    console.log(`downloading ${url}`)
    await execFile('curl', [
      '--http1.1',
      '-fsSL',
      '--retry', '5',
      '--retry-delay', '2',
      '--max-time', '240',
      '-o', tmp,
      url,
    ])
    await rm(dest, { force: true })
    await rename(tmp, dest)
  } catch (err) {
    await rm(tmp, { force: true })
    throw new Error(`download failed: ${url}\n${((err as Error).message || '').slice(0, 500)}`)
  }
}

async function ensureFile(url: string, dest: string, opts: CliOptions, label: string): Promise<void> {
  const exists = existsSync(dest)
  if (opts.refresh || !exists) {
    if (opts.offline) {
      if (!exists) throw new Error(`${label} missing and --offline was used: ${dest}`)
      console.log(`using cached ${label}`)
      return
    }
    await downloadWithCurl(url, dest)
  } else {
    console.log(`using cached ${label}`)
  }
  if (!existsSync(dest)) throw new Error(`${label} not available: ${dest}`)
}

export async function ensureRaw(opts: CliOptions): Promise<void> {
  await ensureFile(MODELS_DEV_API_URL, path.join(RAW_MODELS, 'api.json'), opts, 'models.dev api.json')
  await ensureFile(MODELS_DEV_MODELS_URL, path.join(RAW_MODELS, 'models.json'), opts, 'models.dev models.json')
  await ensureFile(ARENA_TEXT_URL, path.join(RAW_ARENA, 'text-latest.parquet'), opts, 'Arena text latest')
  await ensureFile(ARENA_WEBDEV_URL, path.join(RAW_ARENA, 'webdev-latest.parquet'), opts, 'Arena webdev latest')
}

export async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, 'utf8')) as T
}

export async function readYaml<T>(file: string): Promise<T> {
  return parse(await readFile(file, 'utf8')) as T
}

export async function readLaunchSet(): Promise<LaunchEntry[]> {
  return await readYaml<LaunchEntry[]>(path.join(DATA_DIR, 'launch-set.yml'))
}

export async function readCrosswalk(): Promise<CrosswalkEntry[]> {
  return await readYaml<CrosswalkEntry[]>(path.join(DATA_DIR, 'crosswalk/arena.yml'))
}

export async function readAaCrosswalk(): Promise<AaCrosswalkEntry[]> {
  return await readYaml<AaCrosswalkEntry[]>(path.join(DATA_DIR, 'crosswalk/aa.yml'))
}

export async function readFx(): Promise<FxConfig> {
  return await readYaml<FxConfig>(path.join(DATA_DIR, 'fx.yml'))
}

export async function fileInfo(file: string): Promise<{ path: string; hash: string; fetchedAt: string; bytes: number }> {
  const buf = await readFile(file)
  const st = await stat(file)
  return {
    path: file,
    hash: createHash('sha256').update(buf).digest('hex'),
    fetchedAt: st.mtime.toISOString(),
    bytes: st.size,
  }
}

export async function makeSnapshotId(): Promise<string> {
  const PIPELINE_VERSION = '2026-10-27.2'
  const files = [
    path.join(RAW_MODELS, 'api.json'),
    path.join(RAW_MODELS, 'models.json'),
    path.join(RAW_ARENA, 'text-latest.parquet'),
    path.join(RAW_ARENA, 'webdev-latest.parquet'),
    path.join(DATA_DIR, 'launch-set.yml'),
    path.join(DATA_DIR, 'crosswalk/arena.yml'),
    path.join(DATA_DIR, 'crosswalk/aa.yml'),
    path.join(DATA_DIR, 'fx.yml'),
  ]
  const hash = createHash('sha256')
  hash.update(PIPELINE_VERSION)
  for (const file of files) {
    if (existsSync(file)) hash.update(await readFile(file))
  }
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `${date}-${hash.digest('hex').slice(0, 8)}`
}

export async function loadModelsDev(): Promise<RawCatalog> {
  return await readJson<RawCatalog>(path.join(RAW_MODELS, 'api.json'))
}

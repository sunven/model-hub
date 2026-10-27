import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { parse } from 'yaml'
import { asyncBufferFromFile, parquetReadObjects } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'

type Launch = { canonicalId: string; name: string; lab: string; status: string; openWeights: boolean }

const ROOT = new URL('..', import.meta.url)
const RAW = new URL('data/raw/arena/', ROOT)

const SOURCES = {
  text: 'https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset/resolve/main/text/latest-00000-of-00001.parquet',
  webdev: 'https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset/resolve/main/webdev/latest-00000-of-00001.parquet',
} as const

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '')
}
function baseName(s: string): string {
  return s.replace(/\s*\([^)]*\)\s*$/, '').trim()
}
function tokens(s: string): string[] {
  return s.toLowerCase().split(/[^a-z0-9.]+/).filter(Boolean)
}

async function download(name: keyof typeof SOURCES) {
  await mkdir(RAW, { recursive: true })
  const path = new URL(`${name}-latest.parquet`, RAW)
  if (existsSync(path)) return path
  console.log(`downloading ${name}...`)
  const res = await fetch(SOURCES[name])
  if (!res.ok) throw new Error(`download ${name}: ${res.status}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await writeFile(path, buf)
  return path
}

async function readRows(name: keyof typeof SOURCES): Promise<any[]> {
  const path = await download(name)
  const file = await asyncBufferFromFile(path.pathname)
  return await parquetReadObjects({ file, compressors })
}

const launch = parse(await readFile(new URL('data/launch-set.yml', ROOT), 'utf8')) as Launch[]
const text = await readRows('text')
const webdev = await readRows('webdev')

console.log('rows', { text: text.length, webdev: webdev.length })
for (const [name, rows] of [['text', text], ['webdev', webdev]] as const) {
  const cats = new Map<string, number>()
  for (const r of rows) cats.set(r.category, (cats.get(r.category) ?? 0) + 1)
  console.log(name, 'categories', [...cats.entries()].sort((a, b) => b[1] - a[1]))
}

// unique base names per board
const boardNames = {
  text: [...new Set(text.map(r => String(r.model_name)))],
  webdev: [...new Set(webdev.map(r => String(r.model_name)))],
}
console.log('unique text names', boardNames.text.length, 'unique webdev names', boardNames.webdev.length)

for (const m of launch) {
  const n = norm(m.name)
  const t = tokens(m.name).filter(x => x.length > 1)
  const candidates = new Set<string>()
  for (const name of boardNames.text) {
    const nb = norm(baseName(name))
    if (nb === n || nb.startsWith(n) || n.startsWith(nb) || t.every(x => name.toLowerCase().includes(x))) {
      candidates.add(name)
    }
  }
  const webCandidates = new Set<string>()
  for (const name of boardNames.webdev) {
    const nb = norm(baseName(name))
    if (nb === n || nb.startsWith(n) || n.startsWith(nb) || t.every(x => name.toLowerCase().includes(x))) {
      webCandidates.add(name)
    }
  }
  console.log(`\n## ${m.canonicalId} | ${m.name} | ${m.lab}`)
  console.log('text:', [...candidates].slice(0, 12).join(' | ') || '(none)')
  console.log('webdev:', [...webCandidates].slice(0, 12).join(' | ') || '(none)')
}

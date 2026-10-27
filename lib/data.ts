import modelsJson from '@/data/latest/models.json'
import offersJson from '@/data/latest/offers.json'
import scoresJson from '@/data/latest/scores.json'
import unmatchedJson from '@/data/latest/unmatched.json'
import manifestJson from '@/data/latest/manifest.json'
import type { FxConfig } from '@/scripts/types'
import { buildCatalog } from './catalog'
import { modelHref } from './site'
import type {
  Board,
  LeaderboardRow,
  Manifest,
  ModelVersion,
  Offer,
  Score,
  UnmatchedEntry,
} from './types'

const models = modelsJson as unknown as ModelVersion[]
const offers = offersJson as unknown as Offer[]
const scores = scoresJson as unknown as Score[]
const unmatched = unmatchedJson as unknown as UnmatchedEntry[]

export const manifest = manifestJson as unknown as Manifest
export const fx = manifest.fx as FxConfig
export const catalog = buildCatalog({ models, offers, scores })

function dateOnly(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

export const modelsDevDate = dateOnly(manifest.sources.modelsDev.files.api.fetchedAt)

export function arenaDate(board: Board): string {
  return dateOnly(manifest.sources.arena.files[board].fetchedAt)
}

const modelById = new Map(catalog.index.map(model => [model.id, model]))

export function leaderboardRows(board: Board): LeaderboardRow[] {
  const rows: LeaderboardRow[] = []
  for (const score of scores.filter(s => s.board === board)) {
    const model = modelById.get(score.modelVersionId)
    if (!model) continue
    rows.push({
      id: score.id,
      kind: 'model',
      rank: score.rank,
      name: model.name,
      lab: model.lab,
      rating: score.rating,
      ciLow: score.ciLow,
      ciHigh: score.ciHigh,
      condition: score.condition,
      votes: score.votes,
      href: modelHref(model.canonicalId),
    })
  }
  for (const entry of unmatched.filter(u => u.board === board)) {
    rows.push({
      id: entry.id,
      kind: 'unmatched',
      rank: entry.rank,
      name: entry.modelName,
      lab: entry.organization,
      rating: entry.rating,
      ciLow: entry.ciLow,
      ciHigh: entry.ciHigh,
      condition: entry.condition,
      votes: entry.votes,
      href: null,
    })
  }
  return rows.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
}

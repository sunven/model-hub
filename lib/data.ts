import modelsJson from '@/data/latest/models.json'
import offersJson from '@/data/latest/offers.json'
import scoresJson from '@/data/latest/scores.json'
import unmatchedJson from '@/data/latest/unmatched.json'
import manifestJson from '@/data/latest/manifest.json'
import type { FxConfig } from '@/scripts/types'
import type {
  Board,
  LeaderboardRow,
  Manifest,
  ModelIndexEntry,
  ModelRow,
  ModelVersion,
  Offer,
  PriceSummary,
  Score,
  ScoreView,
  UnmatchedEntry,
} from './types'
import { compareOffers } from './offers'
import { modelHref } from './site'

export const models = modelsJson as unknown as ModelVersion[]
export const offers = offersJson as unknown as Offer[]
export const scores = scoresJson as unknown as Score[]
export const unmatched = unmatchedJson as unknown as UnmatchedEntry[]
export const manifest = manifestJson as unknown as Manifest
export const fx = manifest.fx as FxConfig

function dateOnly(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10)
}

export const modelsDevDate = dateOnly(manifest.sources.modelsDev.files.api.fetchedAt)

export function arenaDate(board: Board): string {
  return dateOnly(manifest.sources.arena.files[board].fetchedAt)
}

const modelById = new Map(models.map(m => [m.id, m]))
const offersByModel = new Map<string, Offer[]>()
for (const offer of offers) {
  const list = offersByModel.get(offer.modelVersionId) ?? []
  list.push(offer)
  offersByModel.set(offer.modelVersionId, list)
}
const scoresByModel = new Map<string, Score[]>()
for (const score of scores) {
  const list = scoresByModel.get(score.modelVersionId) ?? []
  list.push(score)
  scoresByModel.set(score.modelVersionId, list)
}

function scoreView(score: Score | undefined): ScoreView | null {
  if (!score) return null
  return {
    rating: score.rating,
    ciLow: score.ciLow,
    ciHigh: score.ciHigh,
    rank: score.rank,
    votes: score.votes,
    condition: score.condition,
  }
}

export function primaryScore(modelId: string, board: 'text' | 'webdev'): Score | null {
  const list = (scoresByModel.get(modelId) ?? []).filter(s => s.board === board)
  if (!list.length) return null
  const base = list.find(s => s.condition === 'default')
  if (base) return base
  return [...list].sort((a, b) => b.votes - a.votes || b.rating - a.rating || a.rank - b.rank)[0]
}

export function getModelScores(modelId: string): Score[] {
  return [...(scoresByModel.get(modelId) ?? [])].sort((a, b) =>
    a.board.localeCompare(b.board) || a.rank - b.rank || a.condition.localeCompare(b.condition),
  )
}

export function getModelOffers(modelId: string): Offer[] {
  return [...(offersByModel.get(modelId) ?? [])].sort(compareOffers)
}

function summarizePrice(modelOffers: Offer[]): PriceSummary | null {
  const primary = modelOffers.filter(o => o.providerKind !== 'gateway')
  const pricedPrimary = primary.filter(o => o.price != null && o.price.input != null && o.price.output != null)
  const priced = pricedPrimary.length
    ? pricedPrimary
    : modelOffers.filter(o => o.price != null && o.price.input != null && o.price.output != null)
  if (!priced.length) return null
  const inputs = priced.map(o => o.price!.input!) as number[]
  const outputs = priced.map(o => o.price!.output!) as number[]
  return {
    inputMin: Math.min(...inputs),
    inputMax: Math.max(...inputs),
    outputMin: Math.min(...outputs),
    outputMax: Math.max(...outputs),
    gatewayOnly: pricedPrimary.length === 0,
  }
}

function bestContext(modelOffers: Offer[]): number | null {
  const primary = modelOffers.filter(o => o.providerKind !== 'gateway' && o.limits.context != null)
  const list = primary.length ? primary : modelOffers.filter(o => o.limits.context != null)
  if (!list.length) return null
  return Math.max(...list.map(o => o.limits.context!))
}

function bestOutputLimit(modelOffers: Offer[]): number | null {
  const primary = modelOffers.filter(o => o.providerKind !== 'gateway' && o.limits.output != null)
  const list = primary.length ? primary : modelOffers.filter(o => o.limits.output != null)
  if (!list.length) return null
  return Math.max(...list.map(o => o.limits.output!))
}

export const modelRows: ModelRow[] = models.map(m => {
  const modelOffers = offersByModel.get(m.id) ?? []
  const providerNames = [...new Set(modelOffers.filter(o => o.providerKind !== 'gateway').map(o => o.providerName))]
    .sort((a, b) => a.localeCompare(b))
  return {
    id: m.id,
    canonicalId: m.canonicalModelId,
    name: m.name,
    lab: m.lab,
    availability: m.availability,
    releaseBadges: m.releaseBadges,
    openWeights: m.openWeights,
    reasoningLabel: m.reasoningLabel,
    context: bestContext(modelOffers),
    outputLimit: bestOutputLimit(modelOffers),
    releaseDate: m.releaseDate,
    price: summarizePrice(modelOffers),
    text: scoreView(primaryScore(m.id, 'text') ?? undefined),
    webdev: scoreView(primaryScore(m.id, 'webdev') ?? undefined),
    providerNames,
    gatewayOnly: providerNames.length === 0,
    unmarked: modelOffers.some(o => o.status === 'available_unmarked'),
  }
})

export const modelIndex: ModelIndexEntry[] = modelRows.map(m => ({
  id: m.id,
  canonicalId: m.canonicalId,
  name: m.name,
  lab: m.lab,
}))

export function getModelByParams(lab: string, model: string): ModelVersion | undefined {
  const canonical = `${lab}/${model}`
  return models.find(m => m.canonicalModelId === canonical)
}

export function topTextModels(limit: number): ModelRow[] {
  return modelRows
    .filter(model => model.text)
    .sort((a, b) => b.text!.rating - a.text!.rating)
    .slice(0, limit)
}

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
      href: modelHref(model.canonicalModelId),
    })
  }
  for (const u of unmatched.filter(u => u.board === board)) {
    rows.push({
      id: u.id,
      kind: 'unmatched',
      rank: u.rank,
      name: u.modelName,
      lab: u.organization,
      rating: u.rating,
      ciLow: u.ciLow,
      ciHigh: u.ciHigh,
      condition: u.condition,
      votes: u.votes,
      href: null,
    })
  }
  return rows.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
}

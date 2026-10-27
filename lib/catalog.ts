import { ciDomain } from './format'
import { compareOffers } from './offers'
import type {
  Board,
  BoardDomains,
  CiDomain,
  ModelIndexEntry,
  ModelRow,
  ModelVersion,
  Offer,
  PriceSummary,
  Score,
  ScoreView,
} from './types'

export interface ModelDetail {
  model: ModelVersion
  row: ModelRow
  offers: Offer[]
  textScores: Score[]
  webdevScores: Score[]
  textPrimary: Score | null
  webdevPrimary: Score | null
  textDomain: CiDomain | null
  webdevDomain: CiDomain | null
}

export interface Catalog {
  rows: ModelRow[]
  index: ModelIndexEntry[]
  domains: BoardDomains
  getDetail(canonicalId: string): ModelDetail | null
  topText(limit: number): ModelRow[]
}

export interface CatalogInput {
  models: ModelVersion[]
  offers: Offer[]
  scores: Score[]
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

function primaryScore(scores: Score[] | undefined, board: Board): Score | null {
  const list = (scores ?? []).filter(score => score.board === board)
  if (!list.length) return null
  const base = list.find(score => score.condition === 'default')
  if (base) return base
  return [...list].sort((a, b) => b.votes - a.votes || b.rating - a.rating || a.rank - b.rank)[0]
}

function sortScores(scores: Score[]): Score[] {
  return [...scores].sort(
    (a, b) =>
      a.board.localeCompare(b.board) ||
      a.rank - b.rank ||
      a.condition.localeCompare(b.condition),
  )
}

function bestLimit(offers: Offer[], pick: (offer: Offer) => number | null): number | null {
  const primary = offers.filter(offer => offer.providerKind !== 'gateway' && pick(offer) !== null)
  const candidates = primary.length ? primary : offers.filter(offer => pick(offer) !== null)
  if (!candidates.length) return null
  return Math.max(...candidates.map(offer => pick(offer)!))
}

type OfferSummary = Pick<
  ModelRow,
  'price' | 'context' | 'outputLimit' | 'providerNames' | 'gatewayOnly' | 'unmarked'
>

function summarizeOffers(offers: Offer[]): OfferSummary {
  const primary = offers.filter(offer => offer.providerKind !== 'gateway')
  const pricedPrimary = primary.filter(
    offer => offer.price != null && offer.price.input != null && offer.price.output != null,
  )
  const priced = pricedPrimary.length
    ? pricedPrimary
    : offers.filter(offer => offer.price != null && offer.price.input != null && offer.price.output != null)
  const price: PriceSummary | null = priced.length
    ? {
        inputMin: Math.min(...priced.map(offer => offer.price!.input!)),
        inputMax: Math.max(...priced.map(offer => offer.price!.input!)),
        outputMin: Math.min(...priced.map(offer => offer.price!.output!)),
        outputMax: Math.max(...priced.map(offer => offer.price!.output!)),
        gatewayOnly: pricedPrimary.length === 0,
      }
    : null
  const providerNames = [...new Set(primary.map(offer => offer.providerName))].sort((a, b) =>
    a.localeCompare(b),
  )

  return {
    price,
    context: bestLimit(offers, offer => offer.limits.context),
    outputLimit: bestLimit(offers, offer => offer.limits.output),
    providerNames,
    gatewayOnly: providerNames.length === 0,
    unmarked: offers.some(offer => offer.status === 'available_unmarked'),
  }
}

export function buildCatalog({ models, offers, scores }: CatalogInput): Catalog {
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

  const rows: ModelRow[] = models.map(model => {
    const summary = summarizeOffers(offersByModel.get(model.id) ?? [])
    return {
      id: model.id,
      canonicalId: model.canonicalModelId,
      name: model.name,
      lab: model.lab,
      family: model.family,
      availability: model.availability,
      releaseBadges: model.releaseBadges,
      openWeights: model.openWeights,
      reasoningLabel: model.reasoningLabel,
      context: summary.context,
      outputLimit: summary.outputLimit,
      releaseDate: model.releaseDate,
      price: summary.price,
      text: scoreView(primaryScore(scoresByModel.get(model.id), 'text') ?? undefined),
      webdev: scoreView(primaryScore(scoresByModel.get(model.id), 'webdev') ?? undefined),
      providerNames: summary.providerNames,
      gatewayOnly: summary.gatewayOnly,
      unmarked: summary.unmarked,
    }
  })
  const rowById = new Map(rows.map(row => [row.id, row]))
  const index: ModelIndexEntry[] = rows.map(row => ({
    id: row.id,
    canonicalId: row.canonicalId,
    name: row.name,
    lab: row.lab,
  }))
  const domains: BoardDomains = {
    text: ciDomain(rows.map(row => row.text)),
    webdev: ciDomain(rows.map(row => row.webdev)),
  }

  const detailByCanonical = new Map<string, ModelDetail>()
  for (const model of models) {
    const row = rowById.get(model.id)
    if (!row) continue
    const allScores = sortScores(scoresByModel.get(model.id) ?? [])
    detailByCanonical.set(model.canonicalModelId, {
      model,
      row,
      offers: [...(offersByModel.get(model.id) ?? [])].sort(compareOffers),
      textScores: allScores.filter(score => score.board === 'text'),
      webdevScores: allScores.filter(score => score.board === 'webdev'),
      textPrimary: primaryScore(scoresByModel.get(model.id), 'text'),
      webdevPrimary: primaryScore(scoresByModel.get(model.id), 'webdev'),
      textDomain: domains.text,
      webdevDomain: domains.webdev,
    })
  }

  return {
    rows,
    index,
    domains,
    getDetail: canonicalId => detailByCanonical.get(canonicalId) ?? null,
    topText: limit =>
      rows
        .filter(row => row.text)
        .sort((a, b) => b.text!.rating - a.text!.rating)
        .slice(0, limit),
  }
}

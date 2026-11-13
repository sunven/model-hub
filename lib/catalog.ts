import { hasCompletePrice } from './snapshot'
import { ciDomain } from './format'
import { compareOffers } from './offers'
import type { Board, ModelVersion, Offer, Score } from './snapshot'
import type { BoardDomains, CiDomain, ModelIndexEntry, ModelRow, PriceSummary, ScoreView } from './types'

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

function scoreView(score: Score | null | undefined): ScoreView | null {
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
  const pricedPrimary = primary.filter(hasCompletePrice)
  const priced = pricedPrimary.length
    ? pricedPrimary
    : offers.filter(hasCompletePrice)
  let price: PriceSummary | null = null
  if (priced.length) {
    let inputMin = Infinity, inputMax = -Infinity, outputMin = Infinity, outputMax = -Infinity
    for (const offer of priced) {
      const input = offer.price!.input!
      const output = offer.price!.output!
      if (input < inputMin) inputMin = input
      if (input > inputMax) inputMax = input
      if (output < outputMin) outputMin = output
      if (output > outputMax) outputMax = output
    }
    price = { inputMin, inputMax, outputMin, outputMax, gatewayOnly: pricedPrimary.length === 0 }
  }
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

  const primaries = new Map<string, { text: Score | null; webdev: Score | null }>()
  const rows: ModelRow[] = models.map(model => {
    const modelScores = scoresByModel.get(model.id)
    const textPrimary = primaryScore(modelScores, 'text')
    const webdevPrimary = primaryScore(modelScores, 'webdev')
    primaries.set(model.id, { text: textPrimary, webdev: webdevPrimary })
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
      text: scoreView(textPrimary),
      webdev: scoreView(webdevPrimary),
      providerNames: summary.providerNames,
      gatewayOnly: summary.gatewayOnly,
      unmarked: summary.unmarked,
    }
  })
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
  for (let i = 0; i < models.length; i++) {
    const model = models[i]
    const row = rows[i]
    const allScores = sortScores(scoresByModel.get(model.id) ?? [])
    const primary = primaries.get(model.id)!
    detailByCanonical.set(model.canonicalModelId, {
      model,
      row,
      offers: [...(offersByModel.get(model.id) ?? [])].sort(compareOffers),
      textScores: allScores.filter(score => score.board === 'text'),
      webdevScores: allScores.filter(score => score.board === 'webdev'),
      textPrimary: primary.text,
      webdevPrimary: primary.webdev,
      textDomain: domains.text,
      webdevDomain: domains.webdev,
    })
  }

  const textRanked = rows
    .filter(row => row.text)
    .sort((a, b) => b.text!.rating - a.text!.rating)

  return {
    rows,
    index,
    domains,
    getDetail: canonicalId => detailByCanonical.get(canonicalId) ?? null,
    topText: limit => textRanked.slice(0, limit),
  }
}

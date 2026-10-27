import type {
  FxConfig,
  LaunchEntry,
  ModelVersion,
  Offer,
  Score,
  UnmatchedEntry,
  ValidationReport,
} from './types'

function finite(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function ageDays(date: string): number | null {
  const t = Date.parse(date)
  if (!Number.isFinite(t)) return null
  return Math.floor((Date.now() - t) / 86_400_000)
}

export function validateSnapshot(args: {
  snapshotId: string
  launch: LaunchEntry[]
  models: ModelVersion[]
  offers: Offer[]
  scores: Score[]
  unmatched: UnmatchedEntry[]
  fx: FxConfig
}): ValidationReport {
  const hardFailures: string[] = []
  const warnings: string[] = []
  const { snapshotId, launch, models, offers, scores, unmatched, fx } = args

  if (models.length !== launch.length) {
    hardFailures.push(`model count ${models.length} !== launch count ${launch.length}`)
  }
  const modelIds = new Set<string>()
  const canonicalIds = new Set<string>()
  for (const m of models) {
    if (!m.id || modelIds.has(m.id)) hardFailures.push(`duplicate or empty model id: ${m.id}`)
    modelIds.add(m.id)
    if (!m.canonicalModelId || canonicalIds.has(m.canonicalModelId)) {
      hardFailures.push(`duplicate or empty canonicalModelId: ${m.canonicalModelId}`)
    }
    canonicalIds.add(m.canonicalModelId)
    if (!m.name || !m.lab) hardFailures.push(`model missing name/lab: ${m.id}`)
    if (m.availability === 'unknown') hardFailures.push(`model has unknown availability: ${m.id}`)
    if (m.availability === 'deprecated') warnings.push(`launch model is deprecated-only: ${m.id}`)
  }
  for (const entry of launch) {
    if (!canonicalIds.has(entry.canonicalId)) hardFailures.push(`launch canonicalId missing from models: ${entry.canonicalId}`)
  }

  const offerIds = new Set<string>()
  const offerStatusCounts = new Map<string, number>()
  const offerKindCounts = new Map<string, number>()
  for (const o of offers) {
    if (!o.id || offerIds.has(o.id)) hardFailures.push(`duplicate or empty offer id: ${o.id}`)
    offerIds.add(o.id)
    if (!modelIds.has(o.modelVersionId)) hardFailures.push(`offer references missing model: ${o.id} -> ${o.modelVersionId}`)
    if (!['first_party', 'cloud', 'gateway'].includes(o.providerKind)) hardFailures.push(`invalid providerKind: ${o.id}`)
    if (!['available_unmarked', 'beta', 'alpha', 'deprecated'].includes(o.status)) hardFailures.push(`invalid offer status: ${o.id}`)
    offerStatusCounts.set(o.status, (offerStatusCounts.get(o.status) ?? 0) + 1)
    offerKindCounts.set(o.providerKind, (offerKindCounts.get(o.providerKind) ?? 0) + 1)
    if (o.limits.context !== null) {
      if (!finite(o.limits.context) || o.limits.context <= 0) hardFailures.push(`invalid offer context: ${o.id}`)
      else if (o.limits.context < 1_000 || o.limits.context > 20_000_000) warnings.push(`unusual context for ${o.id}: ${o.limits.context}`)
    }
    if (o.price) {
      for (const [key, v] of Object.entries({ input: o.price.input, output: o.price.output, cacheRead: o.price.cacheRead, cacheWrite: o.price.cacheWrite })) {
        if (v !== null && (!finite(v) || v < 0)) hardFailures.push(`invalid price ${key} on ${o.id}: ${v}`)
      }
      if (!Array.isArray(o.price.tiers)) hardFailures.push(`invalid price tiers on ${o.id}`)
    }
  }

  const offersByModel = new Map<string, Offer[]>()
  for (const o of offers) {
    const list = offersByModel.get(o.modelVersionId) ?? []
    list.push(o)
    offersByModel.set(o.modelVersionId, list)
  }
  for (const m of models) {
    const list = offersByModel.get(m.id) ?? []
    if (!list.length && !m.openWeights) hardFailures.push(`model has no offers and no open weights: ${m.id}`)
    if (list.length && !list.some(o => o.price != null && o.price.input != null && o.price.output != null)) {
      warnings.push(`model has no priced offer: ${m.id}`)
    }
  }

  const scoreIds = new Set<string>()
  const byBoard = { text: 0, webdev: 0 }
  const modelsWithScores = new Set<string>()
  for (const s of scores) {
    if (!s.id || scoreIds.has(s.id)) hardFailures.push(`duplicate or empty score id: ${s.id}`)
    scoreIds.add(s.id)
    if (!modelIds.has(s.modelVersionId)) hardFailures.push(`score references missing model: ${s.id} -> ${s.modelVersionId}`)
    if (s.source !== 'arena_hf') hardFailures.push(`invalid score source: ${s.id}`)
    if (s.board !== 'text' && s.board !== 'webdev') hardFailures.push(`invalid score board: ${s.id}`)
    else byBoard[s.board]++
    if (!finite(s.rating)) hardFailures.push(`invalid rating on ${s.id}`)
    if (!finite(s.ciLow) || !finite(s.ciHigh)) hardFailures.push(`invalid CI on ${s.id}`)
    if (finite(s.rating) && finite(s.ciLow) && finite(s.ciHigh) && !(s.ciLow <= s.rating && s.rating <= s.ciHigh)) {
      hardFailures.push(`rating outside CI on ${s.id}`)
    }
    if (!finite(s.rank) || s.rank <= 0) hardFailures.push(`invalid rank on ${s.id}`)
    if (!finite(s.votes) || s.votes < 0) hardFailures.push(`invalid votes on ${s.id}`)
    if (!s.snapshotDate) hardFailures.push(`missing score date on ${s.id}`)
    if (!s.condition) hardFailures.push(`missing condition on ${s.id}`)
    modelsWithScores.add(s.modelVersionId)
  }
  for (const m of models) {
    if (!modelsWithScores.has(m.id)) warnings.push(`model has no Arena score: ${m.id}`)
  }

  const unmatchedIds = new Set<string>()
  for (const u of unmatched) {
    if (!u.id || unmatchedIds.has(u.id)) hardFailures.push(`duplicate or empty unmatched id: ${u.id}`)
    unmatchedIds.add(u.id)
    if (u.board !== 'text' && u.board !== 'webdev') hardFailures.push(`invalid unmatched board: ${u.id}`)
    if (!finite(u.rating) || !finite(u.ciLow) || !finite(u.ciHigh)) hardFailures.push(`invalid unmatched rating: ${u.id}`)
    if (!u.snapshotDate) hardFailures.push(`missing unmatched date: ${u.id}`)
  }

  if (!finite(fx.usd_to_cny) || fx.usd_to_cny <= 0) hardFailures.push(`invalid fx rate: ${fx.usd_to_cny}`)
  const fxAge = ageDays(fx.as_of)
  if (fxAge === null) hardFailures.push(`invalid fx as_of: ${fx.as_of}`)
  else if (fxAge > 14) warnings.push(`fx rate is ${fxAge} days old (>14); CNY should be hidden in UI`)

  const stats = {
    launchModels: launch.length,
    models: models.length,
    offers: offers.length,
    scores: scores.length,
    unmatched: unmatched.length,
    modelsWithScores: modelsWithScores.size,
    modelsWithoutScores: models.length - modelsWithScores.size,
    byBoard,
    offerStatusCounts: Object.fromEntries([...offerStatusCounts.entries()].sort()),
    offerKindCounts: Object.fromEntries([...offerKindCounts.entries()].sort()),
    availabilityCounts: Object.fromEntries(
      [...models.reduce((map, m) => map.set(m.availability, (map.get(m.availability) ?? 0) + 1), new Map<string, number>())].sort(),
    ),
    fxAgeDays: fxAge,
  }

  return {
    status: hardFailures.length ? 'failed' : 'passed',
    hardFailures,
    warnings,
    stats,
    generatedAt: new Date().toISOString(),
    snapshotId,
  }
}

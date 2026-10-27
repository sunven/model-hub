import { aaUrlSchema, hasCompletePrice } from '../lib/snapshot'
import type { ModelVersion, Offer, OfferStatus } from '../lib/snapshot'
import type { AaCrosswalkEntry, LaunchEntry, ModelBuildResult, RawCatalog, RawModel } from './types'
import {
  LAB_FIRST_PARTY_KEYS,
  availabilityFromStatuses,
  finiteNumber,
  modelVersionIdFromCanonical,
  offerId,
  providerKindForModel,
  reasoningLabelFromRow,
  sourceRefModelsDev,
  statusFromRaw,
} from './config'

interface Row {
  providerId: string
  providerName: string
  modelId: string
  model: RawModel
}

function completeness(row: Row): number {
  const m = row.model
  let score = 0
  if (m.description) score += 2
  if (m.limit?.context) score += 2
  if (m.cost?.input !== undefined || m.cost?.output !== undefined) score += 2
  if (m.reasoning) score += 1
  if (m.modalities?.output?.length) score += 1
  if (m.release_date) score += 1
  if (m.knowledge) score += 1
  return score
}

function pickSummary(rows: Row[], firstPartyKeys: string[]): Row | undefined {
  if (!rows.length) return undefined
  const firstParty = rows
    .filter(r => firstPartyKeys.includes(r.providerId))
    .sort((a, b) => completeness(b) - completeness(a) || a.providerId.localeCompare(b.providerId))
  if (firstParty.length) return firstParty[0]
  return [...rows].sort((a, b) => completeness(b) - completeness(a) || a.providerId.localeCompare(b.providerId))[0]
}

function pickReasoningRow(rows: Row[], summary: Row | undefined): Row | undefined {
  if (summary?.model.reasoning) return summary
  return rows.find(r => r.model.reasoning) ?? summary
}

function dedupeRows(rows: Row[]): Row[] {
  const bySignature = new Map<string, Row>()
  for (const row of rows) {
    const cost = row.model.cost
    const signature = JSON.stringify([
      row.providerId,
      cost ? [cost.input ?? null, cost.output ?? null, cost.cache_read ?? null, cost.cache_write ?? null, cost.tiers ?? []] : null,
      [row.model.limit?.context ?? null, row.model.limit?.input ?? null, row.model.limit?.output ?? null],
      row.model.status ?? null,
    ])
    const prev = bySignature.get(signature)
    if (!prev) {
      bySignature.set(signature, row)
      continue
    }
    const prevOptions = Array.isArray(prev.model.reasoning_options) ? prev.model.reasoning_options.length : 0
    const rowOptions = Array.isArray(row.model.reasoning_options) ? row.model.reasoning_options.length : 0
    if (
      rowOptions > prevOptions ||
      (rowOptions === prevOptions && row.modelId.length < prev.modelId.length) ||
      (rowOptions === prevOptions && row.modelId.length === prev.modelId.length && row.modelId.localeCompare(prev.modelId) < 0)
    ) {
      bySignature.set(signature, row)
    }
  }
  return [...bySignature.values()]
}

function buildOffer(row: Row, lab: string, modelVersionId: string, snapshotId: string, seen: Set<string>): Offer {
  const m = row.model
  const status = statusFromRaw(m.status)
  const cost = m.cost
  const hasPrice = cost && [cost.input, cost.output, cost.cache_read, cost.cache_write]
    .some(v => finiteNumber(v) !== null)
  const price = hasPrice
    ? {
        input: finiteNumber(cost?.input),
        output: finiteNumber(cost?.output),
        cacheRead: finiteNumber(cost?.cache_read),
        cacheWrite: finiteNumber(cost?.cache_write),
        currency: 'USD' as const,
        tiers: Array.isArray(cost?.tiers) ? cost.tiers : [],
      }
    : null
  let id = offerId(row.providerId, row.modelId)
  let n = 2
  while (seen.has(id)) id = `${offerId(row.providerId, row.modelId)}_${n++}`
  seen.add(id)
  return {
    id,
    modelVersionId,
    providerId: row.providerId,
    providerName: row.providerName || row.providerId,
    providerKind: providerKindForModel(row.providerId, lab),
    providerModelId: row.modelId,
    providerModelName: m.name ?? row.modelId,
    status,
    price,
    limits: {
      context: finiteNumber(m.limit?.context),
      input: finiteNumber(m.limit?.input),
      output: finiteNumber(m.limit?.output),
    },
    capabilities: {
      reasoning: Boolean(m.reasoning),
      reasoningOptions: Array.isArray(m.reasoning_options) ? m.reasoning_options : [],
      toolCall: Boolean(m.tool_call),
      structuredOutput: Boolean(m.structured_output),
      attachment: Boolean(m.attachment),
      temperature: Boolean(m.temperature),
      interleaved: m.interleaved ?? null,
    },
    sourceRefs: [sourceRefModelsDev(row.providerId, row.modelId)],
    snapshotId,
  }
}

export function buildModelsData(
  catalog: RawCatalog,
  launchSet: LaunchEntry[],
  snapshotId: string,
  aaCrosswalk: AaCrosswalkEntry[] = [],
): ModelBuildResult {
  const warnings: string[] = []
  const seenLaunch = new Set<string>()
  for (const entry of launchSet) {
    if (seenLaunch.has(entry.canonicalId)) warnings.push(`duplicate launch canonicalId: ${entry.canonicalId}`)
    seenLaunch.add(entry.canonicalId)
  }

  const aaById = new Map<string, string>()
  for (const entry of aaCrosswalk) {
    if (!seenLaunch.has(entry.canonicalId)) {
      warnings.push(`AA crosswalk canonicalId not in launch set: ${entry.canonicalId}`)
      continue
    }
    if (!entry.verified) {
      continue
    }
    if (!entry.aaUrl) {
      warnings.push(`AA crosswalk missing URL: ${entry.canonicalId}`)
      continue
    }
    if (!aaUrlSchema.safeParse(entry.aaUrl).success) {
      warnings.push(`AA crosswalk ignored (invalid URL): ${entry.canonicalId} -> ${entry.aaUrl}`)
      continue
    }
    if (aaById.has(entry.canonicalId)) {
      warnings.push(`duplicate AA crosswalk canonicalId: ${entry.canonicalId}`)
      continue
    }
    aaById.set(entry.canonicalId, entry.aaUrl)
  }

  const launchIds = new Set(launchSet.map(entry => entry.canonicalId))
  const rowsByCanonical = new Map<string, Row[]>()
  for (const [providerId, provider] of Object.entries(catalog)) {
    for (const [modelId, model] of Object.entries(provider.models ?? {})) {
      const canonical = model.canonical_model_id
      if (!canonical || !launchIds.has(canonical)) continue
      const rows = rowsByCanonical.get(canonical) ?? []
      rows.push({ providerId, providerName: provider.name ?? providerId, modelId, model })
      rowsByCanonical.set(canonical, rows)
    }
  }

  const models: ModelVersion[] = []
  const offers: Offer[] = []
  const seenOfferIds = new Set<string>()

  for (const entry of launchSet) {
    const rows = rowsByCanonical.get(entry.canonicalId) ?? []
    if (!rows.length) warnings.push(`launch model has no models.dev rows: ${entry.canonicalId}`)
    const summary = pickSummary(rows, LAB_FIRST_PARTY_KEYS[entry.lab] ?? [])
    const reasoningRow = pickReasoningRow(rows, summary)
    const modelVersionId = modelVersionIdFromCanonical(entry.canonicalId)
    const modelRows = dedupeRows(rows)
    const modelOffers = modelRows.map(row => buildOffer(row, entry.lab, modelVersionId, snapshotId, seenOfferIds))
    const statuses = modelOffers.map(o => o.status) as OfferStatus[]
    const availability = availabilityFromStatuses(statuses, modelOffers.length > 0, entry.openWeights)
    const badges = [...new Set(statuses.filter(s => s === 'beta' || s === 'alpha'))]

    if (summary?.model.open_weights !== undefined && Boolean(summary.model.open_weights) !== entry.openWeights) {
      warnings.push(`open_weights mismatch for ${entry.canonicalId}: launch=${entry.openWeights}, source=${summary.model.open_weights}`)
    }
    if (!modelOffers.length) warnings.push(`launch model has no offers: ${entry.canonicalId}`)
    if (modelOffers.length && !modelOffers.some(o => o.status !== 'deprecated')) {
      warnings.push(`launch model is deprecated-only: ${entry.canonicalId}`)
    }
    if (modelOffers.length && !modelOffers.some(hasCompletePrice)) {
      warnings.push(`launch model has no priced offer: ${entry.canonicalId}`)
    }

    models.push({
      id: modelVersionId,
      canonicalModelId: entry.canonicalId,
      name: entry.name,
      lab: entry.lab,
      family: summary?.model.family ?? null,
      releaseDate: summary?.model.release_date ?? null,
      knowledgeCutoff: summary?.model.knowledge ?? null,
      modalities: {
        input: Array.isArray(summary?.model.modalities?.input) ? summary.model.modalities.input : [],
        output: Array.isArray(summary?.model.modalities?.output) ? summary.model.modalities.output : [],
      },
      openWeights: entry.openWeights,
      description: summary?.model.description ?? null,
      aaUrl: aaById.get(entry.canonicalId) ?? null,
      availability,
      releaseBadges: badges,
      reasoningLabel: reasoningLabelFromRow(reasoningRow?.model),
      sourceRefs: [`models.dev:${entry.canonicalId}`],
      snapshotId,
    })
    offers.push(...modelOffers)
  }

  models.sort((a, b) => a.name.localeCompare(b.name, 'zh'))
  offers.sort((a, b) =>
    a.modelVersionId.localeCompare(b.modelVersionId) ||
    a.providerKind.localeCompare(b.providerKind) ||
    a.providerName.localeCompare(b.providerName),
  )

  return { models, offers, warnings }
}

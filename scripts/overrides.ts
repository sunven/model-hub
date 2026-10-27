import { availabilitySchema, modelVersionSchema, offerStatusSchema, priceSchema, providerKindSchema } from '../lib/snapshot'
import type { ModelVersion, Offer, OverrideAudit, OverrideEntry } from '../lib/snapshot'
import type { OverrideResult } from './types'

const MODEL_FIELDS = new Set([
  'name',
  'lab',
  'family',
  'releaseDate',
  'knowledgeCutoff',
  'openWeights',
  'aaUrl',
  'availability',
  'reasoningLabel',
])

const OFFER_FIELDS = new Set(['status', 'providerKind', 'price'])

const pricePatchSchema = priceSchema.omit({ currency: true }).partial().refine(
  patch => Object.values(patch).some(value => value !== undefined),
  'price override must contain at least one field',
)

function isIsoDate(value: unknown): boolean {
  return typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value) && !Number.isNaN(Date.parse(value))
}

function applyModelField(model: ModelVersion, field: string, value: unknown): string | null {
  switch (field) {
    case 'name':
    case 'lab':
    case 'reasoningLabel':
      if (typeof value !== 'string' || !value.trim()) return `expected non-empty string for ${field}`
      model[field] = value
      return null
    case 'family':
    case 'knowledgeCutoff':
      if (value !== null && typeof value !== 'string') return `expected string or null for ${field}`
      model[field] = value
      return null
    case 'releaseDate':
      if (value !== null && (typeof value !== 'string' || !isIsoDate(value))) {
        return 'expected YYYY-MM-DD string or null for releaseDate'
      }
      model.releaseDate = value as string | null
      return null
    case 'openWeights':
      if (typeof value !== 'boolean') return 'expected boolean for openWeights'
      model.openWeights = value
      return null
    case 'aaUrl': {
      const parsed = modelVersionSchema.shape.aaUrl.safeParse(value)
      if (!parsed.success) return 'expected https://artificialanalysis.ai/models/<slug> or null for aaUrl'
      model.aaUrl = parsed.data
      return null
    }
    case 'availability': {
      const parsed = availabilitySchema.safeParse(value)
      if (!parsed.success) return `expected one of ${availabilitySchema.options.join(', ')} for availability`
      model.availability = parsed.data
      return null
    }
    default:
      return `unallowed model field: ${field}`
  }
}

function applyPrice(offer: Offer, value: unknown): string | null {
  if (value === null) {
    offer.price = null
    return null
  }
  const parsed = pricePatchSchema.safeParse(value)
  if (!parsed.success) return parsed.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join('; ')
  const patch = parsed.data

  const base = offer.price ?? {
    input: null,
    output: null,
    cacheRead: null,
    cacheWrite: null,
    currency: 'USD' as const,
    tiers: [],
  }
  offer.price = {
    ...base,
    ...(patch.input !== undefined ? { input: patch.input } : {}),
    ...(patch.output !== undefined ? { output: patch.output } : {}),
    ...(patch.cacheRead !== undefined ? { cacheRead: patch.cacheRead } : {}),
    ...(patch.cacheWrite !== undefined ? { cacheWrite: patch.cacheWrite } : {}),
    ...(patch.tiers !== undefined ? { tiers: patch.tiers } : {}),
  }
  return null
}

function applyOfferField(offer: Offer, field: string, value: unknown): string | null {
  switch (field) {
    case 'status': {
      const parsed = offerStatusSchema.safeParse(value)
      if (!parsed.success) return `expected one of ${offerStatusSchema.options.join(', ')} for status`
      offer.status = parsed.data
      return null
    }
    case 'providerKind': {
      const parsed = providerKindSchema.safeParse(value)
      if (!parsed.success) return `expected one of ${providerKindSchema.options.join(', ')} for providerKind`
      offer.providerKind = parsed.data
      return null
    }
    case 'price':
      return applyPrice(offer, value)
    default:
      return `unallowed offer field: ${field}`
  }
}

export function applyOverrides(
  models: ModelVersion[],
  offers: Offer[],
  entries: OverrideEntry[],
  hash: string,
): OverrideResult {
  if (!entries.length) {
    return { models, offers, applied: [], warnings: [], hardFailures: [], count: 0, hash }
  }
  const nextModels = structuredClone(models)
  const nextOffers = structuredClone(offers)
  const modelByCanonical = new Map(nextModels.map(m => [m.canonicalModelId, m]))
  const modelById = new Map(nextModels.map(m => [m.id, m]))
  const offerById = new Map(nextOffers.map(o => [o.id, o]))
  const applied: OverrideAudit[] = []
  const warnings: string[] = []
  const hardFailures: string[] = []
  const seen = new Map<string, unknown>()

  for (const entry of entries) {
    const label = `${entry.target_type}:${entry.target_id}.${entry.field}`
    if (entry.target_type === 'model' && !MODEL_FIELDS.has(entry.field)) {
      hardFailures.push(`override ${label}: unallowed field`)
      continue
    }
    if (entry.target_type === 'offer' && !OFFER_FIELDS.has(entry.field)) {
      hardFailures.push(`override ${label}: unallowed field`)
      continue
    }

    const key = `${entry.target_type}:${entry.target_id}:${entry.field}`
    if (seen.has(key)) {
      const previous = seen.get(key)
      if (JSON.stringify(previous) !== JSON.stringify(entry.value)) {
        warnings.push(`override conflict for ${label}: later value ignored`)
      }
      continue
    }
    seen.set(key, entry.value)

    let target: ModelVersion | Offer | undefined
    if (entry.target_type === 'model') {
      target = modelByCanonical.get(entry.target_id) ?? modelById.get(entry.target_id)
    } else {
      target = offerById.get(entry.target_id)
    }
    if (!target) {
      warnings.push(`override target not found: ${label}`)
      continue
    }

    const error =
      entry.target_type === 'model'
        ? applyModelField(target as ModelVersion, entry.field, entry.value)
        : applyOfferField(target as Offer, entry.field, entry.value)
    if (error) {
      hardFailures.push(`override ${label}: ${error}`)
      continue
    }
    applied.push({
      targetType: entry.target_type,
      targetId: entry.target_id,
      field: entry.field,
      author: entry.author,
      createdAt: entry.created_at,
      reason: entry.reason,
      sourceUrl: entry.source_url ?? null,
    })
  }

  return {
    models: nextModels,
    offers: nextOffers,
    applied,
    warnings,
    hardFailures,
    count: entries.length,
    hash,
  }
}

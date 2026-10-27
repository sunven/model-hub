import type {
  ModelVersion,
  Offer,
  OverrideAudit,
  OverrideEntry,
  OverrideResult,
} from './types'

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

const AVAILABILITY = new Set(['available', 'deprecated', 'mixed', 'open_weights_only', 'unknown'])
const OFFER_STATUS = new Set(['available_unmarked', 'beta', 'alpha', 'deprecated'])
const PROVIDER_KIND = new Set(['first_party', 'cloud', 'gateway'])

function isAaUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'artificialanalysis.ai' || url.hostname === 'www.artificialanalysis.ai') &&
      /^\/models\/[^/]+\/?$/.test(url.pathname)
    )
  } catch {
    return false
  }
}

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
    case 'aaUrl':
      if (value !== null && !isAaUrl(value)) return 'expected https://artificialanalysis.ai/models/<slug> or null for aaUrl'
      model.aaUrl = value
      return null
    case 'availability':
      if (typeof value !== 'string' || !AVAILABILITY.has(value)) {
        return `expected one of ${[...AVAILABILITY].join(', ')} for availability`
      }
      model.availability = value as ModelVersion['availability']
      return null
    default:
      return `unallowed model field: ${field}`
  }
}

function applyPrice(offer: Offer, value: unknown): string | null {
  if (value === null) {
    offer.price = null
    return null
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return 'expected price object or null'
  }
  const patch = value as Record<string, unknown>
  const allowed = new Set(['input', 'output', 'cacheRead', 'cacheWrite', 'tiers'])
  for (const key of Object.keys(patch)) {
    if (!allowed.has(key)) return `unallowed price field: ${key}`
  }
  for (const key of ['input', 'output', 'cacheRead', 'cacheWrite'] as const) {
    const next = patch[key]
    if (next !== undefined && next !== null && (typeof next !== 'number' || !Number.isFinite(next) || next < 0)) {
      return `expected non-negative number or null for price.${key}`
    }
  }
  if (patch.tiers !== undefined && !Array.isArray(patch.tiers)) return 'expected array for price.tiers'
  if (patch.input === undefined && patch.output === undefined && patch.cacheRead === undefined && patch.cacheWrite === undefined && patch.tiers === undefined) {
    return 'price override must contain at least one field'
  }

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
    ...(patch.input !== undefined ? { input: patch.input as number | null } : {}),
    ...(patch.output !== undefined ? { output: patch.output as number | null } : {}),
    ...(patch.cacheRead !== undefined ? { cacheRead: patch.cacheRead as number | null } : {}),
    ...(patch.cacheWrite !== undefined ? { cacheWrite: patch.cacheWrite as number | null } : {}),
    ...(patch.tiers !== undefined ? { tiers: patch.tiers as unknown[] } : {}),
  }
  return null
}

function applyOfferField(offer: Offer, field: string, value: unknown): string | null {
  switch (field) {
    case 'status':
      if (typeof value !== 'string' || !OFFER_STATUS.has(value)) {
        return `expected one of ${[...OFFER_STATUS].join(', ')} for status`
      }
      offer.status = value as Offer['status']
      return null
    case 'providerKind':
      if (typeof value !== 'string' || !PROVIDER_KIND.has(value)) {
        return `expected one of ${[...PROVIDER_KIND].join(', ')} for providerKind`
      }
      offer.providerKind = value as Offer['providerKind']
      return null
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

import { z } from 'zod'

const stringArray = z.array(z.string())
const nullableNumber = z.number().finite().nullable()
const nullablePrice = z.number().finite().nonnegative().nullable()
const nullableString = z.string().nullable()

export const providerKindSchema = z.enum(['first_party', 'cloud', 'gateway'])
export const offerStatusSchema = z.enum(['available_unmarked', 'beta', 'alpha', 'deprecated'])
export const availabilitySchema = z.enum(['available', 'deprecated', 'mixed', 'open_weights_only', 'unknown'])
export const boardSchema = z.enum(['text', 'webdev'])
export const aaUrlSchema = z.string().url().regex(
  /^https:\/\/(?:www\.)?artificialanalysis\.ai\/models\/[A-Za-z0-9][A-Za-z0-9._-]*\/?(?:[?#].*)?$/,
  'AA URL must use https://artificialanalysis.ai/models/<slug>',
)

const modalitiesSchema = z.object({ input: stringArray, output: stringArray }).strict()

export const priceSchema = z
  .object({
    input: nullablePrice,
    output: nullablePrice,
    cacheRead: nullablePrice,
    cacheWrite: nullablePrice,
    currency: z.literal('USD'),
    tiers: z.array(z.unknown()),
  })
  .strict()

const limitsSchema = z
  .object({ context: z.number().finite().positive().nullable(), input: nullableNumber, output: nullableNumber })
  .strict()

const capabilitiesSchema = z
  .object({
    reasoning: z.boolean(),
    reasoningOptions: z.array(z.unknown()),
    toolCall: z.boolean(),
    structuredOutput: z.boolean(),
    attachment: z.boolean(),
    temperature: z.boolean(),
    interleaved: z.unknown().nullable(),
  })
  .strict()

export const modelVersionSchema = z
  .object({
    id: z.string().min(1),
    canonicalModelId: z.string().min(1),
    name: z.string().min(1),
    lab: z.string().min(1),
    family: nullableString,
    releaseDate: nullableString,
    knowledgeCutoff: nullableString,
    modalities: modalitiesSchema,
    openWeights: z.boolean(),
    description: nullableString,
    aaUrl: aaUrlSchema.nullable(),
    availability: availabilitySchema,
    releaseBadges: stringArray,
    reasoningLabel: z.string(),
    sourceRefs: stringArray,
    snapshotId: z.string(),
  })
  .strict()

export const offerSchema = z
  .object({
    id: z.string().min(1),
    modelVersionId: z.string().min(1),
    providerId: z.string().min(1),
    providerName: z.string().min(1),
    providerKind: providerKindSchema,
    providerModelId: z.string().min(1),
    providerModelName: z.string().min(1),
    status: offerStatusSchema,
    price: priceSchema.nullable(),
    limits: limitsSchema,
    capabilities: capabilitiesSchema,
    sourceRefs: stringArray,
    snapshotId: z.string(),
  })
  .strict()

export const scoreSchema = z
  .object({
    id: z.string().min(1),
    modelVersionId: z.string().min(1),
    source: z.literal('arena_hf'),
    board: boardSchema,
    condition: z.string().min(1),
    rating: z.number().finite(),
    ciLow: z.number().finite(),
    ciHigh: z.number().finite(),
    rank: z.number().int().positive(),
    votes: z.number().int().nonnegative(),
    snapshotDate: z.string().min(1),
    sourceRef: z.string(),
  })
  .strict()

export const unmatchedSchema = z
  .object({
    id: z.string().min(1),
    board: boardSchema,
    modelName: z.string(),
    organization: z.string(),
    condition: z.string().min(1),
    rating: z.number().finite(),
    ciLow: z.number().finite(),
    ciHigh: z.number().finite(),
    rank: z.number().int().positive(),
    votes: z.number().int().nonnegative(),
    snapshotDate: z.string().min(1),
    sourceRef: z.string(),
  })
  .strict()

export const overrideEntrySchema = z
  .object({
    target_type: z.enum(['model', 'offer']),
    target_id: z.string().min(1),
    field: z.string().min(1),
    value: z.unknown(),
    reason: z.string().min(1),
    author: z.string().min(1),
    created_at: z.iso.datetime(),
    source_url: z.string().url().nullable().optional(),
  })
  .strict()

export const sourceFileSchema = z
  .object({ url: z.string(), hash: z.string(), fetchedAt: z.string(), bytes: z.number().int().nonnegative() })
  .strict()

export const freshnessCheckSchema = z
  .object({
    fetchedAt: z.string(),
    ageHours: z.number().finite().nonnegative(),
    thresholdHours: z.number().positive(),
    stale: z.boolean(),
  })
  .strict()

export const fxSchema = z
  .object({
    usd_to_cny: z.number().finite().positive(),
    as_of: z.string(),
    source: z.string(),
    source_url: z.string().url().optional(),
    fetched_at: z.iso.datetime().optional(),
    reviewed_at: z.string().optional(),
  })
  .strict()

export const manifestSchema = z
  .object({
    snapshotId: z.string().min(1),
    generatedAt: z.iso.datetime(),
    sources: z
      .object({
        modelsDev: z.object({
          license: z.string(),
          url: z.string(),
          files: z.object({ api: sourceFileSchema, models: sourceFileSchema.optional() }),
        }),
        arena: z.object({
          license: z.string(),
          attribution: z.string(),
          filters: z.object({ text: z.string(), webdev: z.string() }),
          files: z.object({ text: sourceFileSchema, webdev: sourceFileSchema }),
        }),
      })
      .catchall(z.unknown()),
    fx: fxSchema,
    counts: z.object({
      models: z.number().int().nonnegative(),
      offers: z.number().int().nonnegative(),
      scores: z.number().int().nonnegative(),
      unmatched: z.number().int().nonnegative(),
    }),
    files: z.record(z.string(), z.string()),
    overrides: z.object({
      count: z.number().int().nonnegative(),
      hash: z.string().nullable(),
      applied: z.array(
        z.object({
          targetType: z.enum(['model', 'offer']),
          targetId: z.string(),
          field: z.string(),
          author: z.string(),
          createdAt: z.string(),
          reason: z.string(),
          sourceUrl: z.string().nullable(),
        }),
      ),
    }),
    crosswalk: z
      .object({ verified: z.number().int(), tentative: z.number().int(), none: z.number().int() })
      .optional(),
    aaLinks: z.object({ verified: z.number().int(), unverified: z.number().int() }).optional(),
    freshness: z.object({
      modelsDev: freshnessCheckSchema,
      arena: freshnessCheckSchema,
      fx: z.object({
        asOf: z.string(),
        ageDays: z.number().int().nonnegative(),
        thresholdDays: z.number().positive(),
        stale: z.boolean(),
      }),
    }),
    validation: z.object({ status: z.enum(['passed', 'failed']), report: z.string() }),
    notes: stringArray,
  })
  .strict()

export const validationReportSchema = z
  .object({
    status: z.enum(['passed', 'failed']),
    hardFailures: stringArray,
    warnings: stringArray,
    stats: z.record(z.string(), z.unknown()),
    generatedAt: z.iso.datetime(),
    snapshotId: z.string(),
  })
  .strict()

const outputSchemas = {
  'models.schema.json': modelVersionSchema.array(),
  'offers.schema.json': offerSchema.array(),
  'scores.schema.json': scoreSchema.array(),
  'unmatched.schema.json': unmatchedSchema.array(),
  'manifest.schema.json': manifestSchema,
  'overrides.schema.json': overrideEntrySchema.array(),
  'validation-report.schema.json': validationReportSchema,
} as const

export function generateJsonSchemas(): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(outputSchemas).map(([file, schema]) => [
      file,
      z.toJSONSchema(schema, { target: 'draft-2020-12' }),
    ]),
  )
}

export function validateSchema<T>(
  schema: z.ZodType<T>,
  value: unknown,
  label: string,
  hardFailures: string[],
): T | null {
  const parsed = schema.safeParse(value)
  if (parsed.success) return parsed.data
  for (const issue of parsed.error.issues.slice(0, 20)) {
    hardFailures.push(`schema ${label}: ${issue.path.join('.') || '(root)'} ${issue.message}`)
  }
  if (parsed.error.issues.length > 20) {
    hardFailures.push(`schema ${label}: ${parsed.error.issues.length - 20} more issue(s)`)
  }
  return null
}

export type ProviderKind = z.infer<typeof providerKindSchema>
export type OfferStatus = z.infer<typeof offerStatusSchema>
export type Availability = z.infer<typeof availabilitySchema>
export type Board = z.infer<typeof boardSchema>
export type ModelVersion = z.infer<typeof modelVersionSchema>
export type OfferPrice = z.infer<typeof priceSchema>
export type Offer = z.infer<typeof offerSchema>
export type Score = z.infer<typeof scoreSchema>
export type UnmatchedEntry = z.infer<typeof unmatchedSchema>
export type OverrideEntry = z.infer<typeof overrideEntrySchema>
export type OverrideTargetType = OverrideEntry['target_type']
export type Manifest = z.infer<typeof manifestSchema>
export type ManifestSources = Manifest['sources']
export type OverrideAudit = Manifest['overrides']['applied'][number]
export type FxConfig = z.infer<typeof fxSchema>
export type FreshnessCheck = z.infer<typeof freshnessCheckSchema>
export type SourceFile = z.infer<typeof sourceFileSchema>
export type ValidationReport = z.infer<typeof validationReportSchema>

/** A complete input/output price includes free (zero) prices. */
export function hasCompletePrice(offer: Offer): boolean {
  return offer.price != null && offer.price.input != null && offer.price.output != null
}

function ageDays(date: string, now: number): number | null {
  const t = Date.parse(date)
  if (!Number.isFinite(t)) return null
  return Math.floor((now - t) / 86_400_000)
}

export function validateSnapshot(args: {
  snapshotId: string
  now?: number
  expectedCanonicalIds: readonly string[]
  models: unknown
  offers: unknown
  scores: unknown
  unmatched: unknown
  fx: unknown
}): ValidationReport {
  const hardFailures: string[] = []
  const warnings: string[] = []
  const { snapshotId, expectedCanonicalIds, now = Date.now() } = args
  const models = validateSchema(modelVersionSchema.array(), args.models, 'models.json', hardFailures)
  const offers = validateSchema(offerSchema.array(), args.offers, 'offers.json', hardFailures)
  const scores = validateSchema(scoreSchema.array(), args.scores, 'scores.json', hardFailures)
  const unmatched = validateSchema(unmatchedSchema.array(), args.unmatched, 'unmatched.json', hardFailures)
  const fx = validateSchema(fxSchema, args.fx, 'fx', hardFailures)
  if (!models || !offers || !scores || !unmatched || !fx) {
    return { status: 'failed', hardFailures, warnings, stats: {}, generatedAt: new Date(now).toISOString(), snapshotId }
  }

  if (models.length !== expectedCanonicalIds.length) {
    hardFailures.push(`model count ${models.length} !== launch count ${expectedCanonicalIds.length}`)
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
    if (m.availability === 'unknown') hardFailures.push(`model has unknown availability: ${m.id}`)
    if (m.availability === 'deprecated') warnings.push(`launch model is deprecated-only: ${m.id}`)
  }
  for (const canonicalId of expectedCanonicalIds) {
    if (!canonicalIds.has(canonicalId)) hardFailures.push(`launch canonicalId missing from models: ${canonicalId}`)
  }

  const offerIds = new Set<string>()
  const offerStatusCounts = new Map<string, number>()
  const offerKindCounts = new Map<string, number>()
  for (const o of offers) {
    if (!o.id || offerIds.has(o.id)) hardFailures.push(`duplicate or empty offer id: ${o.id}`)
    offerIds.add(o.id)
    if (!modelIds.has(o.modelVersionId)) hardFailures.push(`offer references missing model: ${o.id} -> ${o.modelVersionId}`)
    offerStatusCounts.set(o.status, (offerStatusCounts.get(o.status) ?? 0) + 1)
    offerKindCounts.set(o.providerKind, (offerKindCounts.get(o.providerKind) ?? 0) + 1)
    if (o.limits.context !== null && (o.limits.context < 1_000 || o.limits.context > 20_000_000)) {
      warnings.push(`unusual context for ${o.id}: ${o.limits.context}`)
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
    if (list.length && !list.some(hasCompletePrice)) {
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
    byBoard[s.board]++
    if (!(s.ciLow <= s.rating && s.rating <= s.ciHigh)) {
      hardFailures.push(`rating outside CI on ${s.id}`)
    }
    modelsWithScores.add(s.modelVersionId)
  }
  for (const m of models) {
    if (!modelsWithScores.has(m.id)) warnings.push(`model has no Arena score: ${m.id}`)
  }

  const unmatchedIds = new Set<string>()
  for (const u of unmatched) {
    if (!u.id || unmatchedIds.has(u.id)) hardFailures.push(`duplicate or empty unmatched id: ${u.id}`)
    unmatchedIds.add(u.id)
    if (!(u.ciLow <= u.rating && u.rating <= u.ciHigh)) {
      hardFailures.push(`rating outside CI on ${u.id}`)
    }
  }

  const fxAge = ageDays(fx.as_of, now)
  if (fxAge === null) hardFailures.push(`invalid fx as_of: ${fx.as_of}`)
  else if (fxAge > 14) warnings.push(`fx rate is ${fxAge} days old (>14); CNY should be hidden in UI`)

  const stats = {
    launchModels: expectedCanonicalIds.length,
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
    generatedAt: new Date(now).toISOString(),
    snapshotId,
  }
}

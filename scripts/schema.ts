import { z } from 'zod'
import type {
  Manifest,
  ModelVersion,
  Offer,
  OverrideEntry,
  Score,
  UnmatchedEntry,
  ValidationReport,
} from './types'

const stringArray = z.array(z.string())
const nullableNumber = z.number().finite().nullable()
const nullableString = z.string().nullable()

const modalitiesSchema = z.object({ input: stringArray, output: stringArray }).strict()

const priceSchema = z
  .object({
    input: nullableNumber,
    output: nullableNumber,
    cacheRead: nullableNumber,
    cacheWrite: nullableNumber,
    currency: z.literal('USD'),
    tiers: z.array(z.unknown()),
  })
  .strict()

const limitsSchema = z
  .object({ context: nullableNumber, input: nullableNumber, output: nullableNumber })
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

export const modelVersionSchema: z.ZodType<ModelVersion> = z
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
    aaUrl: z
      .string()
      .url()
      .refine(
        value => {
          try {
            const url = new URL(value)
            return (
              url.protocol === 'https:' &&
              (url.hostname === 'artificialanalysis.ai' || url.hostname === 'www.artificialanalysis.ai')
            )
          } catch {
            return false
          }
        },
        { message: 'AA URL must use https://artificialanalysis.ai' },
      )
      .nullable(),
    availability: z.enum(['available', 'deprecated', 'mixed', 'open_weights_only', 'unknown']),
    releaseBadges: stringArray,
    reasoningLabel: z.string(),
    sourceRefs: stringArray,
    snapshotId: z.string(),
  })
  .strict()

export const offerSchema: z.ZodType<Offer> = z
  .object({
    id: z.string().min(1),
    modelVersionId: z.string().min(1),
    providerId: z.string().min(1),
    providerName: z.string().min(1),
    providerKind: z.enum(['first_party', 'cloud', 'gateway']),
    providerModelId: z.string().min(1),
    providerModelName: z.string().min(1),
    status: z.enum(['available_unmarked', 'beta', 'alpha', 'deprecated']),
    price: priceSchema.nullable(),
    limits: limitsSchema,
    capabilities: capabilitiesSchema,
    sourceRefs: stringArray,
    snapshotId: z.string(),
  })
  .strict()

export const scoreSchema: z.ZodType<Score> = z
  .object({
    id: z.string().min(1),
    modelVersionId: z.string().min(1),
    source: z.literal('arena_hf'),
    board: z.enum(['text', 'webdev']),
    condition: z.string(),
    rating: z.number().finite(),
    ciLow: z.number().finite(),
    ciHigh: z.number().finite(),
    rank: z.number().int().positive(),
    votes: z.number().int().nonnegative(),
    snapshotDate: z.string(),
    sourceRef: z.string(),
  })
  .strict()

export const unmatchedSchema: z.ZodType<UnmatchedEntry> = z
  .object({
    id: z.string().min(1),
    board: z.enum(['text', 'webdev']),
    modelName: z.string(),
    organization: z.string(),
    condition: z.string(),
    rating: z.number().finite(),
    ciLow: z.number().finite(),
    ciHigh: z.number().finite(),
    rank: z.number().int().positive(),
    votes: z.number().int().nonnegative(),
    snapshotDate: z.string(),
    sourceRef: z.string(),
  })
  .strict()

export const overrideEntrySchema: z.ZodType<OverrideEntry> = z
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

const fileInfoSchema = z
  .object({ url: z.string(), hash: z.string(), fetchedAt: z.string(), bytes: z.number().int().nonnegative() })
  .strict()

const freshnessCheckSchema = z
  .object({
    fetchedAt: z.string(),
    ageHours: z.number().finite().nonnegative(),
    thresholdHours: z.number().positive(),
    stale: z.boolean(),
  })
  .strict()

export const manifestSchema: z.ZodType<Manifest> = z
  .object({
    snapshotId: z.string().min(1),
    generatedAt: z.iso.datetime(),
    sources: z
      .object({
        modelsDev: z.object({
          license: z.string(),
          url: z.string(),
          files: z.object({ api: fileInfoSchema, models: fileInfoSchema.optional() }),
        }),
        arena: z.object({
          license: z.string(),
          attribution: z.string(),
          filters: z.object({ text: z.string(), webdev: z.string() }),
          files: z.object({ text: fileInfoSchema, webdev: fileInfoSchema }),
        }),
      })
      .catchall(z.unknown()),
    fx: z
      .object({
        usd_to_cny: z.number().finite().positive(),
        as_of: z.string(),
        source: z.string(),
        source_url: z.string().url().optional(),
        fetched_at: z.iso.datetime().optional(),
        reviewed_at: z.string().optional(),
      })
      .strict(),
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

export const validationReportSchema: z.ZodType<ValidationReport> = z
  .object({
    status: z.enum(['passed', 'failed']),
    hardFailures: stringArray,
    warnings: stringArray,
    stats: z.record(z.string(), z.unknown()),
    generatedAt: z.iso.datetime(),
    snapshotId: z.string(),
  })
  .strict()

export const outputSchemas = {
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

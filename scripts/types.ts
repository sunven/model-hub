export type ProviderKind = 'first_party' | 'cloud' | 'gateway'
export type OfferStatus = 'available_unmarked' | 'beta' | 'alpha' | 'deprecated'
export type Availability = 'available' | 'deprecated' | 'mixed' | 'open_weights_only' | 'unknown'
export type Board = 'text' | 'webdev'

export interface LaunchEntry {
  canonicalId: string
  name: string
  lab: string
  status: string
  openWeights: boolean
}

export interface CrosswalkEntry {
  canonicalId: string
  textPatterns: string[]
  webdevPatterns: string[]
  confidence: string
  notes?: string
}

export interface AaCrosswalkEntry {
  canonicalId: string
  aaUrl: string | null
  verified: boolean
  notes?: string
}

export interface FxConfig {
  usd_to_cny: number
  as_of: string
  source: string
  source_url?: string
  fetched_at?: string
  reviewed_at?: string
}

export type OverrideTargetType = 'model' | 'offer'

export interface OverrideEntry {
  target_type: OverrideTargetType
  target_id: string
  field: string
  value: unknown
  reason: string
  author: string
  created_at: string
  source_url?: string | null
}

export interface OverrideAudit {
  targetType: OverrideTargetType
  targetId: string
  field: string
  author: string
  createdAt: string
  reason: string
  sourceUrl: string | null
}

export interface OverrideResult {
  models: ModelVersion[]
  offers: Offer[]
  applied: OverrideAudit[]
  warnings: string[]
  hardFailures: string[]
  count: number
  hash: string
}

export interface RawModel {
  id?: string
  name?: string
  canonical_model_id?: string
  description?: string
  family?: string
  reasoning?: boolean
  reasoning_options?: any[]
  tool_call?: boolean
  structured_output?: boolean
  temperature?: boolean
  attachment?: boolean
  modalities?: { input?: string[]; output?: string[] }
  open_weights?: boolean
  limit?: { context?: number; input?: number; output?: number }
  cost?: { input?: number; output?: number; cache_read?: number; cache_write?: number; tiers?: any[]; [key: string]: any }
  release_date?: string
  last_updated?: string
  knowledge?: string
  status?: string | null
  type?: string | null
  interleaved?: any
  [key: string]: any
}

export interface RawProvider {
  name?: string
  api?: string
  doc?: string
  models?: Record<string, RawModel>
  [key: string]: any
}

export type RawCatalog = Record<string, RawProvider>

export interface ModelVersion {
  id: string
  canonicalModelId: string
  name: string
  lab: string
  family: string | null
  releaseDate: string | null
  knowledgeCutoff: string | null
  modalities: { input: string[]; output: string[] }
  openWeights: boolean
  description: string | null
  aaUrl: string | null
  availability: Availability
  releaseBadges: string[]
  reasoningLabel: string
  sourceRefs: string[]
  snapshotId: string
}

export interface OfferPrice {
  input: number | null
  output: number | null
  cacheRead: number | null
  cacheWrite: number | null
  currency: 'USD'
  tiers: any[]
}

export interface Offer {
  id: string
  modelVersionId: string
  providerId: string
  providerName: string
  providerKind: ProviderKind
  providerModelId: string
  providerModelName: string
  status: OfferStatus
  price: OfferPrice | null
  limits: { context: number | null; input: number | null; output: number | null }
  capabilities: {
    reasoning: boolean
    reasoningOptions: any[]
    toolCall: boolean
    structuredOutput: boolean
    attachment: boolean
    temperature: boolean
    interleaved: any | null
  }
  sourceRefs: string[]
  snapshotId: string
}

export interface Score {
  id: string
  modelVersionId: string
  source: 'arena_hf'
  board: Board
  condition: string
  rating: number
  ciLow: number
  ciHigh: number
  rank: number
  votes: number
  snapshotDate: string
  sourceRef: string
}

export interface UnmatchedEntry {
  id: string
  board: Board
  modelName: string
  organization: string
  condition: string
  rating: number
  ciLow: number
  ciHigh: number
  rank: number
  votes: number
  snapshotDate: string
  sourceRef: string
}

export interface ValidationReport {
  status: 'passed' | 'failed'
  hardFailures: string[]
  warnings: string[]
  stats: Record<string, any>
  generatedAt: string
  snapshotId: string
}

export interface FreshnessCheck {
  fetchedAt: string
  ageHours: number
  thresholdHours: number
  stale: boolean
}

export interface Manifest {
  snapshotId: string
  generatedAt: string
  sources: Record<string, any>
  fx: FxConfig
  counts: { models: number; offers: number; scores: number; unmatched: number }
  files: Record<string, string>
  overrides: { count: number; hash: string | null; applied: OverrideAudit[] }
  crosswalk?: { verified: number; tentative: number; none: number }
  aaLinks?: { verified: number; unverified: number }
  freshness: {
    modelsDev: FreshnessCheck
    arena: FreshnessCheck
    fx: { asOf: string; ageDays: number; thresholdDays: number; stale: boolean }
  }
  validation: { status: 'passed' | 'failed'; report: string }
  notes: string[]
}

export interface ModelBuildResult {
  models: ModelVersion[]
  offers: Offer[]
  warnings: string[]
}

export interface ArenaBuildResult {
  scores: Score[]
  unmatched: UnmatchedEntry[]
  warnings: string[]
  hardFailures: string[]
  stats: Record<string, any>
}

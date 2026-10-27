import type { ModelVersion, Offer, OverrideAudit, Score, UnmatchedEntry } from '../lib/snapshot'

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

export type RawCatalog = Record<string, RawProvider>

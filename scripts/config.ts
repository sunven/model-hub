import type { Availability, Board, OfferStatus, ProviderKind } from '../lib/snapshot'
import type { RawModel } from './types'

export const CLOUD_PROVIDER_KEYS = new Set([
  'amazon-bedrock', 'azure', 'google-vertex', 'google-vertex-anthropic', 'volcengine',
  // Major inference clouds: legitimate hosting for open-weight models.
  'togetherai', 'fireworks-ai', 'deepinfra', 'nvidia', 'novita-ai', 'groq', 'cerebras',
  'sambanova', 'nebius', 'cloudflare-workers-ai', 'vultr', 'hyperbolic', 'modal',
])

export const LAB_FIRST_PARTY_KEYS: Record<string, string[]> = {
  OpenAI: ['openai'],
  Anthropic: ['anthropic'],
  Google: ['google', 'google-vertex'],
  xAI: ['xai'],
  Mistral: ['mistral'],
  Cohere: ['cohere'],
  Meta: ['meta'],
  DeepSeek: ['deepseek'],
  'Alibaba / Qwen': ['alibaba', 'alibaba-cn'],
  'Zhipu / GLM': ['zhipuai', 'zai'],
  'Moonshot / Kimi': ['moonshotai', 'moonshotai-cn'],
  'ByteDance / Seed': ['volcengine'],
  StepFun: ['stepfun', 'stepfun-ai'],
  Xiaomi: ['xiaomi'],
  Tencent: ['tencent-tokenhub'],
  NVIDIA: ['nvidia'],
  Amazon: ['amazon-bedrock', 'amazon'],
  Sakana: ['sakana'],
  Upstage: ['upstage'],
  Inception: ['inception'],
}

export function providerKindForModel(providerId: string, lab: string): ProviderKind {
  if ((LAB_FIRST_PARTY_KEYS[lab] ?? []).includes(providerId)) return 'first_party'
  if (CLOUD_PROVIDER_KEYS.has(providerId)) return 'cloud'
  return 'gateway'
}

export function statusFromRaw(status: string | null | undefined): OfferStatus {
  if (status === 'deprecated' || status === 'beta' || status === 'alpha') return status
  return 'available_unmarked'
}

export function availabilityFromStatuses(statuses: OfferStatus[], haveOffers: boolean, openWeights: boolean): Availability {
  if (!haveOffers) return openWeights ? 'open_weights_only' : 'unknown'
  const nonDeprecated = statuses.filter(s => s !== 'deprecated')
  if (nonDeprecated.length === 0) return 'deprecated'
  if (statuses.some(s => s === 'deprecated')) return 'mixed'
  return 'available'
}

function uniqueEffortValues(options: any[] | undefined): string[] {
  if (!Array.isArray(options)) return []
  const effort = options.find(o => o?.type === 'effort')
  const rawValues: unknown[] = Array.isArray(effort?.values) ? effort.values : []
  const values = rawValues.map(v => String(v)).filter(Boolean)
  return [...new Set(values)]
}

export function reasoningLabelFromRow(row: RawModel | undefined): string {
  if (!row?.reasoning) return '不支持'
  const options = Array.isArray(row.reasoning_options) ? row.reasoning_options : []
  if (!options.length) return '未标档'
  const efforts = uniqueEffortValues(options)
  if (efforts.length > 1) return `可调 ${efforts.length} 档`
  if (efforts.length === 1) return `固定 ${efforts[0]}`
  if (options.some(o => o?.type === 'budget_tokens')) return '预算可调'
  if (options.some(o => o?.type === 'toggle')) return '开关'
  return '未标档'
}

export function conditionFromName(name: string): string {
  const m = name.match(/\(([^()]*)\)\s*$/)
  const raw = m?.[1]?.trim()
  return raw || 'default'
}

function slug(value: string): string {
  return value
    .toLowerCase()
    .replace(/\//g, '__')
    .replace(/[^a-z0-9_.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^[-_.]+|[-_.]+$/g, '')
}

export function modelVersionIdFromCanonical(canonicalId: string): string {
  return `mv_${slug(canonicalId)}`
}

export function offerId(providerId: string, providerModelId: string): string {
  return `of_${slug(providerId)}__${slug(providerModelId)}`
}

export function scoreId(board: Board, modelVersionId: string, condition: string, snapshotDate: string): string {
  return `sc_${board}_${slug(modelVersionId)}_${slug(condition)}_${snapshotDate}`
}

export function unmatchedId(board: Board, modelName: string, snapshotDate: string): string {
  return `unmatched_${board}_${slug(modelName)}_${snapshotDate}`
}

export function finiteNumber(value: unknown): number | null {
  const n = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

export function sourceRefModelsDev(providerId: string, modelId: string): string {
  return `models.dev:${providerId}/${modelId}`
}

export function sourceRefArena(board: Board, modelName: string, publishDate: string): string {
  return `arena_hf:${board}:${modelName}:${publishDate}`
}

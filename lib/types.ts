import type {
  Availability,
  Manifest,
  ModelVersion,
  Offer,
  Score,
  UnmatchedEntry,
} from '@/scripts/types'

export type { Availability, Manifest, ModelVersion, Offer, Score, UnmatchedEntry }

export interface ScoreView {
  rating: number
  ciLow: number
  ciHigh: number
  rank: number
  votes: number
  condition: string
  date: string
}

export interface PriceSummary {
  inputMin: number
  inputMax: number
  outputMin: number
  outputMax: number
  gatewayOnly: boolean
}

export interface ModelRow {
  id: string
  canonicalId: string
  name: string
  lab: string
  availability: Availability
  releaseBadges: string[]
  openWeights: boolean
  reasoningLabel: string
  context: number | null
  outputLimit: number | null
  releaseDate: string | null
  price: PriceSummary | null
  text: ScoreView | null
  webdev: ScoreView | null
  offerCount: number
  visibleOfferCount: number
  providerNames: string[]
  gatewayOnly: boolean
  unmarked: boolean
}

export interface ModelIndexEntry {
  id: string
  canonicalId: string
  name: string
  lab: string
}

export interface LeaderboardRow {
  id: string
  kind: 'model' | 'unmatched'
  board: 'text' | 'webdev'
  rank: number
  name: string
  lab: string
  organization: string
  rating: number
  ciLow: number
  ciHigh: number
  condition: string
  votes: number
  snapshotDate: string
  href: string | null
}

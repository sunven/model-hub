import type {
  Availability,
  Board,
  Manifest,
  ModelVersion,
  Offer,
  Score,
  UnmatchedEntry,
} from '@/scripts/types'

export type { Availability, Board, Manifest, ModelVersion, Offer, Score, UnmatchedEntry }

export interface ScoreView {
  rating: number
  ciLow: number
  ciHigh: number
  rank: number
  votes: number
  condition: string
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
  family: string | null
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
  rank: number
  name: string
  lab: string
  rating: number
  ciLow: number
  ciHigh: number
  condition: string
  votes: number
  href: string | null
}

import { asyncBufferFromFile, parquetReadObjects } from 'hyparquet'
import { compressors } from 'hyparquet-compressors'
import type { Board, Score, UnmatchedEntry } from '../lib/snapshot'
import type { ArenaBuildResult, CrosswalkEntry, LaunchEntry } from './types'
import {
  conditionFromName,
  finiteNumber,
  modelVersionIdFromCanonical,
  scoreId,
  sourceRefArena,
  unmatchedId,
} from './config'

interface ArenaRow {
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
  category: string
  sourceRef: string
}

interface CompiledPattern {
  canonicalId: string
  regex: RegExp
}

async function readParquet(file: string): Promise<any[]> {
  const fileBuffer = await asyncBufferFromFile(file)
  return await parquetReadObjects({ file: fileBuffer, compressors })
}

function normalizeRows(raw: any[], board: Board): { rows: ArenaRow[]; warnings: string[]; filtered: number } {
  const warnings: string[] = []
  const category = board === 'text' ? 'overall' : 'webdev'
  const filteredRows = raw.filter(r => r?.category === category)
  const grouped = new Map<string, ArenaRow>()

  for (const r of filteredRows) {
    const modelName = String(r.model_name ?? '')
    const organization = String(r.organization ?? '')
    if (!modelName) continue
    const rating = finiteNumber(r.rating)
    const ciLow = finiteNumber(r.rating_lower) ?? rating
    const ciHigh = finiteNumber(r.rating_upper) ?? rating
    const rank = finiteNumber(r.rank)
    const votes = finiteNumber(r.vote_count)
    if (rating === null || ciLow === null || ciHigh === null || rank === null || votes === null) {
      warnings.push(`Arena ${board} row has invalid numbers: ${modelName} (${organization})`)
      continue
    }
    const snapshotDate = String(r.leaderboard_publish_date ?? '')
    if (!snapshotDate) {
      warnings.push(`Arena ${board} row has no publish date: ${modelName}`)
      continue
    }
    const row: ArenaRow = {
      board,
      modelName,
      organization,
      condition: conditionFromName(modelName),
      rating,
      ciLow,
      ciHigh,
      rank: Math.trunc(rank),
      votes: Math.trunc(votes),
      snapshotDate,
      category,
      sourceRef: sourceRefArena(board, modelName, snapshotDate),
    }
    const key = `${modelName}|${organization}`
    const prev = grouped.get(key)
    if (!prev || row.snapshotDate > prev.snapshotDate || (row.snapshotDate === prev.snapshotDate && row.votes > prev.votes)) {
      grouped.set(key, row)
    }
  }

  return { rows: [...grouped.values()], warnings, filtered: filteredRows.length }
}

function compilePatterns(crosswalk: CrosswalkEntry[], launch: LaunchEntry[], hardFailures: string[]): Map<Board, CompiledPattern[]> {
  const launchIds = new Set(launch.map(l => l.canonicalId))
  const seen = new Set<string>()
  const out = new Map<Board, CompiledPattern[]>([
    ['text', []],
    ['webdev', []],
  ])

  for (const entry of crosswalk) {
    if (!launchIds.has(entry.canonicalId)) {
      hardFailures.push(`crosswalk canonicalId not in launch set: ${entry.canonicalId}`)
      continue
    }
    if (seen.has(entry.canonicalId)) {
      hardFailures.push(`duplicate crosswalk canonicalId: ${entry.canonicalId}`)
      continue
    }
    seen.add(entry.canonicalId)
    for (const board of ['text', 'webdev'] as const) {
      const patterns = board === 'text' ? entry.textPatterns : entry.webdevPatterns
      for (const pattern of patterns ?? []) {
        try {
          out.get(board)!.push({ canonicalId: entry.canonicalId, regex: new RegExp(pattern, 'i') })
        } catch (err) {
          hardFailures.push(`invalid crosswalk regex for ${entry.canonicalId} (${board}): ${pattern}`)
        }
      }
    }
  }

  for (const entry of launch) {
    if (!seen.has(entry.canonicalId)) {
      hardFailures.push(`launch model missing crosswalk entry: ${entry.canonicalId}`)
    }
  }

  return out
}

export async function buildArenaData(args: {
  textFile: string
  webdevFile: string
  crosswalk: CrosswalkEntry[]
  launch: LaunchEntry[]
  modelIds: Set<string>
}): Promise<ArenaBuildResult> {
  const hardFailures: string[] = []
  const warnings: string[] = []
  const patterns = compilePatterns(args.crosswalk, args.launch, hardFailures)

  const [rawText, rawWebdev] = await Promise.all([readParquet(args.textFile), readParquet(args.webdevFile)])
  const text = normalizeRows(rawText, 'text')
  const webdev = normalizeRows(rawWebdev, 'webdev')
  warnings.push(...text.warnings, ...webdev.warnings)

  const scoresById = new Map<string, Score>()
  const unmatchedById = new Map<string, UnmatchedEntry>()
  const matchedByCanonical = new Map<string, number>()
  let matchedCount = 0

  for (const board of ['text', 'webdev'] as const) {
    const rows = board === 'text' ? text.rows : webdev.rows
    const boardPatterns = patterns.get(board) ?? []
    for (const row of rows) {
      const matches = boardPatterns.filter(p => p.regex.test(row.modelName))
      if (matches.length > 1) {
        hardFailures.push(`crosswalk overlap on ${board}: "${row.modelName}" matches ${matches.map(m => m.canonicalId).join(', ')}`)
        continue
      }
      if (matches.length === 1) {
        const canonicalId = matches[0].canonicalId
        const modelVersionId = modelVersionIdFromCanonical(canonicalId)
        if (!args.modelIds.has(modelVersionId)) {
          hardFailures.push(`score references missing modelVersion: ${modelVersionId}`)
          continue
        }
        matchedCount++
        matchedByCanonical.set(canonicalId, (matchedByCanonical.get(canonicalId) ?? 0) + 1)
        const id = scoreId(board, modelVersionId, row.condition, row.snapshotDate)
        const score: Score = {
          id,
          modelVersionId,
          source: 'arena_hf',
          board,
          condition: row.condition,
          rating: row.rating,
          ciLow: row.ciLow,
          ciHigh: row.ciHigh,
          rank: row.rank,
          votes: row.votes,
          snapshotDate: row.snapshotDate,
          sourceRef: row.sourceRef,
        }
        const prev = scoresById.get(id)
        if (prev) {
          warnings.push(`duplicate score id ${id}; keeping higher vote_count (${row.modelName})`)
          if (score.votes > prev.votes) scoresById.set(id, score)
        } else {
          scoresById.set(id, score)
        }
      } else {
        const id = unmatchedId(board, row.modelName, row.snapshotDate)
        const entry: UnmatchedEntry = {
          id,
          board,
          modelName: row.modelName,
          organization: row.organization,
          condition: row.condition,
          rating: row.rating,
          ciLow: row.ciLow,
          ciHigh: row.ciHigh,
          rank: row.rank,
          votes: row.votes,
          snapshotDate: row.snapshotDate,
          sourceRef: row.sourceRef,
        }
        const prev = unmatchedById.get(id)
        if (prev) {
          if (entry.votes > prev.votes) unmatchedById.set(id, entry)
        } else {
          unmatchedById.set(id, entry)
        }
      }
    }
  }

  // Surface crosswalk entries that produced no matched scores, except intentional none entries.
  for (const entry of args.crosswalk) {
    if (entry.confidence !== 'none' && !matchedByCanonical.has(entry.canonicalId)) {
      warnings.push(`crosswalk produced no scores: ${entry.canonicalId}`)
    }
  }
  const tentative = args.crosswalk.filter(c => c.confidence === 'tentative').map(c => c.canonicalId)
  if (tentative.length) warnings.push(`crosswalk tentative, verify before launch: ${tentative.join(', ')}`)

  const scores = [...scoresById.values()].sort((a, b) =>
    a.modelVersionId.localeCompare(b.modelVersionId) ||
    a.board.localeCompare(b.board) ||
    a.rank - b.rank ||
    a.condition.localeCompare(b.condition),
  )
  const unmatched = [...unmatchedById.values()].sort((a, b) =>
    a.board.localeCompare(b.board) ||
    a.rank - b.rank ||
    a.modelName.localeCompare(b.modelName),
  )

  const stats = {
    textRows: rawText.length,
    webdevRows: rawWebdev.length,
    textCategoryRows: text.filtered,
    webdevCategoryRows: webdev.filtered,
    textDeduped: text.rows.length,
    webdevDeduped: webdev.rows.length,
    scores: scores.length,
    unmatched: unmatched.length,
    matchedRows: matchedCount,
    byBoard: {
      text: scores.filter(s => s.board === 'text').length,
      webdev: scores.filter(s => s.board === 'webdev').length,
    },
  }

  return { scores, unmatched, warnings, hardFailures, stats }
}

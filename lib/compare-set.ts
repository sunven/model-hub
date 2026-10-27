export const COMPARE_LIMIT = 3

export type CompareAction =
  | { type: 'toggle'; id: string }
  | { type: 'remove'; id: string }
  | { type: 'clear' }

/** Keep the first three distinct, known Model Version IDs, in the supplied order. */
export function normalizeCompareSet(value: unknown, knownIds: ReadonlySet<string>): string[] {
  if (!Array.isArray(value)) return []
  const selected: string[] = []
  for (const id of value) {
    if (typeof id !== 'string' || !knownIds.has(id) || selected.includes(id)) continue
    selected.push(id)
    if (selected.length === COMPARE_LIMIT) break
  }
  return selected
}

/** An explicit URL selection, even empty or invalid, takes precedence over the fallback. */
export function restoreCompareSet(
  params: URLSearchParams,
  fallback: unknown,
  knownIds: ReadonlySet<string>,
): string[] {
  const value = params.has('models') ? params.getAll('models').flatMap(value => value.split(',')) : fallback
  return normalizeCompareSet(value, knownIds)
}

export function updateCompareSet(
  current: readonly string[],
  action: CompareAction,
  knownIds: ReadonlySet<string>,
): { selected: string[]; limitReached: boolean } {
  const selected = normalizeCompareSet(current, knownIds)
  if (action.type === 'clear') return { selected: [], limitReached: false }
  if (action.type === 'remove' || selected.includes(action.id)) {
    return { selected: selected.filter(id => id !== action.id), limitReached: false }
  }
  if (!knownIds.has(action.id)) return { selected, limitReached: false }
  if (selected.length === COMPARE_LIMIT) return { selected, limitReached: true }
  return { selected: [...selected, action.id], limitReached: false }
}

export function compareHref(selected: readonly string[]): string {
  return selected.length ? `/compare?models=${selected.map(encodeURIComponent).join(',')}` : '/compare'
}

'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { normalizeCompareSet, restoreCompareSet, updateCompareSet, type CompareAction } from '@/lib/compare-set'
import type { ModelIndexEntry } from '@/lib/types'

const STORAGE_KEY = 'modelhub.compare'

function readStoredSelection(): unknown {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) : []
  } catch {
    return []
  }
}

function persistSelection(selected: string[]): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(selected))
  } catch {
    // Selection and shareable URLs still work when browser storage is unavailable.
  }
}

function replaceCompareUrl(selected: string[]): void {
  const url = new URL(window.location.href)
  if (url.pathname !== '/compare') return
  if (selected.length) url.searchParams.set('models', selected.join(','))
  else url.searchParams.delete('models')
  if (url.href !== window.location.href) window.history.replaceState(window.history.state, '', url.href)
}

/** Browser adapters and React binding for the one Compare Set owned by the Provider. */
export function useCompareSet(modelIndex: ModelIndexEntry[], onLimit: () => void) {
  const knownIds = useMemo(() => new Set(modelIndex.map(model => model.id)), [modelIndex])
  const [selected, setSelected] = useState<string[]>([])
  const [ready, setReady] = useState(false)
  const current = useRef<string[]>([])
  const initialized = useRef(false)

  const commit = useCallback((next: string[]) => {
    if (current.current.length !== next.length || current.current.some((id, index) => id !== next[index])) {
      current.current = next
      setSelected(next)
    }
    persistSelection(next)
    replaceCompareUrl(next)
  }, [])

  const synchronize = useCallback((fromHistory = false) => {
    const url = new URL(window.location.href)
    const fallback = initialized.current ? current.current : readStoredSelection()
    const next = url.pathname === '/compare'
      ? restoreCompareSet(url.searchParams, fromHistory ? [] : fallback, knownIds)
      : normalizeCompareSet(fallback, knownIds)
    initialized.current = true
    commit(next)
    setReady(true)
  }, [knownIds, commit])

  useEffect(() => {
    const onPopState = () => synchronize(true)
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [synchronize])

  const dispatch = useCallback((action: CompareAction) => {
    if (!initialized.current) synchronize()
    const next = updateCompareSet(current.current, action, knownIds)
    commit(next.selected)
    if (next.limitReached) onLimit()
  }, [knownIds, commit, synchronize, onLimit])

  const toggle = useCallback((id: string) => dispatch({ type: 'toggle', id }), [dispatch])
  const remove = useCallback((id: string) => dispatch({ type: 'remove', id }), [dispatch])
  const clear = useCallback(() => dispatch({ type: 'clear' }), [dispatch])

  return { selected, ready, toggle, remove, clear, synchronize }
}

/** Observe Next navigation without making the whole shared layout depend on search params. */
export function CompareLocationSync({ synchronize }: { synchronize: () => void }) {
  const pathname = usePathname()
  const params = useSearchParams()
  useEffect(() => synchronize(), [pathname, params, synchronize])
  return null
}

'use client'

import { createContext, Suspense, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { CompareLocationSync, useCompareSet } from './use-compare-set'
import { COMPARE_LIMIT } from '@/lib/compare-set'
import type { ModelIndexEntry } from '@/lib/types'

interface CompareContextValue {
  selected: readonly string[]
  ready: boolean
  modelIndex: ModelIndexEntry[]
  toggle: (id: string) => void
  remove: (id: string) => void
  clear: () => void
  showToast: (message: string) => void
}

const CompareContext = createContext<CompareContextValue | null>(null)

export function CompareProvider({ modelIndex, children }: { modelIndex: ModelIndexEntry[]; children: ReactNode }) {
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1900)
  }, [])
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }, [])

  const onLimit = useCallback(() => showToast(`最多选择 ${COMPARE_LIMIT} 个模型`), [showToast])
  const { selected, ready, toggle, remove, clear, synchronize } = useCompareSet(modelIndex, onLimit)
  const value = useMemo(
    () => ({ selected, ready, modelIndex, toggle, remove, clear, showToast }),
    [selected, ready, modelIndex, toggle, remove, clear, showToast],
  )

  return (
    <CompareContext.Provider value={value}>
      <Suspense fallback={null}>
        <CompareLocationSync synchronize={synchronize} />
      </Suspense>
      {children}
      <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">
        {toast ?? ''}
      </div>
    </CompareContext.Provider>
  )
}

export function useCompare(): CompareContextValue {
  const value = useContext(CompareContext)
  if (!value) throw new Error('useCompare must be used inside CompareProvider')
  return value
}

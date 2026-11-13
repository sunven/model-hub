'use client'

import { createContext, Suspense, useCallback, useContext, useMemo, type ReactNode } from 'react'
import { useToast } from '@astryxdesign/core/Toast'
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
  const toast = useToast()
  const showToast = useCallback(
    (message: string) => {
      toast({ body: message, uniqueID: 'compare-limit', autoHideDuration: 2600 })
    },
    [toast],
  )

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
    </CompareContext.Provider>
  )
}

export function useCompare(): CompareContextValue {
  const value = useContext(CompareContext)
  if (!value) throw new Error('useCompare must be used inside CompareProvider')
  return value
}

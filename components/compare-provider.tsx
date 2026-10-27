'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { parseCompareIds } from '@/lib/site'
import type { ModelIndexEntry } from '@/lib/types'

interface CompareContextValue {
  selected: string[]
  modelIndex: ModelIndexEntry[]
  toggle: (id: string) => void
  remove: (id: string) => void
  clear: () => void
  setSelected: (ids: string[]) => void
  showToast: (message: string) => void
}

const CompareContext = createContext<CompareContextValue | null>(null)

const STORAGE_KEY = 'modelhub.compare'

export function CompareProvider({
  modelIndex,
  children,
}: {
  modelIndex: ModelIndexEntry[]
  children: ReactNode
}) {
  const [selected, setSelectedState] = useState<string[]>([])
  const [toast, setToast] = useState<string | null>(null)
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ids = useMemo(() => new Set(modelIndex.map(m => m.id)), [modelIndex])

  const showToast = useCallback((message: string) => {
    setToast(message)
    if (toastTimer.current) clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToast(null), 1900)
  }, [])

  useEffect(() => {
    let initial: string[] = []
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored) initial = JSON.parse(stored)
    } catch {
      initial = []
    }
    if (window.location.pathname.startsWith('/compare')) {
      const fromUrl = parseCompareIds(new URLSearchParams(window.location.search).get('models'))
      if (fromUrl.length) initial = fromUrl
    }
    setSelectedState(initial.filter(id => ids.has(id)).slice(0, 3))
  }, [ids])

  const persist = useCallback(
    (next: string[]) => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        // ignore local storage failures
      }
      if (window.location.pathname.startsWith('/compare')) {
        const url = new URL(window.location.href)
        if (next.length) url.searchParams.set('models', next.join(','))
        else url.searchParams.delete('models')
        window.history.replaceState({}, '', url.toString())
      }
    },
    [],
  )

  const setSelected = useCallback(
    (next: string[]) => {
      const sanitized = [...new Set(next)].filter(id => ids.has(id)).slice(0, 3)
      setSelectedState(sanitized)
      persist(sanitized)
    },
    [ids, persist],
  )

  const toggle = useCallback(
    (id: string) => {
      if (!ids.has(id)) return
      if (selected.includes(id)) {
        setSelected(selected.filter(x => x !== id))
        return
      }
      if (selected.length >= 3) {
        showToast('最多选择 3 个模型')
        return
      }
      setSelected([...selected, id])
    },
    [ids, selected, setSelected, showToast],
  )

  const remove = useCallback(
    (id: string) => setSelected(selected.filter(x => x !== id)),
    [selected, setSelected],
  )
  const clear = useCallback(() => setSelected([]), [setSelected])
  const value = useMemo(
    () => ({ selected, modelIndex, toggle, remove, clear, setSelected, showToast }),
    [selected, modelIndex, toggle, remove, clear, setSelected, showToast],
  )

  return (
    <CompareContext.Provider value={value}>
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

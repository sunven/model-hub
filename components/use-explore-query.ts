'use client'

import { useCallback, useEffect, useLayoutEffect, useState } from 'react'
import {
  DEFAULT_EXPLORE_QUERY,
  isDefaultExploreQuery,
  parseExploreQuery,
  removeFilter as removeExploreFilter,
  serializeExploreQuery,
  type ActiveFilter,
  type ExploreListField,
  type ExploreQuery,
} from '@/lib/explore-query'
import { useNoindex } from './use-noindex'

const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

export function useExploreQuery() {
  const [query, setQuery] = useState<ExploreQuery>(DEFAULT_EXPLORE_QUERY)
  const [urlReady, setUrlReady] = useState(false)

  useIsoLayoutEffect(() => {
    setQuery(parseExploreQuery(new URLSearchParams(window.location.search)))
    setUrlReady(true)
  }, [])

  useNoindex(!isDefaultExploreQuery(query))

  useEffect(() => {
    if (!urlReady || window.location.pathname !== '/') return
    const search = serializeExploreQuery(query).toString()
    const next = `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`
    window.history.replaceState({}, '', next)
  }, [urlReady, query])

  const update = useCallback((patch: Partial<ExploreQuery>) => {
    setQuery(previous => ({ ...previous, ...patch }))
  }, [])

  const reset = useCallback(() => setQuery(DEFAULT_EXPLORE_QUERY), [])

  const toggleInList = useCallback((field: ExploreListField, value: string) => {
    setQuery(previous => {
      const values = previous[field]
      const next = values.includes(value) ? values.filter(item => item !== value) : [...values, value]
      return field === 'labs' ? { ...previous, labs: next } : { ...previous, providers: next }
    })
  }, [])

  const removeFilter = useCallback((filter: ActiveFilter) => {
    setQuery(previous => removeExploreFilter(previous, filter))
  }, [])

  return { query, update, reset, toggleInList, removeFilter, urlReady }
}

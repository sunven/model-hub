'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { checkFreshness, snapshotFreshness } from '@/lib/freshness'
import type { Manifest } from '@/lib/snapshot'

type FreshnessState = { now: number; freshness: Manifest['freshness'] }
const FreshnessContext = createContext<FreshnessState | null>(null)

/** One browser clock drives both warnings and CNY, including static pages.
 * CNY is withheld until the browser clock is available.
 */
export function FreshnessProvider({ freshness, children }: {
  freshness: Manifest['freshness']
  children: ReactNode
}) {
  const [state, setState] = useState<FreshnessState | null>(null)

  useEffect(() => {
    let timer: number
    const check = () => {
      window.clearTimeout(timer)
      const now = Date.now()
      const timestamps = {
        modelsDev: freshness.modelsDev.fetchedAt,
        arena: [freshness.arena.fetchedAt],
        fx: freshness.fx.asOf,
      }
      const state = snapshotFreshness(timestamps, now)
      setState({ now, freshness: state })
      const expirations = [
        checkFreshness('modelsDev', timestamps.modelsDev, now),
        checkFreshness('arena', timestamps.arena[0], now),
        checkFreshness('fx', timestamps.fx, now),
      ].flatMap(({ expiresAt }) => expiresAt !== null && expiresAt >= now ? [expiresAt + 1] : [])
      timer = window.setTimeout(check, Math.min(3_600_000, ...expirations.map(time => time - now)))
    }
    check()
    const onVisible = () => { if (document.visibilityState === 'visible') check() }
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [freshness])

  return <FreshnessContext.Provider value={state}>{children}</FreshnessContext.Provider>
}

export function useFreshness() {
  return useContext(FreshnessContext)
}

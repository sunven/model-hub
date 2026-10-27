'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { checkFreshness, snapshotFreshness } from '@/lib/freshness'
import type { Manifest } from '@/lib/snapshot'

type FreshnessState = { now: number; freshness: Manifest['freshness'] }
const FreshnessContext = createContext<FreshnessState | null>(null)

/** One browser clock drives both warnings and CNY, including static pages.
 * No time-dependent markup is emitted before hydration.
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
      setState({ now, freshness: snapshotFreshness({
        modelsDev: freshness.modelsDev.fetchedAt,
        arena: [freshness.arena.fetchedAt],
        fx: freshness.fx.asOf,
      }, now) })
      const expirations = [
        checkFreshness('modelsDev', freshness.modelsDev.fetchedAt, now),
        checkFreshness('arena', freshness.arena.fetchedAt, now),
        checkFreshness('fx', freshness.fx.asOf, now),
      ].flatMap(({ expiresAt }) => expiresAt !== null && expiresAt >= now ? [expiresAt + 1] : [])
      // Recheck hourly for clock changes, and immediately after each expiry.
      timer = window.setTimeout(check, Math.min(3_600_000, ...expirations.map(time => time - now)))
    }
    check()
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', check)
    }
  }, [freshness])

  return <FreshnessContext.Provider value={state}>{children}</FreshnessContext.Provider>
}

export function useFreshness() {
  return useContext(FreshnessContext)
}

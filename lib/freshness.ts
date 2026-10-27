import type { Manifest } from './snapshot'

const HOUR = 3_600_000
const DAY = 24 * HOUR

export const FRESHNESS_POLICY = {
  modelsDev: { thresholdHours: 48 },
  arena: { thresholdHours: 72 },
  fx: { thresholdDays: 14 },
} as const

type Source = keyof typeof FRESHNESS_POLICY

/** Decisions use elapsed milliseconds; rounded ages are only for reporting.
 * Date-only FX values mean midnight UTC. Future timestamps have age zero.
 * Invalid timestamps are stale and cannot authorize a currency conversion.
 */
export function checkFreshness(source: Source, timestamp: string, now = Date.now()) {
  if (!Number.isFinite(now)) throw new RangeError('Freshness clock must be finite')
  const time = Date.parse(timestamp)
  const threshold = source === 'fx'
    ? FRESHNESS_POLICY.fx.thresholdDays * DAY
    : FRESHNESS_POLICY[source].thresholdHours * HOUR
  const expiresAt = Number.isFinite(time) ? time + threshold : null
  const ageMs = expiresAt === null ? null : Math.max(0, now - time)
  return {
    ageHours: ageMs === null ? null : Math.round(ageMs / HOUR * 10) / 10,
    ageDays: ageMs === null ? null : Math.floor(ageMs / DAY),
    stale: expiresAt === null || now > expiresAt,
    expiresAt,
  }
}

/** Arena is as old as its oldest (or unknown) source file. Invalid ages fail
 * Manifest validation rather than inventing a serializable fetch age.
 */
export function snapshotFreshness(timestamps: {
  modelsDev: string
  arena: readonly string[]
  fx: string
}, now = Date.now()): Manifest['freshness'] {
  const arena = timestamps.arena.find(time => !Number.isFinite(Date.parse(time)))
    ?? [...timestamps.arena].sort((a, b) => Date.parse(a) - Date.parse(b))[0]
    ?? ''
  const hours = (source: 'modelsDev' | 'arena', fetchedAt: string) => {
    const check = checkFreshness(source, fetchedAt, now)
    return {
      fetchedAt,
      ageHours: check.ageHours ?? Infinity,
      ...FRESHNESS_POLICY[source],
      stale: check.stale,
    }
  }
  const fx = checkFreshness('fx', timestamps.fx, now)
  return {
    modelsDev: hours('modelsDev', timestamps.modelsDev),
    arena: hours('arena', arena),
    fx: {
      asOf: timestamps.fx,
      ageDays: fx.ageDays ?? Infinity,
      ...FRESHNESS_POLICY.fx,
      stale: fx.stale,
    },
  }
}

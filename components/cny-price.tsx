'use client'

import { fmtCnyRange } from '@/lib/format'
import type { FxConfig } from '@/lib/snapshot'
import { useFreshness } from './freshness-provider'

type Props = { min: number; max: number; fx: FxConfig; className?: string }

export function CnyRange({ min, max, fx, className }: Props) {
  const state = useFreshness()
  const value = state ? fmtCnyRange(min, max, fx, state.now) : null
  return value ? <span className={className}>{value}</span> : null
}

export function CnyPricePair({ inputMin, inputMax, outputMin, outputMax, fx }: {
  inputMin: number; inputMax: number; outputMin: number; outputMax: number; fx: FxConfig
}) {
  const state = useFreshness()
  const input = state ? fmtCnyRange(inputMin, inputMax, fx, state.now) : null
  const output = state ? fmtCnyRange(outputMin, outputMax, fx, state.now) : null
  if (!input || !output) return null
  return <>
    {' · '}
    <span className="cny-range">{input}</span>
    {' / '}
    <span className="cny-range">{output}</span>
  </>
}

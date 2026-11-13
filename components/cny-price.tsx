'use client'

import { Text } from '@astryxdesign/core/Text'
import { fmtCnyRange } from '@/lib/format'
import type { FxConfig } from '@/lib/snapshot'
import { useFreshness } from './freshness-provider'

type Props = { min: number; max: number; fx: FxConfig; className?: string }

export function CnyRange({ min, max, fx, className }: Props) {
  const state = useFreshness()
  const value = state ? fmtCnyRange(min, max, fx, state.now) : null
  return value ? (
    <Text as="span" type="supporting" className={className}>
      {value}
    </Text>
  ) : null
}

export function CnyPricePair({ inputMin, inputMax, outputMin, outputMax, fx }: {
  inputMin: number; inputMax: number; outputMin: number; outputMax: number; fx: FxConfig
}) {
  const state = useFreshness()
  if (!state) return null
  const input = fmtCnyRange(inputMin, inputMax, fx, state.now)
  const output = fmtCnyRange(outputMin, outputMax, fx, state.now)
  if (!input || !output) return null
  return <>
    {' · '}
    <CnyRange min={inputMin} max={inputMax} fx={fx} className="cny-range" />
    {' / '}
    <CnyRange min={outputMin} max={outputMax} fx={fx} className="cny-range" />
  </>
}

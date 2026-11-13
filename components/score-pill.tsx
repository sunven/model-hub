import { HStack } from '@astryxdesign/core/HStack'
import { Stack } from '@astryxdesign/core/Stack'
import { Text } from '@astryxdesign/core/Text'
import { Tooltip } from '@astryxdesign/core/Tooltip'
import { CiRail } from './ci-rail'
import { scoreMeta } from '@/lib/format'
import type { CiDomain, ScoreView } from '@/lib/types'

export function ScorePill({ score, domain }: { score: ScoreView | null; domain: CiDomain | null }) {
  if (!score) {
    return (
      <Tooltip content="Arena 未收录，不代表能力差">
        <Text type="supporting" as="span">未收录</Text>
      </Tooltip>
    )
  }
  return (
    <HStack gap={1} vAlign="center">
      <CiRail stat={score} domain={domain} width={40} />
      <Text weight="medium" hasTabularNumbers>{score.rating.toFixed(1)}</Text>
    </HStack>
  )
}

export function ScoreCell({
  score,
  domain,
  label,
}: {
  score: ScoreView | null
  domain: CiDomain | null
  label: string
}) {
  if (!score) {
    return (
      <Tooltip content={`${label} 未收录，不代表能力差`}>
        <Text type="supporting" as="span">未收录</Text>
      </Tooltip>
    )
  }
  return (
    <Tooltip content={`${label} CI ${score.ciLow.toFixed(1)}–${score.ciHigh.toFixed(1)}`}>
      <Stack gap={0.5}>
        <ScorePill score={score} domain={domain} />
        <Text type="supporting">{scoreMeta(score)}</Text>
      </Stack>
    </Tooltip>
  )
}

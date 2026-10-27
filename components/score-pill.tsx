import { CiRail, type CiDomain } from './ci-rail'
import { scoreMeta } from '@/lib/format'
import type { ScoreView } from '@/lib/types'

export function ScorePill({ score, domain }: { score: ScoreView | null; domain: CiDomain | null }) {
  if (!score) {
    return <span className="missing" title="Arena 未收录，不代表能力差">未收录</span>
  }
  return (
    <span className="score-top">
      <CiRail stat={score} domain={domain} width={40} />
      <span className="score-rating">{score.rating.toFixed(1)}</span>
    </span>
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
      <div className="score-cell">
        <span className="missing" title={`${label} 未收录`}>未收录</span>
      </div>
    )
  }
  return (
    <div className="score-cell" title={`${label} CI ${score.ciLow.toFixed(1)}–${score.ciHigh.toFixed(1)}`}>
      <ScorePill score={score} domain={domain} />
      <span className="score-meta">{scoreMeta(score)}</span>
    </div>
  )
}

import { ciHalf, scoreSubline } from '@/lib/format'
import type { ScoreView } from '@/lib/types'

export function ScorePill({ score }: { score: ScoreView | null }) {
  if (!score) {
    return <span className="missing" title="Arena 未收录，不代表能力差">未收录</span>
  }
  return (
    <span className="score">
      <span className="rating">{score.rating.toFixed(1)}</span>
      <span className="ci">±{ciHalf(score).toFixed(1)}</span>
      <span className="rank">#{score.rank}</span>
    </span>
  )
}

export function ScoreCell({ score, label }: { score: ScoreView | null; label: string }) {
  return (
    <div title={score ? scoreSubline(score) : `${label} 未收录`}>
      <ScorePill score={score} />
      {score && <div className="small muted" style={{ marginTop: 3 }}>{score.condition}</div>}
    </div>
  )
}

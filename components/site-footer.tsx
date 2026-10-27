import Link from 'next/link'
import { manifest } from '@/lib/data'
import { ATTRIBUTION_URL, NEW_ISSUE_URL, REPO_URL } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        数据：<a href="https://models.dev" target="_blank" rel="noopener noreferrer">models.dev</a>（MIT） ·{' '}
        <a href="https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset" target="_blank" rel="noopener noreferrer">
          LMArena Leaderboard Dataset
        </a>
        （CC BY 4.0） · Artificial Analysis 仅外链 · 汇率 ECB / Frankfurter {manifest.fx.as_of} · 价格以供应商官网为准 ·{' '}
        <Link href="/about">数据说明</Link> ·{' '}
        <a href={ATTRIBUTION_URL} target="_blank" rel="noopener noreferrer">署名与许可</a>
      </div>
      <div>
        非官方 · 模型与商标归各自所有者 · 未做外网部署 ·{' '}
        <a href={REPO_URL} target="_blank" rel="noopener noreferrer">GitHub</a> ·{' '}
        <a href={NEW_ISSUE_URL} target="_blank" rel="noopener noreferrer">纠错 / 下架</a>
      </div>
    </footer>
  )
}

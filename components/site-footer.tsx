import Link from 'next/link'

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div>
        数据：<a href="https://models.dev" target="_blank" rel="noopener noreferrer">models.dev</a>（MIT） ·{' '}
        <a href="https://huggingface.co/datasets/lmarena-ai/leaderboard-dataset" target="_blank" rel="noopener noreferrer">
          LMArena Leaderboard Dataset
        </a>
        （CC BY 4.0） · Artificial Analysis 仅外链 · 价格以供应商官网为准 ·{' '}
        <Link href="/about">数据说明</Link>
      </div>
      <div>非官方 · 模型与商标归各自所有者 · 本地预览</div>
    </footer>
  )
}

import Link from 'next/link'
import { modelRows } from '@/lib/data'

const picks = modelRows
  .filter(model => model.text)
  .sort((a, b) => b.text!.rating - a.text!.rating)
  .slice(0, 8)

export default function NotFound() {
  return (
    <div className="sheet-inner">
      <div className="notfound">
        <div className="notfound-intro">
          <h1>没有找到这个页面</h1>
          <p>模型可能不在当前目录里，或者链接已经失效。</p>
          <div className="detail-actions">
            <Link className="btn primary" href="/">返回模型表</Link>
            <Link className="btn" href="/leaderboards/text">查看 Arena 榜单</Link>
          </div>
          <p className="notfound-note">
            链接可能来自旧版本，目录随数据快照更新。也可以从评分最高的模型或榜单重新开始；共收录{' '}
            {modelRows.length} 个模型版本。
          </p>
        </div>
        <div className="notfound-list">
          <div className="notfound-head">
            <h2>评分最高的模型</h2>
            <Link href="/">浏览全部 {modelRows.length} 个模型</Link>
          </div>
          {picks.map(model => (
            <Link className="notfound-row" href={`/models/${model.canonicalId}`} key={model.id}>
              <span className="pick-rank">#{model.text!.rank}</span>
              <span className="pick-name">
                {model.name}
                <small>{model.lab}</small>
              </span>
              <span className="pick-rating">{model.text!.rating.toFixed(1)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

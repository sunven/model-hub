'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCompare } from './compare-provider'

export function SiteHeader({ dataDate }: { dataDate: string }) {
  const pathname = usePathname()
  const { selected } = useCompare()
  const leaderboard = pathname.startsWith('/leaderboards')
  const models = !leaderboard

  return (
    <header className="site-header">
      <Link className="brand" href="/">
        Model<span>Hub</span>
      </Link>
      <nav className="nav" aria-label="主导航">
        <Link className={`nav-link ${models ? 'active' : ''}`} href="/">
          模型
        </Link>
        <Link className={`nav-link ${leaderboard ? 'active' : ''}`} href="/leaderboards/text">
          榜单
        </Link>
      </nav>
      <div className="header-meta">
        {selected.length > 0 && (
          <Link
            className="compare-count"
            href={selected.length >= 2 ? `/compare?models=${selected.map(encodeURIComponent).join(',')}` : '/compare'}
          >
            对比 {selected.length}
          </Link>
        )}
        <span className="proto-pill">本地预览</span>
        <span className="data-note">数据 {dataDate}</span>
      </div>
    </header>
  )
}

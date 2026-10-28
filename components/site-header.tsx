'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { brandMark } from './brand-mark'
import { useCompare } from './compare-provider'
import { compareHref } from '@/lib/compare-set'

export function SiteHeader() {
  const pathname = usePathname()
  const { selected } = useCompare()
  const section = pathname.startsWith('/leaderboards')
    ? 'leaderboards'
    : pathname === '/' || pathname.startsWith('/models') || pathname.startsWith('/compare')
      ? 'models'
      : 'about'

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="Model Hub 首页">
          {brandMark}
          <span>Model Hub</span>
        </Link>
        <nav className="nav" aria-label="主导航">
          <Link
            className={`nav-link ${section === 'models' ? 'active' : ''}`}
            href="/"
            aria-current={section === 'models' ? 'page' : undefined}
          >
            模型
          </Link>
          <Link
            className={`nav-link ${section === 'leaderboards' ? 'active' : ''}`}
            href="/leaderboards/text"
            aria-current={section === 'leaderboards' ? 'page' : undefined}
          >
            榜单
          </Link>
        </nav>
        <div className="header-tools">
          {selected.length > 0 && (
            <Link
              className="compare-count"
              href={compareHref(selected)}
            >
              对比 <b>{selected.length}</b>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

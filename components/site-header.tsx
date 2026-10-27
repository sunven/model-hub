'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCompare } from './compare-provider'

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
          <svg className="brand-mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M12 5.2v5.2M12 13.6v5.2M5.2 12h5.2M13.6 12h5.2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
            <circle cx="12" cy="12" r="2.4" fill="currentColor" />
            <circle cx="12" cy="3.4" r="1.6" fill="currentColor" />
            <circle cx="12" cy="20.6" r="1.6" fill="currentColor" />
            <circle cx="3.4" cy="12" r="1.6" fill="currentColor" />
            <circle cx="20.6" cy="12" r="1.6" fill="currentColor" />
          </svg>
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
              href={selected.length >= 2 ? `/compare?models=${selected.map(encodeURIComponent).join(',')}` : '/compare'}
            >
              对比 <b>{selected.length}</b>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

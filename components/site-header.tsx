'use client'

import { usePathname } from 'next/navigation'
import { Badge } from '@astryxdesign/core/Badge'
import { Button } from '@astryxdesign/core/Button'
import { TopNav, TopNavHeading, TopNavItem } from '@astryxdesign/core/TopNav'
import { brandMark } from './brand-mark'
import { useCompare } from './compare-provider'
import { compareHref } from '@/lib/compare-set'
import { SITE_NAME } from '@/lib/site'

export function SiteHeader() {
  const pathname = usePathname()
  const { selected } = useCompare()
  const section = pathname.startsWith('/leaderboards')
    ? 'leaderboards'
    : pathname === '/' || pathname.startsWith('/models') || pathname.startsWith('/compare')
      ? 'models'
      : 'about'

  return (
    <TopNav
      label="主导航"
      heading={<TopNavHeading heading={SITE_NAME} headingHref="/" logo={brandMark} />}
      startContent={
        <>
          <TopNavItem label="模型" href="/" isSelected={section === 'models'} />
          <TopNavItem label="榜单" href="/leaderboards/text" isSelected={section === 'leaderboards'} />
          <TopNavItem label="关于" href="/about" isSelected={section === 'about'} />
        </>
      }
      endContent={
        selected.length > 0 ? (
          <Button
            label="对比模型"
            href={compareHref(selected)}
            size="sm"
            variant="secondary"
            endContent={selected.length > 0 ? <Badge label={String(selected.length)} variant="neutral" /> : undefined}
          />
        ) : undefined
      }
    />
  )
}

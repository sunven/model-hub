'use client'

import type { ReactNode } from 'react'
import NextLink from 'next/link'
import { LinkProvider } from '@astryxdesign/core/Link'

export function AstryxLinkProvider({ children }: { children: ReactNode }) {
  return <LinkProvider component={NextLink}>{children}</LinkProvider>
}

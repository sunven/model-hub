'use client'

import type { ReactNode } from 'react'
import { Theme } from '@astryxdesign/core/theme'
import { themes, defaultThemeSlug } from '../astryx-themes'

/** Built themes carry React icon elements, so the theme object must be read on
 * this side of the RSC boundary rather than passed down from the server layout.
 * mode is pinned to light because the app's own stylesheet has no dark palette.
 */
export function AstryxThemeProvider({ children }: { children: ReactNode }) {
  return (
    <Theme theme={themes[defaultThemeSlug]} mode="light">
      {children}
    </Theme>
  )
}
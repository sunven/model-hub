'use client'

import { Suspense, use, type ReactNode } from 'react'

let activated = false
let desktop: Promise<void> | undefined

function DesktopContent({ children }: { children: ReactNode }) {
  if (typeof window !== 'undefined' && !activated) {
    const media = window.matchMedia('(min-width: 980px)')
    if (media.matches) activated = true
    else {
      desktop ??= new Promise<void>(resolve => {
        const onChange = () => {
          if (!media.matches) return
          activated = true
          media.removeEventListener('change', onChange)
          resolve()
        }
        media.addEventListener('change', onChange)
      })
      use(desktop)
    }
  }
  return children
}

/** Preserve the static table, hydrating it when the desktop layout is shown. */
export function DesktopHydration({ children }: { children: ReactNode }) {
  return <Suspense><DesktopContent>{children}</DesktopContent></Suspense>
}

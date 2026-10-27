'use client'

import { useEffect } from 'react'

export function useNoindex(active: boolean): void {
  useEffect(() => {
    const metas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="robots"]'))
    if (!metas.length) return
    const previous = metas.map(meta => meta.getAttribute('content'))
    const content = active ? 'noindex,follow' : 'index,follow'
    for (const meta of metas) meta.setAttribute('content', content)
    return () => {
      metas.forEach((meta, index) => {
        if (previous[index]) meta.setAttribute('content', previous[index]!)
      })
    }
  }, [active])
}

import type { MetadataRoute } from 'next'
import { catalog, manifest } from '@/lib/data'
import { absoluteUrl, modelHref } from '@/lib/site'

export const dynamic = 'force-static'

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(manifest.generatedAt)
  return [
    { url: absoluteUrl('/'), lastModified, changeFrequency: 'weekly', priority: 1 },
    {
      url: absoluteUrl('/leaderboards/text'),
      lastModified,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: absoluteUrl('/leaderboards/webdev'),
      lastModified,
      changeFrequency: 'daily',
      priority: 0.8,
    },
    { url: absoluteUrl('/about'), lastModified, changeFrequency: 'monthly', priority: 0.5 },
    ...catalog.index.map(model => ({
      url: absoluteUrl(modelHref(model.canonicalId)),
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}

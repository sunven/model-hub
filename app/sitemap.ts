import type { MetadataRoute } from 'next'
import { manifest, models } from '@/lib/data'
import { absoluteUrl } from '@/lib/site'

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
    ...models.map(model => ({
      url: absoluteUrl(`/models/${model.canonicalModelId}`),
      lastModified,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    })),
  ]
}

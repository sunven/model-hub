import { SITE_NAME, SITE_URL, absoluteUrl } from './site'

export function webPageLd(args: {
  name: string
  description: string
  path: string
  type?: 'WebPage' | 'AboutPage' | 'CollectionPage'
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': args.type ?? 'WebPage',
    name: args.name,
    description: args.description,
    url: absoluteUrl(args.path),
    inLanguage: 'zh-CN',
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
  }
}

export function breadcrumbLd(items: { name: string; path: string }[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function itemListLd(args: {
  name: string
  items: { name: string; path: string | null }[]
}): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: args.name,
    numberOfItems: args.items.length,
    itemListElement: args.items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.path ? { url: absoluteUrl(item.path) } : {}),
    })),
  }
}

export function websiteLd(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: '只读 AI 模型价格、上下文、推理等级与 Arena 偏好评分目录。',
    inLanguage: 'zh-CN',
  }
}
